
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
	
	socket.on('roomtopic',function(data){
		$(".messagewindow").html("<p class='topic_per_room'><strong>TOPIC: "+data+"</strong></p>");
	});	
	
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
				document.getElementById('countdown').style.color = 'red';
				document.getElementById('countdown1').style.color = 'red';
			}else{
				document.getElementById('countdown').style.color = '#584F4F';
				document.getElementById('countdown1').style.color = '#584F4F';
			}
			if (seconds == 0) {
				clearInterval(countdownTimer);
			} else {
				seconds--;
			}
		}, 1000);
	});
	
	$('.ratings_chick').click(
		function(){
			if($(this).is('.ratings_chick')){
				socket.emit('uninsert',contmechatm8);
			}
			else{
				socket.emit('insert',contmechatm8);
			}
		}
	);
	
	$('.blockbtn').click(function(){
		var link1='http://cdn-img.easyicon.net/png/5084/508421.png';
		var link2='http://icons-search.com/img/fasticon/fasticon_users_lnx.zip/FastIcon_Users_lnx-Icons-128X128-edit_user.png-128x128.png';
		var title1='Block User';
		var title2='Unblocked User';
		var value1='Block User';
		var value2='Unblocked User';
		if($(this).attr('value')==value1){
			$('.button1').attr('src',link2);
			$('.button1').tooltip('destroy');
			$('.button1').attr('title', title2);
			$('.button1').tooltip();
			//the upper portion is from hover effect in current chat image
			$('.blockbtn').attr('value',value2);
			$('.blockbtn').removeClass('btn-danger');
			$('.blockbtn').addClass('btn-info');
			socket.emit('block',contmechatm8);
		}else{
			$('.button1').attr('src',link1);
			$('.button1').tooltip('destroy');
			$('.button1').attr('title', title1);
			$('.button1').tooltip();
			//the upper portion is from hover effect in current chat image
			$('.blockbtn').attr('value',value1);
			$('.blockbtn').removeClass('btn-info');
			$('.blockbtn').addClass('btn-danger');
			socket.emit('unblock',contmechatm8);
		}
	});
	
	$('.button1').on('click',function(){
		var link1='http://cdn-img.easyicon.net/png/5084/508421.png';
		var link2='http://icons-search.com/img/fasticon/fasticon_users_lnx.zip/FastIcon_Users_lnx-Icons-128X128-edit_user.png-128x128.png';
		var title1='Block User';
		var title2='Unblocked User';
		var value1='Block User';
		var value2='Unblocked User';
		if($(this).attr('src')==link1){
			$('.button1').attr('src',link2);
			$(this).tooltip('destroy');
			$('.button1').attr('title', title2);
			$(this).tooltip();
			//this part is for button in container visible
			$('.blockbtn').attr('value',value2);
			$('.blockbtn').removeClass('btn-danger');
			$('.blockbtn').addClass('btn-info');
			socket.emit('block',contmechatm8);
		}else{
			$('.button1').attr('src',link1);
			$(this).tooltip('destroy');
			$('.button1').attr('title', title1);
			$(this).tooltip();
			//this part is for button in container visible
			$('.blockbtn').attr('value',value1);
			$('.blockbtn').removeClass('btn-info');
			$('.blockbtn').addClass('btn-danger');
			socket.emit('unblock',contmechatm8);
		}
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
		//alert(roomsend);
		//socket.emit('leave',{user: user,room:room});
		socket.emit('leave',{user: user,room:my_chatm8});
	});
	
	socket.on('new msg',function(data){
		console.log("++++++++data++++++");
		console.log(data);
		if(data.gender == "male"){
			$(" .messagewindow").append("<img class='leftp'></img><img class='imgleft' src='"+data.photourl+"'></img><p class='me-chat'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p>");
		}
		else{
			$(" .messagewindow").append("<img class='rightp'></img><img class='imgright' src='"+data.photourl+"'></img><p class='you-chat'><strong>"+data.codename+":</strong> <em>"+data.msg+"</em></p>");
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
				//socket.emit('my msg', {
					//msg: chuncks[i]
				//});
			}
			$(this).val('');
			return false;
		}
	});
	socket.on('game_stop',function(){
		window.location = '/loading';
	});
});
