const socket = io();
let currentRoomID = null;
let isHost = false;
let myName = "";

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
    myName = document.getElementById('playerName').value;
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
    myName = document.getElementById('playerName').value;
    const room = document.getElementById('roomInput').value.toUpperCase();
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
    // Prvi u listi je uvek Host
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
    const playersReady = currentPlayersList.length - 1; // Izuzmi hosta

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

// SAMO HOST dobija ovaj event sa svim ulogama
socket.on('hostViewRoles', (data) => {
    const ul = document.getElementById('playerList');
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL";
    
    ul.innerHTML = data.map(p => `
        <li class="admin-player-row">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="kick-btn" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

function kickPlayer(id) {
    if(confirm("Eliminiši igrača?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

// IGRAČI dobijaju samo svoju ulogu
socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div style="padding:40px; border:1px solid #ff0000; border-radius:10px; text-align:center;">
                <p style="opacity:0.4; font-size:0.8rem; letter-spacing:2px;">TVOJA ULOGA</p>
                <h1 style="font-size:3.5rem; color:#ff0000; margin:20px 0;">${role}</h1>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
