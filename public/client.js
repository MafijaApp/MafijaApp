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

function regenerateRoomCode() {
    if (!isHost) return;
    if (confirm("Promeni kod sobe? Stari kod više neće raditi.")) {
        socket.emit('createRoom'); 
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
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('topRoomCode').innerText = id;
    if(isHost) document.getElementById('regenCodeBtn').style.display = 'inline-block';

    socket.emit('joinRoom', { roomID: id, name: myName });
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
});

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
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('topRoomCode').innerText = currentRoomID;
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
});

let currentPlayersList = [];
socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const ul = document.getElementById('playerList');
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
    const totalRequired = mafija + dama + 2; 
    const startBtn = document.getElementById('startGameBtn');
    const playersReady = currentPlayersList.length - 1; // Bez hosta

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

socket.on('hostViewRoles', (data) => {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL";
    const ul = document.getElementById('playerList');
    ul.innerHTML = data.map(p => `
        <li class="player-li">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="is-host-tag" style="background:red; color:white; border:none; cursor:pointer;" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

function kickPlayer(id) {
    if(confirm("Eliminiši igrača?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div style="padding:50px 20px; border:2px solid #ff0000; border-radius:12px; text-align:center; background:rgba(255,0,0,0.05);">
                <p style="opacity:0.5; font-size:0.8rem; letter-spacing:3px; margin-bottom:15px;">TVOJA ULOGA</p>
                <h1 style="font-size:3.5rem; color:#ff0000; font-weight:900;">${role.toUpperCase()}</h1>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
