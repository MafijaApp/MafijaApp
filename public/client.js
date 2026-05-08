const socket = io();
let isHost = false;
let myName = "";
let currentRoomID = "";
let currentPlayers = [];

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

window.toggleRules = () => {
    const m = document.getElementById('rulesModal');
    m.style.display = (m.style.display === 'none' || m.style.display === '') ? 'flex' : 'none';
};

window.changeVal = (id, delta) => {
    const el = document.getElementById(id);
    let val = parseInt(el.value) + delta;
    if (id === 'mafija') val = Math.max(1, Math.min(2, val));
    if (id === 'dama') val = Math.max(0, Math.min(1, val));
    el.value = val; 
    if (isHost) updateStartButton(); 
};

document.getElementById('createBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    if (myName) { isHost = true; socket.emit('createRoom'); }
    else alert("Unesi ime!");
};

document.getElementById('joinBtn').onclick = () => {
    myName = document.getElementById('playerName').value.trim();
    currentRoomID = document.getElementById('roomInput').value.toUpperCase().trim();
    if (myName && currentRoomID) { isHost = false; socket.emit('joinRoom', { roomID: currentRoomID, name: myName }); }
    else alert("Popuni ime i kod!");
};

document.getElementById('startGameBtn').onclick = () => {
    socket.emit('startGame', { 
        roomID: currentRoomID, 
        config: { 
            mafija: parseInt(document.getElementById('mafija').value), 
            dama: parseInt(document.getElementById('dama').value) 
        }
    });
};

socket.on('roomCreated', (id) => {
    currentRoomID = id;
    socket.emit('joinRoom', { roomID: id, name: myName });
});

socket.on('roomJoined', (id) => {
    currentRoomID = id;
    document.getElementById('topRoomCode').innerText = id;
    document.getElementById('stickyRoomHeader').style.display = 'block';
    showScreen('hostScreen');
});

socket.on('updatePlayers', (list) => {
    currentPlayers = list;
    const hostName = list[0];
    
    document.getElementById('hostDisplay').innerHTML = `
        <div class="host-badge">HOST / NARATOR</div>
        <div style="font-size:1.6rem; font-weight:900;">${hostName}</div>`;
    
    const otherPlayers = list.slice(1);
    document.getElementById('playerList').innerHTML = otherPlayers.map(p => `
        <li class="player-li">
            <span>${p}</span>
            ${isHost ? `<span class="kick-btn" onclick="kickPlayer('${p}')">IZBACI</span>` : ''}
        </li>`).join('');
    
    if (isHost) updateStartButton();
});

window.kickPlayer = (name) => {
    if(confirm(`Izbaci igrača ${name}?`)) {
        socket.emit('kickPlayer', { roomID: currentRoomID, targetName: name });
    }
};

socket.on('kicked', () => {
    alert("Izbačen si iz sobe.");
    location.reload();
});

socket.on('yourRole', ({ role }) => {
    showScreen('reveal');
    
    const roleClass = role.toLowerCase()
        .replace('đ', 'd').replace('ž', 'z').replace('č', 'c').replace('ć', 'c');

    document.getElementById('cardContainer').innerHTML = `
        <div class="main-card reveal-card ${roleClass}">
            <p class="styled-label role-label">TVOJA ULOGA</p>
            <h1 class="role-title">${role.toUpperCase()}</h1>
            <p class="role-desc">Slušaj naratora i ne otkrivaj karticu!</p>
            <button onclick="location.reload()" class="secondary-btn exit-btn">NAPUSTI IGRU</button>
        </div>`;
});

socket.on('hostViewRoles', (summary) => {
    document.querySelector('.settings-card').style.display = 'none';
    let listHtml = summary.map(s => `
        <li class="player-li">
            <span>${s.name}</span>
            <span style="color:var(--primary); font-weight:900;">${s.role.toUpperCase()}</span>
        </li>`).join('');
    
    document.getElementById('playerList').innerHTML = `
        <h3 class="styled-label" style="text-align:center; margin-bottom:20px;">PODELJENE ULOGE</h3>
        ${listHtml}
    `;
});

function updateStartButton() {
    const m = parseInt(document.getElementById('mafija').value);
    const d = parseInt(document.getElementById('dama').value);
    const req = m + d + 2; 
    const avail = currentPlayers.length - 1;
    const btn = document.getElementById('startGameBtn');
    
    if (avail < req) {
        btn.disabled = true;
        btn.className = "start-btn locked";
        btn.innerText = `FALI JOŠ ${req - avail} IGRAČA`;
    } else {
        btn.disabled = false;
        btn.className = "start-btn";
        btn.innerText = "PODELI ULOGE";
    }
}

socket.on('errorMsg', (msg) => alert(msg));
