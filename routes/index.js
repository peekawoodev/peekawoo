var async = require('async')
  , redis = require('redis')
  , client = redis.createClient()
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , fs = require('fs')
  , config = require('../config.json');

var rotationGame = 0;
  
module.exports = {
	home : function(req,res){
		//res.render('login');
		res.render('option');
	},
	//--------------sample
	sample: function(req,res){
		res.render('sample');
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
		//res.redirect('/option');
		//console.log(req);
		res.redirect('/loading');
	},
	twcallback : function(req, res) {
		console.log("Authenticated in twitter");
		console.log(req.isAuthenticated());
		//res.redirect('/option');
		//console.log(req);
		res.redirect('/loading');
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
	holder : function(req,res){
		console.log("xxXX HOLDER XXxx");
		console.log(req.query);
		console.log(req.session);
		console.log(req.session.passport.user.gender);
		console.log(req.session.passport.user.provider);
		res.render('holder');
		//res.redirect('/loading');
	},
	option : function(req,res){
		console.log("xxXX OPTION XXxx");
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
		client.set("id:"+info.id,JSON.stringify(info));
		//----------OLD CODE----------------
		//console.log("out put the session content");
		//console.log(req.session);
		//console.log(req.session.passport.user.gender);
		//console.log(req.session.passport.user.provider);
		//res.render('option',{profile:req.session.passport.user.gender,provider:req.session.passport.user.provider});
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
		/*if(req.user.provider == 'facebook'){
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
									res.render('chat',{user: up, room: data, listgen: values});
								});
							}else if(req.user.gender == 'female'){
								console.log("search male");
								client.get('male-'+value,function(err,values){
									console.log(values);
									console.log(JSON.parse(values));
									res.render('chat',{user: up, room: data, listgen: values});
								});
							}else{
								console.log("search random");
								client.get('randale-'+value,function(err,values){
									console.log(values);
									console.log(JSON.parse(values));
									res.render('chat',{user: up, room: data, listgen: values});
								});
							}
						}
						else{
							console.log("yyyyyyyy null value yyyyyyyy");
							listgender = value;
							res.render('chat',{user: up, room: data, listgen: listgender});
						}
					});
				});
			}else{
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
								res.render('chat',{user: up, room: data, listgen: values});
							});
						}else if(req.user.gender == 'female'){
							console.log("search male");
							client.get('male-'+value,function(err,values){
								console.log(values);
								console.log(JSON.parse(values));
								res.render('chat',{user: up, room: data, listgen: values});
							});
						}else{
							console.log("search random");
							client.get('randale-'+value,function(err,values){
								console.log(values);
								console.log(JSON.parse(values));
								res.render('chat',{user: up, room: data, listgen: values});
							});
						}
					}
					else{
						console.log("yyyyyyyy null value yyyyyyyy");
						listgender = value;
						res.render('chat',{user: up, room: data, listgen: listgender});
					}
				});
			}
		});
	}
};