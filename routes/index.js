var async = require('async')
  , redis = require('redis')
  , client = redis.createClient()
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , fs = require('fs')
  , config = require('../config.json')
  , extend = require('util')._extend
  , graph = require('fbgraph')
  , OAuth = require('oauth').OAuth
  , rotationGame = 0
  , conf = config.facebook
  , oa
  ;

  ;
//Paypal
var PayPalEC = require('paypal-ec');

/*Live Account - but still not available*/
/*
var cred = {
	username : 'valenice.balace_api1.gmail.com',
	password : 'H76XXJHTSWZ9HKWR',
	signature : 'ACUe-E7Hjxmeel8FjYAtjnx-yjHAAjzA-F7dbe8uq-Vb1h5UpDRp93nU'
};*/
/*Sandbox Account*/
var cred = {
		  username  : 'valenice.balace-facilitator_api1.gmail.com',
		  password  : '1386296783',
		  signature : 'A-SP7JVyevmeLU.JriRo2VJT1iiJA1RKOLWgYVdGQBh7PG2dzSFDRbQb'
};
/*Another Sandbox Account*/
/*var cred = {
		  username  : 'peekawoo_api1.peekawoo.com',
		  password  : '1386915530',
		  signature : 'ACUe-E7Hjxmeel8FjYAtjnx-yjHAAKLTqd.tnbmmkMI3OvzqEarcfOWG'
};*/

var opts = {
	sandbox : true, /*Must change to false if going live*/
	version : '109.0'
};

var plans = {
	credit10 : {
		returnUrl : config.base_url+'/confirm?plan=credit10',
		cancelUrl : config.base_url+'/credit',
		PAYMENTREQUEST_0_AMT             : '10.00',
		PAYMENTREQUEST_0_DESC            : '10 Peekawoo Credits',
		PAYMENTREQUEST_0_CURRENCYCODE    : 'USD',
		PAYMENTREQUEST_0_PAYMENTACTION   : 'Sale',
		L_PAYMENTREQUEST_0_ITEMCATEGORY0 : 'Digital',
		L_PAYMENTREQUEST_0_NAME0         : '10 Peekawoo Credits',
		L_PAYMENTREQUEST_0_AMT0          : '10.00',
		L_PAYMENTREQUEST_0_QTY0          : '1',
		REQCONFIRMSHIPPING				 : '0',
		NOSHIPPING						 : '1',
		ALLOWNOTE						 : '0',
		ADDOVERRIDE						 : '0'
	},
	credit20 : {
		returnUrl : config.base_url+'/confirm?plan=credit20',
		cancelUrl : config.base_url+'/credit',
		PAYMENTREQUEST_0_AMT             : '20.00',
		PAYMENTREQUEST_0_DESC            : '20 Peekawoo Credits',
		PAYMENTREQUEST_0_CURRENCYCODE    : 'USD',
		PAYMENTREQUEST_0_PAYMENTACTION   : 'Sale',
		L_PAYMENTREQUEST_0_ITEMCATEGORY0 : 'Digital',
		L_PAYMENTREQUEST_0_NAME0         : '20 Peekawoo Credits',
		L_PAYMENTREQUEST_0_AMT0          : '20.00',
		L_PAYMENTREQUEST_0_QTY0          : '1',
		REQCONFIRMSHIPPING				 : '0',
		NOSHIPPING						 : '1',
		ALLOWNOTE						 : '0',
		ADDOVERRIDE						 : '0'
	},
	credit30 : {
		returnUrl : config.base_url+'/confirm?plan=credit30',
		cancelUrl : config.base_url+'/credit',
		PAYMENTREQUEST_0_AMT             : '30.00',
		PAYMENTREQUEST_0_DESC            : '30 Peekawoo Credits',
		PAYMENTREQUEST_0_CURRENCYCODE    : 'USD',
		PAYMENTREQUEST_0_PAYMENTACTION   : 'Sale',
		L_PAYMENTREQUEST_0_ITEMCATEGORY0 : 'Digital',
		L_PAYMENTREQUEST_0_NAME0         : '30 Peekawoo Credits',
		L_PAYMENTREQUEST_0_AMT0          : '30.00',
		L_PAYMENTREQUEST_0_QTY0          : '1',
		REQCONFIRMSHIPPING				 : '0',
		NOSHIPPING						 : '1',
		ALLOWNOTE						 : '0',
		ADDOVERRIDE						 : '0'
	}
};

