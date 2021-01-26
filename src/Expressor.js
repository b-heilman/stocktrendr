(function( root ){

var bMoor;

if ( typeof require === 'undefined' ){
	bMoor = root.bMoor;
}else{
	bMoor = require('bmoor');
	require('./Expression');
	require('./StatPack');
}

bMoor.make('stocktrendr.Expressor', [
	'stocktrendr.Expression', 'stocktrendr.StatPack',
	function( Expression, StatPack ){
		return {
			construct : function Expressor( dataSet, settings ){
				this.dataSet = dataSet;

				this.variables = [];
				this.expressions = {};
				
				if ( settings ){
					this.inflate( settings );
				}
			},
			properties : {
				deflate : function(){
					var t, e,
						key,
						expressions = {};

					for( key in this.expressions ){
						if ( this.expressions.hasOwnProperty(key) ){
							e = this.expressions[key];
							t = e.deflate();

							if ( e.results ){
								t.results = this.dataSet.deflateNodes( e.results )
							}

							expressions[ key ] = t;
						}
					}

					return {
						variables : this.variables,
						expressions : expressions
					}
				},
				inflate : function( settings ){
					var t, e,
						key;

					this.variables = settings.variables;

					for( key in settings.expressions ){
						if ( settings.expressions.hasOwnProperty(key) ){
							e = settings.expressions[key];
							t = new Expression( e );

							if ( e.results ){
								t.results = this.dataSet.inflateNodes( e.results )
							}

							this.expressions[key] = t;
						}
					}
				},
				express : function ( request ){
					var expression = new Expression( request ),
						reference = expression.reference;

					if ( expression.method ){
						if ( !this.expressions[reference] && this[expression.method] ){
							expression.results = this[expression.method]( expression );
							this.expressions[ reference ] = expression;

							if ( expression.name ){
								this.variables.push( expression.name );
							}
						}else if ( !this[expression.method] ){
							throw 'unsupported method: '+expression.method+' -> '+request;
						}
					}else if ( !this.expressions[reference] ){
						// throw 'unknown variable: '+reference+' -> '+request;
						this.expressions[reference] = expression;
					}

					return this.expressions[ reference ];
				},
				// average(behind, ahead, field) | average(behind, field)
				average : function( expression ){
					var field,
						ahead,
						behind;

					if ( expression.args.length > 2 ){
						behind = parseInt( expression.args[0],10 );
						ahead = parseInt( expression.args[1],10 );
						field = this.express( expression.args[2] ).reference;
					}else{
						behind = parseInt( expression.args[0],10 );
						field = this.express( expression.args[1] ).reference;
						ahead = 0;
					}

					expression.type = 'number';
					
					return StatPack.calcAverage( 
						this.dataSet.values, 
						behind,
						ahead,
						expression.reference,
						field
					);
				},
				// offset(-20,close)
				offset : function( expression ){
					var t = this.express( expression.args[1] );

					expression.type = t.type || 'number'; // base columns are raw, so type not defined

					return StatPack.findOffset( 
						this.dataSet.values, 
						parseInt(expression.args[0],10),
						expression.reference,
						t.reference
					);
				},
				// percent(-10,close)
				percent : function( expression ){
					var t = this.express( expression.args[1] ),
						percentage = expression.args[0];

					if ( percentage.charAt(0) == '+' ){
						percentage = parseInt(percentage.substring(1),10) + 100;
					}else{
						percentage = parseInt(percentage,10);
					}

					expression.type = 'number'; // base columns are raw, so type not defined

					return StatPack.calcPercent( 
						this.dataSet.values, 
						percentage,
						expression.reference,
						t.reference
					);
				},
				// test(close,>,average20)
				test : function( expression ){
					var a = this.express( expression.args[0] ).reference,
						b = this.express( expression.args[2] ).reference,
						test = this.dataSet.getComparator( expression.args[1] );

					expression.type = 'boolean';

					return StatPack.test(
						this.dataSet.values,
						expression.reference,
						function( p ){
							return p[a] !== undefined && p[b] !== undefined && test( p[a], p[b] );
						}
					);
				},
				// variance(close,>,-20,+10) => test( close, <, percent(+10,offset(-20,close)) )
				variance : function( expression ){
					var i, c,
						t = this.express( expression.args[0] ).reference;
						offset = this.express('offset('+expression.args[2]+','+t+')').reference,
						percent = this.express('percent('+expression.args[3]+','+offset+')').reference,
						test = this.dataSet.getComparator( expression.args[1] );

					expression.type = 'boolean';

					return StatPack.test(
						this.dataSet.values,
						expression.reference,
						function( p ){
							return p[t] !== undefined && p[percent] !== undefined && test( p[t], p[percent] );
						}
					);
				},
				// trend(close,>,-5)
				trend : function( expression ){
					var t = this.express( expression.args[0] ),
						test = this.dataSet.getComparator( expression.args[1] );

					expression.type = 'boolean'; // base columns are raw, so type not defined

					return StatPack.matchTrend( 
						this.dataSet.values, 
						parseInt(expression.args[2],10),
						expression.reference,
						t.reference,
						test
					);
				},
				// point( change(-20,<,percent(-10),close), trend(-5,>,close), test(close,>,average20) )
				point : function( expression ){
					var func = '', args = [],
						subset = [],
						i, c,
						a, e, 
						dex = {};

					expression.type = 'boolean';
					
					for ( i = 0, c = expression.args.length; i < c; i++ ){
						a = expression.args[i];

						if( i ){
							func += ' && ';
						}

						e = this.express( a );

						func += 'point["'+e.reference+'"]';
					}

					return StatPack.test(
						this.dataSet.values,
						expression.reference,
						new Function( ['point'], 'return '+func+';' )
					);
				},
				// pattern( localMin, localMax, localMin, localMax, endMin )
				pattern : function( expression ){
					var func = '', args = [],
						subset = [],
						data,
						i, c,
						a, e, 
						dex = {};

					expression.type = 'boolean';
					
					for ( i = 0, c = expression.args.length; i < c; i++ ){
						a = expression.args[i];

						if( i ){
							func += ' && ';
						}

						e = this.express( a );

						args.push( 'v'+i );
						func += 'v'+i+'["'+e.reference+'"]';
						
						// TODO : bmoor
						if ( !dex[e.reference] ){
							dex[e.reference] = true;
							
							subset = subset.concat( e.results );
						}
					}

					if ( subset.length ){
						// one has to have matched, right?
						data = subset.sort(function( a, b ){
							// oldest date goes to 0
							return a.date - b.date;
						});

						// remove multiples
						for ( i = 0, c = data.length-1; i < c; i++ ){
							if ( data[i].date === data[i+1].date ){
								data.splice(i+1,1);
								c--;
								i--;
							}
						}
					}

					return StatPack.matchPatterns(
						data,
						expression.reference, 
						new Function( args, 'return '+func+';' )
					);
				}
			}
		};
	}]
);
	
}( this ));
