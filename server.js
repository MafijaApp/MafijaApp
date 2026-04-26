const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

io.on("connection", (socket) => {

    socket.on("createRoom", (name) => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();

        rooms[roomID] = {
            host: socket.id,
            players: [],
            started: false
        };

        socket.join(roomID);

        rooms[roomID].players.push({
            id: socket.id,
            name: name || "Host",
            role: null
        });

        socket.emit("roomCreated", roomID);

        io.to(roomID).emit(
            "updatePlayers",
            rooms[roomID].players.map(p => p.name)
        );
    });

    socket.on("joinRoom", ({ roomID, name }) => {
        const room = rooms[roomID];
        if (!room) return socket.emit("error", "Soba ne postoji!");

        socket.join(roomID);

        room.players.push({
            id: socket.id,
            name: name || "Player",
            role: null
        });

        io.to(roomID).emit(
            "updatePlayers",
            room.players.map(p => p.name || "Unknown")
        );
    });

    socket.on("startGame", ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        let roles = [];

        for (let i = 0; i < (config.mafija || 0); i++) roles.push("Mafija");
        for (let i = 0; i < (config.doktor || 0); i++) roles.push("Doktor");
        for (let i = 0; i < (config.policajac || 0); i++) roles.push("Policajac");
        for (let i = 0; i < (config.dama || 0); i++) roles.push("Dama");

        while (roles.length < room.players.length) {
            roles.push("Gradjanin");
        }

        roles = shuffle(roles);

        room.players.forEach((p, i) => {
            p.role = roles[i];
            io.to(p.id).emit("yourRole", { role: roles[i] });
        });

        room.started = true;
    });

    socket.on("resetGame", (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        room.players.forEach(p => p.role = null);
        room.started = false;

        io.to(roomID).emit("resetGame");
        io.to(roomID).emit(
            "updatePlayers",
            room.players.map(p => p.name || "Unknown")
        );
    });

    socket.on("disconnect", () => {
        for (const roomID in rooms) {
            const room = rooms[roomID];

            room.players = room.players.filter(p => p.id !== socket.id);

            if (room.players.length === 0) {
                delete rooms[roomID];
            } else {
                io.to(roomID).emit(
                    "updatePlayers",
                    room.players.map(p => p.name || "Unknown")
                );
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
