const socket = io({
    transports: ["websocket"]
});

let currentRoom = null;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

// CREATE ROOM
document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Unesi ime!");

    socket.emit("createRoom", name);
};

// ROOM CREATED
socket.on("roomCreated", (roomID) => {
    currentRoom = roomID;

    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeTextModal").textContent = roomID;

    document.getElementById("roomCodeModal").style.display = "flex";
});

// CLOSE MODAL
document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen("hostScreen");
};

// JOIN ROOM
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();

    if (!name || !roomID) return alert("Unesi sve!");

    currentRoom = roomID;
    socket.emit("joinRoom", { roomID, name });

    showScreen("reveal");
};

// UPDATE PLAYERS
socket.on("updatePlayers", (players) => {
    const list = document.getElementById("playerList");
    if (!list) return;

    list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

// START GAME
document.getElementById("startGameBtn").onclick = () => {

    const config = {
        mafija: parseInt(document.getElementById("mafija").value) || 0,
        doktor: parseInt(document.getElementById("doktor").value) || 0,
        policajac: parseInt(document.getElementById("policajac").value) || 0,
        dama: parseInt(document.getElementById("dama").value) || 0
    };

    socket.emit("startGame", { roomID: currentRoom, config });

    document.getElementById("startGameBtn").disabled = true;
};

// NEW GAME
document.getElementById("newGameBtn").onclick = () => {
    socket.emit("resetGame", currentRoom);
};

// ROLE RECEIVE
socket.on("yourRole", (data) => {

    showScreen("reveal");

    let roleClass = "role-civil";
    if (data.role === "Mafija") roleClass = "role-mafija";
    if (data.role === "Doktor") roleClass = "role-doktor";
    if (data.role === "Policajac") roleClass = "role-policajac";
    if (data.role === "Dama") roleClass = "role-dama";

    document.getElementById("cardContainer").innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI KARTU</div>
                <div class="card-back ${roleClass}">${data.role}</div>
            </div>
        </div>
    `;
});

// RESET
socket.on("resetGame", () => {
    document.getElementById("startGameBtn").disabled = false;
    document.getElementById("cardContainer").innerHTML = "";
    showScreen("hostScreen");
});

// ERROR
socket.on("error", (msg) => alert(msg));
