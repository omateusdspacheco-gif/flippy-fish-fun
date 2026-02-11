import React, { useState, useEffect, useCallback } from "react";

const ANIMALS = ["🐶", "🐱", "🐸", "🦁", "🐼", "🦊", "🐷", "🐵"];

interface Card {
  id: number;
  animal: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(): Card[] {
  const pairs = [...ANIMALS, ...ANIMALS];
  return shuffle(pairs).map((animal, i) => ({
    id: i,
    animal,
    flipped: false,
    matched: false,
  }));
}

const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(createCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [bestMoves, setBestMoves] = useState(() =>
    parseInt(localStorage.getItem("memory_best") || "0", 10)
  );

  const handleCardClick = useCallback(
    (id: number) => {
      if (locked) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;
      if (selected.includes(id)) return;

      const newSelected = [...selected, id];
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
      );
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);
        const [first, second] = newSelected;
        const c1 = cards.find((c) => c.id === first)!;
        const c2 = cards.find((c) => c.id === second)!;

        if (c1.animal === c2.animal) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first || c.id === second
                  ? { ...c, matched: true }
                  : c
              )
            );
            setMatches((m) => m + 1);
            setSelected([]);
            setLocked(false);
          }, 400);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first || c.id === second
                  ? { ...c, flipped: false }
                  : c
              )
            );
            setSelected([]);
            setLocked(false);
          }, 800);
        }
      }
    },
    [cards, selected, locked]
  );

  useEffect(() => {
    if (matches === ANIMALS.length) {
      setWon(true);
      const best = parseInt(localStorage.getItem("memory_best") || "0", 10);
      if (best === 0 || moves < best) {
        localStorage.setItem("memory_best", String(moves));
        setBestMoves(moves);
      }
    }
  }, [matches, moves]);

  const restart = () => {
    setCards(createCards());
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setWon(false);
    setLocked(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(145, 60%, 40%) 0%, hsl(170, 50%, 35%) 50%, hsl(200, 55%, 30%) 100%)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg mb-1">
          🐾 Jogo da Memória
        </h1>
        <p className="text-white/70 text-sm sm:text-base">Encontre todos os pares de animais!</p>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-6">
        <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-2 text-center">
          <p className="text-white/60 text-xs uppercase tracking-wide">Jogadas</p>
          <p className="text-white text-2xl font-bold">{moves}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-2 text-center">
          <p className="text-white/60 text-xs uppercase tracking-wide">Pares</p>
          <p className="text-white text-2xl font-bold">{matches}/{ANIMALS.length}</p>
        </div>
        {bestMoves > 0 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-2 text-center">
            <p className="text-white/60 text-xs uppercase tracking-wide">Melhor</p>
            <p className="text-yellow-300 text-2xl font-bold">{bestMoves}</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md w-full">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="aspect-square rounded-2xl text-4xl sm:text-5xl flex items-center justify-center transition-all duration-300 transform select-none"
            style={{
              background: card.flipped || card.matched
                ? "linear-gradient(145deg, hsl(45, 90%, 95%), hsl(45, 80%, 85%))"
                : "linear-gradient(145deg, hsl(260, 60%, 55%), hsl(280, 50%, 45%))",
              boxShadow: card.matched
                ? "0 0 20px hsl(120, 70%, 50%, 0.5), 0 4px 12px rgba(0,0,0,0.15)"
                : card.flipped
                ? "0 4px 16px rgba(0,0,0,0.2)"
                : "0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              transform: card.flipped || card.matched ? "rotateY(0deg) scale(1.02)" : "rotateY(0deg) scale(1)",
              opacity: card.matched ? 0.8 : 1,
              cursor: card.matched || locked ? "default" : "pointer",
            }}
            disabled={card.matched || locked}
          >
            {card.flipped || card.matched ? (
              <span className="animate-in zoom-in duration-200">{card.animal}</span>
            ) : (
              <span className="text-white/40 text-3xl">❓</span>
            )}
          </button>
        ))}
      </div>

      {/* Win modal */}
      {won && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Parabéns!</h2>
            <p className="text-gray-500 mb-1">Você encontrou todos os pares!</p>
            <p className="text-lg font-semibold text-gray-700 mb-6">
              Em <span className="text-purple-600">{moves}</span> jogadas
            </p>
            <button
              onClick={restart}
              className="w-full py-3 rounded-xl font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, hsl(260, 60%, 55%), hsl(280, 50%, 45%))",
              }}
            >
              Jogar Novamente 🔄
            </button>
          </div>
        </div>
      )}

      {/* Restart button */}
      {!won && (
        <button
          onClick={restart}
          className="mt-6 px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, hsl(260, 60%, 55%), hsl(280, 50%, 45%))",
          }}
        >
          Reiniciar 🔄
        </button>
      )}
    </div>
  );
};

export default MemoryGame;
