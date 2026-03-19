import http from "node:http";

import cors from "cors";
import express from "express";
import { Server } from "socket.io";

import { puissance4Router } from "./routes";
import { registerPuissance4Sockets } from "./sockets";

export { puissance4Router } from "./routes";
export { registerPuissance4Sockets } from "./sockets";
export type * from "./types";

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
registerPuissance4Sockets(io);

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => {
  console.log(`Puissance 4 backend listening on http://localhost:${port}`);
});
