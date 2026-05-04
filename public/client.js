const socket = io();
let currentRoomID = null;

// Funkcija za upravljanje + i - dugmićima (Stepperima)
function changeVal(id, delta) {
    const input = document.getElementById(id);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));
    let newVal = parseInt(input.value) + delta;

    if (newVal >= min && newVal <= max) {
        input.value = newVal;
    }
}

// Kreiranje sobe
document.getElementById('createBtn').onclick = () => {
    const name = document.getElementById('playerName').value;
    if (!name) return alert("Moraš uneti ime!");
    
    socket.emit('createRoom');
    socket.once('roomCreated', (id) => {
        currentRoomID = id;
        socket.emit('joinRoom', { roomID: id, name: name });
        showScreen('hostScreen');
        document.getElementById('roomCodeText').innerText = id;
    });
};

// Ulazak u sobu
document.getElementById('joinBtn').onclick = () => {
    const name = document.getElementById('playerName').value;
    const room = document.getElementById('roomInput').value.toUpperCase();
    if (name && room) {
        currentRoomID = room;
        socket.emit('joinRoom', { roomID: room, name: name });
    } else {
        alert("Popuni sva polja!");
    }
};

// Uspešan ulazak
socket.on('joinSuccess', () => {
    showScreen('hostScreen');
});

// Ažuriranje liste igrača u lobiju
socket.on('updatePlayers', (list) => {
    const ul = document.getElementById('playerList');
    ul.innerHTML = list.map(p => `<li>${p}</li>`).join('');
});

// Startovanje igre (samo za hosta)
document.getElementById('startGameBtn').onclick = () => {
    const mafijaCount = parseInt(document.getElementById('mafija').value);
    const damaCount = parseInt(document.getElementById('dama').value);

    socket.emit('startGame', {
        roomID: currentRoomID,
        config: {
            mafija: mafijaCount,
            dama: damaCount
        }
    });
};

// Prikaz dodeljene uloge
socket.on('yourRole', ({ role }) => {
    showScreen('reveal');
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = `
        <div class="role-reveal-anim">
            <p>Tvoja uloga je:</p>
            <h1 class="role-title">${role}</h1>
        </div>
    `;
});

// Navigacija kroz ekrane
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// Greške
socket.on('error', (msg) => alert(msg));

// Forsirano vraćanje na početnu
socket.on('forceToHome', () => {
    alert("Veza sa sobom je prekinuta.");
    location.reload();
});
