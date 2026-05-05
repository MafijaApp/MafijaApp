const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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

    // GLAVNA LOGIKA ZA DODELU ULOGA
    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room || room.players.length < 2) return;

        // 1. Izdvajamo igrače bez Naratora (Narator je index 0)
        let playersToAssign = [...room.players.slice(1)]; 
        
        // Mešamo igrače da podela ne bude uvek ista
        playersToAssign = playersToAssign.sort(() => Math.random() - 0.5);

        let roles = [];

        // 2. PRVI PRIORITET: Doktor i Policajac (Podrazumevani)
        roles.push("Doktor");
        roles.push("Policajac");

        // 3. DRUGI PRIORITET: Mafija
        for (let i = 0; i < config.mafija; i++) {
            roles.push("Mafija");
        }

        // 4. TREĆI PRIORITET: Dama (ako je selektovana)
        if (config.dama > 0) {
            roles.push("Dama");
        }

        // 5. OSTATAK: Građani
        while (roles.length < playersToAssign.length) {
            roles.push("Građanin");
        }

        // Emitovanje uloga samo igračima (Narator ne dobija emit)
        const gameSummary = playersToAssign.map((player, index) => {
            const role = roles[index];
            io.to(player.id).emit('yourRole', { role: role });
            return { name: player.name, role: role };
        });

        // Naratoru (index 0) šaljemo pregled svih uloga da može da vodi igru
        io.to(room.players[0].id).emit('hostViewRoles', gameSummary);
    });

    socket.on('disconnect', () => {
        // Logika za brisanje sobe/igrača po potrebi
    });
});

http.listen(3000, () => console.log('Server na portu 3000'));
