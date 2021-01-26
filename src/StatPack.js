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
