import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { Play, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 150;
const INITIAL_FOOD = { x: 5, y: 5 };

const Snake = () => {
    const { updateBalance, refreshBalance } = useGame();
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState(INITIAL_FOOD);
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('snake_highscore')) || 0);

    // Refs mirror state so the game loop always reads fresh values
    const foodRef = useRef(food);
    const directionRef = useRef(direction);
    const scoreRef = useRef(score);
    useEffect(() => { foodRef.current = food; }, [food]);
    useEffect(() => { directionRef.current = direction; }, [direction]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    const gameLoopRef = useRef();

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('snake');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session, with A1 reward (flat + skill bonus)
    const finishBackendSession = async (finalScore) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const result = finalScore > 0 ? 'win' : 'loss';
            const res = await endSession(sessionIdRef.current, {
                result,
                score: finalScore,
                finalState: { length: Math.floor(finalScore / 10) + 3 }
            });

            // Skill bonus: 1 coin per 10 points scored, capped at +25
            const skillBonus = result === 'win' ? Math.min(25, Math.floor(finalScore / 10)) : 0;
            if (skillBonus > 0) {
                await updateBalance(skillBonus);
            } else {
                await refreshBalance();
            }
            setCoinsEarned((res.coinChange || 0) + skillBonus);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    const setGameOver = (status, finalScore) => {
        setIsGameOver(status);
        if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('snake_highscore', finalScore);
        }
        finishBackendSession(finalScore);
    };

    const moveSnake = useCallback(() => {
        if (isGameOver || isPaused || !hasStarted) return;
        setSnake(prevSnake => {
            const dir = directionRef.current;
            const currentFood = foodRef.current;
            const head = { x: prevSnake[0].x + dir.x, y: prevSnake[0].y + dir.y };

            // Collision check
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
                prevSnake.some(s => s.x === head.x && s.y === head.y)) {
                setGameOver(true, scoreRef.current);
                return prevSnake;
            }

            const newSnake = [head, ...prevSnake];

            // Did we eat food?
            if (head.x === currentFood.x && head.y === currentFood.y) {
                setScore(s => s + 10);
                // Generate new food, avoiding snake
                let newFood;
                do {
                    newFood = {
                        x: Math.floor(Math.random() * GRID_SIZE),
                        y: Math.floor(Math.random() * GRID_SIZE)
                    };
                } while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y));
                setFood(newFood);
                // DON'T pop — snake grows
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [isGameOver, isPaused, hasStarted]);

    useEffect(() => {
        gameLoopRef.current = setInterval(moveSnake, SPEED);
        return () => clearInterval(gameLoopRef.current);
    }, [moveSnake]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Prevent page from scrolling on arrow keys / space
            if (e.key.startsWith('Arrow') || e.key === ' ') {
                e.preventDefault();
            }
            if (!hasStarted && (e.key.startsWith('Arrow') || e.key === ' ')) {
                setHasStarted(true);
                beginBackendSession();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': if (direction.y !== 1) setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (direction.y !== -1) setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (direction.x !== 1) setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (direction.x !== -1) setDirection({ x: 1, y: 0 }); break;
                case ' ': setIsPaused(p => !p); break;
                default: break;
            }
        };
        window.addEventListener('keydown', handleKeyPress, { passive: false });
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [direction, hasStarted]);

    const resetGame = async () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setIsGameOver(false);
        setScore(0);
        setCoinsEarned(0);
        setIsPaused(false);
        setHasStarted(true);
        setFood(INITIAL_FOOD);
        await beginBackendSession();
    };

    // Background canvas effect
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const dots = Array.from({ length: 45 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));
        const drawBg = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55'; ctx.fill();
            });
            dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 120) {
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`; ctx.lineWidth = 0.6; ctx.stroke();
                }
            }));
            animId = requestAnimationFrame(drawBg);
        };
        drawBg();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const showOverlay = !hasStarted || isGameOver || isPaused;

    return (
        <Layout>
            <div className="ar-root">
                <canvas ref={bgCanvasRef} className="ar-bg-canvas" />
                <div className="ar-blob ar-blob-1" />
                <div className="ar-blob ar-blob-2" />

                <div className="ar-inner">
                    <div className="ar-page-header">
                        <h1 className="ar-title">
                            <span className="ar-title-dark">Snake.</span>
                            <span className="ar-title-green"> Grow.</span>
                        </h1>
                        <p className="ar-subtitle">Eat the food, grow longer. Don't bite yourself!</p>
                    </div>

                    <div className="ar-status-row">
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ar-stat-label">Score</div>
                                <div className="ar-stat-val">{score}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ar-stat-label">Best</div>
                                <div className="ar-stat-val">{highScore}</div>
                            </div>
                        </div>
                        <button className="ar-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="ar-board-wrap">
                        <div style={{ position: 'relative' }}>
                            <div className="ar-snake-grid">
                                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                                    const x = i % GRID_SIZE;
                                    const y = Math.floor(i / GRID_SIZE);
                                    const isHead = snake[0].x === x && snake[0].y === y;
                                    const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
                                    const isFood = food.x === x && food.y === y;
                                    return (
                                        <div key={i} className={`ar-snake-cell${isHead ? ' head' : isBody ? ' body' : ''}`}>
                                            {isFood && <div className="ar-food" />}
                                        </div>
                                    );
                                })}
                            </div>
                            {showOverlay && (
                                <div className="ar-modal-overlay-inline">
                                    <h2 className="ar-modal-title">
                                        {!hasStarted ? 'Ready?' : isGameOver ? '💔 Game Over' : '⏸ Paused'}
                                    </h2>
                                    {isGameOver && (
                                        <p className="ar-modal-fee">Earned: <span className="ar-coin-val">+{coinsEarned} Z Coins</span></p>
                                    )}
                                    {!hasStarted && (
                                        <p className="ar-modal-fee" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Press any arrow key or tap below</p>
                                    )}
                                    <div className="ar-modal-actions">
                                        {isGameOver ? (
                                            <button onClick={resetGame} className="ar-btn-primary">
                                                <RotateCcw size={16} /> Play Again
                                            </button>
                                        ) : isPaused ? (
                                            <button onClick={() => setIsPaused(false)} className="ar-btn-primary">
                                                <Play size={16} /> Resume
                                            </button>
                                        ) : (
                                            <button onClick={() => { setHasStarted(true); beginBackendSession(); }} className="ar-btn-primary">
                                                <Play size={16} /> Start Game
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="ar-hint">Arrow Keys to move &bull; Space to pause</p>
                </div>

                <style>{`
                    .ar-root { position: relative; min-height: 100vh; overflow: hidden; background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%); }
                    .ar-bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
                    .ar-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
                    .ar-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
                    .ar-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }
                    .ar-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 3rem 2rem 5rem; }
                    .ar-page-header { margin-bottom: 2rem; text-align: center; }
                    .ar-title { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; font-family: var(--font-ui); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; line-height: 1.15; letter-spacing: -0.5px; margin: 0 0 0.6rem; }
                    .ar-title-dark { color: var(--text-primary); }
                    .ar-title-purple { background: linear-gradient(135deg, #8e44ad, #732d91); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                    .ar-title-green { background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                    .ar-subtitle { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; max-width: 480px; margin: 0 auto; }
                    .ar-status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(142,68,173,0.14); border-radius: 14px; padding: 0.75rem 1.2rem; backdrop-filter: blur(8px); box-shadow: 0 4px 14px rgba(142,68,173,0.06); }
                    .ar-stat-label { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                    .ar-stat-val { font-size: 1.3rem; font-weight: 800; color: #8e44ad; }
                    .ar-restart-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(142,68,173,0.06); border: 1px solid rgba(142,68,173,0.18); color: var(--accent-primary); padding: 0.5rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; font-family: var(--font-ui); cursor: pointer; transition: all 0.2s; }
                    .ar-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }
                    .ar-board-wrap { background: rgba(255,255,255,0.9); border: 1px solid rgba(142,68,173,0.14); border-radius: 20px; padding: 1rem; box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
                    .ar-snake-grid { display: grid; grid-template-columns: repeat(${GRID_SIZE}, 1fr); background: rgba(142,68,173,0.05); border-radius: 12px; overflow: hidden; aspect-ratio: 1; width: 100%; }
                    .ar-snake-cell { aspect-ratio: 1; border: 0.5px solid rgba(142,68,173,0.08); display: flex; align-items: center; justify-content: center; }
                    .ar-snake-cell.head { background: #8e44ad; border-radius: 4px; }
                    .ar-snake-cell.body { background: #b07cc9; }
                    .ar-food { width: 70%; height: 70%; background: #22c55e; border-radius: 50%; }
                    .ar-modal-overlay-inline { position: absolute; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; gap: 0.75rem; }
                    .ar-modal-title { font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900; color: white; margin: 0; }
                    .ar-modal-fee { color: rgba(255,255,255,0.85); margin: 0; font-size: 1rem; }
                    .ar-coin-val { color: #FFB400; font-weight: 800; }
                    .ar-modal-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
                    .ar-btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #8e44ad, #732d91); color: white; border: none; padding: 0.85rem 1.6rem; border-radius: 999px; font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 20px rgba(142,68,173,0.28); }
                    .ar-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(142,68,173,0.38); }
                    .ar-hint { color: var(--text-secondary); font-size: 0.9rem; text-align: center; margin-top: 1rem; }
                    @media (max-width: 640px) { .ar-inner { padding: 2rem 1.25rem 3rem; } }
                `}</style>
            </div>
        </Layout>
    );
};

export default Snake;