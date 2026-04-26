const socket = io();
let currentRoom = null;
let isHost = false;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

// CREATE
document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Unesi ime");

    isHost = true;
    socket.emit('createRoom', name);
};

// ROOM CREATED
socket.on('roomCreated', (roomID) => {
    currentRoom = roomID;
    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeModal").style.display = "flex";
});

// CLOSE MODAL
document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

// JOIN
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();

    if (!name || !roomID) return alert("Unesi sve");

    currentRoom = roomID;
    socket.emit('joinRoom', { roomID, name });

    showScreen('reveal');
};

// PLAYERS
socket.on('updatePlayers', (players) => {
    const list = document.getElementById("playerList");
    if (!list) return;

    list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

// START GAME
document.getElementById("startGameBtn").onclick = () => {

    const config = {
        mafija: +document.getElementById("mafija").value,
        doktor: +document.getElementById("doktor").value,
        policajac: +document.getElementById("policajac").value,
        dama: +document.getElementById("dama").value
    };

    socket.emit('startGame', { roomID: currentRoom, config });
};

// ROLE
socket.on('yourRole', (data) => {
    const container = document.getElementById("cardContainer");

    container.innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI</div>
                <div class="card-back">${data.role}</div>
            </div>
        </div>
    `;

    showScreen('reveal');
});

// ADMIN PANEL
socket.on('adminPanel', (players) => {
    if (!isHost) return;

    let panel = players.map(p =>
        `${p.name} - ${p.role || '---'}`
    ).join("\n");

    alert("ADMIN PANEL:\n\n" + panel);
});

// NEW GAME
document.getElementById("newGameBtn").onclick = () => {
    socket.emit('newGame', currentRoom);
};

// RESET
socket.on('resetGame', () => {
    document.getElementById("startGameBtn").disabled = false;
    document.getElementById("cardContainer").innerHTML = "";
    showScreen('hostScreen');
});

// ERROR
socket.on('error', msg => alert(msg));
