$(function(){
	var socket = io.connect();
	var $count = document.getElementById('count');
	var timeAgain = setInterval(function(){
		socket.emit('enter');
	},1000);
	
	socket.on('listusers',function(data){
		
		var seconds = data.users.timeVal;
		var lockTrigger = data.users.gamelockTrigger;
		if(lockTrigger){
			seconds+=5;
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
				}else {
					seconds--;
				}
			}, 1000);
		}else{
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
		}
		
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
				document.getElementById('displayTextMale').innerHTML = "Male";
			}else{
				document.getElementById('displayTextMale').innerHTML = "Male";
			}
			document.getElementById('displayTextMale').style.color = 'green';
		}
		else{
			document.getElementById('displayTextMale').innerHTML = "Male";
			document.getElementById('displayTextMale').style.color = 'red';
		}
		document.getElementById('displayFemale').innerHTML = data.users.female;
		if(data.users.female > 0){
			if(data.users.female == 1){
				document.getElementById('displayTextFemale').innerHTML = "Female";
			}else{
				document.getElementById('displayTextFemale').innerHTML = "Female";
			}
			document.getElementById('displayTextFemale').style.color = 'green';
		}
		else{
			document.getElementById('displayTextFemale').innerHTML = "Female";
			document.getElementById('displayTextFemale').style.color = 'red';
		}
		document.getElementById('displayRandom').innerHTML = data.users.rand;
		if(data.users.rand > 0){
			if(data.users.rand == 1){
				document.getElementById('displayTextRandom').innerHTML = "Random";
			}else{
				document.getElementById('displayTextRandom').innerHTML = "Random";
			}
			document.getElementById('displayTextRandom').style.color = 'green';
		}
		else{
			document.getElementById('displayTextRandom').innerHTML = "Random";
			document.getElementById('displayTextRandom').style.color = 'red';
		}
		document.getElementById('displayUndefine').innerHTML = data.users.undefineduser;
		if(data.users.undefineduser > 0){
			if(data.users.undefineduser == 1){
				document.getElementById('displayTextUndefine').innerHTML = "Undefine";
			}else{
				document.getElementById('displayTextUndefine').innerHTML = "Undefine";
			}
			document.getElementById('displayTextUndefine').style.color = 'green';
		}
		else{
			document.getElementById('displayTextUndefine').innerHTML = "Undefine";
			document.getElementById('displayTextUndefine').style.color = 'red';
		}
		
		var countingRand = data.users.randCount; 
		document.getElementById('displayRandCount').innerHTML = countingRand.length;
		if(countingRand.length > 0){
			if(countingRand.length == 1){
				document.getElementById('displayTextRandCount').innerHTML = "Random Login User";
			}else{
				document.getElementById('displayTextRandCount').innerHTML = "Random Login Users";
			}
			document.getElementById('displayTextRandCount').style.color = 'green';
		}
		else{
			document.getElementById('displayTextRandCount').innerHTML = "Random Login User";
			document.getElementById('displayTextRandCount').style.color = 'red';
		}
	});
});