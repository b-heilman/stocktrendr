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

