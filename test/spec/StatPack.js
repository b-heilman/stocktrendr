describe('stocktrendr.StatPack', function(){
	var StatPack = bMoor.get('stocktrendr.StatPack');
	
	describe('calc', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 9, x : 0 },
				{ y : 5, x : 1 },
				{ y : 1, x : 2 },
				{ y : 2, x : 3 },
				{ y : 3, x : 4 }
			];
		});

		it( 'should correctly run the compare function, >', function(){
			var res = StatPack.calc( dataSet, 'x', 'y', 'z', function( x, y ){
				return x > y
			});

			expect( res.length ).toBe( 5 );
			expect( res[0].z ).toBe( false );
			expect( res[4].z ).toBe( true );
		});

		it( 'should correctly run the compare function, <', function(){
			var res = StatPack.calc( dataSet, 'x', 'y', 'z', function( x, y ){
				return x < y
			});

			expect( res.length ).toBe( 5 );
			expect( res[0].z ).toBe( true );
			expect( res[4].z ).toBe( false );
		});

		it( 'should correctly run the compare function, <', function(){
			var res = StatPack.calc( dataSet, 'x', 'y', 'z', function( x, y ){
				return x - y
			});

			expect( res.length ).toBe( 5 );
			expect( res[0].z ).toBe( -9 );
			expect( res[4].z ).toBe( 1 );
		});
	});

	describe('calcAverage', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 6, x : 0 },
				{ y : 4, x : 1 },
				{ y : 5, x : 2 },
				{ y : 3, x : 3 },
				{ y : 1, x : 4 }
			];
		});

		it( 'should calculate behind correctly', function(){
			var res = StatPack.calcAverage( dataSet, 2, 0, 'avg', 'y' );

			expect( res.length ).toBe( 3 );
			expect( res[0].avg ).toBe( 5 );
			expect( res[0].x ).toBe( 2 );
			expect( res[1].avg ).toBe( 4 );
			expect( res[2].avg ).toBe( 3 );
		});

		it( 'should calculate ahead correctly', function(){
			var res = StatPack.calcAverage( dataSet, 0, 2, 'avg', 'y' );

			expect( res.length ).toBe( 3 );
			expect( res[0].avg ).toBe( 5 );
			expect( res[0].x ).toBe( 0 );
			expect( res[1].avg ).toBe( 4 );
			expect( res[2].avg ).toBe( 3 );
		});

		it( 'should calculate in between correctly', function(){
			var res = StatPack.calcAverage( dataSet, 1, 1, 'avg', 'y' );

			expect( res.length ).toBe( 3 );
			expect( res[0].avg ).toBe( 5 );
			expect( res[0].x ).toBe( 1 );
			expect( res[1].avg ).toBe( 4 );
			expect( res[2].avg ).toBe( 3 );
		});
	});

	describe('calcPercent', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 100, x : 0 },
				{ y : 50, x : 1 },
				{ y : 10, x : 2 }
			];
		});

		it( 'should correctly calculate with positive percents', function(){
			var res = StatPack.calcPercent( dataSet, 10, 'perc', 'y' );

			expect( res.length ).toBe( 3 );
			expect( res[0].perc ).toBe( 10 );
			expect( res[1].perc ).toBe( 5 );
			expect( res[2].perc ).toBe( 1 );
		});

		it( 'should correctly calculate with positive percents', function(){
			var res = StatPack.calcPercent( dataSet, 110, 'perc', 'y' );

			expect( res.length ).toBe( 3 );
			expect( parseInt(res[0].perc,10) ).toBe( 110 );
			expect( parseInt(res[1].perc,10)).toBe( 55 );
			expect( parseInt(res[2].perc,10) ).toBe( 11 );
		});

		it( 'should correctly calculate with positive percents', function(){
			var res = StatPack.calcPercent( dataSet, -10, 'perc', 'y' );

			expect( res.length ).toBe( 3 );
			expect( res[0].perc ).toBe( 90 );
			expect( res[1].perc ).toBe( 45 );
			expect( res[2].perc ).toBe( 9 );
		});
	});

	describe('findOffset', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 9, x : 0 },
				{ y : 5, x : 1 },
				{ y : 1, x : 2 },
				{ y : 3, x : 3 },
				{ y : 0, x : 4 }
			];
		});

		it( 'should calculate correctly, going backwards', function(){
			var res = StatPack.findOffset( dataSet, -3, 'off', 'y' );

			expect( res.length ).toBe( 5 );
			expect( res[0].off ).toBe( 9 );
			expect( res[1].off ).toBe( 9 );
			expect( res[2].off ).toBe( 9 );
			expect( res[3].off ).toBe( 9 );
			expect( res[4].off ).toBe( 5 );
		});

		it( 'should calculate correctly, going forwards', function(){
			var res = StatPack.findOffset( dataSet, 3, 'off', 'y' );

			expect( res.length ).toBe( 5 );
			expect( res[0].off ).toBe( 3 );
			expect( res[1].off ).toBe( 0 );
			expect( res[2].off ).toBe( 0 );
			expect( res[3].off ).toBe( 0 );
			expect( res[4].off ).toBe( 0 );
		});
	});

	describe('matchTrend', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 5, x : 0 },
				{ y : 9, x : 1 },
				{ y : 7, x : 2 },
				{ y : 4, x : 3 },
				{ y : 6, x : 4 },
				{ y : 8, x : 5 },
				{ y : 5, x : 6 },
				{ y : 3, x : 7 },
				{ y : 4, x : 8 },
				{ y : 6, x : 9 },
				{ y : 10, x : 10 },
				{ y : 7, x : 11 },
				{ y : 2, x : 12 },
				{ y : 5, x : 13 },
				{ y : 11, x : 14 }
			];
		});

		it( 'should match a perscribed pattern going backwards', function(){
			var res = StatPack.matchTrend( dataSet, -3, 'z', 'y', function( a, b ){
				return a > b;
			});

			expect( res.length ).toBe( 3 );
			expect( res[0].x ).toBe( 14 );
			expect( res[1].x ).toBe( 10 );
			expect( res[2].x ).toBe( 5 );
		});

		it( 'should match a perscribed pattern going forwards', function(){
			var res = StatPack.matchTrend( dataSet, 3, 'z', 'y', function( a, b ){
				return a > b;
			});

			expect( res.length ).toBe( 3 );
			expect( res[0].x ).toBe( 1 );
			expect( res[1].x ).toBe( 5 );
			expect( res[2].x ).toBe( 10 );
		});
	});

	describe('matchPatterns', function(){
		var dataSet;

		beforeEach(function(){
			dataSet = [
				{ y : 9, x : 0 },
				{ y : 5, x : 1 },
				{ y : 1, x : 2 },
				{ y : 2, x : 3 },
				{ y : 3, x : 4 },
				{ y : 7, x : 5 },
				{ y : 6, x : 6 },
				{ y : 8, x : 7 },
				{ y : 4, x : 8 },
				{ y : 5, x : 9 },
				{ y : 3, x : 10 },
				{ y : 9, x : 11 },
				{ y : 10, x : 12 },
				{ y : 3, x : 13 },
				{ y : 8, x : 14 },
				{ y : 4, x : 15 },
				{ y : 7, x : 16 }
			];
		});

		it( 'should match a perscribed pattern', function(){
			var res = StatPack.matchPatterns( dataSet,  5, function( eins, zwei, drei, fier, funf ){
				return eins.y > zwei.y && zwei.y < drei.y && drei.y > fier.y && fier.y < funf.y;
			});

			expect( res.length ).toBe( 3 );
			expect( res[0].x ).toBe( 9 );
			expect( res[1].x ).toBe( 11 );
			expect( res[2].x ).toBe( 16 );
		});
	});
});