import http               from "node:http";
import express, { type Express } from "express";
import cors               from "cors";

import { createTicTacToeIo }           from "./io";
import { createTicTacToeRoomRegistry } from "./room-registry";
import { createTicTacToeRoutes }       from "./routes";
import type {
  TicTacToeServerInstance,
  TicTacToeServerOptions,
} from "./types";

export function createTicTacToeServer(
  options: TicTacToeServerOptions = {},
): TicTacToeServerInstance {
  const app: Express    = express();
  const httpServer      = http.createServer(app);
  const { io, sessionStore } = createTicTacToeIo(httpServer, options.socket);
  const roomRegistry    = createTicTacToeRoomRegistry();

  app.use(cors());
  app.use(express.json());
  app.use(
    "/tic-tac-toe",
    createTicTacToeRoutes({ roomRegistry, sessionStore }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  return { app, httpServer, io, sessionStore, roomRegistry };
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3002);
  const { httpServer } = createTicTacToeServer();

  httpServer.listen(port, () => {
    console.log(`Tic Tac Toe server listening on port ${port}`);
  });
}