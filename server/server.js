const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let rooms = {};

class Player {
	constructor(name, conn) {
		this.name = name;
		this.score = 0;
		this.conn = conn;
	}
	
	send(msg) {
		this.conn.send(msg);
	}
}

class Room {
	constructor(name, password) {
		this.name = name;
		this.password = password;
		this.players = [];
	}
	
	addPlayer(player) {
		let index = this.players.push(player);
		this.players[index - 1].conn.id = index - 1;
	}
	
	removePlayer(index) {
		this.players.splice(index, 1);
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].conn.id = i;
		}
		//TODO: Remove room from `rooms` if no more players left
	}
	
	send(msg) {
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].send(msg);
		}
	}
}

wss.on('connection', (ws) => {
	ws.room = "";
	
	ws.on("close", () => {
		console.log("Connection closed");
		if (rooms.hasOwnProperty(ws.room)) {
			let ret = {"type": "disconnect", "player_name": rooms[ws.room].players[ws.id].name};
			rooms[ws.room].removePlayer(ws.id);
			rooms[ws.room].send(JSON.stringify(ret));
		}
	});
	
	ws.on("message", (msg) => {
		console.log("Received: " + msg);
		let action = JSON.parse(msg);
		let ret;
		if (action.type == "msg") {
			ret = {
				"type": "msg",
				"data": action.data,
				"author": rooms[ws.room].players[ws.id].name
			}
			rooms[ws.room].send(JSON.stringify(ret));
		}
		else if (action.type == "create_room") {
			if (!action.room_name) {
				ws.send(JSON.stringify({"type": "error", "code": 4}));
			}
			else if (!action.player_name) {
				ws.send(JSON.stringify({"type": "error", "code": 2}));
			}
			else {
				let hash = generateHash();
				ws.room = hash;
				let room = new Room(action.room_name, action.room_password);
				room.addPlayer(new Player(action.player_name, ws));
				rooms[hash] = room;
				ret = {
					"type": "room_created",
					"room_name": action.room_name,
					"room_hash": hash
				}
				let string = JSON.stringify(ret);
				ws.send(string);
				console.log("Sent    : " + string);

				rooms[hash].send(JSON.stringify({"type": "connect", "player_name": action.player_name}));
			}
		}
		else if (action.type == "join_room") {
			let hash = action.room_hash;
			//room doesn't exist
			if (!rooms.hasOwnProperty(hash)) {
				ret = {"type": "error", "code": 0};
			}
			//no player name
			else if (!action.player_name) {
				ret = {"type": "error", "code": 3};
			}
			//password does not match
			else if (rooms[hash].password && rooms[hash].password != action.room_password) {
				ret = {"type": "error", "code": 1};
			}
			else {
				ws.room = hash;
				rooms[hash].addPlayer(new Player(action.player_name, ws));
				ret = {"type": "room_joined", "room_name": rooms[hash].name, "room_hash": hash};
				rooms[hash].send(JSON.stringify({"type": "connect", "player_name": action.player_name}));
			}
			let string = JSON.stringify(ret);
			ws.send(string);
			console.log("Sent    : " + string);
		}
	});
});

function generateHash() {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var charactersLength = characters.length;
	do {
		for (var i = 0; i < 6; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
	} while (rooms.hasOwnProperty(result));
	return result;
}