import johnImage from "@/assets/john.png";
import larryImage from "@/assets/larry.png";
import { cn } from "@/lib/utils";
import type { TicTacToeSymbol } from "@/games/tic-tac-toe/socket";

const symbolMeta = {
  X: {
    image: larryImage,
    label: "Larry",
  },
  O: {
    image: johnImage,
    label: "John",
  },
} as const;

type Props = {
  symbol: TicTacToeSymbol;
  className?: string;
  imageClassName?: string;
};

export function getSymbolLabel(symbol: TicTacToeSymbol) {
  return symbolMeta[symbol].label;
}

export default function SymbolAvatar({
  symbol,
  className,
  imageClassName,
}: Props) {
  const meta = symbolMeta[symbol];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/90 p-1 shadow-sm",
        className,
      )}
    >
      <img
        src={meta.image}
        alt={meta.label}
        className={cn("size-full rounded-full object-cover", imageClassName)}
      />
    </div>
  );
}
