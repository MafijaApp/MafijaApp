const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayers = [];

window.changeVal = (id, delta) => {
    const el = document.getElementById(id);
    let val = parseInt(el.value) + delta;
    if (val >= 0 && val <= 10) { el.value = val; updateStartButton(); }
};

window.toggleRules = () => {
    const m = document.getElementById('rulesModal');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
};

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (myName) { isHost = true; socket.emit('createRoom'); }
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    currentRoomID = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && currentRoomID) socket.emit('joinRoom', { roomID: currentRoomID, name: myName });
};

document.getElementById('regenBtn').onclick = () => { if(isHost) socket.emit('createRoom'); };

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    if(isHost) document.getElementById('regenBtn').style.display = 'inline-block';
    socket.emit('joinRoom', { roomID: id, name: myName });
    showScreen('hostScreen');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    document.getElementById('hostDisplay').innerHTML = `
        <div class="host-badge">HOST / NARATOR</div>
        <div style="font-size:1.4rem; font-weight:900;">${list[0]}</div>`;
    document.getElementById('playerList').innerHTML = list.slice(1).map(p => `<li class="player-li"><span>${p}</span></li>`).join('');
    if (isHost) updateStartButton();
});

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const req = 2 + m + d; 
    const avail = currentPlayers.length - 1;
    const btn = document.getElementById('startGameBtn');
    btn.disabled = avail < req;
    btn.className = avail < req ? "start-btn locked" : "start-btn";
    btn.innerText = avail < req ? `FALI JOŠ ${req - avail} IGRAČA` : "PODELI ULOGE";
}

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { roomID: currentRoomID, config: { 
        mafija: parseInt(document.getElementById('mafija').value), 
        dama: parseInt(document.getElementById('dama').value) 
    }});
};

socket.on('yourRole', ({ role }) => {
    if (isHost) return;
    showScreen('reveal');
    const r = role.toLowerCase().replace('đ', 'd');
    document.getElementById('cardContainer').innerHTML = `
        <div class="role-card role-${r}">
            <p class="styled-label" style="opacity:0.5;">TVOJA ULOGA</p>
            <h1>${role.toUpperCase()}</h1>
            <p style="margin-top:20px; font-size:0.8rem; opacity:0.6;">Prati naratora i igraj pošteno.</p>
        </div>`;
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
