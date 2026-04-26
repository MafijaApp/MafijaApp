const socket = io();
let currentRoom = null;
let isHost = false;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

// CREATE ROOM
document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Unesi ime!");

    isHost = true;
    socket.emit('createRoom', name);
};

// ROOM CREATED
socket.on('roomCreated', (roomID) => {
    currentRoom = roomID;

    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeTextModal").textContent = roomID;

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

    if (!name || !roomID) return alert("Popuni sve!");

    currentRoom = roomID;
    socket.emit('joinRoom', { roomID, name });

    showScreen('reveal');
};

// PLAYERS LIST
socket.on('updatePlayers', (players) => {
    const list = document.getElementById("playerList");
    if (list) list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

// ADMIN ROLES
socket.on('adminRoles', (data) => {
    const list = document.getElementById("adminList");
    list.innerHTML = data.players.map(p =>
        `<li>${p.name} - ${p.role}</li>`
    ).join("");
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

// NEW GAME FIX
document.getElementById("newGameBtn").onclick = () => {
    socket.emit('newGame', currentRoom);
};

// RESET
socket.on('resetGame', () => {
    showScreen('hostScreen');
});

// ROLE
socket.on('yourRole', (data) => {

    showScreen('reveal');

    let roleClass = "role-civil";
    if (data.role === "Mafija") roleClass = "role-mafija";
    if (data.role === "Doktor") roleClass = "role-doktor";
    if (data.role === "Policajac") roleClass = "role-policajac";
    if (data.role === "Dama") roleClass = "role-dama";

    document.getElementById("cardContainer").innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI</div>
                <div class="card-back ${roleClass}">${data.role}</div>
            </div>
        </div>
    `;
});
