const socket = io();
let isHost = false;
let currentPlayers = [];

// Kreiranje / Pridruživanje
socket.on('roomCreated', (id) => {
    isHost = true;
    document.getElementById('roomDisplay').innerText = id;
    showScreen('lobby');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    const playerListUI = document.getElementById('playerList');
    
    // Prikazujemo listu (prvi je uvek Narator)
    playerListUI.innerHTML = list.slice(1).map(name => `<li class="player-li">${name}</li>`).join('');
    
    // Ažuriraj brojač i proveri da li ima dovoljno igrača
    if (isHost) updateStartButton();
});

function updateStartButton() {
    const mafija = parseInt(document.getElementById('mafija').value);
    const dama = parseInt(document.getElementById('dama').value);
    const required = 1 + 1 + mafija + dama; // Doktor + Policajac + ostalo
    const available = currentPlayers.length - 1; // Bez Naratora

    const btn = document.getElementById('startGameBtn');
    if (available >= required) {
        btn.disabled = false;
        btn.classList.remove('locked');
        btn.innerText = "PODELI ULOGE";
    } else {
        btn.disabled = true;
        btn.classList.add('locked');
        btn.innerText = `FALI JOŠ ${required - available} IGRAČA`;
    }
}

// PRIKAZ KARTICE
socket.on('yourRole', ({ role }) => {
    // Ako si host, tebi server nije ni poslao ovo, ali za svaki slučaj:
    if (isHost) return;

    showScreen('reveal');
    let roleClass = "role-gradjanin";
    let desc = "Pokušaj da otkriješ ko je mafija pre nego što bude kasno.";

    const r = role.toLowerCase();
    if (r === "mafija") { 
        roleClass = "role-mafija"; 
        desc = "Eliminiši sve građane, jedan po jedan.";
    } else if (r === "dama") {
        roleClass = "role-dama";
        desc = "Izaberi osobu koju želiš da zaštitiš od mafije.";
    } else if (r === "doktor") {
        roleClass = "role-doktor";
        desc = "Izleči osobu za koju misliš da će biti napadnuta.";
    } else if (r === "policajac") {
        roleClass = "role-policajac";
        desc = "Proveri identitet jednog igrača svake noći.";
    }

    document.getElementById('cardContainer').innerHTML = `
        <div class="role-card ${roleClass}">
            <p class="styled-label" style="opacity:0.5; margin-bottom:10px;">Tvoja Uloga</p>
            <h1 style="font-size:3.5rem; font-weight:900;">${role.toUpperCase()}</h1>
            <div class="divider-line" style="margin: 20px auto; width: 50%;"></div>
            <p style="font-size:0.9rem; line-height:1.5; opacity:0.8;">${desc}</p>
        </div>
    `;
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function changeVal(id, delta) {
    const el = document.getElementById(id);
    let val = parseInt(el.value) + delta;
    if (val >= 0 && val <= 10) {
        el.value = val;
        updateStartButton();
    }
}
