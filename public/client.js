const socket = io();
let currentRoomID = null;
let isHost = false;

// Upravljanje + i - (Stepper)
function changeVal(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));
    let newVal = parseInt(input.value) + delta;

    if (newVal >= min && newVal <= max) {
        input.value = newVal;
    }
}

// Kreiranje sobe (Host)
document.getElementById('createBtn').onclick = () => {
    const name = document.getElementById('playerName').value;
    if (!name) return alert("Unesi ime!");
    
    isHost = true;
    socket.emit('createRoom');
    socket.once('roomCreated', (id) => {
        currentRoomID = id;
        socket.emit('joinRoom', { roomID: id, name: name });
        showScreen('hostScreen');
        document.getElementById('roomCodeText').innerText = id;
    });
};

// Ulazak u sobu (Igrač)
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
    showScreen('hostScreen');
    // Ako nije host, sakrij podešavanja uloga
    if (!isHost) {
        document.getElementById('setupArea').style.display = 'none';
    }
});

socket.on('updatePlayers', (list) => {
    const ul = document.getElementById('playerList');
    ul.innerHTML = list.map(p => `<li>${p}</li>`).join('');
});

// Host pokreće igru
document.getElementById('startGameBtn').onclick = () => {
    const config = {
        mafija: parseInt(document.getElementById('mafija').value),
        dama: parseInt(document.getElementById('dama').value),
        doktor: 1,
        policajac: 1
    };
    socket.emit('startGame', { roomID: currentRoomID, config });
};

// Specijalni prikaz za Hosta (Vidi ko je ko i dugme za izbacivanje)
socket.on('hostViewRoles', (data) => {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "VODITELJSKI PANEL";
    
    const ul = document.getElementById('playerList');
    // Host vidi sve, ali sebe (hosta) ne treba da izbacuje
    ul.innerHTML = data.map(p => `
        <li class="admin-player-row">
            <span><strong>${p.name}</strong> (${p.role})</span>
            <button class="kick-btn" onclick="kickPlayer('${p.id}')">IZBACI</button>
        </li>
    `).join('');
});

// Igrač dobija svoju ulogu
socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        const container = document.getElementById('cardContainer');
        container.innerHTML = `
            <div class="role-reveal-card">
                <p style="text-transform: uppercase; letter-spacing: 2px; opacity: 0.6;">Tvoja uloga je</p>
                <h1 style="font-size: 3rem; color: #ff4b2b; margin-top: 10px;">${role}</h1>
            </div>
        `;
    }
});

// Funkcija za izbacivanje koju zove Host
function kickPlayer(playerID) {
    if (confirm("Da li je ovaj igrač eliminisan?")) {
        socket.emit('kickPlayer', { roomID: currentRoomID, playerID });
    }
}

// Kada je igrač izbačen (dobija poruku ili se resetuje)
socket.on('kicked', () => {
    alert("Eliminisani ste iz igre.");
    location.reload();
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

socket.on('error', (msg) => alert(msg));
