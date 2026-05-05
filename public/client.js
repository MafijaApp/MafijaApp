const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayers = [];

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (myName) { isHost = true; socket.emit('createRoom'); }
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    currentRoomID = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && currentRoomID) {
        socket.emit('joinRoom', { roomID: currentRoomID, name: myName });
    }
};

socket.on('roomCreated', (id) => {
    socket.emit('joinRoom', { roomID: id, name: myName });
});

socket.on('roomJoined', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    showScreen('hostScreen');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    document.getElementById('hostDisplay').innerHTML = `Host: ${list[0]}`;
    document.getElementById('playerList').innerHTML = list.slice(1).map(p => `<li>${p}</li>`).join('');
    
    if (isHost) {
        const btn = document.getElementById('startGameBtn');
        btn.disabled = false;
        btn.innerText = "PODELI ULOGE";
    }
});

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { 
            mafija: parseInt(document.getElementById('mafija').value), 
            dama: parseInt(document.getElementById('dama').value) 
        }
    });
};

socket.on('yourRole', ({ role }) => {
    showScreen('reveal');
    document.getElementById('cardContainer').innerHTML = `<h1>Tvoja uloga: ${role}</h1>`;
});

socket.on('hostViewRoles', (summary) => {
    document.getElementById('playerList').innerHTML = summary.map(s => `<li>${s.name}: ${s.role}</li>`).join('');
});
