const socket = io();
let currentPlayersCount = 0;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'flex';
}

document.getElementById("createBtn").onclick = () => socket.emit('createRoom');

socket.on('roomCreated', (roomID) => {
    document.getElementById("roomCodeText").textContent = roomID;
    document.getElementById("roomCodeTextModal").textContent = roomID;
    document.getElementById("roomCodeModal").style.display = "flex";
});

document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();
    if(name && roomID) {
        socket.emit('joinRoom', { roomID, name });
        showScreen('reveal');
        document.getElementById("cardContainer").innerHTML = "<h3>Čekamo hosta...</h3>";
    }
};

document.getElementById("exitBtn").onclick = () => {
    socket.disconnect(); 
    location.reload();
};

socket.on('updatePlayers', (players) => {
    currentPlayersCount = players.length;
    const list = document.getElementById("playerList");
    if(list) list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

document.getElementById("startGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent;
    
    // Čitanje vrednosti
    let mCount = parseInt(document.getElementById("mafija").value) || 0;
    let dCount = parseInt(document.getElementById("doktor").value) || 0;
    let pCount = parseInt(document.getElementById("policajac").value) || 0;
    let damaCount = parseInt(document.getElementById("dama").value) || 0;

    // STRIKTNA OGRANIČENJA
    if (mCount < 1) mCount = 1;
    if (mCount > 2) mCount = 2;
    if (dCount !== 1) dCount = 1; // Mora biti 1
    if (pCount !== 1) pCount = 1; // Mora biti 1
    if (damaCount < 0) damaCount = 0;
    if (damaCount > 1) damaCount = 1;

    const totalSpecialRoles = mCount + dCount + pCount + damaCount;

    // Provera da li ima dovoljno ljudi u sobi
    if (currentPlayersCount < totalSpecialRoles) {
        alert(`Nema dovoljno igrača! Treba vam bar ${totalSpecialRoles} ljudi za ove uloge.`);
        return;
    }

    const config = { mafija: mCount, doktor: dCount, policajac: pCount, dama: damaCount };
    socket.emit('startGame', { roomID, config });
    
    document.getElementById("setupArea").style.display = "none";
    document.getElementById("hostActions").style.display = "block";
};

document.getElementById("newGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent;
    socket.emit('resetGame', roomID);
};

socket.on('goToLobby', () => {
    document.getElementById("setupArea").style.display = "block";
    document.getElementById("hostActions").style.display = "none";
    const revealScreen = document.getElementById("reveal");
    if (revealScreen.style.display !== "none") {
        document.getElementById("cardContainer").innerHTML = "<h3>Sledeća partija počinje...</h3>";
    }
});

document.getElementById("endGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent;
    socket.emit('destroyRoom', roomID);
};

socket.on('forceToHome', () => {
    location.reload();
});

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
                <div class="card-front">DODIRNI KARTU</div>
                <div class="card-back ${roleClass}">${data.role}</div>
            </div>
        </div>`;
});

socket.on('hostViewRoles', (data) => {
    const list = document.getElementById("playerList");
    if(list) {
        list.innerHTML = "<h3>Uloge:</h3>" + data.map(p => `<li>${p.name}: ${p.role}</li>`).join("");
    }
});

socket.on('error', (m) => alert(m));