var ec = new PayPalEC(cred, opts);
//end of Paypal declarations

module.exports = {
	home : function(req,res){
		res.render('login');
		//res.render('option');
	},
	//--------------sample
	sample: function(req,res){
		console.log("xxXX AJAX request XXxx");
		console.log(req.query);
		console.log(req.query.chat.me);
		console.log(req.query.chat.m8);
		console.log(req.query.chat.gift);
		var me = req.query.chat.me;
		var m8 = req.query.chat.m8;
		var gift = req.query.chat.gift;
		var data = {};
		client.get('credit:'+me.id,function(err,value){
			var boolValue = false;
			if(err){
				console.log("theres an error");
				value = 0;
				data.cValue = value;
				data.bValue = boolValue;
				res.send(JSON.stringify(data));
			}else{
				if(value == null){
					var setValue = 0;
					boolValue = false;
					client.set('credit:'+me.id,setValue);
					data.cValue = setValue;
					data.bValue = boolValue;
					res.send(JSON.stringify(data));
				}else{
					console.log("theres an value");
					console.log(value);
					var qValue = Number(value);
					if(qValue > 0){
						boolValue = true;
						qValue-=1;
						client.set('credit:'+me.id,qValue);
						var saveinfo = {};
						saveinfo.me = me;
						saveinfo.m8 = m8;
						saveinfo.gift = gift;
						client.set('mychat:'+me.id,JSON.stringify(saveinfo));
						data.cValue = qValue;
						data.bValue = boolValue;
						res.send(JSON.stringify(data));
					}else{
						boolValue = false;
						data.cValue = value;
						data.bValue = boolValue;
						res.send(JSON.stringify(data));
					}
				}
			}
		});
	},
	fbauth : function(req,res){
		console.log("xxXX value of send data XXxx");
		console.log(conf);
		if (!req.query.code) {
			var authUrl = graph.getOauthUrl({
				"client_id":                conf.client_id,
				"redirect_uri":        conf.redirect_uri,
				"scope":                        conf.scope
			});

			if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
				console.log("no error found");
				res.redirect(authUrl);
			} else {
				//req.query.error == 'access_denied'
				console.log("error found");
				res.send('access denied');
			}
			return;
		}
		console.log("req.query.code value");
		console.log(req.query.code);
		// code is set
		// we'll send that and get the access token
		graph.authorize({
			"client_id":      conf.client_id,
			"redirect_uri":   conf.redirect_uri,
			"client_secret":  conf.client_secret,
			"code":           req.query.code
		}, function (err, facebookRes) {
			console.log("facebookRes value");
			console.log(facebookRes);
			console.log("req.session value");
			console.log(req.session);
			graph.setAccessToken(facebookRes.access_token);
			//-------------FB post------------------
			res.redirect('/postfbtw');
			//--------------------------------------
			//res.redirect('/sample2');
		});
	},
	twauth : function(req,res){
		console.log(req.user.token);
		console.log(req.user.tokenSecret);
		oa = new OAuth(
			    "https://twitter.com/oauth/request_token"
			  , "https://twitter.com/oauth/access_token"
			  , config.tw.consumerKey
			  , config.tw.consumerSecret
			  , "1.0A"
			  , null
			  , "HMAC-SHA1"
			  );
		res.redirect('/postfbtw');
	},
	postfbtw : function(req,res){
		console.log("xxXX value of send data XXxx");
		client.get('mychat:'+req.user.id,function(err,value){
			if(err){
			}else{
				if(value != null){
					console.log("mychat content after query");
					console.log(value);
					value = JSON.parse(value);
					var setMe = value.me;
					var setM8 = value.m8;
					var setGift = value.gift;
					var wallmsg;
					if(setM8.provider == 'facebook'){
						wallmsg = "http://"+setM8.provider+".com/"+setM8.username+" received a ";
					}else{
						wallmsg = "@"+setM8.username+" received a ";
					}
					wallmsg+="special "+setGift+" from http://"+setMe.provider+".com/"+setMe.username+"!";
					if(setMe.provider == 'facebook'){
						var wallPost = {
							message: wallmsg,
							caption: setGift,
							picture:"http://dev.peekawoo.com/img/stickers/"+setGift+".png"
						};
						graph.post('407450559359869/feed',wallPost,function(err,data){
							console.log("data value after graphapi call");
							console.log(data);
							var msg;
							if(err){
								msg = "failed to feed in Facebook";
								//res.render('sample2',{ title: "Logged In"});
							}else{
								msg = "You're gift post to Peekawoo Page Timeline";
								res.render('sample2',{ title: setGift+" Gift!", getInfo:msg });
							}
						});
					}else{
						var msg;
						if(setM8.provider == 'facebook'){
							msg = "http://"+setM8.provider+".com/"+setM8.username+" received a ";
						}else{
							msg = "@"+setM8.username+" received a ";
						}
						msg+="special "+setGift+" from @"+setMe.username+". Please see link http://dev.peekawoo.com/img/stickers/"+setGift+".png";
						oa.post(
							    "https://api.twitter.com/1.1/statuses/update.json"
							  , req.user.token
							  , req.user.tokenSecret
							  , {   "status": msg }
								 // , "media[]": "http://dev.peekawoo.com/img/stickers/"+setGift+".png" }
							  , function(err,data){
								  if(err) {
								      console.log(require('sys').inspect(err));
								      res.end('bad stuff happened');
								    } else {
								      console.log(data);
								      msg = "Gift post to you're Tweet Board";
								      res.render('sample2',{ title: setGift+" Gift!", getInfo:msg });
								    }
							  });
					}
				}
			}
		});
	},
	//--------------------
	counter : function(req,res){
		res.render('counter');
	},
	error : function(req,res){
		var finishedRemove = function(countListX){
			console.log(countListX);
			req.logout();
			var sendurl = {};
			sendurl.url = config['base_url'];
			if(countListX.length > 0){
				console.log("=====baseurl=====");
				console.log(sendurl);
				res.render('error',{baseurl:JSON.stringify(sendurl)});
			}else{
				console.log("=====baseurl=====");
				console.log(sendurl);
				res.render('error2',{baseurl:JSON.stringify(sendurl)});
			}
		};
		var removeme = req.user;
		console.log("+++ removing error +++");
		//console.log(removeme);
		if(removeme.provider == 'twitter'){
			client.keys('*ale-'+removeme.id,function(err,value){
				if(value){
					if(value.length > 0){
						var errorGen = value[0].search('female-');
						if(errorGen >= 0){
							removeme.gender = 'female';
						}else{
							var errorRand = value[0].search('randale-');
							if(errorRand >= 0){
								removeme.gender = 'randale';
							}else{
								removeme.gender = 'male';
							}
						}
					}
				}
			});
		}
		var again = {};
		again.id = removeme.id;
		again.username = removeme.username;
		again.gender = removeme.gender;
		again.photourl = removeme.photourl;
		again.provider = removeme.provider;
		client.del(removeme.gender+'-'+removeme.id,JSON.stringify(again));
		client.del('chatted:'+removeme.id);
		//client.del('last:'+removeme.id);
		client.keys('*ale-*',function(err,countList){
			console.log(countList);
			finishedRemove(countList);
		});
	},
	fbcallback : function(req, res) {
		console.log("Authenticated in facebook");
		console.log(req.isAuthenticated());
		res.redirect('/option');
	},
	twcallback : function(req, res) {
		console.log("Authenticated in twitter");
		console.log(req.isAuthenticated());
		res.redirect('/option');
	},
	subscribe : function(req,res){
		console.log("+++++SUBSCRIBE+++++");
		console.log(req.user);
		console.log(req.query);
		client.sadd("email",req.query.inputBox);
		var gatherEmail = req.query.inputBox + '\r\n';
		fs.appendFile('email.txt',gatherEmail,function(err){
			if(err) throw err;
			console.log('Email saved');
		});
		res.render('subscribe2');
	},
	bookmark : function(req,res){
		var user = req.user;
		var blocklist = new Array();
		var up = {};
		up.id = user.id;
		up.username = user.username;
		up.gender = user.gender;
		up.photourl = user.photourl;
		up.provider = user.provider;
		up.codename = user.codename;
		client.smembers('blockinfo:'+user.id,function(err,datas){
			if(err){
				res.render('bookmark',{user:up,blockuser:blocklist});
			}else{
				datas.forEach(function(data){
					blocklist.push(data);
				});
				console.log("xxXX BOOKMARK XXxx");
				console.log(user);
				console.log(blocklist);
				res.render('bookmark',{user:up,blockuser:blocklist});
			}
		});
	},
	bookmark2 : function(req,res){
		var user = req.user;
		var todelete = req.query.todelete;
		console.log("xxXX REQ PARAMS ADN REQ QUERY XXxx");
		console.log(req.params);
		console.log(req.query);
		console.log(req.query['todelete']);
		console.log(JSON.parse(todelete));
		console.log(user);
		client.srem('block:'+user.id,JSON.parse(todelete).id);
		client.srem('blockinfo:'+user.id,todelete);
		var blocklist = new Array();
		var up = {};
		up.id = user.id;
		up.username = user.username;
		up.gender = user.gender;
		up.photourl = user.photourl;
		up.provider = user.provider;
		up.codename = user.codename;
		client.smembers('blockinfo:'+user.id,function(err,datas){
			if(err){
				res.render('bookmark',{user:up,blockuser:blocklist});
			}else{
				datas.forEach(function(data){
					blocklist.push(data);
				});
				console.log("xxXX BOOKMARK XXxx");
				console.log(user);
				console.log(blocklist);
				res.render('bookmark',{user:up,blockuser:blocklist});
			}
		});
	},
	process : function(req,res){
		//-----------Gender and Codename-------------
		var info = {};
		if(req.query["gender-m"]){
			 info.gender = req.query["gender-m"];
		}
		if(req.query["gender-f"]){
			info.gender = req.query["gender-f"];
		}
		if(req.query["gender-r"]){
			info.gender = req.query["gender-r"];
		}
		console.log(info.gender);
		info.codename = req.query['codename'];
		info.id = req.signedCookies.peekawoo;
		console.log(info);
		client.del("id:"+info.id);
		client.set("id:"+info.id,JSON.stringify(info));
		//-------------------------------------------
		res.redirect('/credit');
	},
	credit : function(req,res){
		console.log("User is now on buying credit page.");
		console.log(req.user);
		//res.render('credit');
		if(req.query["cred"] != "chat"){
			client.get('credit:'+req.user.id,function(err,value){
				if(err){
					res.render('credit');
				}else{
					if(value > 0){
						console.log("you have "+value+" credit");
						res.redirect('/loading');
					}else{
						console.log("you don't have credit");
						res.render('credit');
					}
				}
			});
		}else{
			res.redirect('/loading');
		}
	},
	checkout: function (req, res, next){
		var params = extend({}, plans[req.body.plan]);
		
		ec.set(params, function (err, data){
			if (err) return next(err);//must be another page saying error on paying
			
			console.log("Returned by setExpress data:");
			console.log(data);
			
			res.redirect(data.PAYMENTURL);
		});
	},
	confirm: function (req, res, next){
		var plan = req.query.plan;
		var params = extend({}, plans[ plan ]);
		
		params.TOKEN = req.query.token;
		params.PAYERID = req.query.PayerID;
					
		ec.do_payment(params, function(err,data){
			console.log("Returned by doExpress data:");
			console.log(data);
			
			if (err) return next(err);//must be another page saying error on paying
			
			res.redirect('/status?token=' + params.TOKEN);
		});			
	},
	status: function (req,res) {
		var token = req.query.token;
		console.log('User successfully purchased credits!');
		ec.get_details({token : token}, function (err,data){
			if(err) return next(err); //must be another page saying error on paying
			console.log("Returned by getDetails data:");
			console.log(data);
			
			if(data.CHECKOUTSTATUS == "PaymentActionCompleted"){
				var insertAmount;
				if(data.AMT == "10.00"){
					//user purchase 10 credits
					insertAmount = 10;
				}else if(data.AMT == "20.00"){
					//user purchase 20 credits
					insertAmount = 20;
				}else if(data.AMT == "30.00"){
					//user purchase 30 credits
					insertAmount = 30;
				}
				client.set("credit:"+req.user.id,insertAmount);
			}
			res.redirect('/loading');
		});
	},
	paypalError: function(req, res) {
		setTimeout(
				res.redirect('/credit'), 3000
		);
	},
	option : function(req,res){
	/*	console.log("xxXX OPTION XXxx");
		console.log(req.query);
		provide = req.query["prov"] || req.query["prov1"]; 
		console.log(provide);
		if(provide == 'fb'){
			console.log("Facebook Selected");
			provide = 'facebook';
			res.redirect('/authfb');
		}else if(provide == 'tw'){
			console.log("Twitter Selected");
			provide = 'twitter';
			res.redirect('/authtw');
			
		}
		console.log(req.signedCookies);
		var info = {};
		var gendertemp = '';
		if(req.query["gender-m"]){
			 info.gender = req.query["gender-m"];
		}
		if(req.query["gender-f"]){
			info.gender = req.query["gender-f"];
		}
		if(req.query["gender-r"]){
			info.gender = req.query["gender-r"];
		}
		console.log(info.gender);
		info.provider = provide;
		info.codename = req.query['codename'];
		info.id = req.signedCookies.peekawoo;
		console.log(info);
		client.del("id:"+info.id);
		client.set("id:"+info.id,JSON.stringify(info)); */
		//----------OLD CODE----------------
		console.log("out put the session content");
		console.log(req.session);
		if(req.session.passport.user.provider === 'twitter'){
			console.log(req.session.passport.user.provider);
			res.render('option',{provider:req.session.passport.user.provider});
		}else{
			console.log(req.session.passport.user.gender);
			console.log(req.session.passport.user.provider);
			res.render('option',{profile:req.session.passport.user.gender,provider:req.session.passport.user.provider});
		}
	},
	loading : function(req,res){
		console.log("------------------------");
		console.log(req.user);
		var info = {};
		client.get("id:"+req.signedCookies.peekawoo,function(err,data){
			if(err){
				res.redirect('/');
			}else{
				console.log("xx================xx");
				if(data==null){
					res.redirect(config['base_url']);
				}else{
					console.log(data);
					data = JSON.parse(data);
					info.gender = data.gender;
					info.codename = data.codename;
					console.log(info);
					console.log("xx================xx");
					req.user.gender = info.gender;
					req.user.codename = info.codename;
					if(req.user.gender == 'randale'){
						client.srem('randomcounter',req.user.id);
						client.sadd('randomcounter',req.user.id);
					}
					res.render('loading',{user:req.user});
				}
			}
		});
		/*
		if(req.user.provider == 'facebook'){
			if(rotationGame == 0){
				console.log("xxXXX---------------- FACEBOOK GENDER DEFAULT -----------------XXXxx");
				req.user.gender = req.query["gender-m"] || req.query["gender-f"] || req.query["gender-r"] || req.user._json.gender;
				req.user.codename = req.query.codename || req.user.codename;
				res.render('loading',{user: req.user});
			}else{
				if(req.query["gender-m"]){
					req.user.gender = req.query["gender-m"];
				}
				if(req.query["gender-f"]){
					req.user.gender = req.query["gender-f"];
				}
				if(req.query["gender-r"]){
					req.user.gender = req.query["gender-r"];
				}
				console.log(req.query["gender-m"]);
				console.log(req.query["gender-f"]);
				console.log(req.query["gender-r"]);
				if(!req.query["gender-f"] && !req.query["gender-m"] && !req.query["gender-r"]){
					req.user.codename = req.query.codename || req.user.codename;
					client.keys('*ale-'+req.user.id,function(err,keys){
						console.log("facebook checking..");
						console.log(keys);
						if(keys){
							if(keys.length > 0){
								var locateGen = keys[0].search('female-');
								console.log(locateGen);
								if(locateGen >= 0){
									req.user.gender = 'female';
									res.render('loading',{user: req.user});
								}else{
									var locateRandom = keys[0].search('randale-');
									if(locateRandom >= 0){
										req.user.gender = 'randale';
										res.render('loading',{user: req.user});
									}else{
										req.user.gender = 'male';
										res.render('loading',{user: req.user});
									}
								}
							}
						}
						else{
							console.log("problem occur");
						}
					});
				}else{
					console.log("req query have a value");
					req.user.codename = req.query.codename || req.user.codename;
					res.render('loading',{user: req.user});
				}
			}
		}else{
			if(req.query["gender-m"]){
				req.user.gender = req.query["gender-m"];
			}
			if(req.query["gender-f"]){
				req.user.gender = req.query["gender-f"];
			}
			if(req.query["gender-r"]){
				req.user.gender = req.query["gender-r"];
			}
			if(req.user._json.gender){
				req.user.gender = req.user._json.gender;
			}
			if(req.query.codename){
				req.user.codename = req.query.codename;
			}
			if(req.user.codename){
				req.user.codename = req.user.codename;
			}
			if(rotationGame == 0){
				console.log("XXX---------------- TWITTER GENDER DEFAULT -----------------XXX");
				console.log(req.query["gender-m"]);
				console.log(req.query["gender-f"]);
				console.log(req.query["gender-r"]);
				console.log(req.user._json.gender);
				res.render('loading',{user: req.user});
			}
			else{
				console.log("XXX---------------- TWITTER GENDER AUTOMATIC -----------------XXX");
				if(req.user.gender == 'male' || req.user.gender == 'female' || req.user.gender == 'randale'){
					console.log(req.user.gender);
					console.log("it goes to this location");
					res.render('loading',{user: req.user});
				}else{
					console.log("null goes to this location");
					client.keys('*ale-'+req.user.id,function(err,keys){
						console.log("twitter checking..");
						console.log(keys);
						if(keys){
							if(keys.length > 0){
								var locateGen = keys[0].search('female-');
								console.log(locateGen);
								if(locateGen >= 0){
									req.user.gender = 'female';
									res.render('loading',{user: req.user});
								}else{
									var locateRandom = keys[0].search('randale-');
									if(locateRandom >= 0){
										req.user.gender = 'randale';
										res.render('loading',{user: req.user});
									}else{
										req.user.gender = 'male';
										res.render('loading',{user: req.user});
									}
								}
							}
						}
						else{
							console.log("problem occur");
						}
					});
				}
			}
		}*/
	},
	ranking : function(req,res){
		var user = req.user;
		//console.log(req.user);
		var likes = new Array();
		var finalLikes = new Array();
		var finishedRequest = function(){
			if(user.provider == 'twitter'){
				client.keys('*ale-'+user.id,function(err,value){
					if(value){
						if(value.length > 0){
							var errorGen = value[0].search('female-');
							if(errorGen >= 0){
								user.gender = 'female';
							}else{
								var errorGenR = value[0].search('randale-');
								if(errorGenR >= 0){
									user.gender = 'randale';
								}
								else{
									user.gender = 'male';
								}
							}
						}
					}
				});
			}
			var up = {};
			up.id = user.id;
			up.username = user.username;
			up.gender = user.gender;
			up.photourl = user.photourl;
			up.provider = user.provider;
			up.codename = user.codename;
			console.log("+++++UP content+++++");
			//console.log(up);
			console.log("+++++UP content+++++");
			//console.log(finalLikes);
			var sendurl = {};
			sendurl.url = config['base_url'];
			res.render('ranking',{user:up,chatmate:finalLikes,baseurl:JSON.stringify(sendurl)});
		}
		client.smembers('visitor:'+user.id,function(err,datas){
			var countData;
			countData = datas.length;
			console.log("xxXXxx Count Content Value xxXXxx");
			if(countData > 0){
				datas.forEach(function(data){
					console.log("xxXXxx PEOPLE WHO LIKE YOU");
					console.log(data);
					likes.push(data);
					client.smembers('visitor:'+JSON.parse(data).id,function(err,liked){
						if(!liked[0]){
							console.log("xxXXxx NO ONE LIKE YOU xxXXxx");
							liked = {};
						}
						else{
							console.log("xxXXxx OTHER PEOPLE LIKE DATA xxXXxx");
							console.log(liked);
							liked.forEach(function(like){
								console.log("xxXXxx LIKE DATA xxXXxx");
								console.log(like);
								if(JSON.parse(like).id == req.user.id){
									console.log("xxXXxx RESULT OF LIKE xxXXxx");
									finalLikes.push(data);
								}
							});
						} 
						countData-=1;
						if(countData <= 0){
							finishedRequest();
						}
					});
				});
			}else{
				finishedRequest();
			}
		});
	},
	chat : function(req,res){
		console.log("******req.params.room******");
		console.log(req.params);
		console.log(req.params.room);
		rotationGame+=1;
		//-----------for Credit purpose------------
		var creditCon = 0;
		client.get('credit:'+req.user.id,function(err,data){
			if(err){
				data = 0;
				creditCon = creditCon + data;
			}else{
				creditCon+=Number(data);
			}
		});
		//-----------------------------------------
		client.smembers(req.params.room,function(err,data){
			console.log(data);
			if(err){
				data = {};
			}
			else{
				if(data.length > 0){
					data = JSON.parse(data[0]);
				}
			}
			console.log(data);
			var container;
			var listgender = new Array();
			console.log("xxXX Value of Credits after query XXxx");
			console.log(creditCon);
			if(req.user.provider == 'twitter'){
				console.log("goes to this location due to twitter account");
				console.log(req.user.id);
				client.keys('*ale-'+req.user.id,function(err,result){
					console.log(result[0]);
					if(result){
						if(result.length > 0){
							var trimGet = result[0].search('female-');
							console.log(trimGet);
							if(trimGet >= 0){
								req.user.gender = 'female';
							}else{
								var trimRan = result[0].search('randale-');
								if(trimRan >= 0){
									req.user.gender = 'randale';
								}else{
									req.user.gender = 'male';
								}
							}
						}
					}
					var up = {};
					console.log("****GENDER IF Twitter USE****");
					up.id = req.user.id;
					up.username = req.user.username;
					up.gender = req.user.gender;
					up.photourl = req.user.photourl;
					up.provider = req.user.provider;
					up.codename = req.user.codename;
					client.lrange('last:'+req.user.id,1,1,function(err,value){
						if(err){
							console.log("Error found!!");
						}
						console.log("$$$$$ checking if value.length have content $$$$$")
						console.log(value.length);
						console.log("****LIST of Opposite Gender****");
						console.log(listgender);
						if(value.length > 0){
							if(req.user.gender == 'male'){
								console.log("search female");
								client.get('female-'+value,function(err,values){
									console.log(values);
									console.log(JSON.parse(values));
									res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
								});
							}else if(req.user.gender == 'female'){
								console.log("search male");
								client.get('male-'+value,function(err,values){
									console.log(values);
									console.log(JSON.parse(values));
									res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
								});
							}else{
								console.log("search random");
								client.get('randale-'+value,function(err,values){
									console.log(values);
									console.log(JSON.parse(values));
									res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
								});
							}
						}
						else{
							console.log("yyyyyyyy null value yyyyyyyy");
							listgender = value;
							res.render('chat',{user: up, room: data, listgen: listgender, creditquery: creditCon});
						}
					});
				});
			}else{
				var up = {};
				console.log("****GENDER IF Facebook USE****");
				up.id = req.user.id;
				up.username = req.user.username;
				up.gender = req.user.gender;
				up.photourl = req.user.photourl;
				up.provider = req.user.provider;
				up.codename = req.user.codename;
				client.lrange('last:'+req.user.id,1,1,function(err,value){
					if(err){
						console.log("Error found!!");
					}
					//listgender = JSON.parse(value);
					console.log("$$$$$ checking if value.length have content $$$$$")
					console.log(value.length);
					console.log("****LIST of Opposite Gender****");
					console.log(listgender);
					if(value.length > 0){
						if(req.user.gender == 'male'){
							console.log("search female");
							client.get('female-'+value,function(err,values){
								console.log(values);
								console.log(JSON.parse(values));
								res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
							});
						}else if(req.user.gender == 'female'){
							console.log("search male");
							client.get('male-'+value,function(err,values){
								console.log(values);
								console.log(JSON.parse(values));
								res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
							});
						}else{
							console.log("search random");
							client.get('randale-'+value,function(err,values){
								console.log(values);
								console.log(JSON.parse(values));
								res.render('chat',{user: up, room: data, listgen: values, creditquery: creditCon});
							});
						}
					}
					else{
						console.log("yyyyyyyy null value yyyyyyyy");
						listgender = value;
						res.render('chat',{user: up, room: data, listgen: listgender, creditquery: creditCon});
					}
				});
			}
		});
	}
};