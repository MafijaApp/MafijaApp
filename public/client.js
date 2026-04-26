const socket = io();
let currentRoom = null;

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "flex";
}

// CREATE
document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Unesi ime!");

    socket.emit("createRoom", name);
};

// ROOM CREATED
socket.on("roomCreated", (roomID) => {
    currentRoom = roomID;
    document.getElementById("roomCodeText").textContent = roomID;
    showScreen("hostScreen");
});

// JOIN
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();

    if (!name || !roomID) return alert("Unesi podatke!");

    currentRoom = roomID;
    socket.emit("joinRoom", { roomID, name });

    showScreen("reveal");
};

// PLAYERS LIST
socket.on("updatePlayers", (players) => {
    document.getElementById("playerList").innerHTML =
        players.map(p => `<li>${p}</li>`).join("");
});

// START GAME
document.getElementById("startGameBtn").onclick = () => {

    const config = {
        mafija: Math.max(0, +document.getElementById("mafija").value || 0),
        doktor: Math.max(0, +document.getElementById("doktor").value || 0),
        policajac: Math.max(0, +document.getElementById("policajac").value || 0),
        dama: Math.max(0, +document.getElementById("dama").value || 0)
    };

    socket.emit("startGame", { roomID: currentRoom, config });
};

// ROLE
socket.on("yourRole", (data) => {
    showScreen("reveal");

    document.getElementById("cardContainer").innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI</div>
                <div class="card-back">${data.role}</div>
            </div>
        </div>
    `;
});

// ADMIN OPEN
document.getElementById("adminBtn").onclick = () => {
    socket.emit("requestAdmin", currentRoom);
};

// ADMIN PANEL
socket.on("adminPanel", (data) => {
    showScreen("adminScreen");

    document.getElementById("adminList").innerHTML =
        data.players.map(p => `<li>${p.name} → ${p.role}</li>`).join("");
});

// BACK
document.getElementById("backFromAdminBtn").onclick = () => {
    showScreen("hostScreen");
};

// NEW GAME (REAL RESET)
document.getElementById("newGameBtn").onclick = () => {
    socket.emit("resetGame", currentRoom);
};

// RESET UI FROM SERVER
socket.on("resetGame", () => {
    document.getElementById("cardContainer").innerHTML = "";
    document.getElementById("adminList").innerHTML = "";
    showScreen("hostScreen");
});

// ERROR
socket.on("error", (msg) => alert(msg));
