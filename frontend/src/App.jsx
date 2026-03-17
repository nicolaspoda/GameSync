import "./App.css";
import JoinGuessTheDraw from "./games/guess-the-draw/pages/join";
import { Routes, Route } from "react-router-dom";
import CreatePrivateRoom from "./games/guess-the-draw/pages/create-private-room";
import GuessTheDrawRoom from "./games/guess-the-draw/pages/room";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      {/* <nav style={{ display: "flex", gap: "1rem" }}>
        <Link to="/guess-the-draw">GuessTheDraw</Link>
        <Link to="/about">About</Link>
      </nav> */}
      <Routes>
        <Route path="/guess-the-draw" element={<JoinGuessTheDraw />} />
        <Route path="/guess-the-draw/create" element={<CreatePrivateRoom />} />
        <Route path="/guess-the-draw/room/:roomId" element={<GuessTheDrawRoom />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
