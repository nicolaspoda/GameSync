import http from "node:http";

import express, { type Express } from "express";

import { createGuessTheDrawIo } from "./io";
import type { GuessTheDrawServerInstance, GuessTheDrawServerOptions } from "./types";

export function createGuessTheDrawServer(
  options: GuessTheDrawServerOptions = {},
): GuessTheDrawServerInstance {
  const app: Express = express();
  const httpServer = http.createServer(app);
  const { io, sessionStore } = createGuessTheDrawIo(httpServer, options.socket);

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  return {
    app,
    httpServer,
    io,
    sessionStore,
  };
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3001);
  const { httpServer } = createGuessTheDrawServer();

  httpServer.listen(port, () => {
    console.log(`Guess The Draw server listening on port ${port}`);
  });
}
