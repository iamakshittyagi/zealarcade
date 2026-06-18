import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw, Play } from 'lucide-react';

const FlappyBird = () => {
    const { updateBalance, refreshBalance } = useGame();
    const canvasRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    const [gameState, setGameState] = useState('START');
    const [score, setScore] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('flappyHighScore')) || 0);
    const animationIdRef = useRef(null);

    const birdRef = useRef({ x: 50, y: 150, width: 34, height: 24, gravity: 0.25, velocity: 0, jump: -4.5 });
    const pipesRef = useRef([]);
    const framesRef = useRef(0);

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('flappy-bird');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session with A1 reward (flat + skill bonus)
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
                finalState: { pipesPassed: finalScore }
            });

            // Skill bonus: 1 coin per pipe passed, capped at +25
            const skillBonus = result === 'win' ? Math.min(25, finalScore) : 0;
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
        birdRef.current = { x: 50, y: 150, width: 34, height: 24, gravity: 0.25, velocity: 0, jump: -4.5 };
        pipesRef.current = [];
        framesRef.current = 0;
        setScore(0);
        setCoinsEarned(0);
        setGameState('START');
    };

    const triggerGameOver = (currentScore) => {
        if (gameState === 'GAME_OVER') return;
        setGameState('GAME_OVER');
        if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('flappyHighScore', currentScore);
        }
        finishBackendSession(currentScore);
    };

    const handleInput = () => {
        if (gameState === 'START') {
            setGameState('PLAYING');
            birdRef.current.velocity = birdRef.current.jump;
            beginBackendSession();
        } else if (gameState === 'PLAYING') {
            birdRef.current.velocity = birdRef.current.jump;
        } else if (gameState === 'GAME_OVER') {
            resetGame();
        }
    };

    const update = () => {
        if (gameState !== 'PLAYING') return;
        const bird = birdRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        if (bird.y + bird.height >= canvas.height - 20) {
            bird.y = canvas.height - bird.height - 20;
            triggerGameOver(score);
        }

        if (framesRef.current % 100 === 0) {
            const gap = 120;
            const topPipeHeight = Math.random() * (canvas.height - gap - 60) + 20;
            pipesRef.current.push({
                x: canvas.width,
                top: topPipeHeight,
                bottom: canvas.height - (topPipeHeight + gap),
                passed: false
            });
        }

        for (let i = 0; i < pipesRef.current.length; i++) {
            const p = pipesRef.current[i];
            p.x -= 2;
            if (bird.x + bird.width > p.x && bird.x < p.x + 50 &&
                (bird.y < p.top || bird.y + bird.height > canvas.height - p.bottom)) {
                triggerGameOver(score);
            }
            if (p.x + 50 < bird.x && !p.passed) {
                setScore(s => s + 1);
                p.passed = true;
            }
            if (p.x + 50 < 0) {
                pipesRef.current.shift();
                i--;
            }
        }
        framesRef.current++;
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4ec0ca';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(100, 100, 30, 0, Math.PI * 2);
        ctx.arc(130, 100, 40, 0, Math.PI * 2);
        ctx.arc(160, 100, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(300, 200, 25, 0, Math.PI * 2);
        ctx.arc(330, 200, 35, 0, Math.PI * 2);
        ctx.arc(360, 200, 25, 0, Math.PI * 2);
        ctx.fill();

        pipesRef.current.forEach(p => {
            ctx.fillStyle = '#73bf2e';
            ctx.strokeStyle = '#558022';
            ctx.lineWidth = 3;
            ctx.fillRect(p.x, 0, 50, p.top);
            ctx.strokeRect(p.x, 0, 50, p.top);
            ctx.fillRect(p.x - 5, p.top - 20, 60, 20);
            ctx.strokeRect(p.x - 5, p.top - 20, 60, 20);
            ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom);
            ctx.strokeRect(p.x, canvas.height - p.bottom, 50, p.bottom);
            ctx.fillRect(p.x - 5, canvas.height - p.bottom, 60, 20);
            ctx.strokeRect(p.x - 5, canvas.height - p.bottom, 60, 20);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(p.x + 5, 0, 10, p.top);
            ctx.fillRect(p.x + 5, canvas.height - p.bottom, 10, p.bottom);
        });

        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(0, canvas.height - 25, canvas.width, 5);

        const bird = birdRef.current;
        const birdX = bird.x + bird.width / 2;
        const birdY = bird.y + bird.height / 2;

        ctx.save();
        ctx.translate(birdX, birdY);
        ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1)));

        ctx.fillStyle = '#f8d020';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const wingOffset = Math.sin(framesRef.current * 0.3) * 5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-8, wingOffset > 0 ? 0 : -2, 10, 6 + Math.abs(wingOffset), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f03000';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(22, 2);
        ctx.lineTo(12, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (gameState === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
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
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));

        const drawBg = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55';
                ctx.fill();
            });
            dots.forEach((a, i) => {
                dots.slice(i + 1).forEach(b => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                });
            });
            animId = requestAnimationFrame(drawBg);
        };
        drawBg();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    useEffect(() => {
        const loop = () => {
            update();
            draw();
            animationIdRef.current = requestAnimationFrame(loop);
        };
        animationIdRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationIdRef.current);
    }, [gameState, score]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') { e.preventDefault(); handleInput(); }
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
                            <span className="ar-title-dark">Flappy</span>
                            <span className="ar-title-purple"> Bird.</span>
                        </h1>
                        <p className="ar-subtitle">Click or press Space to flap. Don't hit the pipes!</p>
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
                                width="400"
                                height="500"
                                onClick={handleInput}
                                className="ar-game-canvas"
                            />
                            {gameState === 'START' && (
                                <div className="ar-modal-overlay-inline">
                                    <h2 className="ar-modal-title">Ready?</h2>
                                    <div className="ar-modal-actions">
                                        <button onClick={handleInput} className="ar-btn-primary">
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

                    <p className="ar-hint">Click or press Space to jump</p>
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
                    .ar-game-canvas { width: 100%; height: auto; border-radius: 12px; cursor: pointer; display: block; }
                    .ar-modal-overlay-inline { position: absolute; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; gap: 0.75rem; }
                    .ar-modal-title { font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900; color: white; margin: 0; }
                    .ar-modal-fee { color: rgba(255,255,255,0.85); margin: 0; font-size: 1rem; }
                    .ar-modal-balance { color: rgba(255,255,255,0.7); margin: 0.4rem 0; font-size: 1rem; }
                    .ar-coin-val { color: #FFB400; font-weight: 800; }
                    .ar-modal-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
                    .ar-btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #8e44ad, #732d91); color: white; border: none; padding: 0.85rem 1.6rem; border-radius: 999px; font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 20px rgba(142,68,173,0.28); }
                    .ar-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(142,68,173,0.38); }
                    .ar-btn-outline { display: inline-flex; align-items: center; padding: 0.85rem 1.6rem; border-radius: 999px; border: 1.5px solid rgba(142,68,173,0.3); color: var(--accent-primary); background: rgba(142,68,173,0.04); font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; text-decoration: none; transition: all 0.3s; }
                    .ar-btn-outline:hover { background: rgba(142,68,173,0.10); transform: translateY(-2px); }
                    .ar-hint { color: var(--text-secondary); font-size: 0.9rem; text-align: center; margin-top: 1rem; }
                    @media (max-width: 640px) { .ar-inner { padding: 2rem 1.25rem 3rem; } }
                `}</style>
            </div>
        </Layout>
    );
};

export default FlappyBird;