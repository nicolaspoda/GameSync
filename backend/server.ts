import { createGuessTheDrawServer } from "./guess-the-draw/server";
import { createHangmanServer } from "./hangman/server";
import { createPuissance4Server } from "./puissance4/server";
import { createTicTacToeServer } from "./tic-tac-toe/server";

const hangmanPort = Number(process.env.HANGMAN_PORT ?? 3000);
const guessTheDrawPort = Number(process.env.GUESS_THE_DRAW_PORT ?? 3001);
const ticTacToePort = Number(process.env.TIC_TAC_TOE_PORT ?? 3002);
const puissance4Port = Number(process.env.PUISSANCE4_PORT ?? 3003);

const { httpServer: hangmanServer } = createHangmanServer();
const { httpServer: guessTheDrawServer } = createGuessTheDrawServer();
const { httpServer: ticTacToeServer } = createTicTacToeServer();
const { httpServer: puissance4Server } = createPuissance4Server();

hangmanServer.listen(hangmanPort, () => {
  console.log(`Hangman server listening on port ${hangmanPort}`);
});

guessTheDrawServer.listen(guessTheDrawPort, () => {
  console.log(`Guess The Draw server listening on port ${guessTheDrawPort}`);
});

ticTacToeServer.listen(ticTacToePort, () => {
  console.log(`Tic Tac Toe server listening on port ${ticTacToePort}`);
});

puissance4Server.listen(puissance4Port, () => {
  console.log(`Puissance 4 server listening on port ${puissance4Port}`);
});
