const socket = io();
let currentRoomID = null;
let isHost = false;
let myName = "";

// Funkcija za menjanje vrednosti (Mafija/Dama)
function changeVal(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));
    let newVal = parseInt(input.value) + delta;
    if (newVal >= min && newVal <= max) {
        input.value = newVal;
        checkPlayerCount();
    }
}

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("Unesi ime!");
    isHost = true;
    socket.emit('createRoom');
};

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    socket.emit('joinRoom', { roomID: id, name: myName });
    showScreen('roomCodeModal');
    document.getElementById('roomCodeDisplay').innerText = id;
});

function closeCodeModal() {
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
}

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    const room = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && room) {
        currentRoomID = room;
        isHost = false;
        socket.emit('joinRoom', { roomID: room, name: myName });
    }
};

socket.on('joinSuccess', () => {
    if (!isHost) {
        showScreen('hostScreen');
        document.getElementById('globalExitBtn').style.display = 'block';
    }
});

let currentPlayersList = [];

socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const ul = document.getElementById('playerList');
    // Host je uvek prvi u listi jer on kreira sobu
    ul.innerHTML = list.map((p, index) => `
        <li class="player-li">
            ${p} ${index === 0 ? '<span class="is-host-tag">HOST</span>' : ''}
        </li>
    `).join('');
    checkPlayerCount();
});

function checkPlayerCount() {
    if (!isHost) return;
    
    const mafija = parseInt(document.getElementById('mafija').value);
    const dama = parseInt(document.getElementById('dama').value);
    const totalRequired = mafija + dama + 2; // + Doktor + Policajac
    
    const startBtn = document.getElementById('startGameBtn');
    // Broj igrača bez hosta
    const playersReady = currentPlayersList.length - 1; 

    if (playersReady >= totalRequired) {
        startBtn.disabled = false;
        startBtn.classList.remove('locked');
        startBtn.innerText = "PODELI ULOGE";
    } else {
        startBtn.disabled = true;
        startBtn.classList.add('locked');
        startBtn.innerText = `POTREBNO JOŠ ${totalRequired - playersReady}`;
    }
}

document.getElementById('startGameBtn').onclick = () => {
    const config = {
        mafija: parseInt(document.getElementById('mafija').value),
        dama: parseInt(document.getElementById('dama').value),
        doktor: 1,
        policajac: 1
    };
    socket.emit('startGame', { roomID: currentRoomID, config });
};

// SAMO HOST vidi Narator Panel sa ulogama
socket.on('hostViewRoles', (data) => {
    const ul = document.getElementById('playerList');
    const setup = document.getElementById('setupArea');
    if(setup) setup.style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL (UŽIVO)";
    
    ul.innerHTML = data.map(p => `
        <li class="admin-player-row">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="kick-btn" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

function kickPlayer(id) {
    if(confirm("Izbaci igrača iz igre?")) {
        socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
    }
}

// IGRAČI dobijaju ulogu (Host je ovde preskočen jer on samo gleda panel)
socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div style="padding:40px; border:1px solid #ff0000; border-radius:12px; text-align:center; background: rgba(255,0,0,0.05);">
                <p style="opacity:0.5; font-size:0.7rem; letter-spacing:3px; margin-bottom:10px;">DODELJENA ULOGA</p>
                <h1 style="font-size:3rem; color:#ff0000; font-weight:900;">${role.toUpperCase()}</h1>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if(target) target.style.display = 'block';
}
