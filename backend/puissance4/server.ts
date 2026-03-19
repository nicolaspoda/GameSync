import http from "node:http";

import cors from "cors";
import express from "express";
import { Server } from "socket.io";

import { puissance4Router } from "./routes";
import { registerPuissance4Sockets } from "./sockets";

export function createPuissance4Server() {
  const app = express();

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json());

  app.use("/api/puissance4", puissance4Router);

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);
  registerPuissance4Sockets(io);

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  return {
    app,
    httpServer,
    io,
  };
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3003);
  const { httpServer } = createPuissance4Server();

  httpServer.listen(port, () => {
    console.log(`Puissance 4 server listening on port ${port}`);
  });
}
