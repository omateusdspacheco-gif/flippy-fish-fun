import React, { useRef, useEffect, useState, useCallback } from "react";

const GRAVITY = 0.25;
const JUMP_FORCE = -6.2;
const PIPE_WIDTH = 55;
const PIPE_GAP = 200;
const PIPE_SPEED_BASE = 1.8;
const FISH_SIZE = 30;
const BUBBLE_COUNT = 15;

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
}

type GameState = "menu" | "playing" | "gameover";

const FlappyFish: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem("flappyfish_best") || "0", 10);
  });

  const gameRef = useRef({
    fishY: 0,
    fishVelocity: 0,
    pipes: [] as Pipe[],
    bubbles: [] as Bubble[],
    score: 0,
    frameCount: 0,
    animationId: 0,
    fishAngle: 0,
    tailPhase: 0,
    sandOffset: 0,
  });

  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const initBubbles = useCallback((w: number, h: number) => {
    const bubbles: Bubble[] = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bubbles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 4,
        speed: 0.3 + Math.random() * 0.7,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    return bubbles;
  }, []);

  const resetGame = useCallback(() => {
    const { w, h } = canvasSizeRef.current;
    const g = gameRef.current;
    g.fishY = h / 2;
    g.fishVelocity = 0;
    g.pipes = [];
    g.score = 0;
    g.frameCount = 0;
    g.fishAngle = 0;
    g.tailPhase = 0;
    g.sandOffset = 0;
    g.bubbles = initBubbles(w, h);
    setScore(0);
  }, [initBubbles]);

  const jump = useCallback(() => {
    if (gameState === "menu") {
      resetGame();
      setGameState("playing");
      gameRef.current.fishVelocity = JUMP_FORCE;
    } else if (gameState === "playing") {
      gameRef.current.fishVelocity = JUMP_FORCE;
    } else if (gameState === "gameover") {
      resetGame();
      setGameState("playing");
      gameRef.current.fishVelocity = JUMP_FORCE;
    }
  }, [gameState, resetGame]);

  // Resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
      if (gameState === "menu") {
        gameRef.current.fishY = h / 2;
        gameRef.current.bubbles = initBubbles(w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [gameState, initBubbles]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;

    const drawBackground = (w: number, h: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0a2463");
      grad.addColorStop(0.4, "#1e3a6e");
      grad.addColorStop(0.7, "#0e6ba8");
      grad.addColorStop(1, "#0a8754");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const drawSand = (w: number, h: number) => {
      const sandH = 30;
      const grad = ctx.createLinearGradient(0, h - sandH, 0, h);
      grad.addColorStop(0, "#c2b280");
      grad.addColorStop(1, "#a89060");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 20) {
        const wave = Math.sin((x + g.sandOffset) * 0.05) * 5;
        ctx.lineTo(x, h - sandH + wave);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    const drawBubbles = (w: number, h: number) => {
      g.bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.2})`;
        ctx.fill();
      });
    };

    const updateBubbles = (w: number, h: number) => {
      g.bubbles.forEach((b) => {
        b.y -= b.speed;
        b.x += Math.sin(b.y * 0.02) * 0.3;
        if (b.y < -10) {
          b.y = h + 10;
          b.x = Math.random() * w;
        }
      });
    };

    const drawFish = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(g.fishAngle);

      // Body
      const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, FISH_SIZE);
      bodyGrad.addColorStop(0, "#ffcc33");
      bodyGrad.addColorStop(0.6, "#ff8800");
      bodyGrad.addColorStop(1, "#e65100");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, FISH_SIZE, FISH_SIZE * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      const tailWag = Math.sin(g.tailPhase) * 8;
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.moveTo(-FISH_SIZE + 2, 0);
      ctx.lineTo(-FISH_SIZE - 15, -10 + tailWag);
      ctx.lineTo(-FISH_SIZE - 15, 10 + tailWag);
      ctx.closePath();
      ctx.fill();

      // Dorsal fin
      ctx.fillStyle = "#ff9900";
      ctx.beginPath();
      ctx.moveTo(-5, -FISH_SIZE * 0.5);
      ctx.lineTo(5, -FISH_SIZE * 0.9);
      ctx.lineTo(12, -FISH_SIZE * 0.4);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(FISH_SIZE * 0.5, -FISH_SIZE * 0.15, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(FISH_SIZE * 0.55, -FISH_SIZE * 0.15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(FISH_SIZE * 0.58, -FISH_SIZE * 0.2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Scales shimmer
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      for (let i = -2; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(i * 8, 0, 6, 0, Math.PI, true);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawPipe = (pipe: Pipe, h: number) => {
      // Top coral
      const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      topGrad.addColorStop(0, "#7b2d8e");
      topGrad.addColorStop(0.5, "#9b59b6");
      topGrad.addColorStop(1, "#6a1b7a");
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight, [0, 0, 10, 10]);
      ctx.fill();

      // Top coral tip
      ctx.fillStyle = "#d35db8";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(pipe.x + 10 + i * 20, pipe.topHeight, 12, 0, Math.PI);
        ctx.fill();
      }

      // Bottom coral
      const botY = pipe.topHeight + PIPE_GAP;
      const botGrad = ctx.createLinearGradient(pipe.x, botY, pipe.x + PIPE_WIDTH, botY);
      botGrad.addColorStop(0, "#1b8a5a");
      botGrad.addColorStop(0.5, "#27ae60");
      botGrad.addColorStop(1, "#145a3a");
      ctx.fillStyle = botGrad;
      ctx.beginPath();
      ctx.roundRect(pipe.x, botY, PIPE_WIDTH, h - botY, [10, 10, 0, 0]);
      ctx.fill();

      // Bottom coral tip
      ctx.fillStyle = "#2ecc71";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(pipe.x + 10 + i * 20, botY, 12, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawScore = (w: number) => {
      ctx.fillStyle = "white";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      ctx.fillText(String(g.score), w / 2, 60);
      ctx.shadowBlur = 0;
    };

    const drawMenu = (w: number, h: number) => {
      // Title
      ctx.fillStyle = "#ffcc33";
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.fillText("🐟 Flappy Fish", w / 2, h * 0.3);
      ctx.shadowBlur = 0;

      // Animated fish
      const menuFishY = h / 2 + Math.sin(Date.now() * 0.003) * 20;
      drawFish(w / 2, menuFishY);

      // Button
      const btnW = 180;
      const btnH = 55;
      const btnX = w / 2 - btnW / 2;
      const btnY = h * 0.7;
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 14);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Jogar", w / 2, btnY + 36);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "16px sans-serif";
      ctx.fillText("Clique ou toque para jogar", w / 2, h * 0.88);
    };

    const drawGameOver = (w: number, h: number) => {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.fillText("Game Over", w / 2, h * 0.3);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`Pontuação: ${g.score}`, w / 2, h * 0.45);

      const best = parseInt(localStorage.getItem("flappyfish_best") || "0", 10);
      ctx.fillStyle = "#ffcc33";
      ctx.font = "22px sans-serif";
      ctx.fillText(`Melhor: ${best}`, w / 2, h * 0.53);

      const btnW = 220;
      const btnH = 55;
      const btnX = w / 2 - btnW / 2;
      const btnY = h * 0.65;
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 14);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("Jogar Novamente", w / 2, btnY + 35);
    };

    const pipeSpeed = () => PIPE_SPEED_BASE + g.score * 0.08;

    const gameLoop = () => {
      const { w, h } = canvasSizeRef.current;
      ctx.clearRect(0, 0, w, h);
      drawBackground(w, h);
      updateBubbles(w, h);
      drawBubbles(w, h);
      drawSand(w, h);

      if (gameState === "menu") {
        g.tailPhase += 0.15;
        g.sandOffset += 0.5;
        drawMenu(w, h);
      } else if (gameState === "playing") {
        g.tailPhase += 0.25;
        g.sandOffset += pipeSpeed() * 0.5;

        // Fish physics
        g.fishVelocity += GRAVITY;
        g.fishY += g.fishVelocity;
        g.fishAngle = Math.min(Math.max(g.fishVelocity * 0.06, -0.5), 0.7);

        // Pipes
        g.frameCount++;
        const spawnInterval = Math.max(100, 150 - g.score * 2);
        if (g.frameCount % spawnInterval === 0) {
          const minTop = 60;
          const maxTop = h - PIPE_GAP - 90;
          const topH = minTop + Math.random() * (maxTop - minTop);
          g.pipes.push({ x: w, topHeight: topH, scored: false });
        }

        const fishX = w * 0.2;
        const speed = pipeSpeed();

        g.pipes.forEach((p) => {
          p.x -= speed;
        });
        g.pipes = g.pipes.filter((p) => p.x + PIPE_WIDTH > -10);

        // Draw pipes
        g.pipes.forEach((p) => drawPipe(p, h));

        // Draw fish
        drawFish(fishX, g.fishY);

        // Score
        g.pipes.forEach((p) => {
          if (!p.scored && p.x + PIPE_WIDTH < fishX) {
            p.scored = true;
            g.score++;
            setScore(g.score);
          }
        });

        drawScore(w);

        // Collision
        const fishR = FISH_SIZE * 0.5;
        const hitBounds = g.fishY < fishR || g.fishY > h - 30 - fishR;
        const hitPipe = g.pipes.some((p) => {
          const inX = fishX + fishR > p.x && fishX - fishR < p.x + PIPE_WIDTH;
          const inGap = g.fishY - fishR > p.topHeight && g.fishY + fishR < p.topHeight + PIPE_GAP;
          return inX && !inGap;
        });

        if (hitBounds || hitPipe) {
          const best = parseInt(localStorage.getItem("flappyfish_best") || "0", 10);
          if (g.score > best) {
            localStorage.setItem("flappyfish_best", String(g.score));
            setBestScore(g.score);
          }
          setGameState("gameover");
        }
      } else if (gameState === "gameover") {
        g.tailPhase += 0.1;
        g.sandOffset += 0.3;
        // Draw last frame pipes and fish
        const fishX = w * 0.2;
        g.pipes.forEach((p) => drawPipe(p, h));
        drawFish(fishX, g.fishY);
        drawScore(w);
        drawGameOver(w, h);
      }

      g.animationId = requestAnimationFrame(gameLoop);
    };

    g.animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(g.animationId);
  }, [gameState]);

  // Input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  return (
    <div
      className="w-screen h-screen overflow-hidden cursor-pointer select-none"
      onClick={jump}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default FlappyFish;
