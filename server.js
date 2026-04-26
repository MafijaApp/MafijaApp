const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {

    // CREATE ROOM
    socket.on("createRoom", (name) => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();

        rooms[roomID] = {
            host: socket.id,
            players: []
        };

        socket.join(roomID);
        socket.emit("roomCreated", roomID);
    });

    // JOIN
    socket.on("joinRoom", ({ roomID, name }) => {
        const room = rooms[roomID];
        if (!room) return socket.emit("error", "Soba ne postoji!");

        socket.join(roomID);

        room.players.push({
            id: socket.id,
            name,
            role: null
        });

        io.to(roomID).emit("updatePlayers", room.players.map(p => p.name));
    });

    // START GAME
    socket.on("startGame", ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        const players = room.players;

        let roles = [];

        for (let i = 0; i < (config.mafija || 0); i++) roles.push("Mafija");
        for (let i = 0; i < (config.doktor || 0); i++) roles.push("Doktor");
        for (let i = 0; i < (config.policajac || 0); i++) roles.push("Policajac");
        for (let i = 0; i < (config.dama || 0); i++) roles.push("Dama");

        while (roles.length < players.length) roles.push("Gradjanin");

        roles.sort(() => Math.random() - 0.5);

        const fullState = [];

        players.forEach((p, i) => {
            p.role = roles[i];

            fullState.push({
                name: p.name,
                role: roles[i]
            });

            io.to(p.id).emit("yourRole", { role: roles[i] });
        });

        room.lastGame = fullState;
    });

    // ADMIN REQUEST (NOVO FIX)
    socket.on("requestAdmin", (roomID) => {
        const room = rooms[roomID];
        if (!room || !room.lastGame) return;

        io.to(socket.id).emit("adminPanel", {
            players: room.lastGame
        });
    });

    // RESET
    socket.on("resetGame", (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.players.forEach(p => p.role = null);
        room.lastGame = null;

        io.to(roomID).emit("resetGame");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
