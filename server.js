const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
    // Kreiranje nove sobe
    socket.on('createRoom', () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomID] = { host: socket.id, players: [] };
        socket.join(roomID);
        socket.roomID = roomID;
        socket.emit('roomCreated', roomID);
    });

    // Ulazak u sobu
    socket.on('joinRoom', ({ roomID, name }) => {
        const id = roomID.trim().toUpperCase();
        if (rooms[id]) {
            // Osiguravamo da isti soket ne bude dupliran u nizu
            rooms[id].players = rooms[id].players.filter(p => p.id !== socket.id);
            rooms[id].players.push({ id: socket.id, name: name });
            
            socket.join(id);
            socket.roomID = id;
            
            socket.emit('joinSuccess');
            io.to(id).emit('updatePlayers', rooms[id].players.map(p => p.name));
        } else {
            socket.emit('error', 'Soba ne postoji!');
        }
    });

    // Startovanje igre sa ulogama
    socket.on('startGame', ({ roomID, config }) => {
        const id = roomID.toUpperCase();
        if (!rooms[id]) return;

        let players = rooms[id].players;
        let roles = [];

        // Dodavanje uloga na osnovu konfiguracije hosta
        if (config.mafija) for (let i = 0; i < config.mafija; i++) roles.push('Mafija');
        if (config.dama) for (let i = 0; i < config.dama; i++) roles.push('Dama');
        
        // Fiksne uloge
        roles.push('Doktor');
        roles.push('Policajac');

        // Ostali igrači postaju građani
        while (roles.length < players.length) {
            roles.push('Gradjanin');
        }

        // Mešanje uloga nasumično
        roles.sort(() => Math.random() - 0.5);

        // Slanje uloga svakom igraču ponaosob
        players.forEach((p, i) => {
            io.to(p.id).emit('yourRole', { role: roles[i] });
        });

        // Hostu šaljemo pregled svih uloga (da bi znao ko je ko)
        let hostSummary = players.map((p, i) => ({ name: p.name, role: roles[i] }));
        io.to(rooms[id].host).emit('hostViewRoles', hostSummary);
    });

    // Diskonekcija
    socket.on('disconnect', () => {
        const id = socket.roomID;
        if (id && rooms[id]) {
            rooms[id].players = rooms[id].players.filter(p => p.id !== socket.id);
            io.to(id).emit('updatePlayers', rooms[id].players.map(p => p.name));

            // Ako je host izašao, gasimo sobu
            if (socket.id === rooms[id].host) {
                io.to(id).emit('forceToHome');
                delete rooms[id];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
