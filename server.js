const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomID] = { players: [] };
        socket.emit('roomCreated', roomID);
    });

    socket.on('joinRoom', ({ roomID, name }) => {
        if (rooms[roomID]) {
            rooms[roomID].players.push({ id: socket.id, name: name });
            socket.join(roomID);
            socket.emit('roomJoined', roomID);
            io.to(roomID).emit('updatePlayers', rooms[roomID].players.map(p => p.name));
        } else {
            socket.emit('errorMsg', 'Soba ne postoji!');
        }
    });

    socket.on('kickPlayer', ({ roomID, targetName }) => {
        const room = rooms[roomID];
        if (room) {
            const pIdx = room.players.findIndex(p => p.name === targetName);
            if (pIdx !== -1) {
                const targetSocketId = room.players[pIdx].id;
                io.to(targetSocketId).emit('kicked');
                room.players.splice(pIdx, 1);
                io.to(roomID).emit('updatePlayers', room.players.map(p => p.name));
            }
        }
    });

    socket.on('startGame', ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room || room.players.length < 2) return;

        let playersToAssign = [...room.players.slice(1)]; 
        playersToAssign.sort(() => Math.random() - 0.5);

        let roles = ["Doktor", "Policajac"];
        for (let i = 0; i < config.mafija; i++) roles.push("Mafija");
        for (let i = 0; i < config.dama; i++) roles.push("Dama");
        while (roles.length < playersToAssign.length) roles.push("Građanin");

        playersToAssign.forEach((player, index) => {
            io.to(player.id).emit('yourRole', { role: roles[index] });
        });

        const summary = playersToAssign.map((p, i) => ({ name: p.name, role: roles[i] }));
        io.to(room.players[0].id).emit('hostViewRoles', summary);
    });

    socket.on('disconnect', () => {
        // Logika za brisanje praznih soba se može dodati ovde
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
