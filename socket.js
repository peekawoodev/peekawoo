var parent = module.parent.exports
  , client = parent.client
  , sessionStore = parent.sessionStore
  , app = parent.app
  , redis = require('redis')
  , express = require('express.io')
  , async = require("async");

var game_lock = false;
var game_ongoing = false;
var catchup_user = false;
var cycle = 0;
var cycle_turn = false;
var newuser = false;
var newuserCount = 0;
var countUserInside = 0;
var countGlobal = 120;
var topic;
var listTopic = new Array();
//app.http().io();
var temp = 0;
var fs = require('fs');
fs.readFile('topics.txt', function(err, data) {
    if(err) throw err;
    var array = data.toString().split("\n");
    temp = array.length;
    for(i in array) {
        //console.log(array[i]);
        listTopic.push(array[i].replace("\r",""));
        temp -= 1;
        if(temp <= 0){
        	displayOutput();
        }
    }
});

function displayOutput(){
//	console.log("TOPICS LIST:");
	topic = listTopic;
//	console.log(topic);
}

app.io.set('log level', 1);
app.io.set('authorization', function (handshakeData, callback) {
	if(handshakeData.headers.cookie){
	//	console.log(handshakeData.headers.cookie);
	//	console.log("xxXX Cookie XXxx");
		//console.log(handshakeData.headers.cookie);
		var cookies = handshakeData.headers.cookie.replace("'","").split(";");
	//	console.log("declaration");
		//console.log(cookies);
	//	console.log("checking cookies");
		//console.log(cookies.length);
		for(var i = 0; i<cookies.length; i++){
			var checkMe = cookies[i].search("peekawoo=");
			//console.log(checkMe);
			if(checkMe >= 0){
			//	console.log("i'm at Array number "+i+" location "+checkMe);
				var sampleMe = cookies[i].split("=");
				if(sampleMe.length > 1){
				//	console.log("goes greater");
					sampleMe = sampleMe[1].split("=");
				}
				else{
				//	console.log("goes lessthan");
					sampleMe = sampleMe[0].split("=");
				}
				break;
			}
		}
	//	console.log("here is the perfect result");
		//console.log(sampleMe);
		sid = sampleMe[0].replace("s%3A","").split(".")[0];
	//	console.log("checking cookies");
		//console.log(sid);
		//console.log(sampleMe);
		sessionStore.load(sid, function(err,session){
			if(err || !session){
				return callback("Error retrieving session!",false);
			}
			handshakeData.peekawoo = {
					user : session.passport.user,
					sessionid : sid
			};
			console.log("===== Connecting . . . =====");
			return callback(null,true);
		});
	//	console.log("it just end here");
	}
	else{
		return callback("No cookie transmitted.!",false);
	}
	
});

app.io.set('store', new express.io.RedisStore({
	redisPub: redis.createClient(),
	redisSub: redis.createClient(),
	redisClient: client
}));

