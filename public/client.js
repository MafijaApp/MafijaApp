const socket = io();
let currentRoom = null;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'flex';
}

document.getElementById("createBtn").onclick = () => socket.emit('createRoom');

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
    const name = document.getElementById("playerName").value.trim();
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();
    if(name && roomID) {
        currentRoom = roomID;
        socket.emit('joinRoom', { roomID, name });
        showScreen('reveal');
    } else {
        alert("Unesi ime i kod sobe!");
    }
};

socket.on('updatePlayers', (players) => {
    const list = document.getElementById("playerList");
    if(list) list.innerHTML = players.map(p => `<li>${p}</li>`).join("");
});

document.getElementById("startGameBtn").onclick = () => {
    const currentCount = document.getElementById("playerList").children.length;
    
    // Smanjio sam na 3 ako testiraš sa manje ljudi, vrati na 4 za pravu igru
    if (currentCount < 4) {
        alert("Potrebno je bar 4 igrača!");
        return;
    }

    const config = {
        mafija: parseInt(document.getElementById("mafija").value) || 0,
        doktor: parseInt(document.getElementById("doktor").value) || 0,
        policajac: parseInt(document.getElementById("policajac").value) || 0,
        dama: parseInt(document.getElementById("dama").value) || 0 // DODATO
    };
    socket.emit('startGame', { roomID: currentRoom, config });
};

socket.on('yourRole', (data) => {
    showScreen('reveal');
    const container = document.getElementById("cardContainer");
    
    // Mapiranje uloge na CSS klasu
    let roleClass = "role-civil"; 
    if (data.role === "Mafija") roleClass = "role-mafija";
    if (data.role === "Doktor") roleClass = "role-doktor";
    if (data.role === "Policajac") roleClass = "role-policajac";
    if (data.role === "Dama") roleClass = "role-dama"; // DODATO

    container.innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">DOTAKNI KARTU</div>
                <div class="card-back ${roleClass}">${data.role}</div>
            </div>
        </div>`;
});

socket.on('error', (m) => alert(m));

// PWA Service Worker registracija
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Svaki put kad menjaš ikonice ili uloge, promeni verziju u sw.js!
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Aplikacija spremna!'))
      .catch(err => console.log('Greška kod SW:', err));
  });
}
