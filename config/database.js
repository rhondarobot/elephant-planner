module.exports = {

    'url' : 'mongodb://capstone:allCAPS123@ds127948.mlab.com:27948/node-capstone' // looks like mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot

};

//URL can be specified in 3 ways:
//environent/global variables or by setting the NODE_ENV to production
exports.DATABASE_URL =  /*1*/process.env.DATABASE_URL ||
/*can set environment variables in 1 of 2 ways:
	PORT=5000 node server.js (temporarily)
	
	export PORT=5000
	node server.js (complete terminal session)
*/	

						/*2*/global.DATABASE_URL ||
						/*3*/(process.env.NODE_ENV === 'production' ?
							'mongodb://capstone:allCAPS123@ds127948.mlab.com:27948/node-capstone' :
							'mongodb://localhost/Evernote-Planner');//default
exports.PORT = process.env.PORT || 8080;