app.io.sockets.on('connection',function(socket){
//	console.log("xxXX connecting clients . . . XXxx");
	//console.log(socket);
	//console.log(socket.handshake);
//	console.log("xxX pushing socket.id Xxx");
	var userx = socket.handshake.peekawoo.user;
	if(userx != undefined){
		if(userx.gender != undefined){
		//	console.log("disconnect "+userx.id+" persist");
			client.persist(userx.gender+'-'+userx.id);
			client.persist('chatted:'+userx.id);
		}
	}
	
	app.io.route('enter',function(){
		var randomcount = new Array();
		client.smembers('randomcounter',function(err,rand){
			if(rand != null){
				if(rand.length > 0){
					rand.forEach(function(ran){
						randomcount.push(ran);
					});
				}
			}
		});
		client.keys('*ale-*',function(err,list){
			var listFemale = 0;
			var listMale = 0;
			var listRandom = 0;
			var undefinedUser = 0;
			var countUserInside = 0;
			if(list){
				list.forEach(function(listCheck){
					var checkValue = listCheck.indexOf('female-');
					if(checkValue >= 0){
						listFemale+=1;
					}else{
						var ifMaleUser = listCheck.indexOf('male-');
						if(ifMaleUser >= 0){
							listMale+=1;
						}else{
							var ifRandomUser = listCheck.indexOf('randale-');
							if(ifRandomUser >= 0){
								listRandom+=1;
							}else{
								undefinedUser+=1;
							}
						}
					}
				});
			//	console.log(countGlobal);
				var userList = {};
				userList.male = listMale;
				userList.female = listFemale;
				userList.rand = listRandom;
				userList.timeVal = countGlobal;
				userList.gamelockTrigger = game_lock;
				userList.undefineduser = undefinedUser;
				userList.randCount = randomcount;
				//console.log(userList);
				if(list.length > 0){
					countUserInside = list.length;
				}
				else{
					countUserInside = 0;
				}
				app.io.broadcast('listusers',{count:countUserInside,users:userList});
			}
		});
	});
	
	socket.on('disconnect',function(){
	//	console.log("xxxxxxxxx disconnecting active client xxxxxxxx");
		if(userx != undefined){
			if(userx.gender != undefined){
			//	console.log("disconnect "+userx.id+" in 20 secs");
				client.expire(userx.gender+'-'+userx.id,20); //change from 60secs to 20secs
				client.expire('chatted:'+userx.id,20);
			}
		}
	});

	//console.log("===================");
	//console.log(socket.handshake.peekawoo.user);
	//console.log("===================");
	app.io.route('join',function(req){
	//	console.log("++++checking req.data.room ++++");
	//	console.log(req.params);
	//	console.log(req.data.room);
		req.io.join(req.data.room);
		app.io.room(req.data.room).broadcast('roomtopic',topic[Math.floor(Math.random() * topic.length)]);
	});
	
	app.io.route('buzz',function(req){
		var user = req.data;
		req.io.room(getRoom(req)).broadcast('receivebuzz',JSON.stringify(user));
	});
	
	app.io.route('postfbtw',function(req){
		var users = req.data;
		users = JSON.parse(users);
		console.log("xxXX display users info via chat credit XXxx");
		console.log(users);
		var forSend = {};
		forSend.user = users.me;
		forSend.gift = users.gift;
		req.io.room(getRoom(req)).broadcast('receivetrigger',JSON.stringify(forSend));
	});
	
	app.io.route('timer',function(req){
		console.log("server current timer");
		console.log(countGlobal);
		if(countGlobal > 0){
			app.io.room(getRoom(req)).broadcast('sendtime', countGlobal);
		}
		//app.io.room(getRoom(req)).broadcast('sendtime', countGlobal);
	});
	
	app.io.route('leave',function(req){
	//	console.log("+++++removing gender and room declare+++++");
		var removegender;
		if(req.data.user.id == req.data.room.male.id){
			removegender = req.data.room.male;
		}else{
			removegender = req.data.room.female;
		}
		var removeroom = req.data.room;
	//	console.log("+++++removing gender+++++");
		delete removegender.codename;
		client.del(removegender.gender+'-'+removegender.id,JSON.stringify(removegender));
		client.del("chatted:"+removegender.id);
		//client.del("last:"+removegender.id);
		console.log("@@@@@ D O N E  R E M O V I N G @@@@@");
	});
	
	app.io.route('insert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
	//	console.log("====user value====");
		//console.log(user);
	//	console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
	//	console.log("====mate value====");
		//console.log(mate);
	//	console.log("====remove if exist====");
		client.srem("visitor:"+mate.id,JSON.stringify(user));
	//	console.log("====add user to mate====");
		client.sadd("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('uninsert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
	//	console.log("====user value====");
		//console.log(user);
	//	console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
	//	console.log("====mate value====");
		//console.log(mate);
	//	console.log("====Delete me in my chatmate====");
		client.srem("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('block',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
	//	console.log("====user value====");
		//console.log(user);
	//	console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
	//	console.log("====mate value====");
		//console.log(mate);
	//	console.log("====remove if exist====");
		client.srem("block:"+user.id,mate.id);
		client.srem("blockinfo:"+user.id,JSON.stringify(mate));
	//	console.log("====add user to mate====");
		client.sadd("block:"+user.id,mate.id);
		client.sadd("blockinfo:"+user.id,JSON.stringify(mate));
	});
	
	app.io.route('unblock',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
	//	console.log("====user value====");
		//console.log(user);
	//	console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
	//	console.log("====mate value====");
		//console.log(mate);
	//	console.log("====Delete me in my chatmate====");
		client.srem("block:"+user.id,mate.id);
		client.srem("blockinfo:"+user.id,JSON.stringify(mate));
	});
	
	app.io.route('checkcreditvalue',function(req){
		client.get('credit:'+req.data.id,function(err,value){
			var boolValue = false;
			if(err){
				value = 0;
				app.io.broadcast('returncreditvalue',{cValue:value,bValue:boolValue});
			}else{
				var qValue = Number(value);
				if(qValue > 0){
					boolValue = true;
					qValue-=2;
					client.set('credit:'+req.data.id,qValue);
					app.io.broadcast('returncreditvalue',{cValue:qValue,bValue:boolValue});
				}else{
					boolValue = false;
					app.io.broadcast('returncreditvalue',{cValue:qValue,bValue:boolValue});
				}
			}
		});
	});
	
	app.io.route('my msg',function(req){
		app.io.room(getRoom(req)).broadcast('new msg', req.data);
	});

	app.io.route('member', function(req) {
		async.auto({
			checkIfExist : function(callback){
			//	console.log("checking if goes in here");
				//console.log(req.data);
				var gender = JSON.parse(req.data);
			//	console.log(gender.gender);
				if(gender.provider == 'twitter'){
					if(gender.gender != 'male' || gender.gender != 'female' || gender.gender != 'randale'){
						client.keys('*ale-'+gender.id,function(err,value){
						//	console.log(value);
							if(value.length > 0){
								var getValue = value[0].search('female-');
								if(getValue >= 0){
									gender.gender = 'female';
								}else{
									var getValueR = value[0].search('randale-');
									if(getValueR >= 0){
										gender.gender = 'randale';
									}else{
										gender.gender = 'male';
									}
								}
							}
						});
						var me = {};
						me.id = gender.id;
						me.username = gender.username;
						me.gender = gender.gender;
						me.photourl = gender.photourl;
						me.provider = gender.provider;
					//	console.log(me);
						client.exists(me.gender+'-'+me.id,callback);
					}
					else{
						var me = {};
						me.id = gender.id;
						me.username = gender.username;
						me.gender = gender.gender;
						me.photourl = gender.photourl;
						me.provider = gender.provider;
						client.exists(me.gender+'-'+me.id,callback);
					}
				}else{
					var me = {};
					me.id = gender.id;
					me.username = gender.username;
					me.gender = gender.gender;
					me.photourl = gender.photourl;
					me.provider = gender.provider;
					client.exists(me.gender+'-'+me.id,callback);
				}
			},
			setMember : function(callback){
			//	console.log("checking if goes in here member");
				var user = JSON.parse(req.data);
				//console.log(req.data);
			//	console.log(user.gender);
				if(user.provider == 'twitter'){
					if(!user.gender){
					//	console.log("member twitter");
					//	console.log(user.gender);
						client.keys('*ale-'+user.id,function(err,value){
						//	console.log(value);
							if(value.length > 0){
								var getValue = value[0].search('female-');
								if(getValue >= 0){
									user.gender = 'female';
								}else{
									var getValueR = value[0].search('randale-');
									if(getValueR >= 0){
										user.gender = 'randale';
									}else{
										user.gender = 'male';
									}
								}
							}
							var me = {};
							me.id = user.id;
							me.username = user.username;
							me.gender = user.gender;
							me.photourl = user.photourl;
							me.provider = user.provider;
							client.del(user.gender+"-"+user.id,JSON.stringify(me),redis.print);
							client.set(user.gender+"-"+user.id,JSON.stringify(me),redis.print);
							callback(null,true);
						});
					}
					else{
						var me = {};
						me.id = user.id;
						me.username = user.username;
						me.gender = user.gender;
						me.photourl = user.photourl;
						me.provider = user.provider;
						client.del(user.gender+"-"+user.id,JSON.stringify(me),redis.print);
						client.set(user.gender+"-"+user.id,JSON.stringify(me),redis.print);
						callback(null,true);
					}
				}else{
					var up = {};
					up.id = user.id;
					up.username = user.username;
					up.gender = user.gender;
					up.photourl = user.photourl;
					up.provider = user.provider;
					client.del(user.gender+"-"+user.id,JSON.stringify(up),redis.print);
					client.set(user.gender+"-"+user.id,JSON.stringify(up),redis.print);
					callback(null,true);
				}
			},
			getMaleVisitor : function(callback){
				client.keys('male-*',callback);
			},
			getFemaleVisitor : function(callback){
				client.keys('female-*',callback);
			},
			getRandomVisitor : function(callback){
				client.keys('randale-*',callback);
			}
		},function(err,result){
			console.log(result);
			if(result.checkIfExist == 0){
			//	console.log("NOTHING");
			//	console.log(result.checkIfExist);
			//	console.log("xxXXxx IM NEW HERE xxXXxx");
				newuser = true;
				newuserCount += 1;
			}
			else{
			//	console.log("xxXXxx IM ALREADY HERE BEFORE xxXXxx");
				newuser = false;
			}
			if((result.getMaleVisitor.length >= 1 && result.getFemaleVisitor.length >= 1) || (result.getRandomVisitor.length > 1)){
				console.log("xxXXxx NEWUSER Result xxXXxx");
				console.log("newuser="+newuser);
				console.log("newuserCount="+newuserCount);
				console.log("game_lock="+game_lock);
				console.log("game_ongoing="+game_ongoing);
				console.log("catchup_user="+catchup_user);
				if(!game_lock){
					game_lock = true;
					console.log("starting game in 15 sec");
					setTimeout(function(){
						newuserCount = 0;
						start_game();
					},3000);
				}
				else{
					if(game_ongoing && !catchup_user){
						if(countGlobal > 30){
							catchup_user = true;
							catchup_game();
						}
					}
				}
			}
		});
	});
});

