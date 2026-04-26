const socket = io();
let currentRoom = null;

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "flex";
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
    showScreen("hostScreen");
});

// JOIN ROOM
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();

    if (!name || !roomID) return alert("Unesi podatke!");

    currentRoom = roomID;
    socket.emit("joinRoom", { roomID, name });

    showScreen("reveal");
};

// UPDATE PLAYERS
socket.on("updatePlayers", (players) => {
    const list = document.getElementById("playerList");
    if (list) {
        list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
    }
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

// PLAYER ROLE
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

// ADMIN PANEL
socket.on("adminPanel", (data) => {
    showScreen("adminScreen");

    document.getElementById("adminList").innerHTML =
        data.players.map(p => `<li>${p.name} → ${p.role}</li>`).join("");
});

// NEW GAME
document.getElementById("newGameBtn").onclick = () => {
    socket.emit("resetGame", currentRoom);
};

// RESET
socket.on("resetGame", () => {
    showScreen("hostScreen");
});

// ERROR
socket.on("error", (msg) => alert(msg));
