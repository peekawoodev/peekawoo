$(function(){
	var socket = io.connect();
	var $count = document.getElementById('count');
	//var locUrl = window.location;
	var timeAgain = setInterval(function(){
		//socket.emit('enter',locUrl);
		socket.emit('enter');
	},1000);
	
	socket.on('listusers',function(data){
		document.getElementById('displayUser').innerHTML = data.count;
		if(data.count > 0){
			if(data.count == 1){
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
		document.getElementById('displayMale').innerHTML = data.users.male;
		if(data.users.male > 0){
			if(data.users.male == 1){
				document.getElementById('displayTextMale').innerHTML = "User";
			}else{
				document.getElementById('displayTextMale').innerHTML = "Users";
			}
			document.getElementById('displayTextMale').style.color = 'green';
		}
		else{
			document.getElementById('displayTextMale').innerHTML = "User";
			document.getElementById('displayTextMale').style.color = 'red';
		}
		document.getElementById('displayFemale').innerHTML = data.users.female;
		if(data.users.female > 0){
			if(data.users.female == 1){
				document.getElementById('displayTextFemale').innerHTML = "User";
			}else{
				document.getElementById('displayTextFemale').innerHTML = "Users";
			}
			document.getElementById('displayTextFemale').style.color = 'green';
		}
		else{
			document.getElementById('displayTextFemale').innerHTML = "User";
			document.getElementById('displayTextFemale').style.color = 'red';
		}
		document.getElementById('displayUndefine').innerHTML = data.users.undefineduser;
		if(data.users.undefineduser > 0){
			if(data.users.undefineduser == 1){
				document.getElementById('displayTextUndefine').innerHTML = "User";
			}else{
				document.getElementById('displayTextUndefine').innerHTML = "Users";
			}
			document.getElementById('displayTextUndefine').style.color = 'green';
		}
		else{
			document.getElementById('displayTextUndefine').innerHTML = "User";
			document.getElementById('displayTextUndefine').style.color = 'red';
		}
		//$('')
	});
	//$('body').append('<p>"jemo"</p>');
});