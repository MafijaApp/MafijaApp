const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";

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
    document.getElementById('hostDisplay').innerHTML = `
        <div style="color:red; font-size:0.8rem; font-weight:900;">NARATOR</div>
        <div style="font-size:1.8rem; font-weight:900; margin-bottom:20px;">${list[0]}</div>`;
    
    document.getElementById('playerList').innerHTML = list.slice(1)
        .map(p => `<li>${p}</li>`).join('');
    
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
    document.getElementById('cardContainer').innerHTML = `
        <div style="border:1px solid red; padding:50px; text-align:center;">
            <p style="color:#666; font-size:0.8rem;">TVOJA ULOGA</p>
            <h1 style="font-size:3rem; letter-spacing:5px;">${role.toUpperCase()}</h1>
        </div>`;
});

socket.on('hostViewRoles', (summary) => {
    document.getElementById('playerList').innerHTML = summary
        .map(s => `<li>${s.name}: <span style="color:red">${s.role}</span></li>`).join('');
    document.getElementById('startGameBtn').style.display = 'none';
});
