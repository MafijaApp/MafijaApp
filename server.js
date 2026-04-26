const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

function createRoomState() {
    return {
        host: null,
        players: [],
        gameStarted: false,
        rolesAssigned: false,
        roles: []
    };
}

// ========== CONNECTION ==========
io.on("connection", (socket) => {

    // ========== CREATE ROOM ==========
    socket.on("createRoom", (hostName) => {
        const roomID = Math.random().toString(36).substring(2, 7).toUpperCase();

        rooms[roomID] = createRoomState();
        rooms[roomID].host = socket.id;

        socket.join(roomID);

        socket.emit("roomCreated", roomID);
    });

    // ========== JOIN ROOM ==========
    socket.on("joinRoom", ({ roomID, name }) => {
        const room = rooms[roomID];
        if (!room) {
            socket.emit("error", "Soba ne postoji!");
            return;
        }

        room.players.push({
            id: socket.id,
            name,
            role: null
        });

        socket.join(roomID);

        io.to(roomID).emit(
            "updatePlayers",
            room.players.map(p => p.name)
        );
    });

    // ========== START GAME ==========
    socket.on("startGame", ({ roomID, config }) => {
        const room = rooms[roomID];
        if (!room) return;

        // RESET ROLE STATE svaki put
        room.roles = [];
        room.rolesAssigned = false;
        room.gameStarted = true;

        let players = room.players;

        let roles = [];

        for (let i = 0; i < config.mafija; i++) roles.push("Mafija");
        for (let i = 0; i < config.doktor; i++) roles.push("Doktor");
        for (let i = 0; i < config.policajac; i++) roles.push("Policajac");
        for (let i = 0; i < config.dama; i++) roles.push("Dama");

        while (roles.length < players.length) {
            roles.push("Gradjanin");
        }

        // shuffle
        roles.sort(() => Math.random() - 0.5);

        room.roles = roles;
        room.rolesAssigned = true;

        players.forEach((p, i) => {
            p.role = roles[i];

            io.to(p.id).emit("yourRole", {
                role: roles[i]
            });
        });

        io.to(roomID).emit("gameStarted");
    });

    // ========== NEW GAME ==========
    socket.on("newGame", (roomID) => {
        const room = rooms[roomID];
        if (!room) return;

        // reset sve role
        room.roles = [];
        room.rolesAssigned = false;
        room.gameStarted = false;

        room.players.forEach(p => {
            p.role = null;
        });

        io.to(roomID).emit("resetGame");
    });

    // ========== DISCONNECT ==========
    socket.on("disconnect", () => {
        for (const roomID in rooms) {
            let room = rooms[roomID];

            room.players = room.players.filter(p => p.id !== socket.id);

            io.to(roomID).emit(
                "updatePlayers",
                room.players.map(p => p.name)
            );

            if (room.players.length === 0) {
                delete rooms[roomID];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