start_chat = function(vf,vm,vr,cflist,cmlist,crlist,cycle){
	console.log("@@@@@@@@@@@@@ Chat start");
	async.auto({
		group_user : function(){
			var rooms = new Array();
			var lowestLength = Math.min(vf.length,vm.length);
			var priority;
			var maleList = cmlist;
			var femaleList = cflist;
			var randomList = crlist;
			var returnMale = new Array();
			var returnFemale = new Array();
			var returnRandom = new Array();
			cmlist.forEach(function(returnAgain){
				returnMale.push(returnAgain);
			});
			cflist.forEach(function(returnAgain2){
				returnFemale.push(returnAgain2);
			});
			vr.forEach(function(vrand){
				returnRandom.push(vrand);
			});
			console.log("return male and female");
			console.log(returnMale);
			console.log(returnFemale);
			if(vf.length == lowestLength){
				priority = "female";
			}else{
				priority = "male";
			}
			var blockAllList = new Array();
			maleList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('male-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {};
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			femaleList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('female-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {};
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			randomList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('randale-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {};
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			if(vr.length > 1){
				console.log(vr);
				//console.log(returnRandom);
				while(vr.length > 1){
					console.log("goes in this location vr.length="+vr.length);
					var pvrx = vr[Math.floor(Math.random()*vr.length)];
					pvrx = JSON.parse(pvrx);
					//if(vr.length > 0){
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vr[Math.floor(Math.random()*vr.length)];
						rc8 = JSON.parse(rc8);
						if(JSON.stringify(rc8) != JSON.stringify(pvrx)){
							//var randomIndex2 = vr.indexOf(JSON.stringify(rc8));
							//vr.splice(randomIndex2,1);
							console.log("rc8 identity "+rc8);
							console.log(rc8);
							//----------------------new here--------------------------
							var theirBlock = new Array();
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == rc8.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+rc8.id+" is not empty");
										lenBlock.forEach(function(list){
											theirBlock.push(list);
										});
									}else{
										console.log("myList of "+rc8.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
							var blockusers = myBlock.indexOf(rc8.id);
							console.log("if chatted is in blocklist");
							console.log(blockusers);
							if(blockusers < 0){
								var theirblockusers = theirBlock.indexOf(pvrx.id);
								if(theirblockusers < 0){
									console.log("they did not have block users");
							//--------------------------------------------------------
									var room = {
										name : pvrx.id + "-" + rc8.id,
										male : pvrx,
										female : rc8
									};
									client.del(room.name,JSON.stringify(room));
									client.sadd(room.name,JSON.stringify(room));
									rooms.push(room);
									var randomIndex = vr.indexOf(JSON.stringify(pvrx));
									vr.splice(randomIndex,1);
									var randomIndex2 = vr.indexOf(JSON.stringify(rc8));
									vr.splice(randomIndex2,1);
									console.log("after removing maleList");
									console.log(returnRandom);
									client.sadd("chatted:"+pvrx.id,rc8.id);
									client.sadd("chatted:"+rc8.id,pvrx.id);
									client.lpush("last:"+pvrx.id,rc8.id);
									client.lpush("last:"+rc8.id,pvrx.id);
									client.sadd("chattingrandom",pvrx.id);
									client.sadd("chattingrandom",rc8.id);
									app.io.broadcast(pvrx.id, room);
									app.io.broadcast(rc8.id, room);
							//--------------------new here------------------------------
								}else{
									console.log("they have block users");
								}
								//----------------------------------------------------------
							}
						}
						
					//}else{
					//	console.log("lack of user");
					//}
				}
			}
			if(vf.length >= 1 && vm.length >= 1){
				//var rotFirst;
				//var rotSecond;
				if(priority == "female"){
					//rotFirst = vf;
					//rotSecond = vm;
					console.log("FEMALE");
					console.log(vf);
					while(vf.length >= 1){
						console.log("goes in this location vr.length="+vf.length);
						var pvrx = vf[Math.floor(Math.random()*vf.length)];
						pvrx = JSON.parse(pvrx);
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vm[Math.floor(Math.random()*vm.length)];
						rc8 = JSON.parse(rc8);
						console.log("rc8 identity "+rc8);
						console.log(rc8);
						//----------------------new here--------------------------
						var theirBlock = new Array();
						console.log("blockAllList is not empty");
						blockAllList.forEach(function(block){
							if(block.id == rc8.id){
								var lenBlock = block.mylist;
								if(lenBlock.length > 0){
									console.log("myList of "+rc8.id+" is not empty");
									lenBlock.forEach(function(list){
										theirBlock.push(list);
									});
								}else{
									console.log("myList of "+rc8.id+" is empty");
								}
							}
							console.log(block.id);
							console.log(block.mylist);
						});
						var blockusers = myBlock.indexOf(rc8.id);
						console.log("if chatted is in blocklist");
						console.log(blockusers);
						if(blockusers < 0){
							var theirblockusers = theirBlock.indexOf(pvrx.id);
							if(theirblockusers < 0){
								console.log("they did not have block users");
						//--------------------------------------------------------
								var room = {
									name : pvrx.id + "-" + rc8.id,
									male : pvrx,
									female : rc8
								};
								client.del(room.name,JSON.stringify(room));
								client.sadd(room.name,JSON.stringify(room));
								rooms.push(room);
								var randomIndex = vf.indexOf(JSON.stringify(pvrx));
								vf.splice(randomIndex,1);
								var randomIndex2 = vm.indexOf(JSON.stringify(rc8));
								vm.splice(randomIndex2,1);
								console.log("after removing maleList");
								console.log(returnRandom);
								client.sadd("chatted:"+pvrx.id,rc8.id);
								client.sadd("chatted:"+rc8.id,pvrx.id);
								client.lpush("last:"+pvrx.id,rc8.id);
								client.lpush("last:"+rc8.id,pvrx.id);
								client.sadd("chattingfemale",pvrx.id);
								client.sadd("chattingmale",rc8.id);
								app.io.broadcast(pvrx.id, room);
								app.io.broadcast(rc8.id, room);
						//--------------------new here------------------------------
							}else{
								console.log("chatmate have block users");
								if(vf.length <= 1){
									console.log("breaking cause no other user to be paired");
									break;
								}
							}
							//----------------------------------------------------------
						}else{
							console.log("you have block users");
							if(vm.length <= 1){
								console.log("breaking cause no other user to be paired");
								break;
							}
						}
					}
				}else{
					//rotFirst = vm;
					//rotSecond = vf;
					console.log("MALE");
					while(vm.length >= 1){
						console.log("goes in this location vr.length="+vm.length);
						var pvrx = vm[Math.floor(Math.random()*vm.length)];
						pvrx = JSON.parse(pvrx);
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vf[Math.floor(Math.random()*vf.length)];
						rc8 = JSON.parse(rc8);
						console.log("rc8 identity "+rc8);
						console.log(rc8);
						//----------------------new here--------------------------
						var theirBlock = new Array();
						console.log("blockAllList is not empty");
						blockAllList.forEach(function(block){
							if(block.id == rc8.id){
								var lenBlock = block.mylist;
								if(lenBlock.length > 0){
									console.log("myList of "+rc8.id+" is not empty");
									lenBlock.forEach(function(list){
										theirBlock.push(list);
									});
								}else{
									console.log("myList of "+rc8.id+" is empty");
								}
							}
							console.log(block.id);
							console.log(block.mylist);
						});
						var blockusers = myBlock.indexOf(rc8.id);
						console.log("if chatted is in blocklist");
						console.log(blockusers);
						if(blockusers < 0){
							var theirblockusers = theirBlock.indexOf(pvrx.id);
							if(theirblockusers < 0){
								console.log("they did not have block users");
						//--------------------------------------------------------
								var room = {
									name : pvrx.id + "-" + rc8.id,
									male : pvrx,
									female : rc8
								};
								client.del(room.name,JSON.stringify(room));
								client.sadd(room.name,JSON.stringify(room));
								rooms.push(room);
								var randomIndex = vm.indexOf(JSON.stringify(pvrx));
								vm.splice(randomIndex,1);
								var randomIndex2 = vf.indexOf(JSON.stringify(rc8));
								vf.splice(randomIndex2,1);
								console.log("after removing maleList");
								console.log(returnRandom);
								client.sadd("chatted:"+pvrx.id,rc8.id);
								client.sadd("chatted:"+rc8.id,pvrx.id);
								client.lpush("last:"+pvrx.id,rc8.id);
								client.lpush("last:"+rc8.id,pvrx.id);
								client.sadd("chattingmale",pvrx.id);
								client.sadd("chattingfemale",rc8.id);
								app.io.broadcast(pvrx.id, room);
								app.io.broadcast(rc8.id, room);
						//--------------------new here------------------------------
							}else{
								console.log("chatmate have block users");
								if(vf.length <= 1){
									console.log("breaking cause no other user to be paired");
									break;
								}
							}
							//----------------------------------------------------------
						}else{
							console.log("you have block users");
							if(vm.length <= 1){
								console.log("breaking cause no other user to be paired");
								break;
							}
						}
					}
				}
			}
			countGlobal = 121;
			var globalTimer = setInterval(function(){
				if(countGlobal >=0){
					countGlobal-=1;
				}
				else{
					countGLobal = 0;
				}
			},1000);
			game_ongoing = true;
			setTimeout(function(){
				console.log("XXXX HERE IT GOES outside XXXX");
				client.del('chattingmale');
				client.del('chattingfemale');
				client.del('chattingrandom');
				clearInterval(globalTimer);
				game_lock = false;
				game_ongoing = false;
				catchup_user = false;
				app.io.broadcast('game_stop', true);
			},123000);
		},
	},function(err,result){
		console.log("++++++++++++++++IT GOES HERE AFTER+++++++++++++++");
	});
};
//require('./');

another_chat = function(vf,vm,vr,cflist,cmlist,crlist,cycle){
	console.log("@@@@@@@@@@@@@ Chat start");
	
	async.auto({
		group_user : function(){
			var rooms = new Array();
			var lowestLength = Math.min(vf.length,vm.length);
			var rotationTurn = false;
			var priority;
			var maleList = cmlist;
			var femaleList = cflist;
			var randomList = crlist;
			var returnMale = new Array();
			var returnFemale = new Array();
			var returnRandom = new Array();
			var noFemalePartner = new Array();
			var noMalePartner = new Array();
			cmlist.forEach(function(returnAgain){
				returnMale.push(returnAgain);
			});
			cflist.forEach(function(returnAgain2){
				returnFemale.push(returnAgain2);
			});
			vr.forEach(function(vrand){
				returnRandom.push(vrand);
			});
			console.log("return male and female");
			console.log(returnMale);
			console.log(returnFemale);
			if(vf.length == lowestLength){
				priority = "female";
			}else{
				priority = "male";
			}
			var blockAllList = new Array();
			maleList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('male-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {}
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			femaleList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('female-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {}
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			randomList.forEach(function(getList){
				var blockList = new Array();
				var removeIdentity = getList.replace('randale-','');
				client.smembers("block:"+removeIdentity,function(err,lists){
					if(lists){
						if(lists.length > 0){
							lists.forEach(function(list){
								blockList.push(list);
							});
						}
						var listme = {}
						listme.id = removeIdentity;
						listme.mylist = blockList;
						blockAllList.push(listme);
					}
				});
			});
			if(vr.length > 1){
				console.log(vr);
				//console.log(returnRandom);
				while(vr.length > 1){
					console.log("goes in this location vr.length="+vr.length);
					var pvrx = vr[Math.floor(Math.random()*vr.length)];
					pvrx = JSON.parse(pvrx);
					//if(vr.length > 0){
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vr[Math.floor(Math.random()*vr.length)];
						rc8 = JSON.parse(rc8);
						if(JSON.stringify(rc8) != JSON.stringify(pvrx)){
							//var randomIndex2 = vr.indexOf(JSON.stringify(rc8));
							//vr.splice(randomIndex2,1);
							console.log("rc8 identity "+rc8);
							console.log(rc8);
							//----------------------new here--------------------------
							var theirBlock = new Array();
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == rc8.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+rc8.id+" is not empty");
										lenBlock.forEach(function(list){
											theirBlock.push(list);
										});
									}else{
										console.log("myList of "+rc8.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
							var blockusers = myBlock.indexOf(rc8.id);
							console.log("if chatted is in blocklist");
							console.log(blockusers);
							if(blockusers < 0){
								var theirblockusers = theirBlock.indexOf(pvrx.id);
								if(theirblockusers < 0){
									console.log("they did not have block users");
							//--------------------------------------------------------
									var room = {
										name : pvrx.id + "-" + rc8.id,
										male : pvrx,
										female : rc8
									};
									client.del(room.name,JSON.stringify(room));
									client.sadd(room.name,JSON.stringify(room));
									rooms.push(room);
									var randomIndex = vr.indexOf(JSON.stringify(pvrx));
									vr.splice(randomIndex,1);
									var randomIndex2 = vr.indexOf(JSON.stringify(rc8));
									vr.splice(randomIndex2,1);
									console.log("after removing maleList");
									console.log(returnRandom);
									client.sadd("chatted:"+pvrx.id,rc8.id);
									client.sadd("chatted:"+rc8.id,pvrx.id);
									client.lpush("last:"+pvrx.id,rc8.id);
									client.lpush("last:"+rc8.id,pvrx.id);
									client.sadd("chattingrandom",pvrx.id);
									client.sadd("chattingrandom",rc8.id);
									app.io.broadcast(pvrx.id, room);
									app.io.broadcast(rc8.id, room);
							//--------------------new here------------------------------
								}else{
									console.log("they have block users");
								}
								//----------------------------------------------------------
							}
						}
						
					//}else{
					//	console.log("lack of user");
					//}
				}
			}
			if(vf.length >= 1 && vm.length >= 1){
				//var rotFirst;
				//var rotSecond;
				if(priority == "female"){
					//rotFirst = vf;
					//rotSecond = vm;
					console.log("FEMALE");
					console.log(vf);
					while(vf.length >= 1){
						console.log("goes in this location vr.length="+vf.length);
						var pvrx = vf[Math.floor(Math.random()*vf.length)];
						pvrx = JSON.parse(pvrx);
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vm[Math.floor(Math.random()*vm.length)];
						rc8 = JSON.parse(rc8);
						console.log("rc8 identity "+rc8);
						console.log(rc8);
						//----------------------new here--------------------------
						var theirBlock = new Array();
						console.log("blockAllList is not empty");
						blockAllList.forEach(function(block){
							if(block.id == rc8.id){
								var lenBlock = block.mylist;
								if(lenBlock.length > 0){
									console.log("myList of "+rc8.id+" is not empty");
									lenBlock.forEach(function(list){
										theirBlock.push(list);
									});
								}else{
									console.log("myList of "+rc8.id+" is empty");
								}
							}
							console.log(block.id);
							console.log(block.mylist);
						});
						var blockusers = myBlock.indexOf(rc8.id);
						console.log("if chatted is in blocklist");
						console.log(blockusers);
						if(blockusers < 0){
							var theirblockusers = theirBlock.indexOf(pvrx.id);
							if(theirblockusers < 0){
								console.log("they did not have block users");
						//--------------------------------------------------------
								var room = {
									name : pvrx.id + "-" + rc8.id,
									male : pvrx,
									female : rc8
								};
								client.del(room.name,JSON.stringify(room));
								client.sadd(room.name,JSON.stringify(room));
								rooms.push(room);
								var randomIndex = vf.indexOf(JSON.stringify(pvrx));
								vf.splice(randomIndex,1);
								var randomIndex2 = vm.indexOf(JSON.stringify(rc8));
								vm.splice(randomIndex2,1);
								console.log("after removing maleList");
								console.log(returnRandom);
								client.sadd("chatted:"+pvrx.id,rc8.id);
								client.sadd("chatted:"+rc8.id,pvrx.id);
								client.lpush("last:"+pvrx.id,rc8.id);
								client.lpush("last:"+rc8.id,pvrx.id);
								client.sadd("chattingfemale",pvrx.id);
								client.sadd("chattingmale",rc8.id);
								app.io.broadcast(pvrx.id, room);
								app.io.broadcast(rc8.id, room);
						//--------------------new here------------------------------
							}else{
								console.log("chatmate have block users");
								if(vf.length <= 1){
									console.log("breaking cause no other user to be paired");
									break;
								}
							}
							//----------------------------------------------------------
						}else{
							console.log("you have block users");
							if(vm.length <= 1){
								console.log("breaking cause no other user to be paired");
								break;
							}
						}
					}
				}else{
					//rotFirst = vm;
					//rotSecond = vf;
					console.log("MALE");
					while(vm.length >= 1){
						console.log("goes in this location vr.length="+vm.length);
						var pvrx = vm[Math.floor(Math.random()*vm.length)];
						pvrx = JSON.parse(pvrx);
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvrx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvrx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvrx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						console.log("pvrx identity "+pvrx);
						console.log(pvrx);
						var rc8 = vf[Math.floor(Math.random()*vf.length)];
						rc8 = JSON.parse(rc8);
						console.log("rc8 identity "+rc8);
						console.log(rc8);
						//----------------------new here--------------------------
						var theirBlock = new Array();
						console.log("blockAllList is not empty");
						blockAllList.forEach(function(block){
							if(block.id == rc8.id){
								var lenBlock = block.mylist;
								if(lenBlock.length > 0){
									console.log("myList of "+rc8.id+" is not empty");
									lenBlock.forEach(function(list){
										theirBlock.push(list);
									});
								}else{
									console.log("myList of "+rc8.id+" is empty");
								}
							}
							console.log(block.id);
							console.log(block.mylist);
						});
						var blockusers = myBlock.indexOf(rc8.id);
						console.log("if chatted is in blocklist");
						console.log(blockusers);
						if(blockusers < 0){
							var theirblockusers = theirBlock.indexOf(pvrx.id);
							if(theirblockusers < 0){
								console.log("they did not have block users");
						//--------------------------------------------------------
								var room = {
									name : pvrx.id + "-" + rc8.id,
									male : pvrx,
									female : rc8
								};
								client.del(room.name,JSON.stringify(room));
								client.sadd(room.name,JSON.stringify(room));
								rooms.push(room);
								var randomIndex = vm.indexOf(JSON.stringify(pvrx));
								vm.splice(randomIndex,1);
								var randomIndex2 = vf.indexOf(JSON.stringify(rc8));
								vf.splice(randomIndex2,1);
								console.log("after removing maleList");
								console.log(returnRandom);
								client.sadd("chatted:"+pvrx.id,rc8.id);
								client.sadd("chatted:"+rc8.id,pvrx.id);
								client.lpush("last:"+pvrx.id,rc8.id);
								client.lpush("last:"+rc8.id,pvrx.id);
								client.sadd("chattingmale",pvrx.id);
								client.sadd("chattingfemale",rc8.id);
								app.io.broadcast(pvrx.id, room);
								app.io.broadcast(rc8.id, room);
						//--------------------new here------------------------------
							}else{
								console.log("chatmate have block users");
								if(vf.length <= 1){
									console.log("breaking cause no other user to be paired");
									break;
								}
							}
							//----------------------------------------------------------
						}else{
							console.log("you have block users");
							if(vm.length <= 1){
								console.log("breaking cause no other user to be paired");
								break;
							}
						}
					}
				}
			}
		},
		forcatchup : function(){
			console.log("CATCHUP_USER SHOULD RESET TO FALSE");
			catchup_user = false;
			console.log("CATCHUP_USER SHOULD RESET TO FALSE");
		}
	},function(err,result){
		console.log("++++++++++++++++IT GOES HERE AFTER+++++++++++++++");
	});
};

catchup_game = function(){
	async.auto({
		getListChattingMale : function(callback){
			client.smembers('chattingmale',callback);
		},
		getListChattingFemale : function(callback){
			client.smembers('chattingfemale',callback);
		},
		getListChattingRandom : function(callback){
			client.smembers('chattingrandom',callback);
		},
		getListMaleVisitor : function(callback){
			client.keys('male-*',callback);
		},
		getListFemaleVisitor : function(callback){
			client.keys('female-*',callback);
		},
		getListRandomVisitor : function(callback){
			client.keys('randale-*',callback);
		},
		catchupFemale : ['getListChattingFemale','getListFemaleVisitor',function(callback,result){
			var onFemale = result.getListChattingFemale;
			var totalFemale = result.getListFemaleVisitor;
			console.log(onFemale);
			console.log(totalFemale);
			var proxyFemale = new Array();
			totalFemale.forEach(function(listTotal){
				proxyFemale.push(listTotal);
			});
			var countTotal = 0;
			console.log("total count of onFemale chatting");
			console.log(countTotal);
			var lengthonFe = onFemale.length;
			totalFemale.forEach(function(female){
				var trimfemale = female.replace("female-","");
				console.log("trimfemale");
				console.log(trimfemale);
				onFemale.forEach(function(inFemale){
					console.log("inFemale");
					console.log(inFemale);
					if(inFemale == trimfemale){
						var locateFemale = proxyFemale.indexOf('female-'+trimfemale);
						console.log("locateFemale");
						console.log(locateFemale);
						proxyFemale.splice(locateFemale,1);
						console.log("totalFemale");
						console.log(proxyFemale);
						console.log(totalFemale);
						countTotal+=1;
					}
				});
			});
			console.log("total count of onFemale chatting");
			console.log(countTotal);
			if(countTotal == lengthonFe){
				console.log("Final list after removing ongoing chatters Female");
				console.log(proxyFemale);
				callback(null,proxyFemale);
			}
		}],
		catchupMale : ['getListChattingMale','getListMaleVisitor',function(callback,result){
			var onMale = result.getListChattingMale;
			var totalMale = result.getListMaleVisitor;
			console.log(onMale);
			console.log(totalMale);
			var proxyMale = new Array();
			totalMale.forEach(function(listTotal){
				proxyMale.push(listTotal);
			});
			//var countTotal = onMale.length;
			var countTotal = 0;
			console.log("total count of onMale chatting");
			console.log(countTotal);
			var lengthonMa = onMale.length;
			totalMale.forEach(function(male){
				var trimmale = male.replace("male-","");
				console.log("trimmale");
				console.log(trimmale);
				onMale.forEach(function(inMale){
					console.log("inMale");
					console.log(inMale);
					if(inMale == trimmale){
						var locateMale = proxyMale.indexOf('male-'+trimmale);
						console.log("locateMale");
						console.log(locateMale);
						proxyMale.splice(locateMale,1);
						console.log("totalMale");
						console.log(proxyMale);
						console.log(totalMale);
						countTotal+=1;
					}
				});
			});
			console.log("total count of onMale chatting");
			console.log(countTotal);
			if(countTotal == lengthonMa){
				console.log("Final list after removing ongoing chatters Male");
				console.log(proxyMale);
				callback(null,proxyMale);
			}
		}],
		catchupRandom : ['getListChattingRandom','getListRandomVisitor',function(callback,result){
			var onRandom = result.getListChattingRandom;
			var totalRandom = result.getListRandomVisitor;
			console.log(onRandom);
			console.log(totalRandom);
			var proxyRandom = new Array();
			totalRandom.forEach(function(listTotal){
				proxyRandom.push(listTotal);
			});
			var countTotal = 0;
			console.log("total count of onRandom chatting");
			console.log(countTotal);
			var lengthonRa = onRandom.length;
			totalRandom.forEach(function(random){
				var trimrandom = random.replace("randale-","");
				console.log("trimrandom");
				console.log(trimrandom);
				onRandom.forEach(function(inRandom){
					console.log("inRandom");
					console.log(inRandom);
					if(inRandom == trimrandom){
						var locateRandom = proxyRandom.indexOf('randale-'+trimrandom);
						console.log("locateRandom");
						console.log(locateRandom);
						proxyRandom.splice(locateRandom,1);
						console.log("totalRandom");
						console.log(proxyRandom);
						console.log(totalRandom);
						countTotal+=1;
					}
				});
			});
			console.log("total count of onFemale chatting");
			console.log(countTotal);
			if(countTotal == lengthonRa){
				console.log("Final list after removing ongoing chatters Random");
				console.log(proxyRandom);
				callback(null,proxyRandom);
			}
		}],
		getMaleVisitor : ['catchupMale',function(callback,result){
			console.log("function get male");
			var cm = result.catchupMale;
			console.log(result.catchupMale);
			console.log(cm);
			console.log(cm.length);
			if(cm.length > 0){
				client.mget(cm,callback);
			}
			else{
				var emptylist = [];
				callback(null,emptylist);
			}
		}],
		getFemaleVisitor : ['catchupFemale',function(callback,result){
			console.log("function get female");
			var cf = result.catchupFemale;
			console.log(result.catchupFemale);
			console.log(cf);
			console.log(cf.length);
			if(cf.length > 0){
				client.mget(cf,callback);
			}else{
				var emptylist = [];
				callback(null,emptylist);
			}
		}],
		getRandomVisitor : ['catchupRandom',function(callback,result){
			console.log("function get random");
			var cr = result.catchupRandom;
			console.log(result.catchupRandom);
			console.log(cr);
			console.log(cr.length);
			if(cr.length > 0){
				client.mget(cr,callback);
			}else{
				var emptylist = [];
				callback(null,emptylist);
			}
		}],
		startCatchUpGame : ['getFemaleVisitor','getMaleVisitor','getRandomVisitor',function(callback,result){
			var catchFinalFemale = result.catchupFemale;
			var catchFinalMale = result.catchupMale;
			var catchFinalRandom = result.catchupRandom;
			var catchDetailFemale = result.getFemaleVisitor;
			var catchDetailMale = result.getMaleVisitor;
			var catchDetailRandom = result.getRandomVisitor;
			console.log("Final list of Male, Female and Random to catch-up");
			console.log(catchFinalFemale);
			console.log(catchFinalMale);
			console.log(catchFinalRandom);
			console.log("DETAILS of Catch Up");
			console.log(catchDetailFemale);
			console.log(catchDetailMale);
			console.log(catchDetailRandom);
			//-----newly add-------
			catchup_user = false;
			//---------------------
			if((catchFinalFemale.length >= 1 && catchFinalMale.length >= 1) || catchFinalRandom.length > 1){
				console.log("PROCEED CATCH UP TO CHAT");
				another_chat(catchDetailFemale,catchDetailMale,catchDetailRandom,catchFinalFemale,catchFinalMale,catchFinalRandom,0);
			}else{
				console.log("WAITING FOR OTHER USER TO BE PAIRED");
				//catchup_user = false;
			}
		}]
	});
};

start_game = function(){
	async.auto({
		getListMaleVisitor : function(callback){
			client.keys('male-*',callback);
		},
		getListFemaleVisitor : function(callback){
			client.keys('female-*',callback);
		},
		getListRandomVisitor : function(callback){
			client.keys('randale-*',callback);
		},
		getMaleVisitor : ['getListMaleVisitor',function(callback,result){
			console.log("function get male");
			var cm = result.getListMaleVisitor;
			console.log(result.getListMaleVisitor);
			console.log(cm);
			console.log(cm.length);
			if(cm.length > 0){
				client.mget(cm,callback);
			}else{
				var male = [];
				callback(null,male);
			}
		}],
		getFemaleVisitor : ['getListFemaleVisitor',function(callback,result){
			console.log("function get female");
			var cf = result.getListFemaleVisitor;
			console.log(result.getListFemaleVisitor);
			console.log(cf);
			console.log(cf.length);
			if(cf.length > 0){
				client.mget(cf,callback);
			}else{
				var female = [];
				callback(null,female);
			}
		}],
		getRandomVisitor : ['getListRandomVisitor',function(callback,result){
			console.log("function get random");
			var cr = result.getListRandomVisitor;
			console.log(result.getListRandomVisitor);
			console.log(cr);
			console.log(cr.length);
			if(cr.length > 0){
				client.mget(cr,callback);
			}else{
				var random = [];
				callback(null,random);
			}
		}],
		assignRoom : ['getMaleVisitor','getFemaleVisitor','getRandomVisitor',function(callback,result){
			var vf = result.getFemaleVisitor;
			var vm = result.getMaleVisitor;
			var vr = result.getRandomVisitor;
			var cflist = result.getListFemaleVisitor;
			var cmlist = result.getListMaleVisitor;
			var crlist = result.getListRandomVisitor;
			console.log("@@@@@@@@@@@@@ Room Assigned");
			console.log(vf);
			console.log(vm);
			console.log(vr);
			console.log(cflist);
			console.log(cmlist);
			console.log(crlist);
			console.log("@@@@@@@@@@@@@ Room Assigned");
			newuser = false;
			start_chat(vf,vm,vr,cflist,cmlist,crlist,0);
		}]
	});
};

function getRoom(req){
	var rooms = req.io.manager.roomClients[req.io.socket.id];
	var room = "";
	for(var i in rooms){
		if(i != '' && room == ""){
			room = i.replace('/','');
		}
	}
	console.log(room);
	return room;
}
