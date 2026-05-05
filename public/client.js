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
    // Narator box
    document.getElementById('hostDisplay').innerHTML = `
        <div class="host-badge">HOST / NARATOR</div>
        <div class="host-name" style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">${list[0]}</div>`;
    
    // Ostali igrači u boxovima
    document.getElementById('playerList').innerHTML = list.slice(1)
        .map(p => `<li class="player-li">${p}</li>`).join('');
    
    if (isHost) updateStartButton(list.length);
});

socket.on('yourRole', ({ role }) => {
    showScreen('reveal');
    const r = role.toLowerCase().replace('đ', 'd').replace('ž', 'z');
    document.getElementById('cardContainer').innerHTML = `
        <div class="role-card role-${r}">
            <h1>${role.toUpperCase()}</h1>
        </div>`;
});

socket.on('errorMsg', (msg) => alert(msg));
