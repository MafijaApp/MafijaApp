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

    socket.on("createRoom", () => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();

        rooms[roomID] = {
            host: socket.id,
            players: [],
            state: "lobby"
        };

        socket.join(roomID);
        socket.emit("roomCreated", roomID);
    });

    socket.on("joinRoom", ({ roomID, name }) => {
        const room = rooms[roomID];
        if (!room) return socket.emit("error", "Soba ne postoji!");

        socket.join(roomID);

        room.players.push({
            id: socket.id,
            name,
            role: null
        });

        io.to(roomID).emit(
            "updatePlayers",
            room.players.map(p => p.name)
        );
    });

    socket.on("startGame", ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let roles = [];

        for (let i = 0; i < config.mafija; i++) roles.push("Mafija");
        for (let i = 0; i < config.doktor; i++) roles.push("Doktor");
        for (let i = 0; i < config.policajac; i++) roles.push("Policajac");
        for (let i = 0; i < config.dama; i++) roles.push("Dama");

        const players = room.players;

        while (roles.length < players.length) roles.push("Gradjanin");

        roles.sort(() => Math.random() - 0.5);

        const fullGame = [];

        players.forEach((p, i) => {
            p.role = roles[i];

            fullGame.push({
                name: p.name,
                role: roles[i]
            });

            io.to(p.id).emit("yourRole", { role: roles[i] });
        });

        room.lastGame = fullGame;
        room.state = "playing";
    });

    socket.on("requestAdmin", (roomID) => {
        const room = rooms[roomID];
        if (!room || !room.lastGame) return;

        io.to(socket.id).emit("adminPanel", {
            players: room.lastGame
        });
    });

    socket.on("resetGame", (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.players.forEach(p => p.role = null);
        room.lastGame = [];
        room.state = "lobby";

        io.to(roomID).emit("resetGame");
    });
});

server.listen(process.env.PORT || 3000);
