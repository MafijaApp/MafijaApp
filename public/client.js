const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayers = [];

// Pomoćne funkcije
window.changeVal = (id, delta) => {
    const el = document.getElementById(id);
    let val = parseInt(el.value) + delta;
    if (val >= 0 && val <= 10) { 
        el.value = val; 
        if (isHost) updateStartButton(); 
    }
};

window.toggleRules = () => {
    const m = document.getElementById('rulesModal');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// --- AKCIJE ---

// Kreiranje sobe
document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (myName) { 
        isHost = true; 
        socket.emit('createRoom'); 
    } else {
        alert("Unesi ime pre kreiranja!");
    }
};

// Ulazak u sobu
document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    currentRoomID = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && currentRoomID) {
        isHost = false; // Osiguravamo da nije host ako ulazi u tuđu sobu
        socket.emit('joinRoom', { roomID: currentRoomID, name: myName });
    } else {
        alert("Unesi ime i kod sobe!");
    }
};

document.getElementById('regenBtn').onclick = () => { if(isHost) socket.emit('createRoom'); };

// --- SOCKET ODGOVORI ---

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    if(isHost) document.getElementById('regenBtn').style.display = 'inline-block';
    
    // Automatski uđi u sobu koju si kreirao
    socket.emit('joinRoom', { roomID: id, name: myName });
    showScreen('hostScreen');
});

// NOVO: Ovo je falilo da bi "Join" dugme prebacilo ekran
socket.on('roomJoined', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('regenBtn').style.display = 'none'; // Gost ne vidi regen
    showScreen('hostScreen');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    
    // Prvi na listi je uvek host/narator
    document.getElementById('hostDisplay').innerHTML = `
        <div class="host-badge">HOST / NARATOR</div>
        <div class="host-name">${list[0]}</div>`;
        
    // Ostali igrači
    document.getElementById('playerList').innerHTML = list.slice(1).map(p => `<li class="player-li">${p}</li>`).join('');
    
    if (isHost) updateStartButton();
});

socket.on('error', (msg) => {
    alert(msg);
});

// --- LOGIKA IGRE ---

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const req = 2 + m + d; // Narator + Doktor + Policajac + Mafije + Dame
    const avail = currentPlayers.length - 1; // Bez naratora
    
    const btn = document.getElementById('startGameBtn');
    if (avail < req) {
        btn.disabled = true;
        btn.className = "start-btn locked";
        btn.innerText = `FALI JOŠ ${req - avail}`;
    } else {
        btn.disabled = false;
        btn.className = "start-btn";
        btn.innerText = "PODELI ULOGE";
    }
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
            <p class="styled-label">TVOJA ULOGA</p>
            <h1>${role.toUpperCase()}</h1>
            <p>Slušaj naratora i igraj pošteno.</p>
        </div>`;
});
