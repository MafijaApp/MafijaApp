const socket = io();

let currentRoom = null;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

document.getElementById("createBtn").onclick = () => {
    socket.emit('createRoom');
};

socket.on('roomCreated', (roomID) => {
    currentRoom = roomID;

    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeTextModal").textContent = roomID;

    document.getElementById("roomCodeModal").style.display = "flex";
});

document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value;
    const roomID = document.getElementById("roomInput").value.toUpperCase();

    currentRoom = roomID;

    socket.emit('joinRoom', { roomID, name });

    showScreen('reveal');
};

socket.on('updatePlayers', (players) => {
    document.getElementById("playerList").innerHTML =
        players.map(p => `<li>${p}</li>`).join("");
});

document.getElementById("startGameBtn").onclick = () => {

    const config = {
        mafija: +document.getElementById("mafija").value,
        doktor: +document.getElementById("doktor").value,
        policajac: +document.getElementById("policajac").value,
        dama: +document.getElementById("dama").value
    };

    socket.emit('startGame', { roomID: currentRoom, config });
};

document.getElementById("newGameBtn").onclick = () => {
    socket.emit('newGame', currentRoom);
};

socket.on('resetGame', () => {
    showScreen('hostScreen');
});

socket.on('adminRoles', (data) => {
    document.getElementById("adminList").innerHTML =
        data.data.map(p => `<li>${p.name} - ${p.role}</li>`).join("");
});

socket.on('yourRole', (data) => {

    showScreen('reveal');

    let cls = "role-civil";
    if (data.role === "Mafija") cls = "role-mafija";
    if (data.role === "Doktor") cls = "role-doktor";
    if (data.role === "Policajac") cls = "role-policajac";
    if (data.role === "Dama") cls = "role-dama";

    document.getElementById("cardContainer").innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI</div>
                <div class="card-back ${cls}">${data.role}</div>
            </div>
        </div>
    `;
});
