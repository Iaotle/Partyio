let ws;

function initiate() {
	if (window.addEventListener) {
		window.addEventListener("load", autorun, false);
	}
	else if (window.attachEvent){
		window.attachEvent("onload", autorun);
	}
	else {
		window.onload = autorun;
	}  
}

function setupWebSocket() {
	ws = new WebSocket("wss://partyio-server.glitch.me");
	ws.onopen = () => {
		console.log("Connection established");
	};

	ws.onerror = (error) => {
		console.log(`WebSocket error: ${error}`)
	};

	ws.onmessage = (msg) => {
		handleMessage(JSON.parse(msg.data));
	};
}


function autorun(){
	setupEventListeners();
	setupWebSocket();
}

function setupEventListeners(){
	document.getElementById("create").addEventListener("click",create);
	document.getElementById("join").addEventListener("click",join);
	document.getElementById("backButton").addEventListener("click",back);
	document.getElementById("submitCreate").addEventListener("click",receiveCreateForm);
	document.getElementById("submitJoin").addEventListener("click",receiveJoinForm);
	document.getElementById("room-code").addEventListener("click",copyInvite);
	
	
}
function hideCreateJoin(){
	document.getElementById("create").style.display = "none";
	document.getElementById("join").style.display = "none";
}
function join(){
	hideCreateJoin();
	showJoinForm();
	showBackButton();
}
function create(){
	hideCreateJoin();
	showCreateForm();
	showBackButton();
}
function back(){
	showCreateJoin();
	hideForms();
	hideBackButton();
}
function showCreateForm(){
	document.getElementById("createFormWrapper").style.display = "block";
}
function showJoinForm(){
	document.getElementById("joinFormWrapper").style.display = "block";
}
function showBackButton(){
	document.getElementById("backButton").style.display = "block";
}

function showCreateJoin(){
	document.getElementById("create").style.display = "block";
	document.getElementById("join").style.display = "block";
}
function hideForms(){
	document.getElementById("createFormWrapper").style.display = "none";
	document.getElementById("joinFormWrapper").style.display = "none";
}
function hideBackButton(){
	document.getElementById("backButton").style.display = "none";
}
function resetBorders(){
	let borderStyle = "5px outset #1E90FF";
	document.getElementById("joinInviteCode").style.border = borderStyle;
	document.getElementById("joinRoomPassword").style.border = borderStyle;
	document.getElementById("createPlayerName").style.border = borderStyle;
	document.getElementById("joinPlayerName").style.border = borderStyle;
	document.getElementById("createRoomName").style.border = borderStyle;
}

function receiveCreateForm(){
	event.preventDefault();
	let msg = {
		"type": "create_room",
		"room_name": document.getElementById("createRoomName").value,
		"player_name": document.getElementById("createPlayerName").value,
		"room_password": document.getElementById("createRoomPassword").value
	};
	ws.send(JSON.stringify(msg));
	
}
function receiveJoinForm(){
	event.preventDefault();
	let msg = {
		"type": "join_room",
		"player_name": document.getElementById("joinPlayerName").value,
		"room_hash": document.getElementById("joinInviteCode").value,
		"room_password": document.getElementById("joinRoomPassword").value
	};
	ws.send(JSON.stringify(msg));
}

function copyInvite(){
	let str = document.getElementById("room-code").innerHTML;
	console.log(str);
	str = str.substring(12,19);
	const temp = document.createElement('textarea');
	temp.value = str;
	document.body.appendChild(temp);
	temp.select();
	document.execCommand('copy');
	document.body.removeChild(temp);
	alert("Copied: " + str);
}


function handleMessage(action) {
	if (action.type == "msg") {
		addMessage(action.data, 0, action.author);
	}
	else if (action.type == "disconnect"){
		addMessage(action.player_name + " has left.", -1);
	}
	else if (action.type == "connect"){
		addMessage(action.player_name + " has joined.", 1)
	}
	else if (action.type == "room_created") {
		console.log(action);    
		document.getElementById("room-title").innerHTML = action.room_name;
		document.getElementById("room-code").innerHTML = "Invite code: " + action.room_hash;
		// TODO: Edit HTML of the page to add players
		document.getElementById("container").style.display = "block";
		hideForms();
		hideBackButton();
	}
	else if (action.type == "room_joined") {
		console.log(action);
		document.getElementById("room-title").innerHTML = action.room_name;
		 document.getElementById("room-code").innerHTML = action.room_hash;
		// TODO: Edit HTML of the page to add players
		document.getElementById("container").style.display = "block";
		hideForms();
		hideBackButton();
	}
	else if (action.type == "error") {
		resetBorders();
		console.log("Error code: " + action.code);
		if (action.code === 0){
			document.getElementById("joinInviteCode").style.border = "thick solid #ff0000";
		}
		else if (action.code === 1){
			document.getElementById("joinRoomPassword").style.border = "thick solid #ff0000";
		}
		else if (action.code === 2){
			document.getElementById("createPlayerName").style.border = "thick solid #ff0000";
		}
		else if (action.code === 3){
			document.getElementById("joinPlayerName").style.border = "thick solid #ff0000";
		}
		else if (action.code === 4){
			document.getElementById("createRoomName").style.border = "thick solid #ff0000";
		}
	}
	else if (action.type == "details") {
		
	}
}

function sendMessage() {
	event.preventDefault();
	let msg = {
		"type": "msg",
		"data": document.getElementById("chatInput").value
	};
	ws.send(JSON.stringify(msg));
	$('input[type="text"], textarea').val("");
}

function addMessage(message, bg, author = "") {
	let scroll = false;
	let chat = document.getElementById("chat-box");
	if (chat.scrollHeight - chat.scrollTop - chat.clientHeight < 1) {
		scroll = true;
	}
	let newMessage = document.createElement("div");
	newMessage.innerHTML = author;
	if (author) {
		newMessage.innerHTML += ": ";
	}
	newMessage.innerHTML += message;
	if (bg == -1) {
		newMessage.className = "redchat";
	}
	else if (bg == 1) {
		newMessage.className = "greenchat";
	}
	document.getElementById("msgcontainer").appendChild(newMessage);
	if (scroll) {
		chat.scrollTop = chat.scrollHeight;
	}
}