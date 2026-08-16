import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const WIN_SCORE = 5;

const PingPong = () => {
    const { refreshBalance } = useGame();
    const canvasRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    const [score, setScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [gameState, setGameState] = useState('SEARCHING');
    const [winner, setWinner] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const animationIdRef = useRef(null);

    // Refs mirror state so the game loop reads fresh values
    const scoreRef = useRef(0);
    const aiScoreRef = useRef(0);
    const gameStateRef = useRef(gameState);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { aiScoreRef.current = aiScore; }, [aiScore]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Background canvas
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const dots = Array.from({ length: 45 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            color: Math.random() > 0.5 ? '#8e44ad' : '#ef4444',
        }));

        const draw = () => {
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
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const ball = useRef({ x: 300, y: 200, dx: 4, dy: 4, radius: 8 });
    const paddleWidth = 10, paddleHeight = 80;
    const player = useRef({ x: 0, y: 160 });
    const ai = useRef({ x: 590, y: 160 });

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('ping-pong');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session
    const finishBackendSession = async (didWin, finalPlayerScore, finalAiScore) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const result = didWin ? 'win' : 'loss';
            const res = await endSession(sessionIdRef.current, {
                result,
                score: finalPlayerScore,
                finalState: { playerScore: finalPlayerScore, aiScore: finalAiScore }
            });
            const earned = res.coinChange || 0;
            setCoinsEarned(earned);
            if (earned > 0) await refreshBalance();
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    useEffect(() => {
        beginBackendSession();
        const timer = setTimeout(() => setGameState('PLAYING'), 2000);
        return () => clearTimeout(timer);
    }, []);

    const endMatch = (playerWon) => {
        setGameState('GAME_OVER');
        setWinner(playerWon ? 'player' : 'ai');
        finishBackendSession(playerWon, scoreRef.current, aiScoreRef.current);
    };

    const update = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        const b = ball.current;
        const p = player.current;
        const a = ai.current;

        b.x += b.dx;
        b.y += b.dy;

        const aiSpeed = 5;
const deadzone = 8;

// Only react if ball is moving toward AI (saves CPU and looks more natural)
let targetY;
if (b.dx > 0) {
    // Ball coming at AI — predict where it'll be at paddle's x
    const framesToReach = (a.x - b.x) / b.dx;
    targetY = b.y + b.dy * framesToReach;
    // Clamp prediction to court (account for bounces)
    while (targetY < 0 || targetY > 400) {
        if (targetY < 0) targetY = -targetY;
        if (targetY > 400) targetY = 800 - targetY;
    }
} else {
    // Ball moving away — drift toward center
    targetY = 200;
}

const aiCenter = a.y + paddleHeight / 2;
const dy = targetY - aiCenter;
if (Math.abs(dy) > deadzone) {
    a.y += Math.sign(dy) * aiSpeed;
}
a.y = Math.max(0, Math.min(400 - paddleHeight, a.y));

        if (b.y + b.radius > 400 || b.y - b.radius < 0) b.dy *= -1;

        if (b.x - b.radius < p.x + paddleWidth && b.y > p.y && b.y < p.y + paddleHeight) {
            b.dx = Math.abs(b.dx) + 0.2;
            b.dy += (b.y - (p.y + paddleHeight / 2)) * 0.1;
        }
        if (b.x + b.radius > a.x && b.y > a.y && b.y < a.y + paddleHeight) {
            b.dx = -Math.abs(b.dx) - 0.2;
            b.dy += (b.y - (a.y + paddleHeight / 2)) * 0.1;
        }

        if (b.x < 0) {
            const newAiScore = aiScoreRef.current + 1;
            setAiScore(newAiScore);
            if (newAiScore >= WIN_SCORE) {
                endMatch(false);
                return;
            }
            resetBall();
        }
        if (b.x > 600) {
            const newScore = scoreRef.current + 1;
            setScore(newScore);
            if (newScore >= WIN_SCORE) {
                endMatch(true);
                return;
            }
            resetBall();
        }
    };

    const resetBall = () => {
        ball.current = { x: 300, y: 200, dx: Math.random() > 0.5 ? 4 : -4, dy: (Math.random() - 0.5) * 6, radius: 8 };
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 600, 400);

        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(300, 0);
        ctx.lineTo(300, 400);
        ctx.stroke();

        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(player.current.x, player.current.y, paddleWidth, paddleHeight);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ai.current.x, ai.current.y, paddleWidth, paddleHeight);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
        ctx.fill();

        if (gameStateRef.current === 'SEARCHING') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, 600, 400);
            ctx.fillStyle = '#fff';
            ctx.font = '20px Aldrich';
            ctx.textAlign = 'center';
            ctx.fillText('Finding Opponent...', 300, 200);
        }
    };

    // Game loop runs ONCE for component lifetime (no deps)
    useEffect(() => {
        const loop = () => {
            update();
            draw();
            animationIdRef.current = requestAnimationFrame(loop);
        };
        animationIdRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationIdRef.current);
    }, []);

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (400 / rect.height);
        player.current.y = Math.max(0, Math.min(320, y - paddleHeight / 2));
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const y = (touch.clientY - rect.top) * (400 / rect.height);
        player.current.y = Math.max(0, Math.min(320, y - paddleHeight / 2));
    };

    const resetGame = async () => {
        setScore(0);
        setAiScore(0);
        setWinner(null);
        setCoinsEarned(0);
        setGameState('SEARCHING');
        player.current = { x: 0, y: 160 };
        ai.current = { x: 590, y: 160 };
        resetBall();
        await beginBackendSession();
        setTimeout(() => setGameState('PLAYING'), 2000);
    };

    return (
        <Layout>
            <div className="pp-root">
                <canvas ref={bgCanvasRef} className="pp-bg-canvas" />
                <div className="pp-blob pp-blob-1" />
                <div className="pp-blob pp-blob-2" />

                <div className="pp-inner">
                    <div className="pp-page-header">
                        <h1 className="pp-title">
                            <span className="pp-title-dark">Neon</span>
                            <span className="pp-title-purple"> Ping Pong.</span>
                            <span className="pp-title-green"> Fast Paced.</span>
                        </h1>
                        <p className="pp-subtitle">First to {WIN_SCORE} points wins!</p>
                    </div>

                    <div className="pp-status-row">
                        <div className="pp-status">
                            {gameState === 'SEARCHING' ? 'Finding Match...' :
                             gameState === 'GAME_OVER' ? (winner === 'player' ? '🎉 You Win!' : '💔 Computer Wins') :
                             `First to ${WIN_SCORE} wins!`}
                        </div>
                        <div className="pp-score-chip">
                            <span style={{color: '#8e44ad'}}>You: {score}</span>
                            <span style={{color: '#444'}}>|</span>
                            <span style={{color: '#ef4444'}}>Computer: {aiScore}</span>
                        </div>
                        <button className="pp-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="pp-board-wrap">
                        <canvas
                            ref={canvasRef}
                            width="600"
                            height="400"
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleTouchMove}
                            className="pp-arena-canvas"
                        />
                        <p className="pp-instructions">Move mouse or drag finger to control your paddle</p>
                    </div>

                    {gameState === 'GAME_OVER' && (
                        <div className="pp-modal-overlay">
                            <div className="pp-modal-content">
                                <h2>{winner === 'player' ? '🎉 You Win!' : '💔 Computer Wins'}</h2>
                                <p className="pp-final-score">{score} – {aiScore}</p>
                                <p className="pp-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={resetGame} className="pp-modal-btn">
                                    Play Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

const styles = `
    .pp-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .pp-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .pp-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .pp-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .pp-blob-2 { width: 400px; height: 400px; background: rgba(239, 68, 68, 0.06); bottom: 80px; left: -80px; }

    .pp-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .pp-page-header { margin-bottom: 2rem; text-align: center; }
    .pp-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .pp-title-dark { color: var(--text-primary); }
    .pp-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .pp-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .pp-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0.4rem auto 0;
    }

    .pp-status-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1.2rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 14px;
        padding: 0.75rem 1.2rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(142,68,173,0.06);
        gap: 1rem;
        flex-wrap: wrap;
    }
    .pp-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0; flex: 1;
    }
    .pp-score-chip {
        display: flex; gap: 0.5rem;
        font-family: var(--font-ui);
        font-weight: 800; font-size: 1rem;
        background: rgba(0,0,0,0.03);
        padding: 0.3rem 0.8rem; border-radius: 20px;
    }
    .pp-restart-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: rgba(142,68,173,0.06);
        border: 1px solid rgba(142,68,173,0.18);
        color: var(--accent-primary);
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-weight: 700; font-size: 0.85rem;
        font-family: var(--font-ui);
        cursor: pointer;
        transition: all 0.2s;
    }
    .pp-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }

    .pp-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 2.5rem 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .pp-arena-canvas {
        background: #1a1a2e;
        border: 6px solid #333;
        border-radius: 12px;
        cursor: crosshair;
        width: 100%; max-width: 600px; height: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        touch-action: none;
    }

    .pp-instructions {
        font-family: var(--font-ui);
        color: var(--text-secondary);
        font-size: 1rem; margin: 0;
        font-weight: 500;
        text-align: center;
    }

    .pp-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .pp-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .pp-modal-content h2 { font-size: 2.2rem; margin: 0 0 1rem; color: var(--text-primary); }
    .pp-final-score { font-size: 1.8rem; font-weight: 900; color: var(--accent-primary); margin: 0.5rem 0 1rem; }
    .pp-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }
    .pp-modal-btn {
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(142,68,173,0.3);
    }
    .pp-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(142,68,173,0.4); }

    @media (max-width: 640px) {
        .pp-inner { padding: 2rem 1.25rem 3rem; }
    }
`;

export default PingPong;