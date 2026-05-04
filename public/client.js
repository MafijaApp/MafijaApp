const socket = io();
let currentPlayersCount = 0;
let isHost = false;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

document.getElementById("createBtn").onclick = () => {
    isHost = true;
    socket.emit('createRoom');
};

socket.on('roomCreated', (id) => {
    document.getElementById("roomCodeText").textContent = id;
    document.getElementById("roomCodeTextModal").textContent = id;
    document.getElementById("roomCodeModal").style.display = "flex";
});

document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const room = document.getElementById("roomInput").value.trim().toUpperCase();
    if(name && room) socket.emit('joinRoom', { roomID: room, name });
};

socket.on('joinSuccess', () => {
    showScreen('reveal');
    document.getElementById("cardContainer").innerHTML = "<h3>Čekamo hosta...</h3>";
});

document.getElementById("startGameBtn").onclick = () => {
    const config = {
        mafija: parseInt(document.getElementById("mafija").value),
        doktor: 1, policajac: 1,
        dama: parseInt(document.getElementById("dama").value)
    };
    if (currentPlayersCount < (config.mafija + 2 + config.dama)) return alert("Malo igrača!");
    socket.emit('startGame', { roomID: document.getElementById("roomCodeText").textContent, config });
    document.getElementById("setupArea").style.display = "none";
    document.getElementById("hostActions").style.display = "flex";
};

socket.on('updatePlayers', (players) => {
    currentPlayersCount = players.length;
    const list = document.getElementById("playerList");
    list.innerHTML = "<h3>Igrači u sobi:</h3>";
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        if (isHost) {
            const btn = document.createElement('button');
            btn.textContent = "KICK";
            btn.className = "kick-btn";
            btn.onclick = () => socket.emit('kickPlayer', p);
            li.appendChild(btn);
        }
        list.appendChild(li);
    });
});

socket.on('yourRole', (data) => {
    let cls = "role-civil";
    if (data.role === "Mafija") cls = "role-mafija";
    else if (data.role === "Doktor") cls = "role-doktor";
    else if (data.role === "Policajac") cls = "role-policajac";
    else if (data.role === "Dama") cls = "role-dama";

    document.getElementById("cardContainer").innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DODIRNI KARTU</div>
                <div class="card-back ${cls}">${data.role}</div>
            </div>
        </div>`;
});

socket.on('hostViewRoles', (data) => {
    document.getElementById("playerList").innerHTML = "<h3>Uloge:</h3>" + 
        data.map(p => `<li>${p.name}: <strong>${p.role}</strong></li>`).join("");
});

document.getElementById("newGameBtn").onclick = () => socket.emit('resetGame', document.getElementById("roomCodeText").textContent);
document.getElementById("endGameBtn").onclick = () => socket.emit('destroyRoom', document.getElementById("roomCodeText").textContent);
document.getElementById("exitBtn").onclick = () => location.reload();
socket.on('goToLobby', () => {
    document.getElementById("setupArea").style.display = "flex";
    document.getElementById("hostActions").style.display = "none";
    if (document.getElementById("reveal").style.display !== "none") {
        document.getElementById("cardContainer").innerHTML = "<h3>Sledeća partija...</h3>";
    }
});
socket.on('youAreKick', () => { alert("KICKOVAN SI!"); location.reload(); });
socket.on('forceToHome', () => location.reload());
socket.on('error', (m) => alert(m));
