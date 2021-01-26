describe('stocktrendr.Expressor', function(){
	var Expressor = bMoor.get('stocktrendr.Expressor'),
		DataSet = bMoor.get('stocktrendr.DataSet');;
	
	// deflate

	// inflate

	// -- express
	describe('express', function(){
		// average(averageCount,field)
		describe('average', function(){
			var dataSet,
				expressor;

			beforeEach(function(){
				dataSet = new DataSet([
					{ y : 6, x : 0 },
					{ y : 4, x : 1 },
					{ y : 5, x : 2 },
					{ y : 3, x : 3 },
					{ y : 1, x : 4 }
				]);
				expressor = new Expressor( dataSet );
			})

			it('should look behind correctly', function(){
				var res = expressor.express('avg=average(2,y)').results;

				expect( res.length ).toBe( 3 );
				expect( res[0].avg ).toBe( 5 );
				expect( res[0].x ).toBe( 2 );
				expect( res[1].avg ).toBe( 4 );
				expect( res[2].avg ).toBe( 3 );
			});

			it('should look behind correctly again', function(){
				var res = expressor.express('avg=average(2,0,y)').results;

				expect( res.length ).toBe( 3 );
				expect( res[0].avg ).toBe( 5 );
				expect( res[0].x ).toBe( 2 );
				expect( res[1].avg ).toBe( 4 );
				expect( res[2].avg ).toBe( 3 );
			});

			it('should look ahead correctly', function(){
				var res = expressor.express('avg=average(0,2,y)').results;

				expect( res.length ).toBe( 3 );
				expect( res[0].avg ).toBe( 5 );
				expect( res[0].x ).toBe( 0 );
				expect( res[1].avg ).toBe( 4 );
				expect( res[2].avg ).toBe( 3 );
			});

			it('should look in between correctly', function(){
				var res = expressor.express('avg=average(1,1,y)').results;

				expect( res.length ).toBe( 3 );
				expect( res[0].avg ).toBe( 5 );
				expect( res[0].x ).toBe( 1 );
				expect( res[1].avg ).toBe( 4 );
				expect( res[2].avg ).toBe( 3 );
			});
		});
		// offset(-20,close)
		it('should properly calculate an offset', function(){
			var dataSet = new DataSet([
					{ y : 9, x : 0 },
					{ y : 5, x : 1 },
					{ y : 1, x : 2 },
					{ y : 3, x : 3 },
					{ y : 2, x : 4 }
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('z=offset(-1,y)').results;

			expect( res.length ).toBe( 5 );
			expect( res[0].z ).toBe( 9 );
			expect( res[1].z ).toBe( 9 );
			expect( res[2].z ).toBe( 5 );
			expect( res[3].z ).toBe( 1 );
			expect( res[4].z ).toBe( 3 );
		});
		// percent(-10,close)
		it('should properly calculate a percent', function(){
			var dataSet = new DataSet([
					{ y : 20, x : 0 },
					{ y : 10, x : 1 },
					{ y : 5, x : 2 }
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('z=percent(-10,y)').results;

			expect( res.length ).toBe( 3 );
			expect( res[0].z ).toBe( 18 );
			expect( res[1].z ).toBe( 9 );
			expect( res[2].z ).toBe( 4.5 );
		});
		// test(close,>,average20)
		it('should properly calculate a test', function(){
			var dataSet = new DataSet([
					{ z : 10, y : 9, x : 0 },
					{ z : 4, y : 5, x : 1 },
					{ z : 1, y : 1, x : 2 },
					{ z : 4, y : 3, x : 3 },
					{ z : 1, y : 2, x : 4 }
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('res=test(z,>,y)').results;

			expect( res.length ).toBe( 2 );
			expect( res[0].x ).toBe( 0 );
			expect( res[1].x ).toBe( 3 );
		});
		// variance(close,>,-20,+10) => test( close, <, percent(+10,offset(-20,close)) )
		it('should properly calculate a variance', function(){
			var dataSet = new DataSet([
					{ y : 10, x : 0 },
					{ y : 11, x : 1 },
					{ y : 1, x : 2 },
					{ y : 9, x : 3 },
					{ y : 10, x : 4 }
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('res=variance(y,>,-1,+10)').results;

			expect( res.length ).toBe( 2 );
			expect( res[0].x ).toBe( 3 );
			expect( res[1].x ).toBe( 4 );
		});
		// trend(-5,>,close)
		it('should properly calculate a trend', function(){
			var dataSet = new DataSet([
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
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('z=trend(y,>,-3)').results;

			expect( res.length ).toBe( 3 );
			expect( res[0].x ).toBe( 14 );
			expect( res[1].x ).toBe( 10 );
			expect( res[2].x ).toBe( 5 );
		});
		// point( change(-20,<,percent(-10),close), trend(-5,>,close), test(close,>,average20) )
		it('should properly calculate a point', function(){
			var dataSet = new DataSet([
					{ z : 1, y : 9, x : 0 },
					{ z : 10, y : 11, x : 1 },
					{ z : 1, y : 1, x : 2 },
					{ z : 10, y : 9, x : 3 },
					{ z : 1, y : 10, x : 4 }
				]),
				expressor = new Expressor( dataSet ),
				res = expressor.express('res=point(test(z,>,y),test(y,>,x))').results;

			expect( res.length ).toBe( 1 );
			expect( res[0].x ).toBe( 3 );
		});
		// pattern( localMin, localMax, localMin, localMax, endMin )
	})
});