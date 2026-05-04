const socket = io();
let currentRoomID = null;
let isHost = false;

function changeVal(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));
    let newVal = parseInt(input.value) + delta;
    if (newVal >= min && newVal <= max) {
        input.value = newVal;
        checkPlayerCount(); // Proveri limit čim se promeni broj uloga
    }
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

let currentPlayersList = [];

socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const ul = document.getElementById('playerList');
    ul.innerHTML = list.map(p => `<li class="player-li">${p}</li>`).join('');
    checkPlayerCount();
});

// FUNKCIJA KOJA SPREČAVA START BEZ IGRAČA
function checkPlayerCount() {
    if (!isHost) return;
    
    const mafijaCount = parseInt(document.getElementById('mafija').value);
    const damaCount = parseInt(document.getElementById('dama').value);
    const totalRequired = mafijaCount + damaCount + 2; // +2 su Doktor i Policajac
    
    const startBtn = document.getElementById('startGameBtn');
    
    // VAŽNO: Host se NE računa u igrače koji dobijaju uloge
    // Broj igrača u listi MINUS host
    const playersReady = currentPlayersList.length - 1; 

    if (playersReady >= totalRequired) {
        startBtn.disabled = false;
        startBtn.classList.remove('locked');
        startBtn.innerText = "PODELI ULOGE";
    } else {
        startBtn.disabled = true;
        startBtn.classList.add('locked');
        startBtn.innerText = `POTREBNO JOŠ ${totalRequired - playersReady} IGRAČA`;
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
    const ul = document.getElementById('playerList');
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL (UŽIVO)";
    
    // Filtriramo listu tako da Host vidi sve IGRAČE, ali host sam nema ulogu
    ul.innerHTML = data.map(p => `
        <li class="admin-player-row">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="kick-btn" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

function kickPlayer(id) {
    if(confirm("Eliminiši igrača iz ove runde?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

socket.on('yourRole', ({ role }) => {
    // DUPLA PROVERA: Host nikada ne dobija ovaj event
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div class="role-reveal-card">
                <p style="opacity:0.5; letter-spacing:3px;">DODELJEN DOSIJE</p>
                <h1 style="font-size:3.5rem; color:#ff0000; margin:15px 0;">${role}</h1>
                <p style="font-size:0.8rem; color:#666;">Igraj pošteno. Ne otkrivaj ekran drugima.</p>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
