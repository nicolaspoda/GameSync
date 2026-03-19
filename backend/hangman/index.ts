import express from "express";
import http from "node:http";
import { Server } from "socket.io";

import { registerHangmanSockets } from "./sockets";

export { registerHangmanSockets } from "./sockets";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

registerHangmanSockets(io);

app.get("/", (_request, response) => {
  response.send("GameSync backend is running");
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
