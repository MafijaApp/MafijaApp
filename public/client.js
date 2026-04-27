const socket = io();
let currentPlayersCount = 0;

// Funkcija za navigaciju između ekrana
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'flex';
}

// --- HOST LOGIKA ---

document.getElementById("createBtn").onclick = () => {
    socket.emit('createRoom');
};

socket.on('roomCreated', (roomID) => {
    // Soba je uvek velika slova (server to šalje, ali osiguravamo i ovde)
    const upperID = roomID.toUpperCase();
    document.getElementById("roomCodeText").textContent = upperID;
    document.getElementById("roomCodeTextModal").textContent = upperID;
    document.getElementById("roomCodeModal").style.display = "flex";
});

document.getElementById("closeModal").onclick = () => {
    document.getElementById("roomCodeModal").style.display = "none";
    showScreen('hostScreen');
};

document.getElementById("startGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent.toUpperCase();
    
    // Čitanje konfiguracije uloga
    let mCount = parseInt(document.getElementById("mafija").value) || 1;
    let dCount = 1; // Fiksirano na 1 prema tvom zahtevu
    let pCount = 1; // Fiksirano na 1 prema tvom zahtevu
    let damaCount = parseInt(document.getElementById("dama").value) || 0;

    // Provera da li ima dovoljno igrača u sobi za specijalne uloge
    const totalSpecial = mCount + dCount + pCount + damaCount;
    if (currentPlayersCount < totalSpecial) {
        alert(`Nema dovoljno igrača! Potrebno je bar ${totalSpecial} ljudi za ove uloge.`);
        return;
    }

    const config = { 
        mafija: mCount, 
        doktor: dCount, 
        policajac: pCount, 
        dama: damaCount 
    };

    socket.emit('startGame', { roomID, config });
    
    // Sakrij podešavanja, prikaži akcije za upravljanje partijom
    document.getElementById("setupArea").style.display = "none";
    document.getElementById("hostActions").style.display = "flex";
};

// Brzi reset partije (ostaju u istoj sobi)
document.getElementById("newGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent.toUpperCase();
    socket.emit('resetGame', roomID);
};

// Gašenje sobe (svi idu na Home)
document.getElementById("endGameBtn").onclick = () => {
    const roomID = document.getElementById("roomCodeText").textContent.toUpperCase();
    socket.emit('destroyRoom', roomID);
};

// --- LOGIKA IGRAČA ---

document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    // CASE-INSENSITIVE: Pretvaramo unos u velika slova i brišemo razmake
    const roomID = document.getElementById("roomInput").value.trim().toUpperCase();
    
    if(name && roomID) {
        socket.emit('joinRoom', { roomID, name });
        showScreen('reveal');
        document.getElementById("cardContainer").innerHTML = "<h3>Čekamo hosta...</h3>";
    } else {
        alert("Unesi ime i kod sobe!");
    }
};

// Napuštanje igre (diskonekcija i povratak na meni)
document.getElementById("exitBtn").onclick = () => {
    socket.disconnect(); 
    location.reload(); 
};

// --- ZAJEDNIČKI SOCKET EVENTI ---

// Ažuriranje liste igrača (Host vidi ko je ušao)
socket.on('updatePlayers', (players) => {
    currentPlayersCount = players.length;
    const list = document.getElementById("playerList");
    if(list) {
        list.innerHTML = "<h3>Igrači u sobi:</h3>" + 
            players.map(p => `<li>${p}</li>`).join("");
    }
});

// Kada host resetuje partiju, igrači se vraćaju u "lobby" stanje
socket.on('goToLobby', () => {
    document.getElementById("setupArea").style.display = "flex";
    document.getElementById("hostActions").style.display = "none";
    
    // Ako je ekran sa kartom otvoren, resetuj ga
    const revealScreen = document.getElementById("reveal");
    if (revealScreen.style.display !== "none") {
        document.getElementById("cardContainer").innerHTML = "<h3>Sledeća partija počinje...</h3>";
    }
});

// Kada je soba ugašena, svi se silom vraćaju na početak
socket.on('forceToHome', () => {
    location.reload();
});

// Dodela uloga
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
        </div>`;
});

// Prikaz uloga kod Hosta (da zna ko je ko)
socket.on('hostViewRoles', (data) => {
    const list = document.getElementById("playerList");
    if(list) {
        list.innerHTML = "<h3>Raspored uloga:</h3>" + 
            data.map(p => `<li>${p.name}: <strong>${p.role}</strong></li>`).join("");
    }
});

socket.on('error', (m) => alert(m));
