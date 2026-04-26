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
    const list = document.getElementById("playerList");
    if (list) list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

// START GAME
document.getElementById("startGameBtn").onclick = () => {
    const config = {
        mafija: +document.getElementById("mafija").value || 0,
        doktor: +document.getElementById("doktor").value || 0,
        policajac: +document.getElementById("policajac").value || 0,
        dama: +document.getElementById("dama").value || 0
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

// ADMIN PANEL (FIXED SAFE RENDER)
socket.on("adminPanel", (data) => {
    showScreen("adminScreen");

    const list = document.getElementById("adminList");

    list.innerHTML = data.players
        .map(p => `<li><b>${p.name}</b> → ${p.role}</li>`)
        .join("");
});

// NEW GAME FIX (IMPORTANT)
document.getElementById("newGameBtn").onclick = () => {
    if (!currentRoom) return;
    socket.emit("resetGame", currentRoom);
};

// RESET UI
socket.on("resetGame", () => {
    document.getElementById("cardContainer").innerHTML = "";
    showScreen("hostScreen");
});

// ERROR
socket.on("error", (msg) => alert(msg));
