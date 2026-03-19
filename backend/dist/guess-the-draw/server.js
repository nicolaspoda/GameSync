"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuessTheDrawServer = createGuessTheDrawServer;
const node_http_1 = __importDefault(require("node:http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const io_1 = require("./io");
const room_registry_1 = require("./room-registry");
const routes_1 = require("./routes");
function createGuessTheDrawServer(options = {}) {
    const app = (0, express_1.default)();
    const httpServer = node_http_1.default.createServer(app);
    const { io, sessionStore } = (0, io_1.createGuessTheDrawIo)(httpServer, options.socket);
    const roomRegistry = (0, room_registry_1.createGuessTheDrawRoomRegistry)(sessionStore);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use("/guess-the-draw", (0, routes_1.createGuessTheDrawRoutes)({ roomRegistry, sessionStore }));
    app.get("/health", (_request, response) => {
        response.json({ ok: true });
    });
    return {
        app,
        httpServer,
        io,
        sessionStore,
        roomRegistry,
    };
}
if (require.main === module) {
    const port = Number(process.env.PORT ?? 3001);
    const { httpServer } = createGuessTheDrawServer();
    httpServer.listen(port, () => {
        console.log(`Guess The Draw server listening on port ${port}`);
    });
}
