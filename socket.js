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
        console.log(array[i]);
        listTopic.push(array[i].replace("\r",""));
        temp -= 1;
        if(temp <= 0){
        	displayOutput();
        }
    }
});

function displayOutput(){
	console.log("TOPICS LIST:");
	topic = listTopic;
	console.log(topic);
}

app.io.set('log level', 1);
app.io.set('authorization', function (handshakeData, callback) {
	if(handshakeData.headers.cookie){
	//	console.log(handshakeData.headers.cookie);
		console.log("xxXX Cookie XXxx");
		//console.log(handshakeData.headers.cookie);
		var cookies = handshakeData.headers.cookie.replace("'","").split(";");
		console.log("declaration");
		//console.log(cookies);
		console.log("checking cookies");
		//console.log(cookies.length);
		for(var i = 0; i<cookies.length; i++){
			var checkMe = cookies[i].search("peekawoo=");
			//console.log(checkMe);
			if(checkMe >= 0){
				console.log("i'm at Array number "+i+" location "+checkMe);
				var sampleMe = cookies[i].split("=");
				if(sampleMe.length > 1){
					console.log("goes greater");
					sampleMe = sampleMe[1].split("=");
				}
				else{
					console.log("goes lessthan");
					sampleMe = sampleMe[0].split("=");
				}
				break;
			}
		}
		console.log("here is the perfect result");
		//console.log(sampleMe);
		sid = sampleMe[0].replace("s%3A","").split(".")[0];
		console.log("checking cookies");
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
		console.log("it just end here");
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
	console.log("xxXX connecting clients . . . XXxx");
	//console.log(socket);
	//console.log(socket.handshake);
	console.log("xxX pushing socket.id Xxx");
	var userx = socket.handshake.peekawoo.user;
	var usery = socket.handshake.peekawoo.sessionid;
	if(userx != undefined){
		if(userx.gender != undefined){
			client.persist(userx.gender+'-'+userx.id);
			//client.persist('chatted:'+userx.id)
		}
	}
	console.log("xxXX Normal Data came here XXxx");
	//console.log(req.data);
	//console.log(haveData);
	//console.log(myArray);
	
	app.io.route('enter',function(){
			//console.log("location url requesting in socket");
			//console.log(socket);
		client.keys('*ale-*',function(err,list){
			//console.log("content of query for user count");
			//console.log(list);
			var listFemale = 0;
			var listMale = 0;
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
						}else
							undefinedUser+=1;
					}
				});
				var userList = {}
				userList.male = listMale;
				userList.female = listFemale;
				userList.undefineduser = undefinedUser;
				if(list.length > 0){
					countUserInside = list.length;
				}
				else{
					countUserInside = 0;
				}
				//console.log(countUserInside);
				//console.log(userList)
				app.io.broadcast('listusers',{count:countUserInside,users:userList});
			}
		});
	});
	
	socket.on('disconnect',function(){
		console.log("xxxxxxxxx disconnecting active client xxxxxxxx");
		if(userx != undefined){
			if(userx.gender != undefined){
				client.expire(userx.gender+'-'+userx.id,20); //change from 60secs to 20secs
				//client.expire('chatted:'+userx.id,20);
			}
		}
	});

	console.log("===================");
	//console.log(socket.handshake.peekawoo.user);
	console.log("===================");
	var user = socket.handshake.peekawoo.user;
	app.io.route('join',function(req){
		console.log("++++checking req.data.room ++++");
		console.log(req.params);
		console.log(req.data.room);
		req.io.join(req.data.room);
		app.io.room(req.data.room).broadcast('roomtopic',topic[Math.floor(Math.random() * topic.length)]);
	});
	
	app.io.route('timer',function(req){
		console.log("server current timer");
		console.log(countGlobal);
		app.io.room(getRoom(req)).broadcast('sendtime', countGlobal);
	});
	
	app.io.route('reload',function(req){
		console.log("+++ removing due to reloading page +++");
		//console.log(req.data);
		var removehere = req.data;
		var again = {};
		again.id = removehere.id;
		again.username = removehere.username;
		again.gender = removehere.gender;
		again.photourl = removehere.photourl;
		again.provider = removehere.provider;
		//console.log(again);
		if(removehere.provider == 'twitter'){
			again.gender = 'female';
			client.srem("visitor:female",JSON.stringify(again));
			again.gender = 'male';
			client.srem("visitor:male",JSON.stringify(again));
		}else{
			client.srem("visitor:"+removehere.gender,JSON.stringify(again));
		}
	});
	
	app.io.route('leave',function(req){
		console.log("++++signout req.data.room++++");
		//console.log(req.data.room);
		console.log("++++signout req.data.user++++");
		//console.log(req.data.user);
		console.log("+++++removing gender and room declare+++++");
		var removegender;
		if(req.data.user.id == req.data.room.male.id){
			removegender = req.data.room.male;
		}else{
			removegender = req.data.room.female;
		}
		var removeroom = req.data.room;
		//console.log(removegender);
		//console.log(removeroom);
		console.log("+++++removing gender+++++");
		delete removegender.codename;
		//console.log(removegender);
		//client.srem("visitor:"+removegender.gender,JSON.stringify(removegender));
		client.del(removegender.gender+'-'+removegender.id,JSON.stringify(removegender));
		client.del("chatted:"+removegender.id);
		//client.del("last:"+removegender.id);
		//client.del(removeroom.name);
		console.log("@@@@@ D O N E  R E M O V I N G @@@@@");
	});
	
	app.io.route('insert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		//console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
		console.log("====mate value====");
		//console.log(mate);
		console.log("====remove if exist====");
		client.srem("visitor:"+mate.id,JSON.stringify(user));
		console.log("====add user to mate====");
		client.sadd("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('uninsert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		//console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
		console.log("====mate value====");
		//console.log(mate);
		console.log("====Delete me in my chatmate====");
		client.srem("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('block',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		//console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
		console.log("====mate value====");
		//console.log(mate);
		console.log("====remove if exist====");
		client.srem("block:"+user.id,mate.id);
		client.srem("blockinfo:"+user.id,JSON.stringify(mate));
		console.log("====add user to mate====");
		client.sadd("block:"+user.id,mate.id);
		client.sadd("blockinfo:"+user.id,JSON.stringify(mate));
	});
	
	app.io.route('unblock',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		//console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		//console.log(user);
		console.log("====mate value====");
		//console.log(mate);
		console.log("====Delete me in my chatmate====");
		client.srem("block:"+user.id,mate.id);
		client.srem("blockinfo:"+user.id,JSON.stringify(mate));
	});
	
	app.io.route('my msg',function(req){
		app.io.room(getRoom(req)).broadcast('new msg', req.data);
	});

	app.io.route('member', function(req) {
		async.auto({
			checkIfExist : function(callback){
				console.log("checking if goes in here");
				//console.log(req.data);
				var gender = JSON.parse(req.data);
				console.log(gender.gender);
				if(gender.provider == 'twitter'){
					if(gender.gender != 'male' || gender.gender != 'female'){
						client.keys('*le-'+gender.id,function(err,value){
							console.log(value);
							if(value.length > 0){
								var getValue = value[0].search('female-');
								if(getValue >= 0){
									gender.gender = 'female';
								}else{
									gender.gender = 'male';
								}
							}
						});
						var me = {};
						me.id = gender.id;
						me.username = gender.username;
						me.gender = gender.gender;
						me.photourl = gender.photourl;
						me.provider = gender.provider;
						console.log(me);
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
				console.log("checking if goes in here member");
				var user = JSON.parse(req.data);
				//console.log(req.data);
				console.log(user.gender);
				if(user.provider == 'twitter'){
					if(!user.gender){
						console.log("member twitter");
						console.log(user.gender);
						client.keys('*le-'+user.id,function(err,value){
							console.log(value);
							if(value.length > 0){
								var getValue = value[0].search('female-');
								if(getValue >= 0){
									user.gender = 'female';
								}else{
									user.gender = 'male';
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
			}
		},function(err,result){
			console.log(result);
			if(result.checkIfExist == 0){
				console.log("NOTHING");
				console.log(result.checkIfExist);
				console.log("xxXXxx IM NEW HERE xxXXxx");
				newuser = true;
				newuserCount += 1;
			}
			else{
				console.log("xxXXxx IM ALREADY HERE BEFORE xxXXxx");
				newuser = false;
			}
			if(result.getMaleVisitor.length >= 1 && result.getFemaleVisitor.length >= 1){
				console.log("xxXXxx NEWUSER Result xxXXxx");
				console.log("newuser="+newuser);
				console.log("newuserCount="+newuserCount);
				console.log("game_lock="+game_lock);
				if(!game_lock){
					//newuserCount = 0;
					game_lock = true;
					console.log("starting game in 15 sec");
					setTimeout(function(){
						newuserCount = 0;
						start_game();
					},10000);
				}
				else{
					if(game_ongoing && !catchup_user){
						catchup_user = true;
						catchup_game();
					}
				}
			}
		});
	});
});

start_chat = function(vf,vm,cflist,cmlist,cycle){
	console.log("@@@@@@@@@@@@@ Chat start");
	
	async.auto({
		group_user : function(){
			var rooms = new Array();
			var lowestLength = Math.min(vf.length,vm.length);
			var rotationTurn = false;
			var priority;
			var maleList = cmlist;
			var femaleList = cflist;
			var returnMale = new Array();
			var returnFemale = new Array();
			var noFemalePartner = new Array();
			var noMalePartner = new Array();
			cmlist.forEach(function(returnAgain){
				returnMale.push(returnAgain);
			});
			cflist.forEach(function(returnAgain2){
				returnFemale.push(returnAgain2);
			});
			console.log("return male and female");
			console.log(returnMale);
			console.log(returnFemale);
			if(vf.length == lowestLength){
				priority = "female";
			}else{
				priority = "male";
			}
			console.log(lowestLength);
			console.log("female length");
			console.log(vf.length);
			console.log("female list content");
			console.log(cflist);
			console.log("male list content");
			console.log(cmlist);
			//var vfs = JSON.parse(vf[i]);
			//var vms = JSON.parse(vm[i]);
			console.log("json parse of vm and vf");
			//console.log(vfs);
			//console.log(vms);
			
			//newly added code that implements block. get users blocklist
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
			if(priority == "female"){
				vf.forEach(function(pvf){
					var pvfx = JSON.parse(pvf);
					client.smembers("chatted:"+pvfx.id,function(err,chats){
						console.log("female is the priority");
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvfx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvfx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvfx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						if(!chats || chats.length == 0){
							console.log("xxxxXXXX Female IF CONDITION XXxxxx");
							var loopStop = false;
							for(var i = 0;i<vm.length;i++){
								console.log("loop i value");
								console.log(i);
								console.log(loopStop);
								if(!loopStop){
									console.log("list if guyz in vm");
									var vmx = JSON.parse(vm[i]);
									console.log(vmx);
									console.log("if false goes here");
									var checkIfAvailable = maleList.indexOf(vmx.gender+'-'+vmx.id);
									console.log("maleList content");
									console.log(maleList);
									console.log("checkAvailable content");
									console.log(checkIfAvailable);
									if(checkIfAvailable >= 0){
										var theirBlock = new Array();
										if(blockAllList.length > 0){
											console.log("blockAllList is not empty");
											blockAllList.forEach(function(block){
												if(block.id == vmx.id){
													var lenBlock = block.mylist;
													if(lenBlock.length > 0){
														console.log("myList of "+vmx.id+" is not empty");
														lenBlock.forEach(function(list){
															theirBlock.push(list);
														});
													}else{
														console.log("myList of "+vmx.id+" is empty");
													}
												}
												console.log(block.id);
												console.log(block.mylist);
											});
										}else{
											console.log("blockAllList is empty");
										}
										var blockusers = myBlock.indexOf(vmx.id);
										console.log("if chatted is in blocklist");
										console.log(blockusers);
										if(blockusers < 0){
											var theirblockusers = theirBlock.indexOf(pvfx.id);
											if(theirblockusers < 0){
												console.log("they did not have block users");
												var room = {
														name : vmx.id + "-" + pvfx.id,
														male : vmx,
														female : pvfx
													}
												client.del(room.name,JSON.stringify(room));
												client.sadd(room.name,JSON.stringify(room));
												console.log("++++++getting blank room++++++");
												//console.log(room);
												console.log("++++++++++++++++++++++++++++++");
												rooms.push(room);
												console.log("++++Start Conversation++++");
												//console.log(rooms);
												console.log("++++++++++++++++++++++++++");
												console.log("before female remove");
												//console.log(pvfx);
												//console.log(femaleList);
												var removeInListFemale = femaleList.indexOf('female-'+pvfx.id);
												femaleList.splice(removeInListFemale,1);
												console.log("after removing maleList");
												console.log(femaleList);
												console.log("before male remove");
												console.log(vmx);
												console.log(maleList);
												var removeInListMale  = maleList.indexOf('male-'+vmx.id);
												maleList.splice(removeInListMale,1);
												console.log("after removing maleList");
												console.log(maleList);
												client.sadd("chatted:"+pvfx.id,vmx.id);
												client.sadd("chatted:"+vmx.id,pvfx.id);
												client.lpush("last:"+pvfx.id,vmx.id);
												client.lpush("last:"+vmx.id,pvfx.id);
												client.sadd("chattingfemale",pvfx.id);
												client.sadd("chattingmale",vmx.id);
												app.io.broadcast(pvfx.id, room);
												app.io.broadcast(vmx.id, room);
												loopStop = true;
												rotationTurn = true;
												//break;
											}else{
												console.log("they have block users");
											}
										}
									}
								}
							}
						}
						else{
							console.log("xxxxXXXX Female ELSE CONDITION XXxxxx");
							var trimMaleList = new Array();
							maleList.forEach(function(copyMale){
								trimMaleList.push(copyMale);
							});
							console.log(trimMaleList);
							var qtyOfChatmate = chats.length;
							chats.forEach(function(chat){
								console.log("else content chat");
								console.log(chat);
								var ifAlreadyExist = trimMaleList.indexOf('male-'+chat);
								console.log(ifAlreadyExist);
								if(ifAlreadyExist >= 0){
									trimMaleList.splice(ifAlreadyExist,1);
								}
								console.log("trimmalelist content after splice");
								console.log(trimMaleList);
								console.log(maleList);
								qtyOfChatmate-=1;
							});
							console.log("trimmalelist final content");
							console.log(trimMaleList);
							console.log(trimMaleList[0]);
							console.log(maleList);
							if(qtyOfChatmate <= 0){
								console.log("if true done of removing chatted");
								console.log(trimMaleList.length);
								if(trimMaleList.length > 0){
									var loopStop = false;
									for(var k=0;k<vm.length;k++){
										console.log("value of k");
										console.log(k);
										console.log(loopStop);
										if(!loopStop){
											var vmx = JSON.parse(vm[k]);
											console.log("value of vmx");
											console.log(vmx);
											var splitMaleId = trimMaleList[0].replace('male-','');
											console.log("content of splitMlaeId after replaced trimMale");
											console.log(splitMaleId);
											if(vmx.id == splitMaleId){
												var theirBlock = new Array();
												if(blockAllList.length > 0){
													console.log("blockAllList is not empty");
													blockAllList.forEach(function(block){
														if(block.id == vmx.id){
															var lenBlock = block.mylist;
															if(lenBlock.length > 0){
																console.log("myList of "+vmx.id+" is not empty");
																lenBlock.forEach(function(list){
																	theirBlock.push(list);
																});
															}else{
																console.log("myList of "+vmx.id+" is empty");
															}
														}
														console.log(block.id);
														console.log(block.mylist);
													});
												}else{
													console.log("blockAllList is empty");
												}
												var blockusers = myBlock.indexOf(vmx.id);
												if(blockusers < 0){
													var theirblockusers = theirBlock.indexOf(pvfx.id);
													if(theirblockusers < 0){
														console.log("they did not have block users");
														var room = {
																name : vmx.id + "-" + pvfx.id,
																male : vmx,
																female : pvfx
															}
														client.del(room.name,JSON.stringify(room));
														client.sadd(room.name,JSON.stringify(room));
														console.log("++++++getting blank room++++++");
														console.log(room);
														console.log("++++++++++++++++++++++++++++++");
														rooms.push(room);
														console.log("++++Start Conversation++++");
														console.log(rooms);
														console.log("++++++++++++++++++++++++++");
														console.log("before female remove");
														console.log(pvfx);
														console.log(femaleList);
														var removeInListFemale = femaleList.indexOf('female-'+pvfx.id);
														femaleList.splice(removeInListFemale,1);
														console.log("after removing maleList");
														console.log(femaleList);
														console.log("before male remove");
														console.log(vmx);
														console.log(maleList);
														var removeInListMale  = maleList.indexOf('male-'+vmx.id);
														maleList.splice(removeInListMale,1);
														console.log("after removing maleList");
														console.log(maleList);
														client.sadd("chatted:"+pvfx.id,vmx.id);
														client.sadd("chatted:"+vmx.id,pvfx.id);
														client.lpush("last:"+pvfx.id,vmx.id);
														client.lpush("last:"+vmx.id,pvfx.id);
														client.sadd("chattingfemale",pvfx.id);
														client.sadd("chattingmale",vmx.id);
														app.io.broadcast(pvfx.id, room);
														app.io.broadcast(vmx.id, room);
														loopStop = true;
														rotationTurn = true;
														//break;
													}else{
														console.log("they have block users");
													}
												}
											}
										}
									}
								}
							}
						}
					});
				});
			}else{
				vm.forEach(function(pvm){
					var pvmx = JSON.parse(pvm);
					client.smembers("chatted:"+pvmx.id,function(err,chats){
						console.log("male is the priority");
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvmx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvmx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvmx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						if(!chats || chats.length == 0){
							console.log("xxxxXXXX Male IF CONDITION XXxxxx");
							var loopStop2 = false;
							for(var j=0;j<vf.length;j++){
								console.log("loop j value");
								console.log(j);
								console.log(loopStop2);
								if(!loopStop2){
									console.log("list if girlz in vm");
									var vfx = JSON.parse(vf[j]);
									console.log(vfx);
									console.log("if false goes here male");
									var checkIfAvailable = femaleList.indexOf(vfx.gender+'-'+vfx.id);
									console.log("femaleList content");
									console.log(femaleList);
									console.log("checkIfAvailable content");
									console.log(checkIfAvailable);
									if(checkIfAvailable >= 0){
										var theirBlock = new Array();
										if(blockAllList.length > 0){
											console.log("blockAllList is not empty");
											blockAllList.forEach(function(block){
												if(block.id == vfx.id){
													var lenBlock = block.mylist;
													if(lenBlock.length > 0){
														console.log("myList of "+vfx.id+" is not empty");
														lenBlock.forEach(function(list){
															theirBlock.push(list);
														});
													}else{
														console.log("myList of "+vfx.id+" is empty");
													}
												}
												console.log(block.id);
												console.log(block.mylist);
											});
										}else{
											console.log("blockAllList is empty");
										}
										var blockusers = myBlock.indexOf(vfx.id);
										console.log("if chatted is in blocklist");
										console.log(blockusers);
										if(blockusers < 0){
											var theirblockusers = theirBlock.indexOf(pvmx.id);
											if(theirblockusers < 0){
												console.log("they did not have block users");
												var room = {
														name : pvmx.id + "-" + vfx.id,
														male : pvmx,
														female : vfx
													}
												client.del(room.name,JSON.stringify(room));
												client.sadd(room.name,JSON.stringify(room));
												console.log("++++++getting blank room++++++");
												console.log(room);
												console.log("++++++++++++++++++++++++++++++");
												rooms.push(room);
												console.log("++++Start Conversation++++");
												console.log(rooms);
												console.log("++++++++++++++++++++++++++");
												console.log("before female remove");
												console.log(vfx);
												console.log(femaleList);
												var removeInListFemale = femaleList.indexOf('female-'+vfx.id);
												femaleList.splice(removeInListFemale,1);
												console.log("after removing femaleList");
												console.log(femaleList);
												console.log("before male remove");
												console.log(pvmx);
												console.log(maleList);
												var removeInListMale  = maleList.indexOf('male-'+pvmx.id);
												maleList.splice(removeInListMale,1);
												console.log("after removing maleList");
												console.log(maleList);
												client.sadd("chatted:"+vfx.id,pvmx.id);
												client.sadd("chatted:"+pvmx.id,vfx.id);
												client.lpush("last:"+vfx.id,pvmx.id);
												client.lpush("last:"+pvmx.id,vfx.id);
												client.sadd("chattingfemale",vfx.id);
												client.sadd("chattingmale",pvmx.id);
												app.io.broadcast(vfx.id, room);
												app.io.broadcast(pvmx.id, room);
												loopStop2 = true;
												rotationTurn = true;
												//break;
											}else{
												console.log("they have block users");
											}
										}
									}
								}
							}
						}
						else{
							console.log("xxxxXXXX Male ELSE CONDITION XXxxxx");
							var trimFemaleList = new Array();
							femaleList.forEach(function(copyFemale){
								trimFemaleList.push(copyFemale);
							});
							console.log(trimFemaleList);
							var qtyOfChatmate = chats.length;
							chats.forEach(function(chat){
								console.log("else content chat female");
								console.log(chat);
								var ifAlreadyExist = trimFemaleList.indexOf('female-'+chat);
								console.log(ifAlreadyExist);
								if(ifAlreadyExist >= 0){
									trimFemaleList.splice(ifAlreadyExist,1);
								}
								console.log("trimfemalelist content after splice");
								console.log(trimFemaleList);
								console.log(femaleList);
								qtyOfChatmate-=1;
							});
							console.log("trimfemalelist final content");
							console.log(trimFemaleList);
							console.log(trimFemaleList[0]);
							console.log(femaleList);
							if(qtyOfChatmate <= 0){
								console.log("if true done of removing chatted");
								console.log(trimFemaleList.length);
								if(trimFemaleList.length > 0){
									var loopStop2 = false;
									for(var m=0;m<vf.length;m++){
										console.log("value of m");
										console.log(m);
										console.log(loopStop2);
										if(!loopStop2){
											var vfx = JSON.parse(vf[m]);
											console.log("value of vmx");
											console.log(vfx);
											var splitFemaleId = trimFemaleList[0].replace('female-','');
											console.log("content of splitFemaleId after replaced trimFemale");
											console.log(splitFemaleId);
											if(vfx.id == splitFemaleId){
												var theirBlock = new Array();
												if(blockAllList.length > 0){
													console.log("blockAllList is not empty");
													blockAllList.forEach(function(block){
														if(block.id == vfx.id){
															var lenBlock = block.mylist;
															if(lenBlock.length > 0){
																console.log("myList of "+vfx.id+" is not empty");
																lenBlock.forEach(function(list){
																	theirBlock.push(list);
																});
															}else{
																console.log("myList of "+vfx.id+" is empty");
															}
														}
														console.log(block.id);
														console.log(block.mylist);
													});
												}else{
													console.log("blockAllList is empty");
												}
												var blockusers = myBlock.indexOf(vfx.id);
												if(blockusers < 0){
													var theirblockusers = theirBlock.indexOf(pvmx.id);
													if(theirblockusers < 0){
														console.log("they did not have block users");
														var room = {
																name : pvmx.id + "-" + vfx.id,
																male : pvmx,
																female : vfx
															}
														client.del(room.name,JSON.stringify(room));
														client.sadd(room.name,JSON.stringify(room));
														console.log("++++++getting blank room++++++");
														console.log(room);
														console.log("++++++++++++++++++++++++++++++");
														rooms.push(room);
														console.log("++++Start Conversation++++");
														console.log(rooms);
														console.log("++++++++++++++++++++++++++");
														console.log("before female remove");
														console.log(vfx);
														console.log(femaleList);
														var removeInListFemale = femaleList.indexOf('female-'+vfx.id);
														femaleList.splice(removeInListFemale,1);
														console.log("after removing femaleList");
														console.log(femaleList);
														console.log("before male remove");
														console.log(pvmx);
														console.log(maleList);
														var removeInListMale  = maleList.indexOf('male-'+pvmx.id);
														maleList.splice(removeInListMale,1);
														console.log("after removing maleList");
														console.log(maleList);
														client.sadd("chatted:"+vfx.id,pvmx.id);
														client.sadd("chatted:"+pvmx.id,vfx.id);
														client.lpush("last:"+vfx.id,pvmx.id);
														client.lpush("last:"+pvmx.id,vfx.id);
														client.sadd("chattingfemale",vfx.id);
														client.sadd("chattingmale",pvmx.id);
														app.io.broadcast(vfx.id, room);
														app.io.broadcast(pvmx.id, room);
														loopStop2 = true;
														rotationTurn = true;
														//break;
													}else{
														console.log("they have block users");
													}
												}
											}
										}
									}
								}
							}
						}
					});
				});
			}
			countGlobal = 120;
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
				clearInterval(globalTimer);
				game_lock = false;
				game_ongoing = false;
				app.io.broadcast('game_stop', true);
			},120000);
		},
		
	},function(err,result){
		console.log("++++++++++++++++IT GOES HERE AFTER+++++++++++++++");
	});
};

another_chat = function(vf,vm,cflist,cmlist,cycle){
	console.log("@@@@@@@@@@@@@ Chat start");
	
	async.auto({
		group_user : function(){
			var rooms = new Array();
			var lowestLength = Math.min(vf.length,vm.length);
			var rotationTurn = false;
			var priority;
			var maleList = cmlist;
			var femaleList = cflist;
			var returnMale = new Array();
			var returnFemale = new Array();
			var noFemalePartner = new Array();
			var noMalePartner = new Array();
			cmlist.forEach(function(returnAgain){
				returnMale.push(returnAgain);
			});
			cflist.forEach(function(returnAgain2){
				returnFemale.push(returnAgain2);
			});
			console.log("return male and female");
			console.log(returnMale);
			console.log(returnFemale);
			if(vf.length == lowestLength){
				priority = "female";
			}else{
				priority = "male";
			}
			console.log(lowestLength);
			console.log("female length");
			console.log(vf.length);
			console.log("female list content");
			console.log(cflist);
			console.log("male list content");
			console.log(cmlist);
			//var vfs = JSON.parse(vf[i]);
			//var vms = JSON.parse(vm[i]);
			console.log("json parse of vm and vf");
			//console.log(vfs);
			//console.log(vms);
			
			//newly added code that implements block. get users blocklist
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
			if(priority == "female"){
				vf.forEach(function(pvf){
					var pvfx = JSON.parse(pvf);
					client.smembers("chatted:"+pvfx.id,function(err,chats){
						console.log("female is the priority");
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvfx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvfx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvfx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						if(!chats || chats.length == 0){
							console.log("xxxxXXXX Female IF CONDITION XXxxxx");
							var loopStop = false;
							for(var i = 0;i<vm.length;i++){
								console.log("loop i value");
								console.log(i);
								console.log(loopStop);
								if(!loopStop){
									console.log("list if guyz in vm");
									var vmx = JSON.parse(vm[i]);
									console.log(vmx);
									console.log("if false goes here");
									var checkIfAvailable = maleList.indexOf(vmx.gender+'-'+vmx.id);
									console.log("maleList content");
									console.log(maleList);
									console.log("checkAvailable content");
									console.log(checkIfAvailable);
									if(checkIfAvailable >= 0){
										var theirBlock = new Array();
										if(blockAllList.length > 0){
											console.log("blockAllList is not empty");
											blockAllList.forEach(function(block){
												if(block.id == vmx.id){
													var lenBlock = block.mylist;
													if(lenBlock.length > 0){
														console.log("myList of "+vmx.id+" is not empty");
														lenBlock.forEach(function(list){
															theirBlock.push(list);
														});
													}else{
														console.log("myList of "+vmx.id+" is empty");
													}
												}
												console.log(block.id);
												console.log(block.mylist);
											});
										}else{
											console.log("blockAllList is empty");
										}
										var blockusers = myBlock.indexOf(vmx.id);
										console.log("if chatted is in blocklist");
										console.log(blockusers);
										if(blockusers < 0){
											var theirblockusers = theirBlock.indexOf(pvfx.id);
											if(theirblockusers < 0){
												console.log("they did not have block users");
												var room = {
														name : vmx.id + "-" + pvfx.id,
														male : vmx,
														female : pvfx
													}
												client.del(room.name,JSON.stringify(room));
												client.sadd(room.name,JSON.stringify(room));
												console.log("++++++getting blank room++++++");
												//console.log(room);
												console.log("++++++++++++++++++++++++++++++");
												rooms.push(room);
												console.log("++++Start Conversation++++");
												//console.log(rooms);
												console.log("++++++++++++++++++++++++++");
												console.log("before female remove");
												//console.log(pvfx);
												//console.log(femaleList);
												var removeInListFemale = femaleList.indexOf('female-'+pvfx.id);
												femaleList.splice(removeInListFemale,1);
												console.log("after removing maleList");
												console.log(femaleList);
												console.log("before male remove");
												console.log(vmx);
												console.log(maleList);
												var removeInListMale  = maleList.indexOf('male-'+vmx.id);
												maleList.splice(removeInListMale,1);
												console.log("after removing maleList");
												console.log(maleList);
												client.sadd("chatted:"+pvfx.id,vmx.id);
												client.sadd("chatted:"+vmx.id,pvfx.id);
												client.lpush("last:"+pvfx.id,vmx.id);
												client.lpush("last:"+vmx.id,pvfx.id);
												client.sadd("chattingfemale",pvfx.id);
												client.sadd("chattingmale",vmx.id);
												app.io.broadcast(pvfx.id, room);
												app.io.broadcast(vmx.id, room);
												loopStop = true;
												rotationTurn = true;
												//break;
											}else{
												console.log("they have block users");
											}
										}
									}
								}
							}
						}
						else{
							console.log("xxxxXXXX Female ELSE CONDITION XXxxxx");
							var trimMaleList = new Array();
							maleList.forEach(function(copyMale){
								trimMaleList.push(copyMale);
							});
							console.log(trimMaleList);
							var qtyOfChatmate = chats.length;
							chats.forEach(function(chat){
								console.log("else content chat");
								console.log(chat);
								var ifAlreadyExist = trimMaleList.indexOf('male-'+chat);
								console.log(ifAlreadyExist);
								if(ifAlreadyExist >= 0){
									trimMaleList.splice(ifAlreadyExist,1);
								}
								console.log("trimmalelist content after splice");
								console.log(trimMaleList);
								console.log(maleList);
								qtyOfChatmate-=1;
							});
							console.log("trimmalelist final content");
							console.log(trimMaleList);
							console.log(trimMaleList[0]);
							console.log(maleList);
							if(qtyOfChatmate <= 0){
								console.log("if true done of removing chatted");
								console.log(trimMaleList.length);
								if(trimMaleList.length > 0){
									var loopStop = false;
									for(var k=0;k<vm.length;k++){
										console.log("value of k");
										console.log(k);
										console.log(loopStop);
										if(!loopStop){
											var vmx = JSON.parse(vm[k]);
											console.log("value of vmx");
											console.log(vmx);
											var splitMaleId = trimMaleList[0].replace('male-','');
											console.log("content of splitMlaeId after replaced trimMale");
											console.log(splitMaleId);
											if(vmx.id == splitMaleId){
												var theirBlock = new Array();
												if(blockAllList.length > 0){
													console.log("blockAllList is not empty");
													blockAllList.forEach(function(block){
														if(block.id == vmx.id){
															var lenBlock = block.mylist;
															if(lenBlock.length > 0){
																console.log("myList of "+vmx.id+" is not empty");
																lenBlock.forEach(function(list){
																	theirBlock.push(list);
																});
															}else{
																console.log("myList of "+vmx.id+" is empty");
															}
														}
														console.log(block.id);
														console.log(block.mylist);
													});
												}else{
													console.log("blockAllList is empty");
												}
												var blockusers = myBlock.indexOf(vmx.id);
												if(blockusers < 0){
													var theirblockusers = theirBlock.indexOf(pvfx.id);
													if(theirblockusers < 0){
														console.log("they did not have block users");
														var room = {
																name : vmx.id + "-" + pvfx.id,
																male : vmx,
																female : pvfx
															}
														client.del(room.name,JSON.stringify(room));
														client.sadd(room.name,JSON.stringify(room));
														console.log("++++++getting blank room++++++");
														console.log(room);
														console.log("++++++++++++++++++++++++++++++");
														rooms.push(room);
														console.log("++++Start Conversation++++");
														console.log(rooms);
														console.log("++++++++++++++++++++++++++");
														console.log("before female remove");
														console.log(pvfx);
														console.log(femaleList);
														var removeInListFemale = femaleList.indexOf('female-'+pvfx.id);
														femaleList.splice(removeInListFemale,1);
														console.log("after removing maleList");
														console.log(femaleList);
														console.log("before male remove");
														console.log(vmx);
														console.log(maleList);
														var removeInListMale  = maleList.indexOf('male-'+vmx.id);
														maleList.splice(removeInListMale,1);
														console.log("after removing maleList");
														console.log(maleList);
														client.sadd("chatted:"+pvfx.id,vmx.id);
														client.sadd("chatted:"+vmx.id,pvfx.id);
														client.lpush("last:"+pvfx.id,vmx.id);
														client.lpush("last:"+vmx.id,pvfx.id);
														client.sadd("chattingfemale",pvfx.id);
														client.sadd("chattingmale",vmx.id);
														app.io.broadcast(pvfx.id, room);
														app.io.broadcast(vmx.id, room);
														loopStop = true;
														rotationTurn = true;
														//break;
													}else{
														console.log("they have block users");
													}
												}
											}
										}
									}
								}
							}
						}
					});
				});
			}else{
				vm.forEach(function(pvm){
					var pvmx = JSON.parse(pvm);
					client.smembers("chatted:"+pvmx.id,function(err,chats){
						console.log("male is the priority");
						console.log("xxXXxx list of all the blocklist user entered the chat xxXXxx ");
						var myBlock = new Array();
						console.log(blockAllList);
						if(blockAllList.length > 0){
							console.log("blockAllList is not empty");
							blockAllList.forEach(function(block){
								if(block.id == pvmx.id){
									var lenBlock = block.mylist;
									if(lenBlock.length > 0){
										console.log("myList of "+pvmx.id+" is not empty");
										lenBlock.forEach(function(list){
											myBlock.push(list);
										});
									}else{
										console.log("myList of "+pvmx.id+" is empty");
									}
								}
								console.log(block.id);
								console.log(block.mylist);
							});
						}else{
							console.log("blockAllList is empty");
						}
						if(!chats || chats.length == 0){
							console.log("xxxxXXXX Male IF CONDITION XXxxxx");
							var loopStop2 = false;
							for(var j=0;j<vf.length;j++){
								console.log("loop j value");
								console.log(j);
								console.log(loopStop2);
								if(!loopStop2){
									console.log("list if girlz in vm");
									var vfx = JSON.parse(vf[j]);
									console.log(vfx);
									console.log("if false goes here male");
									var checkIfAvailable = femaleList.indexOf(vfx.gender+'-'+vfx.id);
									console.log("femaleList content");
									console.log(femaleList);
									console.log("checkIfAvailable content");
									console.log(checkIfAvailable);
									if(checkIfAvailable >= 0){
										var theirBlock = new Array();
										if(blockAllList.length > 0){
											console.log("blockAllList is not empty");
											blockAllList.forEach(function(block){
												if(block.id == vfx.id){
													var lenBlock = block.mylist;
													if(lenBlock.length > 0){
														console.log("myList of "+vfx.id+" is not empty");
														lenBlock.forEach(function(list){
															theirBlock.push(list);
														});
													}else{
														console.log("myList of "+vfx.id+" is empty");
													}
												}
												console.log(block.id);
												console.log(block.mylist);
											});
										}else{
											console.log("blockAllList is empty");
										}
										var blockusers = myBlock.indexOf(vfx.id);
										console.log("if chatted is in blocklist");
										console.log(blockusers);
										if(blockusers < 0){
											var theirblockusers = theirBlock.indexOf(pvmx.id);
											if(theirblockusers < 0){
												console.log("they did not have block users");
												var room = {
														name : pvmx.id + "-" + vfx.id,
														male : pvmx,
														female : vfx
													}
												client.del(room.name,JSON.stringify(room));
												client.sadd(room.name,JSON.stringify(room));
												console.log("++++++getting blank room++++++");
												console.log(room);
												console.log("++++++++++++++++++++++++++++++");
												rooms.push(room);
												console.log("++++Start Conversation++++");
												console.log(rooms);
												console.log("++++++++++++++++++++++++++");
												console.log("before female remove");
												console.log(vfx);
												console.log(femaleList);
												var removeInListFemale = femaleList.indexOf('female-'+vfx.id);
												femaleList.splice(removeInListFemale,1);
												console.log("after removing femaleList");
												console.log(femaleList);
												console.log("before male remove");
												console.log(pvmx);
												console.log(maleList);
												var removeInListMale  = maleList.indexOf('male-'+pvmx.id);
												maleList.splice(removeInListMale,1);
												console.log("after removing maleList");
												console.log(maleList);
												client.sadd("chatted:"+vfx.id,pvmx.id);
												client.sadd("chatted:"+pvmx.id,vfx.id);
												client.lpush("last:"+vfx.id,pvmx.id);
												client.lpush("last:"+pvmx.id,vfx.id);
												client.sadd("chattingfemale",vfx.id);
												client.sadd("chattingmale",pvmx.id);
												app.io.broadcast(vfx.id, room);
												app.io.broadcast(pvmx.id, room);
												loopStop2 = true;
												rotationTurn = true;
												//break;
											}else{
												console.log("they have block users");
											}
										}
									}
								}
							}
						}
						else{
							console.log("xxxxXXXX Male ELSE CONDITION XXxxxx");
							var trimFemaleList = new Array();
							femaleList.forEach(function(copyFemale){
								trimFemaleList.push(copyFemale);
							});
							console.log(trimFemaleList);
							var qtyOfChatmate = chats.length;
							chats.forEach(function(chat){
								console.log("else content chat female");
								console.log(chat);
								var ifAlreadyExist = trimFemaleList.indexOf('female-'+chat);
								console.log(ifAlreadyExist);
								if(ifAlreadyExist >= 0){
									trimFemaleList.splice(ifAlreadyExist,1);
								}
								console.log("trimfemalelist content after splice");
								console.log(trimFemaleList);
								console.log(femaleList);
								qtyOfChatmate-=1;
							});
							console.log("trimfemalelist final content");
							console.log(trimFemaleList);
							console.log(trimFemaleList[0]);
							console.log(femaleList);
							if(qtyOfChatmate <= 0){
								console.log("if true done of removing chatted");
								console.log(trimFemaleList.length);
								if(trimFemaleList.length > 0){
									var loopStop2 = false;
									for(var m=0;m<vf.length;m++){
										console.log("value of m");
										console.log(m);
										console.log(loopStop2);
										if(!loopStop2){
											var vfx = JSON.parse(vf[m]);
											console.log("value of vmx");
											console.log(vfx);
											var splitFemaleId = trimFemaleList[0].replace('female-','');
											console.log("content of splitFemaleId after replaced trimFemale");
											console.log(splitFemaleId);
											if(vfx.id == splitFemaleId){
												var theirBlock = new Array();
												if(blockAllList.length > 0){
													console.log("blockAllList is not empty");
													blockAllList.forEach(function(block){
														if(block.id == vmx.id){
															var lenBlock = block.mylist;
															if(lenBlock.length > 0){
																console.log("myList of "+vmx.id+" is not empty");
																lenBlock.forEach(function(list){
																	theirBlock.push(list);
																});
															}else{
																console.log("myList of "+vmx.id+" is empty");
															}
														}
														console.log(block.id);
														console.log(block.mylist);
													});
												}else{
													console.log("blockAllList is empty");
												}
												var blockusers = myBlock.indexOf(vmx.id);
												if(blockusers < 0){
													var theirblockusers = theirBlock.indexOf(pvfx.id);
													if(theirblockusers < 0){
														console.log("they did not have block users");
														var room = {
																name : pvmx.id + "-" + vfx.id,
																male : pvmx,
																female : vfx
															}
														client.del(room.name,JSON.stringify(room));
														client.sadd(room.name,JSON.stringify(room));
														console.log("++++++getting blank room++++++");
														console.log(room);
														console.log("++++++++++++++++++++++++++++++");
														rooms.push(room);
														console.log("++++Start Conversation++++");
														console.log(rooms);
														console.log("++++++++++++++++++++++++++");
														console.log("before female remove");
														console.log(vfx);
														console.log(femaleList);
														var removeInListFemale = femaleList.indexOf('female-'+vfx.id);
														femaleList.splice(removeInListFemale,1);
														console.log("after removing femaleList");
														console.log(femaleList);
														console.log("before male remove");
														console.log(pvmx);
														console.log(maleList);
														var removeInListMale  = maleList.indexOf('male-'+pvmx.id);
														maleList.splice(removeInListMale,1);
														console.log("after removing maleList");
														console.log(maleList);
														client.sadd("chatted:"+vfx.id,pvmx.id);
														client.sadd("chatted:"+pvmx.id,vfx.id);
														client.lpush("last:"+vfx.id,pvmx.id);
														client.lpush("last:"+pvmx.id,vfx.id);
														client.sadd("chattingfemale",vfx.id);
														client.sadd("chattingmale",pvmx.id);
														app.io.broadcast(vfx.id, room);
														app.io.broadcast(pvmx.id, room);
														loopStop2 = true;
														rotationTurn = true;
														//break;
													}else{
														console.log("they have block users");
													}
												}
											}
										}
									}
								}
							}
						}
					});
				});
			}
			catchup_user = false;
		},
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
		getListMaleVisitor : function(callback){
			client.keys('male-*',callback);
		},
		getListFemaleVisitor : function(callback){
			client.keys('female-*',callback);
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
		startCatchUpGame : ['getFemaleVisitor','getMaleVisitor',function(callback,result){
			var catchFinalFemale = result.catchupFemale;
			var catchFinalMale = result.catchupMale;
			var catchDetailFemale = result.getFemaleVisitor;
			var catchDetailMale = result.getMaleVisitor;
			console.log("Final list of Male and Female to catch-up");
			console.log(catchFinalFemale);
			console.log(catchFinalMale);
			console.log("DETAILS of Catch Up");
			console.log(catchDetailFemale);
			console.log(catchDetailMale);
			
			if(catchFinalFemale.length >= 1 && catchFinalMale.length >= 1){
				console.log("PROCEED CATCH UP TO CHAT");
				another_chat(catchDetailFemale,catchDetailMale,catchFinalFemale,catchFinalMale,0);
			}else{
				console.log("WAITING FOR OTHER USER TO BE PAIRED");
				catchup_user = false;
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
		getMaleVisitor : ['getListMaleVisitor',function(callback,result){
			console.log("function get male");
			var cm = result.getListMaleVisitor;
			console.log(result.getListMaleVisitor);
			console.log(cm);
			console.log(cm.length);
			client.mget(cm,callback);
		}],
		getFemaleVisitor : ['getListFemaleVisitor',function(callback,result){
			console.log("function get female");
			var cf = result.getListFemaleVisitor;
			console.log(result.getListFemaleVisitor);
			console.log(cf);
			console.log(cf.length);
			client.mget(cf,callback);
		}],
		assignRoom : ['getMaleVisitor','getFemaleVisitor',function(callback,result){
			var vf = result.getFemaleVisitor;
			var vm = result.getMaleVisitor;
			var cflist = result.getListFemaleVisitor;
			var cmlist = result.getListMaleVisitor;
			console.log("@@@@@@@@@@@@@ Room Assigned");
			console.log(vf);
			console.log(vm);
			console.log(cflist);
			console.log(cmlist);
			console.log("@@@@@@@@@@@@@ Room Assigned");
			newuser = false;
			start_chat(vf,vm,cflist,cmlist,0);
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
