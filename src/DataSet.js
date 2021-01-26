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
