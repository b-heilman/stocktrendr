'use strict';

require( '../src/Expressor' );
require( '../src/DataSet' );

var path = require('path'),
	csv = require('fast-csv'),
	fs = require('fs'),
	stream = fs.createReadStream( path.resolve(__dirname, '../amd.csv') ),
	data = [],
	stats = {
		'open' : { type : 'number' },
		'close' : { type : 'number' },
		'high' : { type : 'number' },
		'low' : { type : 'number' }
	},
	variables = {};

var bMoor = typeof require === undefined ? root.bMoor : require('bmoor');

bMoor.inject(
	['stocktrendr.Expressor', 'stocktrendr.Expression','stocktrendr.DataSet', 
	function( Expressor, Expression, DataSet ){
		var expressor;

		csv.fromStream(stream, {headers : ['date','open','high','low','close','volume','adj']})
			.on("data", function( d ){
				var key,
					t = d.date.split('-');

				d.date = +( new Date(t[0],t[1],t[2]) );
				d.open = parseFloat(d.open);
				d.close = parseFloat(d.close);
				d.high = parseFloat(d.high);
				d.low = parseFloat(d.low);
				d.volume = parseInt(d.volume,10);
				d.adj = parseFloat(d.adj);
				
				data.push( d );
			})
			.on("end", function(){
				data.shift();
				data.sort(function( a, b ){
					// oldest date goes to 0
					return a.date - b.date;
				});
				
				try{
					analyze( data );
					console.log( 'loaded' );
				}catch( ex ){
					console.log( ex.message );
					console.log( ex.stack );
				}

				console.log( 'read', data.length );
			});

		function analyze( data ){
			expressor = new Expressor( new DataSet(data,'date') );

			expressor.express( 'average5 = average( 5, close )' );
			expressor.express( 'average10 = average( 10, close )' );
			expressor.express( 'average20 = average( 20, close )' );
			expressor.express( 'average60 = average( 60, close )' );
		}

		// Retrieve
		/*
		var saves,
			MongoClient = require('mongodb').MongoClient;

		MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
			if( err ) {
				console.log("Connection go boom");
			}else{
				console.log("We are connected");
				saves = db.createCollection('saves', function(err, collection) {});
			}
		});
		*/
		var express = require('express'),
			bodyParser = require('body-parser'),
			server = express(),
			router = express.Router();

		router.use( bodyParser.json() );

		router.use(function(req, res, next) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
			res.setHeader('Content-Type', 'application/json');
			next();	
		});

		router
			.get('/ticker/:id',function (req, res) {
				console.log( 'serving: ', req.params.id );

				res.json({
					data : expressor.dataSet.values,
					expressor : expressor.deflate()
				});
			})
			.post('/save/:user', function( req, res ){
				var exp = new Expression( req.body ); 
				console.log( req.body );
				
				res.json({
					valid : true
				})
			});


		server.use( router );
		server.use(function(req, res){
			res.json({
				valid : false,
				message : 'Hi there, I think you want /ticker'
			});
		});

		server.listen(9001);
	}]
);

/*
function test( data, expression ){
	var i, c, d, key,
		matches = 0, 
		accurate = {
			1 : 0,
			2 : 0,
			3 : 0,
			4 : 0,
			5 : 0,
			10 : 0
		},
		average = {},
		t = stats[ expression ];

	for( key in accurate ){
		average[ key ] = 0;
	}

	if ( t ){
		for( i = 0, c = data.length; i < c; i++ ){
			d = data[i];

			if ( d[expression] ){
				matches++;

				for( key in accurate ){
					key = parseInt( key, 10 );
					if ( data[i+key] ){
						if ( d.close < data[i+key].close ){
							accurate[key]++;
						}
						
						average[key] += ( data[i+key].close-d.close ) / d.close;
					}
				}
			}
		}

		t.matches = matches;
		t.accuracy = {};
		
		if ( matches ){
			for( key in accurate ){
				t.accuracy['lookAhead_'+key] = {
					count : accurate[ key ],
					value : average[ key ] / matches
				};
			}
		}
	}
}
*/
