const socket = io();

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'flex';
}

// KREIRANJE SOBE
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

// ULAZAK U SOBU
document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();
    if(name && roomID) {
        socket.emit('joinRoom', { roomID, name });
        showScreen('reveal');
        document.getElementById("cardContainer").innerHTML = "<h3>Čekamo hosta da podeli uloge...</h3>";
    } else {
        alert("Unesi ime i kod!");
    }
};

socket.on('updatePlayers', (players) => {
    const list = document.getElementById("playerList");
    if(list) list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

// START IGRE
document.getElementById("startGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent;
    const config = {
        mafija: parseInt(document.getElementById("mafija").value) || 0,
        doktor: parseInt(document.getElementById("doktor").value) || 0,
        policajac: parseInt(document.getElementById("policajac").value) || 0,
        dama: parseInt(document.getElementById("dama").value) || 0
    };
    socket.emit('startGame', { roomID, config });
};

// PRIKAZ ULOGE
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
        list.innerHTML = "<h3>Pregled:</h3>" + data.map(p => `<li>${p.name}: ${p.role}</li>`).join("");
    }
});

socket.on('error', (m) => alert(m));
