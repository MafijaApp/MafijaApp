const socket = io();
let currentRoomID = null;
let isHost = false;

function changeVal(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));
    let newVal = parseInt(input.value) + delta;
    if (newVal >= min && newVal <= max) input.value = newVal;
}

document.getElementById('createBtn').onclick = () => {
    const name = document.getElementById('playerName').value;
    if (!name) return alert("Unesi ime!");
    isHost = true;
    socket.emit('createRoom');
};

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    const name = document.getElementById('playerName').value;
    socket.emit('joinRoom', { roomID: id, name: name });
    showScreen('roomCodeModal');
    document.getElementById('roomCodeDisplay').innerText = id;
});

function closeCodeModal() {
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
}

document.getElementById('joinBtn').onclick = () => {
    const name = document.getElementById('playerName').value;
    const room = document.getElementById('roomInput').value.toUpperCase();
    if (name && room) {
        currentRoomID = room;
        isHost = false;
        socket.emit('joinRoom', { roomID: room, name: name });
    }
};

socket.on('joinSuccess', () => {
    if (!isHost) {
        showScreen('hostScreen');
        document.getElementById('globalExitBtn').style.display = 'block';
    }
});

socket.on('updatePlayers', (list) => {
    const ul = document.getElementById('playerList');
    ul.innerHTML = list.map(p => `<li style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:5px; list-style:none;">${p}</li>`).join('');
});

document.getElementById('startGameBtn').onclick = () => {
    const config = {
        mafija: parseInt(document.getElementById('mafija').value),
        dama: parseInt(document.getElementById('dama').value),
        doktor: 1,
        policajac: 1
    };
    socket.emit('startGame', { roomID: currentRoomID, config });
};

// PANEL ZA HOSTA (NARATORA)
socket.on('hostViewRoles', (data) => {
    const ul = document.getElementById('playerList');
    document.getElementById('hostScreen').querySelector('.settings-card').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR TABELA";
    
    // Host vidi sve, ali hostu se ne dodeljuje uloga u samoj igri
    ul.innerHTML = data.map(p => `
        <li class="admin-player-row">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="kick-btn" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

function kickPlayer(id) {
    if(confirm("Potvrdi eliminaciju igrača?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

// IGRAČI DOBIJAJU ULOGE (Host ne dobija ovaj event za sebe)
socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div style="padding:40px; border:2px solid #ff0000; border-radius:20px; background:rgba(255,0,0,0.1); text-align:center;">
                <p style="opacity:0.6; letter-spacing:2px;">TVOJA ULOGA</p>
                <h1 style="font-size:3.5rem; margin-top:10px; color:#ff0000;">${role}</h1>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
