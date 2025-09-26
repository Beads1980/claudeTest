'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  landed: boolean;
}

interface Helicopter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  flapOffset: number;
}

const HelicopterGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended' | 'levelComplete' | 'crashed'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.3;
  const THRUST = 0.5;
  const HORIZONTAL_SPEED = 3;

  const [helicopter] = useState<Helicopter>({
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    width: 60,
    height: 30
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [birds, setBirds] = useState<Bird[]>([]);

  const generateBuildings = useCallback((level: number) => {
    const buildingsArray: Building[] = [];
    const numBuildings = 4 + level; // Level 1: 5 buildings, Level 2: 6 buildings, Level 3: 7 buildings
    const spacing = CANVAS_WIDTH / (numBuildings + 1);

    for (let i = 0; i < numBuildings; i++) {
      const height = 150 + Math.random() * 200;
      buildingsArray.push({
        x: spacing * (i + 1) - 40,
        y: CANVAS_HEIGHT - height,
        width: 80,
        height: height,
        landed: false
      });
    }
    return buildingsArray;
  }, []);

  const generateBirds = useCallback((level: number) => {
    const birdsArray: Bird[] = [];
    const numBirds = Math.min(2 + level, 5); // Level 1: 3 birds, Level 2: 4 birds, Level 3: 5 birds max

    for (let i = 0; i < numBirds; i++) {
      birdsArray.push({
        x: CANVAS_WIDTH + Math.random() * 400, // Start off screen
        y: 100 + Math.random() * 300, // Random height in flying area
        vx: -1 - Math.random() * 2, // Random speed flying left
        vy: (Math.random() - 0.5) * 0.5, // Slight vertical movement
        width: 20,
        height: 15,
        flapOffset: Math.random() * Math.PI * 2 // Random flap animation offset
      });
    }
    return birdsArray;
  }, []);

  const resetGame = useCallback(() => {
    helicopter.x = 100;
    helicopter.y = 200;
    helicopter.vx = 0;
    helicopter.vy = 0;
    setScore(0);
    setTimeLeft(30);
    setCurrentLevel(1);
    setTotalScore(0);
    const newBuildings = generateBuildings(1);
    const newBirds = generateBirds(1);
    setBuildings(newBuildings);
    setBirds(newBirds);
  }, [helicopter, generateBuildings, generateBirds]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    startTimer();
  }, [resetGame]);

  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('ended');
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const nextLevel = useCallback(() => {
    if (currentLevel < 3) {
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      setTotalScore(prev => prev + score);
      setScore(0);
      setTimeLeft(30);
      helicopter.x = 100;
      helicopter.y = 200;
      helicopter.vx = 0;
      helicopter.vy = 0;
      const newBuildings = generateBuildings(newLevel);
      const newBirds = generateBirds(newLevel);
      setBuildings(newBuildings);
      setBirds(newBirds);
      setGameState('playing');
      startTimer();
    } else {
      // Game completed all levels
      setTotalScore(prev => prev + score);
      setGameState('ended');
    }
  }, [currentLevel, score, helicopter, generateBuildings, generateBirds, startTimer]);

  const drawHelicopter = (ctx: CanvasRenderingContext2D, heli: Helicopter) => {
    ctx.save();
    ctx.translate(heli.x + heli.width / 2, heli.y + heli.height / 2);

    // Body
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(-25, -10, 50, 20);

    // Cockpit
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(-15, -10, 30, 15);

    // Main rotor
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, -15);
    ctx.lineTo(35, -15);
    ctx.stroke();

    // Tail
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(20, -5, 15, 10);

    // Tail rotor
    ctx.beginPath();
    ctx.moveTo(35, -8);
    ctx.lineTo(35, 8);
    ctx.stroke();

    ctx.restore();
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: Bird) => {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

    // Bird body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (flapping animation)
    const flapAngle = Math.sin(Date.now() * 0.02 + bird.flapOffset) * 0.5;
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(-8 + Math.cos(flapAngle) * 3, -5 + Math.sin(flapAngle) * 2);
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(8 + Math.cos(flapAngle) * 3, -5 + Math.sin(flapAngle) * 2);
    ctx.stroke();

    // Beak
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-12, -1);
    ctx.lineTo(-8, 1);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-4, -2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
    // Building body
    ctx.fillStyle = building.landed ? '#90EE90' : '#FFE66D';
    ctx.fillRect(building.x, building.y, building.width, building.height);

    // Building outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(building.x, building.y, building.width, building.height);

    // Windows
    ctx.fillStyle = '#87CEEB';
    for (let row = 0; row < Math.floor(building.height / 40); row++) {
      for (let col = 0; col < 3; col++) {
        const windowX = building.x + 10 + col * 20;
        const windowY = building.y + 15 + row * 40;
        ctx.fillRect(windowX, windowY, 12, 15);
      }
    }

    // Landing pad on top
    ctx.fillStyle = building.landed ? '#32CD32' : '#FF4757';
    ctx.fillRect(building.x + 10, building.y - 5, building.width - 20, 5);

    // Landing pad "H"
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('H', building.x + building.width / 2, building.y + 3);
  };

  const checkCollisions = () => {
    // Check bird collisions first (game ending)
    for (const bird of birds) {
      if (
        helicopter.x < bird.x + bird.width &&
        helicopter.x + helicopter.width > bird.x &&
        helicopter.y < bird.y + bird.height &&
        helicopter.y + helicopter.height > bird.y
      ) {
        // Helicopter hit a bird - crash!
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setGameState('crashed');
        return; // Exit early, no need to check building collisions
      }
    }

    let landedCount = 0;
    for (const building of buildings) {
      // Check if helicopter is on landing pad
      if (
        helicopter.x + helicopter.width > building.x + 10 &&
        helicopter.x < building.x + building.width - 10 &&
        helicopter.y + helicopter.height >= building.y - 5 &&
        helicopter.y + helicopter.height <= building.y + 10 &&
        Math.abs(helicopter.vy) < 2 // Gentle landing
      ) {
        if (!building.landed) {
          building.landed = true;
          setScore(prev => prev + 1);
        }
      }
      if (building.landed) landedCount++;
    }

    // Check if all buildings are landed on
    if (landedCount === buildings.length && buildings.length > 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGameState('levelComplete');
    }

    // Check ground collision
    if (helicopter.y + helicopter.height > CANVAS_HEIGHT) {
      helicopter.y = CANVAS_HEIGHT - helicopter.height;
      helicopter.vy = 0;
    }

    // Keep helicopter in bounds
    if (helicopter.x < 0) helicopter.x = 0;
    if (helicopter.x + helicopter.width > CANVAS_WIDTH) {
      helicopter.x = CANVAS_WIDTH - helicopter.width;
    }
    if (helicopter.y < 0) {
      helicopter.y = 0;
      helicopter.vy = 0;
    }
  };

  const updateGame = () => {
    if (gameState !== 'playing') return;

    // Handle input
    if (keysRef.current.has('ArrowUp')) {
      helicopter.vy -= THRUST;
    }
    if (keysRef.current.has('ArrowDown')) {
      helicopter.vy += THRUST;
    }
    if (keysRef.current.has('ArrowLeft')) {
      helicopter.vx = -HORIZONTAL_SPEED;
    }
    if (keysRef.current.has('ArrowRight')) {
      helicopter.vx = HORIZONTAL_SPEED;
    }

    // Apply gravity
    helicopter.vy += GRAVITY;

    // Apply air resistance
    helicopter.vx *= 0.95;
    helicopter.vy *= 0.98;

    // Update position
    helicopter.x += helicopter.vx;
    helicopter.y += helicopter.vy;

    // Update birds
    setBirds(currentBirds => {
      return currentBirds.map(bird => {
        const newBird = { ...bird };
        newBird.x += newBird.vx;
        newBird.y += newBird.vy;

        // Reset bird if it goes off screen
        if (newBird.x < -50) {
          newBird.x = CANVAS_WIDTH + Math.random() * 200;
          newBird.y = 100 + Math.random() * 300;
          newBird.vx = -1 - Math.random() * 2;
          newBird.vy = (Math.random() - 0.5) * 0.5;
        }

        // Keep birds in vertical bounds with gentle course correction
        if (newBird.y < 50) {
          newBird.vy = Math.abs(newBird.vy);
        } else if (newBird.y > CANVAS_HEIGHT - 100) {
          newBird.vy = -Math.abs(newBird.vy);
        }

        return newBird;
      });
    });

    checkCollisions();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + 50) % CANVAS_WIDTH;
      const y = 50 + Math.sin(i) * 30;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw buildings
    buildings.forEach(building => drawBuilding(ctx, building));

    // Draw helicopter
    drawHelicopter(ctx, helicopter);

    // Draw birds (on top so they're always visible)
    birds.forEach(bird => drawBird(ctx, bird));

    // Draw UI
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${currentLevel}`, 20, 40);
    ctx.fillText(`Score: ${score}`, 20, 70);
    ctx.fillText(`Total: ${totalScore + score}`, 20, 100);
    ctx.fillText(`Time: ${timeLeft}s`, 20, 130);

    if (gameState === 'waiting') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FFF';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Helicopter Landing Game', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.font = '18px Arial';
      ctx.fillText('3 Levels - Land on all buildings to advance!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.fillText('Use arrow keys to control the helicopter', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Land gently on building helipads to score points!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    } else if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FFD700';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';

      if (currentLevel < 3) {
        ctx.fillText(`Level ${currentLevel} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Score: ${score} points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        ctx.fillText(`Total Score: ${totalScore + score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      } else {
        ctx.fillText('All Levels Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Final Score: ${totalScore + score} points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
    } else if (gameState === 'crashed') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FF4444';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText('Hit by a bird!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.fillText(`Level ${currentLevel} Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Total Score: ${totalScore + score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

      ctx.font = '18px Arial';
      ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
    } else if (gameState === 'ended') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FF6B6B';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Time Up!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(`Level ${currentLevel} Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.fillText(`Total Score: ${totalScore + score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

      ctx.font = '18px Arial';
      ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
  };

  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'waiting' || gameState === 'ended' || gameState === 'crashed') {
          startGame();
        } else if (gameState === 'levelComplete') {
          nextLevel();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, nextLevel]);

  // Initialize buildings and birds on component mount
  useEffect(() => {
    const initialBuildings = generateBuildings(1);
    const initialBirds = generateBirds(1);
    setBuildings(initialBuildings);
    setBirds(initialBirds);
  }, [generateBuildings, generateBirds]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    // Cleanup timer on unmount or game state change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-400 rounded-lg shadow-lg"
        tabIndex={0}
      />
      <div className="mt-4 text-center">
        <p className="text-gray-600">Use arrow keys to control the helicopter. Land gently on building helipads!</p>
      </div>
    </div>
  );
};

export default HelicopterGame;