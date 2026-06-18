import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw, Play } from 'lucide-react';

const Pacman = () => {
    const { updateBalance, refreshBalance } = useGame();
    const canvasRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    const [gameState, setGameState] = useState('START');
    const [score, setScore] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('pacmanHighScore')) || 0);
    const animationIdRef = useRef(null);

    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
        [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
        [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
        [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
        [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
        [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
        [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const TILE_SIZE = 20;
    const pacmanRef = useRef({ x: 9, y: 15, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0, mouthSpeed: 0.1 });
    const ghostsRef = useRef([
        { x: 9, y: 8, color: '#ff0000', dir: { x: 1, y: 0 } },
        { x: 8, y: 9, color: '#ffb8ff', dir: { x: -1, y: 0 } },
        { x: 10, y: 9, color: '#00ffff', dir: { x: 1, y: 0 } },
        { x: 9, y: 10, color: '#ffb852', dir: { x: 0, y: -1 } }
    ]);
    const pelletsRef = useRef([]);

    const initPellets = () => {
        const p = [];
        for (let y = 0; y < maze.length; y++)
            for (let x = 0; x < maze[y].length; x++)
                if (maze[y][x] === 0) p.push({ x, y });
        pelletsRef.current = p;
    };

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('pacman');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session with A1 reward
    const finishBackendSession = async (finalScore) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const allPelletsEaten = pelletsRef.current.length === 0;
            const result = allPelletsEaten ? 'win' : (finalScore > 0 ? 'win' : 'loss');

            const res = await endSession(sessionIdRef.current, {
                result,
                score: finalScore,
                finalState: {
                    pelletsRemaining: pelletsRef.current.length,
                    clearedBoard: allPelletsEaten
                }
            });

            // Skill bonus: 1 coin per 50 points scored, capped at +25
            const skillBonus = result === 'win' ? Math.min(25, Math.floor(finalScore / 50)) : 0;
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

    const resetGame = () => {
        pacmanRef.current = { x: 9, y: 15, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0, mouthSpeed: 0.1 };
        ghostsRef.current = [
            { x: 9, y: 8, color: '#ff0000', dir: { x: 1, y: 0 } },
            { x: 8, y: 9, color: '#ffb8ff', dir: { x: -1, y: 0 } },
            { x: 10, y: 9, color: '#00ffff', dir: { x: 1, y: 0 } },
            { x: 9, y: 10, color: '#ffb852', dir: { x: 0, y: -1 } }
        ];
        initPellets();
        setScore(0);
        setCoinsEarned(0);
        setGameState('START');
    };

    useEffect(() => { initPellets(); }, []);

    const triggerGameOver = (currentScore) => {
        if (gameState === 'GAME_OVER') return;
        setGameState('GAME_OVER');
        if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('pacmanHighScore', currentScore);
        }
        finishBackendSession(currentScore);
    };

    const update = () => {
        if (gameState !== 'PLAYING') return;
        const pacman = pacmanRef.current;

        if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
            const nextX = pacman.x + pacman.nextDir.x;
            const nextY = pacman.y + pacman.nextDir.y;
            if (maze[nextY] && maze[nextY][nextX] !== 1) {
                pacman.dir = { ...pacman.nextDir };
                pacman.nextDir = { x: 0, y: 0 };
            }
        }

        const newX = pacman.x + pacman.dir.x;
        const newY = pacman.y + pacman.dir.y;
        if (maze[newY] && maze[newY][newX] !== 1) {
            pacman.x = newX; pacman.y = newY;
            const pelletIndex = pelletsRef.current.findIndex(p => p.x === pacman.x && p.y === pacman.y);
            if (pelletIndex !== -1) {
                pelletsRef.current.splice(pelletIndex, 1);
                setScore(s => s + 10);
                if (pelletsRef.current.length === 0) triggerGameOver(score + 10);
            }
        }

        pacman.mouth += pacman.mouthSpeed;
        if (pacman.mouth > 0.2 || pacman.mouth < 0) pacman.mouthSpeed *= -1;

        ghostsRef.current.forEach(ghost => {
            const possibleDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            const isAligned = Math.abs(ghost.x - Math.round(ghost.x)) < 0.1 && Math.abs(ghost.y - Math.round(ghost.y)) < 0.1;
            if (isAligned) {
                ghost.x = Math.round(ghost.x); ghost.y = Math.round(ghost.y);
                const cnx = ghost.x + ghost.dir.x, cny = ghost.y + ghost.dir.y;
                if (!maze[cny] || maze[cny][cnx] === 1 || Math.random() < 0.2) {
                    const valid = possibleDirs.filter(d => {
                        const nx = ghost.x + d.x, ny = ghost.y + d.y;
                        return maze[ny] && maze[ny][nx] !== 1;
                    });
                    if (valid.length > 0) ghost.dir = valid[Math.floor(Math.random() * valid.length)];
                }
            }
            ghost.x += ghost.dir.x * 0.25;
            ghost.y += ghost.dir.y * 0.25;
            const dx = ghost.x - pacman.x, dy = ghost.y - pacman.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.7) triggerGameOver(score);
        });
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < maze.length; y++)
            for (let x = 0; x < maze[y].length; x++)
                if (maze[y][x] === 1) {
                    ctx.fillStyle = '#2121ff';
                    ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

        pelletsRef.current.forEach(p => {
            ctx.fillStyle = '#ffb8ae';
            ctx.beginPath();
            ctx.arc(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        const pacman = pacmanRef.current;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        const cx = pacman.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = pacman.y * TILE_SIZE + TILE_SIZE / 2;
        let rotation = 0;
        if (pacman.dir.x === 1) rotation = 0;
        else if (pacman.dir.x === -1) rotation = Math.PI;
        else if (pacman.dir.y === 1) rotation = Math.PI / 2;
        else if (pacman.dir.y === -1) rotation = -Math.PI / 2;
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, TILE_SIZE / 2 - 2, rotation + pacman.mouth * Math.PI, rotation + (2 - pacman.mouth) * Math.PI);
        ctx.fill();

        ghostsRef.current.forEach(ghost => {
            ctx.fillStyle = ghost.color;
            const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
            ctx.beginPath();
            ctx.arc(gx, gy, TILE_SIZE / 2 - 2, Math.PI, 0);
            ctx.lineTo(gx + TILE_SIZE / 2 - 2, gy + TILE_SIZE / 2 - 2);
            ctx.lineTo(gx - TILE_SIZE / 2 + 2, gy + TILE_SIZE / 2 - 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(gx - 4, gy - 2, 3, 0, Math.PI * 2);
            ctx.arc(gx + 4, gy - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(gx - 3, gy - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(gx + 5, gy - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        if (gameState === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

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

    useEffect(() => {
        let lastUpdate = 0;
        const loop = (ts) => {
            if (gameState === 'PLAYING') {
                if (ts - lastUpdate > 150) { update(); lastUpdate = ts; }
            }
            draw();
            animationIdRef.current = requestAnimationFrame(loop);
        };
        animationIdRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationIdRef.current);
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
            if (gameState === 'START' && (e.code === 'Space' || e.code.startsWith('Arrow'))) {
                setGameState('PLAYING');
                beginBackendSession();
            }
            switch (e.code) {
                case 'ArrowUp': pacmanRef.current.nextDir = { x: 0, y: -1 }; break;
                case 'ArrowDown': pacmanRef.current.nextDir = { x: 0, y: 1 }; break;
                case 'ArrowLeft': pacmanRef.current.nextDir = { x: -1, y: 0 }; break;
                case 'ArrowRight': pacmanRef.current.nextDir = { x: 1, y: 0 }; break;
                default: break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    return (
        <Layout>
            <div className="ar-root">
                <canvas ref={bgCanvasRef} className="ar-bg-canvas" />
                <div className="ar-blob ar-blob-1" />
                <div className="ar-blob ar-blob-2" />

                <div className="ar-inner">
                    <div className="ar-page-header">
                        <h1 className="ar-title">
                            <span className="ar-title-dark">Pac-</span>
                            <span className="ar-title-purple">Man.</span>
                        </h1>
                        <p className="ar-subtitle">Eat all the pellets. Avoid the ghosts!</p>
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
                            <canvas
                                ref={canvasRef}
                                width={19 * TILE_SIZE}
                                height={19 * TILE_SIZE}
                                className="ar-game-canvas"
                            />
                            {gameState === 'START' && (
                                <div className="ar-modal-overlay-inline">
                                    <h2 className="ar-modal-title">Ready?</h2>
                                    <div className="ar-modal-actions">
                                        <button onClick={() => { setGameState('PLAYING'); beginBackendSession(); }} className="ar-btn-primary">
                                            <Play size={16} /> Start Game
                                        </button>
                                    </div>
                                </div>
                            )}
                            {gameState === 'GAME_OVER' && (
                                <div className="ar-modal-overlay-inline">
                                    <h2 className="ar-modal-title">💔 Game Over</h2>
                                    <p className="ar-modal-fee">Earned: <span className="ar-coin-val">+{coinsEarned} Z Coins</span></p>
                                    <div className="ar-modal-actions">
                                        <button onClick={resetGame} className="ar-btn-primary">
                                            <RotateCcw size={16} /> Play Again
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="ar-hint">Use Arrow Keys to move</p>
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
                    .ar-subtitle { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; max-width: 480px; margin: 0 auto; }
                    .ar-status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(142,68,173,0.14); border-radius: 14px; padding: 0.75rem 1.2rem; backdrop-filter: blur(8px); box-shadow: 0 4px 14px rgba(142,68,173,0.06); }
                    .ar-stat-label { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                    .ar-stat-val { font-size: 1.3rem; font-weight: 800; color: #8e44ad; }
                    .ar-restart-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(142,68,173,0.06); border: 1px solid rgba(142,68,173,0.18); color: var(--accent-primary); padding: 0.5rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; font-family: var(--font-ui); cursor: pointer; transition: all 0.2s; }
                    .ar-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }
                    .ar-board-wrap { background: rgba(255,255,255,0.9); border: 1px solid rgba(142,68,173,0.14); border-radius: 20px; padding: 1rem; box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
                    .ar-game-canvas { width: 100%; height: auto; border-radius: 12px; display: block; }
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

export default Pacman;