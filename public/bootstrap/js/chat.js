function winOpen(url){
	var room = $("#room").val();
    newwindow=window.open(url,'_blank','width=400,height=400');
    if (window.focus) {newwindow.focus()}
    newwindow.child = room;
    newwindow.init();
    return false;
};

$(function(){
	var socket = io.connect();
	var room = $("#room").val();
	socket.emit('join',{room:room});
	socket.emit('timer',{room:room});
	var user = $("#user").val();
	user = JSON.parse(user);
	var my_chatm8 = $("#chatm8").val();
	my_chatm8 = JSON.parse(my_chatm8);
	var list_gen = $("#list").val();
	//list_gen = JSON.parse(list_gen);
	
	
	
	//-----------------------------------
	//------for Credit-------------------
	//script for gifts
	var giftItem;
	var dateMsg;
	$('#gift_button_rose').click(function(ev){
		giftItem = " ";
		giftItem = $('#gift_button_rose').val();
		showNoPay();
	});
	$('#gift_button_cup').click(function(ev){
		giftItem = " ";
		giftItem = $('#gift_button_cup').val();
		onCredit();
	});
	$('#gift_button_cookie').click(function(ev){
		giftItem = " ";
		giftItem = $('#gift_button_cookie').val();
		onCredit();
	});
	$('#gift_button_milk').click(function(ev){
		giftItem = " ";
		giftItem = $('#gift_button_milk').val();
		onCredit();
	});
	$('#gift_button_date').click(function(ev){
		giftItem = " ";
		giftItem = $('#gift_button_date').val();
		dateMsg = "<br />Someone in Peekawoo will contact you later. Please give us your contact details.";
		dateMsg += "<br /><a href='#' onclick=\"winOpen('/chatForm')\">Click this link!</a>";
		onCredit();
	});
	
	function showNoPay() {
		var sendMe = {};
		sendMe.me = user;
		if(user.id == my_chatm8.male.id){
			sendMe.m8 = my_chatm8.female;
		}else{
			sendMe.m8 = my_chatm8.male;
		}
		sendMe.gift = giftItem;
		var request = $.ajax({
			type: "GET",
			url: "/withfree",
			data: { chat : sendMe }
		});
		request.done(function(data){
			$('#message').val('<img src="/img/hc-theme/' + giftItem + '.png" class="chatGift">');
			$('#reply').click();
			$('.modalInput').overlay().close();
			socket.emit('postfbtw',JSON.stringify(sendMe));
		});
	}
	function onCredit() {
		//must deduct credit here
		//deductCredit(); //psuedo-function for deducting credits
		//show giftItem
		var sendMe = {};
		sendMe.me = user;
		if(user.id == my_chatm8.male.id){
			sendMe.m8 = my_chatm8.female;
		}else{
			sendMe.m8 = my_chatm8.male;
		}
		sendMe.gift = giftItem;
		var request = $.ajax({
			type: "GET",
			url: "/withcredit",
			data: { chat : sendMe }
		});
		request.done(function(data){
			var receiveData = JSON.parse(data);
			if(receiveData.bValue == false){
				alert("You dont have enough credits!");
				$('#credit').text(receiveData.cValue);
			}else{
				if(giftItem == 'date'){
					$('#message').val('<img src="/img/hc-theme/' + giftItem + '.png" class="chatGift">' + dateMsg);
				}else{
					$('#message').val('<img src="/img/hc-theme/' + giftItem + '.png" class="chatGift">');
				}
				$('#reply').click();
				$('.modalInput').overlay().close();
				$('#credit').text(receiveData.cValue);
				socket.emit('postfbtw',JSON.stringify(sendMe));
			//	if(user.provider == 'facebook'){
			//		uponSuccessFB();
			//	}else{
			//		uponSuccessTW()
			//	}
			}
		});
	}
	
	socket.on('receivetrigger',function(data){
		//alert(data);
		var dataRec = JSON.parse(data);
		//console.log(JSON.stringify(dataRec.me));
		if(user.id != dataRec.user.id){
			if(user.provider == 'facebook'){
				$('#noticeText').text("Allow pop-up to auto post in your Timeline");
				uponSuccessFB();
			}else{
				$('#noticeText').text("Allow pop-up to auto post in your Tweet Board");
				uponSuccessTW();
			}
			$('#noticeBox').fadeIn("slow");
			setTimeout(function(){
				$('#noticeBox').fadeOut("slow");
			},10000);
		}
	});
	
	function uponSuccessTW() {
		var winUrl = window.location.host;
		$.ajax({
			url : winUrl,
			success: function(){window.open("/auth/twitter","_blank","width=250,height=150");},
			async : false
		});
		//window.open("/auth/twitter",'_blank',"width=250,height=150");
	}
	
	function uponSuccessFB() {
		var winUrl = window.location.host;
		$.ajax({
			url : winUrl,
			success: function(){window.open("/auth/facebook","_blank","width=500,height=400");},
			async : false
		});
		//window.open("/auth/facebook",'_blank',"width=250,height=150");
	}
	//-----------------------------------
	//-----------------------------------
	var contmechatm8 = {};
	if(user.id == my_chatm8.male.id){
		$(".current-photo").html("<img class='cpimg' src='"+my_chatm8.female.photourl+"'></img>");
		if(list_gen.length > 0){
			$(".previous-photo").html("<img class='ppimg' src='"+JSON.parse(list_gen).photourl+"'></img>");
		}
		contmechatm8 = {user: user,mate:my_chatm8.female};
	}
	else{
		$(".current-photo").html("<img class='cpimg' src='"+my_chatm8.male.photourl+"'></img>");
		if(list_gen.length > 0){
			$(".previous-photo").html("<img class='ppimg' src='"+JSON.parse(list_gen).photourl+"'></img>");
		}
		contmechatm8 = {user: user,mate:my_chatm8.male};
	}
	
	var audioPlayer = document.getElementById('buzz');
	audioPlayer.src='/music/buzz.mp3';
    audioPlayer.load();
    $('#buzzbtn').click(function(){
    	audioPlayer.play();
    	$(" .messagewindow").append("<p style='color:red;margin:0 auto;'><b>BUZZ</b></p>");
    	socket.emit('buzz',{user:user});
    });
	
    socket.on('receivebuzz',function(data){
    	var chatmate = JSON.parse(data);
    	if(user.id != chatmate.id){
    		audioPlayer.play();
    		$(" .messagewindow").append("<p style='color:red;margin:0 auto;'><b>BUZZ</b></p>");
    	}
    });
    
	socket.on('roomtopic',function(data){
		$(".messagewindow").html("<p class='topic_per_room'><strong>TOPIC: "+data+"</strong></p>");
	});	
	
	function playSound(){
		document.getElementById('chataudio').play();
	}
	
	socket.on('sendtime',function(data){
		var seconds = data;
		var countdownTimer = setInterval(function(){
			var minutes = Math.floor(seconds/60);
			var remainingSeconds = Math.floor((seconds % 60)/1);
			if (remainingSeconds < 10) {
				remainingSeconds = "0" + remainingSeconds; 
			}
			document.getElementById('countdown').innerHTML = minutes;
			document.getElementById('countdown1').innerHTML = remainingSeconds;
			//$('#countdown').html(value,minutes);
			//$('#countdown1').html(value,remainingSeconds);
			if(seconds <= 10){
				playSound();
				document.getElementById('countdown').style.color = 'red';
				document.getElementById('countdown1').style.color = 'red';
			}else{
				document.getElementById('countdown').style.color = '#584F4F';
				document.getElementById('countdown1').style.color = '#584F4F';
			}
			if (seconds == 0) {
				clearInterval(countdownTimer);
			}else {
				seconds--;
			}
		}, 1000);
	});
	
	$('.ratings_chick').click(
		function(){
			if($(this).is('.ratings_chick')){
				//socket.emit('uninsert',contmechatm8);
			}
			else{
				socket.emit('insert',contmechatm8);
			}
		}
	);
	
	$('.blockbtn').click(function(){
		var value2='Blocked!';
			//the upper portion is from hover effect in current chat image
			$('.blockbtn').attr('value',value2);
			$('.blockbtn').removeClass('btn-danger');
			$('.blockbtn').addClass('btn-blocked');
			$('.blockbtn').attr('disabled', $('.btn-info'));
			socket.emit('block',contmechatm8);
	});
	
	socket.on(user.id,function(data){
		if(data){
			window.location = '/chat/'+data.name;
		}
		else{
			window.location = '/loading';
		}
	});
	
	$("#signout").click(function(){
		socket.emit('leave',{user: user,room:my_chatm8});
	});
	
	socket.on('new msg',function(data){
		console.log("++++++++data++++++");
		console.log(data);
		if(data.gender == "male"){
			$(" .messagewindow").append("<div class='leftp'><div class='contleft'><img class='imgleft' src='"+data.photourl+"'></img></div><p class='me-chat'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p></div>");
		}
		else if(data.gender == "female"){
			$(" .messagewindow").append("<div class='rightp'><div class='contright'><img class='imgright' src='"+data.photourl+"'></img></div><p class='you-chat'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p></div>");
		}else{
			if(data.id == my_chatm8.male.id){
				$(" .messagewindow").append("<div class='leftp'><div class='contleftrand'><img class='imgleft' src='"+data.photourl+"'></img></div><p class='me-chat-rand'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p></div>");
			}else{
				$(" .messagewindow").append("<div class='rightp'><div class='contrightrand'><img class='imgright' src='"+data.photourl+"'></img></div><p class='you-chat-rand'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p></div>");
			}
		}
		$(".messagewindow").prop({scrollTop: $(".messagewindow").prop("scrollHeight")});
	});
	
	$("#reply").click(function(){
		var inputText = $("#message").val().trim();
		if(inputText){
			var chunks = inputText.match(/.{1,1234}/g)
			, len = chunks.length;
			for(var i = 0; i<len; i++){
				user.msg = chunks[i];
				if(user.provider=='twitter'){
					if(user.id==my_chatm8.male.id){
						user.gender = my_chatm8.male.gender;
					}
					else{
						user.gender = my_chatm8.female.gender;
					}
				}
				socket.emit('my msg',user);
			}
			$("#message").val('');
			
			return false;
		}
	});
	$("#message").keypress(function(e){
		var inputText = $(this).val().trim();
		if(e.which == 13 && inputText){
			var chunks = inputText.match(/.{1,1024}/g)
				, len = chunks.length;
			
			for(var i=0; i<len; i++) {
				user.msg = chunks[i];
				if(user.provider=='twitter'){
					if(user.id==my_chatm8.male.id){
						user.gender = my_chatm8.male.gender;
					}
					else{
						user.gender = my_chatm8.female.gender;
					}
				}
				socket.emit('my msg',user);
			}
			$(this).val('');
			return false;
		}
	});
	socket.on('game_stop',function(){
		window.location = '/loading';
	});
});
