const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayersList = [];

window.changeVal = function(id, delta) {
    const input = document.getElementById(id);
    let val = parseInt(input.value) + delta;
    if (val >= 0 && val <= 10) {
        input.value = val;
        updateStartButton();
    }
};

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    showScreen('hostScreen');
});

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("Upisite ime!");
    isHost = true;
    socket.emit('createRoom');
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    const room = document.getElementById('roomInput').value.toUpperCase().trim();
    if (!myName || !room) return alert("Fali ime ili kod!");
    currentRoomID = room;
    isHost = false;
    socket.emit('joinRoom', { roomID: room, name: myName });
};

socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    
    // Prikaži kod sobe svima
    document.getElementById('topRoomCode').innerText = currentRoomID;
    document.getElementById('stickyRoomHeader').style.display = 'block';

    const hostDisplay = document.getElementById('hostDisplay');
    const playerUl = document.getElementById('playerList');
    
    hostDisplay.innerHTML = `<label class="styled-label">NARATOR (HOST)</label><div style="font-size:1.2rem; font-weight:900;">${list[0]}</div>`;
    playerUl.innerHTML = list.slice(1).map(p => `<li class="player-li">${p}</li>`).join('');
    
    if (isHost) updateStartButton();
});

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const required = 2 + m + d; // 1 Doktor + 1 Policajac + m + d
    const playersCount = currentPlayersList.length - 1;

    const btn = document.getElementById('startGameBtn');
    if (playersCount >= required) {
        btn.disabled = false;
        btn.classList.remove('locked');
        btn.innerText = "PODELI ULOGE";
    } else {
        btn.disabled = true;
        btn.classList.add('locked');
        btn.innerText = `FALI JOŠ ${required - playersCount} IGRAČA`;
    }
}

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
    if (isHost) return;
    showScreen('reveal');
    const rClass = `role-${role.toLowerCase().replace('đ', 'd')}`;
    
    document.getElementById('cardContainer').innerHTML = `
        <div class="role-card ${rClass}">
            <p class="styled-label" style="opacity:0.5;">TVOJA ULOGA</p>
            <h1>${role.toUpperCase()}</h1>
            <p style="margin-top:20px; font-size:0.8rem; opacity:0.7;">Prati naratora i igraj pošteno.</p>
        </div>
    `;
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
