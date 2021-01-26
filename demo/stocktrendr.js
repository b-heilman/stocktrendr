(function( root ){

var bMoor = typeof require === 'undefined' ? root.bMoor : require('bmoor');

bMoor.make('stocktrendr.DataSet', [
	function(){
		return {
			construct : function DataSet( data, key ){
				var d,
					i, c;

				this.values = data;
				this.key = key;
				this.hash = {};

				for( i = 0, c = this.values.length; i < c; i++ ){
					d = this.values[ i ];

					this.hash[ d[key] ] = d;
				}
			},
			properties : {
				deflateNode : function( dataNode ){
					return typeof dataNode === 'object' ? dataNode[this.key] : undefined;
				},
				deflateNodes : function( dataNodes ){
					var i, c,
						nodes = [];

					for ( i = 0, c = dataNodes.length; i < c; i++ ){
						nodes.push( this.deflateNode(dataNodes[i]) );
					}

					return nodes;
				},
				inflateNode : function( key ){
					return key === undefined ? undefined : this.hash[ key ] ;
				},
				inflateNodes : function( nodes ){
					var i, c,
						dataNodes = [];

					for ( i = 0, c = nodes.length; i < c; i++ ){
						dataNodes.push( this.inflateNode(nodes[i]) );
					}

					return dataNodes;
				},
				comparisons : {
					">" : function( a, b ){
						return a > b;
					},
					">=" : function( a, b ){
						return a >= b;
					},
					"<" : function( a, b ){
						return a < b;
					},
					"<=" : function( a, b ){
						return a <= b;
					},
					"==" : function( a, b ){
						return a == b;
					},
					"===" : function( a, b ){
						return a === b;
					},
					"~" : function( a, b ){
						var t = a * .01;

						return a + t > b && a - t < b
					}
				},
				getComparator : function( symbol ){
					var t = this.comparisons[ symbol ];

					if ( t ){
						return t;
					}else{
						throw "could not compare with symbol: "+symbol;
					}
				}
			}
		};
	}]
);

}( this ));

(function( root ){

var bMoor = typeof require === 'undefined' ? root.bMoor : require('bmoor');

bMoor.make('stocktrendr.Expression', [
	function(){
		return {
			construct : function Expression( str ){
				var i, c,
					ch,
					parenthCount = 0,
					name,
					method,
					args = [],
					dex,
					eqs,
					curDex;

				if ( typeof str === 'string' ){
					str = str.replace(/ /g,'');
					dex = str.indexOf('(');
					eqs = str.indexOf('=');

					if ( dex !== -1 ){
						if ( eqs !== -1 && eqs < dex ){
							name = str.substring(0,eqs).trim();
							eqs++;
						}else{
							eqs = 0;
						}

						method = str.substring(eqs,dex).trim();
						curDex = dex+1;

						// TODO : bmoor this
						for( i = dex+1, c = str.length; i < c; i++ ){
							ch = str.charAt(i);

							if ( ch === ',' && parenthCount === 0 ){
								args.push(str.substring(curDex,i).trim());
								i++;
								curDex = i;
							} else if ( ch === '(' ){
								parenthCount++;
							} else if ( ch === ')' ){
								if ( parenthCount === 0 ){
									args.push(str.substring(curDex,i).trim());
									i++;
									curDex = i;
								} else {
									parenthCount--;
								}
							}
						}

						this.name = name;
						this.method = method;
						this.operation = method+'('+args.join(',')+')';
						this.reference = this.name || this.operation;
						this.args = args;
					}else{
						// raw variable
						this.reference = str;
					}
				}else{
					this.inflate( str );
				}
			},
			properties : {
				inflate : function( obj ){
					this.name = obj.name;
					this.method = obj.method;
					this.operation = obj.operation;
					this.reference = obj.reference;
					this.args = obj.args;
					this.type = obj.type;
				},
				deflate : function(){
					return {
						name : this.name,
						method : this.method,
						operation : this.operation,
						reference : this.reference,
						args : this.args,
						type : this.type
					};
				}
			}
		};
	}]
);

}( this ));


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

