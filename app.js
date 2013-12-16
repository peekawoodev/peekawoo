
/**
 * Module dependencies.
 */

var express = require('express.io')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , cookieParser = require('connect').utils.parseSignedCookies
  , cookie = require("cookie")
  , config = require('./config.json')
  ;

var client = exports.client = redis.createClient();
var sessionStore = exports.sessionStore = new RedisStore({client : client});
var app = exports.app = express().http().io();
//app.http().io();
var fs = require('fs');
require('./strategy.js');

// all environments
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon(__dirname + '/public/img/hc-theme/favicon.ico'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser("peekawoo"));
	app.use(express.session({ 
		key: "peekawoo",
		store : sessionStore
		}));
	app.use(passport.initialize());
	app.use(passport.session());
	
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
});

//newly added for creating logfiles
//app.use(function(req, res, next){
//	console.log('%s %s', req.method, req.url);
//	next();
//});

//var logFile = fs.createWriteStream('./myLogFile.log', {flags: 'a'});
//app.use(express.logger({stream: logFile}));

//checking if users is authenticated
function auth(req, res, next) {
	if (req.isAuthenticated()) {
		console.log("authenticated");
		console.log(req.isAuthenticated());
		return next();
	}
	res.redirect('/');
}

//for basic authentication for counter page
var counterAuth = express.basicAuth(function(user, pass, callback) {
	 var result = (user === config.counter.username && pass === config.counter.password);
	 callback(null /* error */, result);
});

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}
//location of passport content before transferring the codes to module
app.get("/",routes.home);
//---------sample-----------
app.get("/sample",routes.sample);
//--------------------------
app.get("/counter",counterAuth, routes.counter);
app.get("/error",auth,routes.error);
//---------NEW API----------
app.get('/credit',routes.credit);
app.post('/checkout', routes.checkout);
app.get('/process',routes.process);
app.get('/confirm', routes.confirm);
app.get('/status', routes.status);
app.get('/paypalError', routes.paypalError);
app.get('/auth/facebook',auth,routes.fbauth);
app.get('/auth/twitter',auth,routes.twauth);
app.get('/postfbtw',auth,routes.postfbtw);
//--------------------------
app.get('/authfb',passport.authenticate('facebook'));
app.get('/authtw',passport.authenticate('twitter'));
app.get('/authfb/callback',passport.authenticate('facebook', { failureRedirect: '/' }),routes.fbcallback);
app.get('/authtw/callback',passport.authenticate('twitter', { failureRedirect: '/' }),routes.twcallback);
app.get('/subscribe2',routes.subscribe);
app.get('/bookmark',auth,routes.bookmark);
app.get('/bookmark2',auth,routes.bookmark2);
app.get('/option',routes.option);
app.get('/loading',auth,routes.loading);
app.get('/ranking',auth,routes.ranking);
app.get('/chat/:room',auth,routes.chat);
//location of sockets before transferring the codes to module
require('./socket.js');
//-----------------------------------------
client.keys('*', function(err, keys) {
	if(keys){
		keys.forEach(function(key){
			var getCredit = key.search('credit:');
			if(key != 'randomcounter'){
				if(getCredit < 0){
					client.del(key);
				}
			}
		});
	}
	console.log('Deletion of all redis reference ', err || "Done!");
});
app.listen(80);
