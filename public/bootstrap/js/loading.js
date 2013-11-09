var socket = io.connect();
//var changePage = false;
var user = $("#user").val();
socket.emit('member',user);
usernew = JSON.parse(user);
socket.on(usernew.id,function(data){
	console.log(data);
	if(data){
		window.location = '/chat/'+data.name;
	}
	else{
		window.location = '/error';
	}

});
socket.on('game_stop',function(){
	window.location = '/loading';
});
setTimeout(function(){
	window.location = '/error';
},120000);