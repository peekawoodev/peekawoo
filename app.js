
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
  , cookie = require("cookie");

var client = exports.client = redis.createClient();
var sessionStore = exports.sessionStore = new RedisStore({client : client});
var app = exports.app = express().http().io();
//app.http().io();
//var haveData = new Array();
//var myArray = new Array();
//var countDownBoolean = false;
var fs = require('fs');
require('./strategy.js');

//var currentTimeCount = new Date().getTime();
//console.log(currentTimeCount);
//var setTimeCount = new Date();
//setTimeCount.setHours(20);
//console.log(setTimeCount);
//var computeSample = Math.abs(setTimeCount - currentTimeCount);
//console.log(computeSample);
//if(computeSample >= 0){
//	var secVal = computeSample;
//	console.log(Number(secVal));
//	secVal1 = Math.ceil((secVal/1000)-1);
//	console.log(Number(secVal1));
//}else{
//	secVal1 = 0;
//}

//var myCounter = new Countdown({
//	seconds: 71000,
//    onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
//    onCounterEnd: function(){ console.log('counter ended!');
//    	console.log("xxXXxx I'm here to Login xxXXxx");
//    	countDownBoolean = false;
//    	newCounter.start();
//    }
//});
//myCounter.start();
//var newCounter = new Countdown({
//	seconds:15500,
//	onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
//    onCounterEnd: function(){ console.log('counter ended!');
//    console.log("xxXXxx I'm here to CountDown xxXXxx");
//    	countDownBoolean = true;
//    	alterCounter.start();
//    }
//});

//var alterCounter = new Countdown({
//	seconds:70000,
//	onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
//    onCounterEnd: function(){ console.log('counter alter!');
//    console.log("xxXXxx I'm here to CountDown xxXXxx");
//    	countDownBoolean = false;
//    	newCounter.start();
//    }
//});

//function Countdown(options) {
//    var timer,
//    instance = this,
//    seconds = options.seconds,
//    updateStatus = options.onUpdateStatus || function () {},
//    counterEnd = options.onCounterEnd || function () {};

//    function decrementCounter() {
//        updateStatus(seconds);
//        if (seconds === 0) {
//            counterEnd();
//            instance.stop();
//        }
//        seconds--;
//    }

//    this.start = function () {
//        clearInterval(timer);
//        timer = 0;
//        seconds = options.seconds;
//        timer = setInterval(decrementCounter, 1000);
//    };

//    this.stop = function () {
//        clearInterval(timer);
//    };
//}

// all environments
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
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
app.use(function(req, res, next){
	console.log('%s %s', req.method, req.url);
	next();
});

var logFile = fs.createWriteStream('./myLogFile.log', {flags: 'a'});
app.use(express.logger({stream: logFile}));

//checking if users is authenticated
function auth(req, res, next) {
	if (req.isAuthenticated()) {
		console.log("authenticated");
		console.log(req.isAuthenticated());
		return next();
	}
	res.redirect('/');
}

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

//location of passport content before transferring the codes to module

app.get("/",routes.home);
app.get("/counter",routes.counter);
app.get("/error",auth,routes.error);
app.get('/authfb',passport.authenticate('facebook'));
app.get('/authtw',passport.authenticate('twitter'));
app.get('/authfb/callback',passport.authenticate('facebook', { failureRedirect: '/' }),routes.fbcallback);
app.get('/authtw/callback',passport.authenticate('twitter', { failureRedirect: '/' }),routes.twcallback);
app.get('/subscribe2',routes.subscribe);
app.get('/bookmark',auth,routes.bookmark);
app.get('/bookmark2',auth,routes.bookmark2);
app.get('/option',auth,routes.option);
app.get('/loading',auth,routes.loading);
app.get('/ranking',auth,routes.ranking);
app.get('/chat/:room',auth,routes.chat);
//location of sockets before transferring the codes to module
require('./socket.js');
//-----------------------------------------
client.keys('*', function(err, keys) {
	if(keys){
		keys.forEach(function(key){client.del(key);});
	}
	console.log('Deletion of all redis reference ', err || "Done!");
});
app.listen(80);
