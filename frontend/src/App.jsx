import "./App.css";
import JoinGuessTheDraw from "./games/guess-the-draw/pages/join";
import { Routes, Route } from "react-router-dom";
import CreatePrivateRoom from "./games/guess-the-draw/pages/create-private-room";
import JoinPrivateRoom from "./games/guess-the-draw/pages/join-private-room";
import GuessTheDrawRoom from "./games/guess-the-draw/pages/room";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "./pages/home";
import GamePlayerPage from "./pages/game-player";
import JoinTicTacToe from "./games/tic-tac-toe/pages/join";
import TicTacToeRoom from "./games/tic-tac-toe/pages/room";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:gameId" element={<GamePlayerPage />} />
        <Route path="/guess-the-draw" element={<JoinGuessTheDraw />} />
        <Route path="/guess-the-draw/create" element={<CreatePrivateRoom />} />
        <Route
          path="/guess-the-draw/private/:roomId/join"
          element={<JoinPrivateRoom />}
        />
        <Route path="/guess-the-draw/room/:roomId" element={<GuessTheDrawRoom />} />
      
        <Route path="/tic-tac-toe"              element={<JoinTicTacToe />} />
        <Route path="/tic-tac-toe/room/:roomId" element={<TicTacToeRoom />} />
            
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
