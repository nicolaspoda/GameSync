import { Card, CardContent } from "@/components/ui/card";

export default function CreatePrivateRoom() {
  const minPlayers = 2;
  const maxPlayers = 8;

  const minRounds = 1;
  const maxRounds = 4;

  const playerOptions = Array.from(
    { length: maxPlayers - minPlayers + 1 },
    (_, i) => minPlayers + i,
  );

  const roundOptions = Array.from(
    { length: maxRounds - minRounds + 1 },
    (_, i) => minRounds + i,
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <Card>
        <CardContent>
          <div>
            <label htmlFor="">Number of players</label>
            <select>
              {playerOptions.map((p) => (
                <option value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="">Number of rounds</label>
            <select name="" id="">
              {roundOptions.map((r) => (
                <option value={r}>{r}</option>
              ))}
            </select>
          </div>
          <input placeholder="Choose name..." />
          <button>Create room</button>
        </CardContent>
      </Card>
    </div>
  );
}
