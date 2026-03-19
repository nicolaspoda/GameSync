import express from "express";
import http from "node:http";
import { Server } from "socket.io";

import { registerHangmanSockets } from "./sockets";

export function createHangmanServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  registerHangmanSockets(io);

  app.get("/", (_request, response) => {
    response.send("GameSync backend is running");
  });

  return {
    app,
    httpServer,
    io,
  };
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  const { httpServer } = createHangmanServer();

  httpServer.listen(port, () => {
    console.log(`Hangman server listening on http://localhost:${port}`);
  });
}