(function( root ){
var bMoor = typeof require === 'undefined' ? root.bMoor : require('bmoor');

bMoor.define('stocktrendr.StatPack',
	{
		test : function( data, writeTo, test ){
			var i, c,
				d,
				valids = [];

			try {
				for( i = 0, c = data.length; i < c; i++ ){
					d = data[ i ];
					
					if ( test(d) ){
						d[writeTo] = true;
						valids.push( d );
					}
				}
			}catch( ex ){
				console.log( 'test', ex, i, c );
			}

			return valids;
		},
		calc : function( data, field1, field2, writeTo, calc ){
			var i, c,
				d;

			try {
				for( i = 0, c = data.length; i < c; i++ ){
					d = data[ i ];
					
					d[writeTo] = calc( d[field1], d[field2] );
				}
			}catch( ex ){
				console.log( 'test', ex, i, c );
			}

			return data;
		},
		calcAverage : function( data, lookBack, lookForward, writeTo, attr ){
			var i, c,
				offset,
				within,
				d, v, sum,
				last,
				averages = [];

			if ( arguments.length < 5 ){
				attr = writeTo;
				writeTo = lookForward;
				lookForward = 0;
			}

			within = lookBack + lookForward + 1;

			try {
				sum = 0;
				for( i = 0, c = within; i < c; i++ ){
					sum += data[i][attr];
				}

				d = data[lookBack];
				d[writeTo] = sum / within;
				averages.push( d );

				for( i = within, c = data.length; i < c; i++ ){
					last = data[i-within];
					d = data[i-lookForward];

					sum = sum - last[attr] + data[i][attr]
					d[writeTo] = sum / within;
					averages.push( d );
				}
			}catch( ex ){
				console.log( ex, i, c );
			}

			return averages;
		},
		calcPercent : function( data, percent, writeTo, attr ){
			var i, c,
				d, offset;

			if ( percent > 0 ) {
				offset = parseInt(percent,10) / 100;
			}else{
				offset = ( 100 + parseInt(percent,10) ) / 100;
			}

			try {
				for( i = 0, c = data.length; i < c; i++ ){
					d = data[ i ];
					
					d[writeTo] = d[attr] * offset;
				}
			}catch( ex ){
				console.log( 'test', ex, i, c );
			}

			return data;
		},
		findOffset : function( data, within, writeTo, attr ){
			var i, c,
				d, offset;

			// i * ( 1 + m ) = o
			// m = ( o / i ) - 1 
			try {
				offset = within;

				for( i = 0, c = data.length; i < c; i++, offset++ ){
					d = data[ i ];

					if ( offset < 0 ){
						d[writeTo] = data[0][attr];
					}else if ( offset < c ){
						d[writeTo] = data[offset][attr];
					}else{
						d[writeTo] = data[data.length-1][attr];
					}
				}
			}catch( ex ){
				console.log( 'calcChange', ex, i, c );
			}

			return data;
		},
		matchTrend : function( data, within, writeTo, attr, compare ){
			var i, c,
				j, k,
				d, offset,
				valid,
				matches = [];

			// i * ( 1 + m ) = o
			// m = ( o / i ) - 1 
			try {
				if ( within > 0 ){
					for( i = 0, c = data.length - within; i < c; ){
						d = data[ i ];
						valid = true;
						for( j = i, k = i + within; j < k && valid; ){
							j++;
							valid = compare( d[attr], data[j][attr] );
						}

						if ( valid ){
							matches.push( d );
							d[writeTo] = valid;
							i = i + within;
						}else{
							i = j;
						}
					}
				}else{
					within *= -1;
					for( i = data.length-1; i > within; ){
						d = data[ i ];
						valid = true;

						for( j = i, k = i - within; j > k && valid; ){
							j--;
							valid = compare( d[attr], data[j][attr] );
						}

						if ( valid ){
							matches.push( d );
							d[writeTo] = valid;
							i = i - within;
						}else{
							i = j;
						}
					}
				}
			
			}catch( ex ){
				console.log( 'matchTrend', ex, i, c );
			}

			return matches;
		},
		matchPatterns : function( data, writeTo, pattern ){
			var argc = pattern.length, // number of arguments
				r = argc - 1,
				i = 0, c = data.length - r,
				matches = [];

			while( i < c ){
				if ( pattern.apply(data, data.slice(i,i+argc)) ){
					data[i+r][writeTo] = true;
					matches.push( data[i+r] );
				}

				i++;
			}

			return matches;
		}
	}
);

}( this ));
