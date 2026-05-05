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
    if (confirm("Da li želiš da napustiš igru?")) location.reload();
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
        isHost = false;
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
    ul.innerHTML = list.map((p, i) => `<li class="player-li">${p} ${i===0?'<span class="is-host-tag">HOST</span>':''}</li>`).join('');
    checkPlayerCount();
});

function checkPlayerCount() {
    if (!isHost) return;
    const totalRoles = parseInt(document.getElementById('mafija').value) + parseInt(document.getElementById('dama').value) + 2;
    const activePlayers = currentPlayersList.length - 1; 
    const btn = document.getElementById('startGameBtn');
    const diff = totalRoles - activePlayers;

    if (diff <= 0) {
        btn.disabled = false; btn.classList.remove('locked'); btn.innerText = "PODELI ULOGE";
    } else {
        btn.disabled = true; btn.classList.add('locked'); btn.innerText = `POTREBNO JOŠ ${diff}`;
    }
}

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { mafija: parseInt(document.getElementById('mafija').value), dama: parseInt(document.getElementById('dama').value), doktor: 1, policajac: 1 } 
    });
};

socket.on('hostViewRoles', (data) => {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('listTitle').innerText = "NARATOR PANEL";
    document.getElementById('playerList').innerHTML = data.map(p => `
        <li class="player-li">
            <span><strong>${p.name}</strong> - ${p.role}</span>
            <button class="is-host-tag" style="background:red; color:white; border:none; cursor:pointer;" onclick="kickPlayer('${p.id}')">UBIJ</button>
        </li>`).join('');
});

function kickPlayer(id) {
    if(confirm("Izbaci igrača?")) socket.emit('kickPlayer', { roomID: currentRoomID, playerID: id });
}

socket.on('yourRole', ({ role }) => {
    if (!isHost) {
        showScreen('reveal');
        let roleClass = "role-mafija";
        let roleName = role;
        
        if (role.toLowerCase() === "dama") roleClass = "role-dama";
        if (role.toLowerCase() === "doktor") roleClass = "role-doktor";
        if (role.toLowerCase() === "policajac") roleClass = "role-policajac";
        if (role.toLowerCase() === "građanin") roleClass = ""; // Možeš dodati i za građanina

        document.getElementById('cardContainer').innerHTML = `
            <div class="role-card ${roleClass}">
                <p style="opacity:0.5; font-size:0.8rem; letter-spacing:3px; color:white;">TVOJA ULOGA</p>
                <h1 style="font-size:3.5rem; font-weight:900; margin: 20px 0; color:white;">${roleName.toUpperCase()}</h1>
                <p style="font-size:0.9rem; color:rgba(255,255,255,0.6);">Slušaj Naratora.</p>
            </div>`;
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
