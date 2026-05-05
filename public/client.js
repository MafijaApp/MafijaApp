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

function confirmExit() {
    if (confirm("Napusti sobu?")) location.reload();
}

function regenerateRoomCode() {
    if (isHost && confirm("Novi kod?")) socket.emit('createRoom');
}

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("Ime!");
    isHost = true;
    socket.emit('createRoom');
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    const room = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && room) {
        currentRoomID = room;
        isHost = false;
        socket.emit('joinRoom', { roomID: room, name: myName });
    }
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

socket.on('joinSuccess', () => {
    document.getElementById('stickyRoomHeader').style.display = 'block';
    document.getElementById('topRoomCode').innerText = currentRoomID;
    showScreen('hostScreen');
    document.getElementById('globalExitBtn').style.display = 'block';
});

let currentPlayersList = [];
socket.on('updatePlayers', (list) => {
    currentPlayersList = list;
    const hostDiv = document.getElementById('hostDisplay');
    const playerUl = document.getElementById('playerList');
    
    const hostName = list[0]; 
    const actualPlayers = list.slice(1); 
    
    hostDiv.innerHTML = `
        <label class="styled-label" style="color:#555">NARATOR (HOST)</label>
        <div style="font-size:1.3rem; font-weight:900;">${hostName}</div>
    `;
    
    playerUl.innerHTML = actualPlayers.length > 0 
        ? actualPlayers.map(p => `<li class="player-li">${p}</li>`).join('')
        : `<li style="color:#333; list-style:none; text-align:center; padding:20px;">Čekamo ostale...</li>`;
        
    checkPlayerCount();
});

function checkPlayerCount() {
    if (!isHost) return;
    const mafija = parseInt(document.getElementById('mafija').value);
    const dama = parseInt(document.getElementById('dama').value);
    const totalRolesNeeded = mafija + dama + 2; // + Dok + Pol
    const activePlayers = currentPlayersList.length - 1; 
    
    const btn = document.getElementById('startGameBtn');
    const diff = totalRolesNeeded - activePlayers;

    if (diff <= 0) {
        btn.disabled = false; btn.classList.remove('locked'); btn.innerText = "PODELI ULOGE";
    } else {
        btn.disabled = true; btn.classList.add('locked'); btn.innerText = `POTREBNO JOŠ ${diff} IGRAČA`;
    }
}

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { mafija: parseInt(document.getElementById('mafija').value), dama: parseInt(document.getElementById('dama').value), doktor: 1, policajac: 1 } 
    });
};

socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        let roleClass = "role-mafija";
        if (role.toLowerCase() === "dama") roleClass = "role-dama";
        if (role.toLowerCase() === "doktor") roleClass = "role-doktor";
        if (role.toLowerCase() === "policajac") roleClass = "role-policajac";
        if (role.toLowerCase() === "građanin") roleClass = "";

        document.getElementById('cardContainer').innerHTML = `
            <div class="role-card ${roleClass}">
                <p style="opacity:0.6; font-size:0.7rem; letter-spacing:4px;">TVOJA ULOGA</p>
                <h1 style="font-size:3rem; font-weight:900; margin: 20px 0;">${role.toUpperCase()}</h1>
                <p style="font-size:0.8rem; color:rgba(255,255,255,0.4);">Slušaj naratora pažljivo.</p>
            </div>`;
    }
});

socket.on('hostViewRoles', (data) => {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('hostDisplay').innerHTML = `<label class="styled-label">TI SI NARATOR</label>`;
    const playerUl = document.getElementById('playerList');
    playerUl.innerHTML = data.map(p => `
        <li class="player-li">
            <span><strong>${p.name}</strong> <br><small style="color:var(--primary)">${p.role}</small></span>
            <button style="background:none; border:1px solid #333; color:#444; padding:5px 10px; border-radius:5px; font-size:0.6rem;" onclick="kickPlayer('${p.id}')">UBIJ</button>
        </li>`).join('');
});

function kickPlayer(id) {
    if(confirm("Izbaci?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
