const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// OVO REŠAVA GREŠKU: Govori serveru da su tvoji fajlovi (index.html, style.css, client.js) u "public" folderu
app.use(express.static(path.join(__dirname, 'public')));

// Ruta za početnu stranicu
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let rooms = {};

io.on('connection', (socket) => {
    // Kreiranje sobe
    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomID] = { players: [] };
        socket.emit('roomCreated', roomID);
    });

    // Pridruživanje (Narator je uvek prvi na indeksu 0)
    socket.on('joinRoom', ({ roomID, name }) => {
        if (rooms[roomID]) {
            rooms[roomID].players.push({ id: socket.id, name });
            socket.join(roomID);
            io.to(roomID).emit('updatePlayers', rooms[roomID].players.map(p => p.name));
        }
    });

    // PRIORITETNA PODELA ULOGA
    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room || room.players.length < 2) return;

        // Narator (index 0) ne dobija ulogu
        let playersToAssign = [...room.players.slice(1)]; 
        playersToAssign = playersToAssign.sort(() => Math.random() - 0.5);

        let roles = [];
        // Prioritet 1: Obavezni Doktor i Policajac
        roles.push("Doktor");
        roles.push("Policajac");

        // Prioritet 2: Mafija
        for (let i = 0; i < config.mafija; i++) {
            roles.push("Mafija");
        }

        // Prioritet 3: Dama
        if (config.dama > 0) {
            roles.push("Dama");
        }

        // Ostatak: Građani
        while (roles.length < playersToAssign.length) {
            roles.push("Građanin");
        }

        // Slanje uloga igračima
        const gameSummary = playersToAssign.map((player, index) => {
            const role = roles[index];
            io.to(player.id).emit('yourRole', { role: role });
            return { name: player.name, role: role };
        });

        // Slanje liste Naratoru
        io.to(room.players[0].id).emit('hostViewRoles', gameSummary);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
