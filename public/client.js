const socket = io();
let currentRoomID = null;
let isHost = false;
let myName = "";

function changeVal(id, delta) {
    const input = document.getElementById(id);
    let newVal = parseInt(input.value) + delta;
    if (newVal >= parseInt(input.min) && newVal <= parseInt(input.max)) {
        input.value = newVal;
        checkPlayerCount();
    }
}

// Potvrda izlaska
function confirmExit() {
    if (confirm("Da li si siguran da želiš da napustiš igru? Sav progres će biti izgubljen.")) {
        location.reload();
    }
}

function regenerateRoomCode() {
    if (isHost && confirm("Generisati novi kod? Stari kôd više neće važiti.")) socket.emit('createRoom');
}

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("Unesi svoje ime!");
    isHost = true;
    socket.emit('createRoom');
};

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('topRoomCode').innerText = id;
    if(isHost) document.getElementById('regenCodeBtn').style.display = 'inline-block';
    socket.emit('joinRoom', { roomID: id, name: myName });
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
});

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    const room = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && room) {
        currentRoomID = room;
        isHost = false; // Pridruženi član nikad nije Host
        socket.emit('joinRoom', { roomID: room, name: myName });
    }
};

socket.on('joinSuccess', () => {
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('topRoomCode').innerText = currentRoomID;
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
});

let currentPlayersList = [];
socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const ul = document.getElementById('playerList');
    // Filtriramo listu da ne prikazujemo Hosta u listi običnih igrača ako želiš, 
    // ali ovde ga ostavljamo sa tagom radi preglednosti.
    ul.innerHTML = list.map((p, i) => `<li class="player-li">${p} ${i===0?'<span class="is-host-tag">HOST (NARATOR)</span>':''}</li>`).join('');
    checkPlayerCount();
});

function checkPlayerCount() {
    if (!isHost) return;
    
    // Računamo koliko uloga treba da podelimo (Mafija + Dama + Doktor + Policajac)
    const totalRolesNeeded = parseInt(document.getElementById('mafija').value) + 
                             parseInt(document.getElementById('dama').value) + 2;
    
    // Broj igrača bez hosta
    const activePlayersCount = currentPlayersList.length - 1; 
    
    const btn = document.getElementById('startGameBtn');
    const diff = totalRolesNeeded - activePlayersCount;

    if (diff <= 0) {
        btn.disabled = false; 
        btn.classList.remove('locked'); 
        btn.innerText = "PODELI ULOGE IGRAČIMA";
    } else {
        btn.disabled = true; 
        btn.classList.add('locked'); 
        btn.innerText = `POTREBNO JOŠ ${diff} IGRAČA`;
    }
}

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { 
            mafija: parseInt(document.getElementById('mafija').value), 
            dama: parseInt(document.getElementById('dama').value), 
            doktor: 1, 
            policajac: 1 
        } 
    });
};

socket.on('hostViewRoles', (data) => {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL (SVE ULOGE)";
    // Host vidi sve, ali nema svoju ulogu
    document.getElementById('playerList').innerHTML = data.map(p => `
        <li class="player-li">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="is-host-tag" style="background:red; color:white; border:none; cursor:pointer;" onclick="kickPlayer('${p.id}')">UBIJ</button>
        </li>`).join('');
});

function kickPlayer(id) {
    if(confirm("Izbaci/Ubij ovog igrača?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

socket.on('yourRole', ({ role }) => {
    // Samo ako NIJE host, prikazuje mu se karta
    if (!isHost) {
        showScreen('reveal');
        document.getElementById('cardContainer').innerHTML = `
            <div style="padding:50px 20px; border:2px solid red; border-radius:20px; text-align:center; background:rgba(255,0,0,0.05); box-shadow: 0 0 30px rgba(255,0,0,0.2);">
                <p style="opacity:0.5; font-size:0.8rem; letter-spacing:3px;">TVOJA ULOGA JE</p>
                <h1 style="font-size:3.5rem; color:red; font-weight:900; margin: 20px 0;">${role.toUpperCase()}</h1>
                <p style="font-size:0.9rem; color:#666;">Ćuti i čekaj instrukcije Naratora.</p>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
