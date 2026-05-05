const socket = io();
let isHost = false;
let myName = "";
let currentPlayersList = [];

// Funkcije za promenu broja (MAFIJA/DAMA)
window.changeVal = function(id, delta) {
    const input = document.getElementById(id);
    let val = parseInt(input.value) + delta;
    if (val >= 0 && val <= 10) {
        input.value = val;
        updateStartButton();
    }
};

// DUGME: KREIRAJ SOBU
document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("Upisite ime!");
    isHost = true;
    socket.emit('createRoom');
};

// DUGME: UĐI U SOBU
document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    const room = document.getElementById('roomInput').value.toUpperCase().trim();
    if (!myName || !room) return alert("Fali ime ili kod!");
    socket.emit('joinRoom', { roomID: room, name: myName });
};

socket.on('roomCreated', (id) => {
    showScreen('hostScreen');
    socket.emit('joinRoom', { roomID: id, name: myName });
});

socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const playerListUI = document.getElementById('playerList');
    const hostDisplay = document.getElementById('hostDisplay');
    
    // Narator je na indexu 0
    hostDisplay.innerHTML = `<label class="styled-label">NARATOR</label><div>${list[0]}</div>`;
    playerListUI.innerHTML = list.slice(1).map(p => `<li class="player-li">${p}</li>`).join('');
    
    if (isHost) updateStartButton();
});

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const required = 2 + m + d; // Doktor(1) + Policajac(1) + ostali
    const playersWithoutHost = currentPlayersList.length - 1;

    const btn = document.getElementById('startGameBtn');
    if (playersWithoutHost >= required) {
        btn.disabled = false;
        btn.classList.remove('locked');
        btn.innerText = "PODELI ULOGE";
    } else {
        btn.disabled = true;
        btn.classList.add('locked');
        btn.innerText = `FALI JOŠ ${required - playersWithoutHost} IGRAČA`;
    }
}

// DUGME: PODELI ULOGE
document.getElementById('startGameBtn').onclick = () => {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    socket.emit('startGame', { 
        roomID: document.getElementById('roomInput').value || currentPlayersList[0], // pojednostavljeno
        config: { mafija: m, dama: d } 
    });
};

socket.on('yourRole', ({ role }) => {
    if (isHost) return;
    showScreen('reveal');
    const container = document.getElementById('cardContainer');
    let rClass = role.toLowerCase() === 'građanin' ? 'role-gradjanin' : `role-${role.toLowerCase()}`;
    
    container.innerHTML = `
        <div class="role-card ${rClass}">
            <h1>${role.toUpperCase()}</h1>
            <p>Slušaj naratora!</p>
        </div>
    `;
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
