$(function(){
	var socket = io.connect();
	var $count = document.getElementById('count');
	//var locUrl = window.location;
	var timeAgain = setInterval(function(){
		//socket.emit('enter',locUrl);
		socket.emit('enter');
	},1000);
	
	socket.on('listusers',function(data){
		document.getElementById('displayUser').innerHTML = data;
		if(data > 0){
			if(data == 1){
				document.getElementById('displayText').innerHTML = "User";
			}else{
				document.getElementById('displayText').innerHTML = "Users";
			}
			document.getElementById('displayText').style.color = 'green';
		}
		else{
			document.getElementById('displayText').innerHTML = "User";
			document.getElementById('displayText').style.color = 'red';
		}
		//$('')
	});
	//$('body').append('<p>"jemo"</p>');
});