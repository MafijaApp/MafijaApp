const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayers = [];

// --- POMOĆNE FUNKCIJE ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

window.changeVal = (id, delta) => {
    const el = document.getElementById(id);
    let val = parseInt(el.value) + delta;
    if (val >= 0 && val <= 10) { 
        el.value = val; 
        updateStartButton(); 
    }
};

window.toggleRules = () => {
    const m = document.getElementById('rulesModal');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
};

// --- KLIKOVI ---
document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (myName) { 
        isHost = true; 
        socket.emit('createRoom'); 
    } else {
        alert("Unesi ime!");
    }
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    currentRoomID = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && currentRoomID) {
        isHost = false;
        socket.emit('joinRoom', { roomID: currentRoomID, name: myName });
    } else {
        alert("Popuni ime i kod!");
    }
};

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { 
            mafija: parseInt(document.getElementById('mafija').value), 
            dama: parseInt(document.getElementById('dama').value) 
        }
    });
};

// --- SOCKET EVENTS ---

// Host dobija kod sobe
socket.on('roomCreated', (id) => {
    currentRoomID = id;
    socket.emit('joinRoom', { roomID: id, name: myName });
});

// Svi (i host i igrač) menjaju ekran kad uđu
socket.on('roomJoined', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('regenBtn').style.display = isHost ? 'inline-block' : 'none';
    showScreen('hostScreen');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    document.getElementById('hostDisplay').innerHTML = `
        <div class="host-badge">HOST / NARATOR</div>
        <div class="host-name">${list[0]}</div>`;
    
    document.getElementById('playerList').innerHTML = list.slice(1)
        .map(p => `<li class="player-li">${p}</li>`).join('');
    
    if (isHost) updateStartButton();
});

socket.on('yourRole', ({ role }) => {
    showScreen('reveal');
    const r = role.toLowerCase().replace('đ', 'd').replace('ž', 'z');
    document.getElementById('cardContainer').innerHTML = `
        <div class="role-card role-${r}">
            <p class="styled-label">TVOJA ULOGA</p>
            <h1>${role.toUpperCase()}</h1>
            <p>Slušaj naratora i igraj pošteno.</p>
        </div>`;
});

// Narator vidi sve uloge
socket.on('hostViewRoles', (summary) => {
    let listHtml = summary.map(s => `<li>${s.name}: <b>${s.role}</b></li>`).join('');
    document.getElementById('playerList').innerHTML = `
        <h3 class="styled-label">PODELJENE ULOGE:</h3>
        ${listHtml}
    `;
    document.getElementById('startGameBtn').style.display = 'none';
});

socket.on('errorMsg', (msg) => alert(msg));

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const req = 2 + m + d; // Doktor + Policajac + Mafija + Dama
    const avail = currentPlayers.length - 1;
    const btn = document.getElementById('startGameBtn');
    
    btn.disabled = avail < req;
    btn.className = avail < req ? "start-btn locked" : "start-btn";
    btn.innerText = avail < req ? `FALI JOŠ ${req - avail}` : "PODELI ULOGE";
}
