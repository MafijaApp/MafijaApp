const socket = io();
let currentRoom = null;
let isHost = false;

// ================== SCREEN SWITCH ==================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

// ================== CREATE ROOM ==================
document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();

    if (!name) {
        alert("Unesi ime!");
        return;
    }

    isHost = true;
    socket.emit('createRoom', name);
};

// ================== ROOM CREATED ==================
socket.on('roomCreated', (roomID) => {
    currentRoom = roomID;

    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeTextModal").textContent = roomID;

    document.getElementById("roomCodeModal").style.display = "flex";
});

// ================== CLOSE MODAL ==================
document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

// ================== JOIN ROOM ==================
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();

    if (!name || !roomID) {
        alert("Unesi ime i kod sobe!");
        return;
    }

    isHost = false;
    currentRoom = roomID;

    socket.emit('joinRoom', { roomID, name });

    showScreen('reveal');
};

// ================== UPDATE PLAYERS ==================
socket.on('updatePlayers', (players) => {
    const list = document.getElementById("playerList");

    if (list) {
        list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
    }
});

// ================== START GAME ==================
document.getElementById("startGameBtn").onclick = () => {

    const mafija = Math.max(0, parseInt(document.getElementById("mafija").value) || 0);
    const doktor = Math.max(0, parseInt(document.getElementById("doktor").value) || 0);
    const policajac = Math.max(0, parseInt(document.getElementById("policajac").value) || 0);
    const dama = Math.max(0, parseInt(document.getElementById("dama").value) || 0);

    const config = { mafija, doktor, policajac, dama };

    const playerCount = document.querySelectorAll("#playerList li").length;
    const totalRoles = mafija + doktor + policajac + dama;

    // ================= VALIDACIJE =================
    if (playerCount < 3) {
        alert("Treba bar 3 igrača!");
        return;
    }

    if (totalRoles > playerCount) {
        alert("Previše uloga!");
        return;
    }

    if (mafija === 0) {
        alert("Mora postojati bar 1 mafija!");
        return;
    }

    // disable dugme
    document.getElementById("startGameBtn").disabled = true;

    socket.emit('startGame', { roomID: currentRoom, config });
};

// ================== RECEIVE ROLE ==================
socket.on('yourRole', (data) => {
    showScreen('reveal');

    const container = document.getElementById("cardContainer");

    let roleClass = "role-civil";
    if (data.role === "Mafija") roleClass = "role-mafija";
    if (data.role === "Doktor") roleClass = "role-doktor";
    if (data.role === "Policajac") roleClass = "role-policajac";
    if (data.role === "Dama") roleClass = "role-dama";

    container.innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI KARTU</div>
                <div class="card-back ${roleClass}">${data.role}</div>
            </div>
        </div>
    `;
});

// ================== NEW GAME BUTTON ==================
document.getElementById("newGameBtn").onclick = () => {
    if (!isHost) return;

    socket.emit('newGame', currentRoom);
};

// ================== RESET GAME ==================
socket.on('resetGame', () => {

    document.getElementById("startGameBtn").disabled = false;

    const container = document.getElementById("cardContainer");
    if (container) container.innerHTML = "";

    showScreen('hostScreen');
});

// ================== ERROR ==================
socket.on('error', (msg) => {
    alert(msg);
});

// ================== CONNECTION STATUS ==================
socket.on('connect', () => {
    console.log("Povezan na server");
});

socket.on('disconnect', () => {
    alert("Izgubljena konekcija sa serverom!");
});

// ================== SERVICE WORKER ==================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}
