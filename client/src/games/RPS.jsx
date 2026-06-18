import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const CHOICES = [
    { name: 'rock', emoji: '✊' },
    { name: 'paper', emoji: '✋' },
    { name: 'scissors', emoji: '✌️' }
];

const RPS = () => {
    const { refreshBalance } = useGame();
    const [userChoice, setUserChoice] = useState(null);
    const [aiChoice, setAiChoice] = useState(null);
    const [result, setResult] = useState(null);
    const [score, setScore] = useState({ user: 0, ai: 0 });
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [isRolling, setIsRolling] = useState(false);
    const bgCanvasRef = useRef(null);

    // Background animation
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const shapes = Array.from({ length: 30 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 20 + 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            type: Math.floor(Math.random() * 3),
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.05,
            color: CHOICES[Math.floor(Math.random() * 3)].name === 'rock' ? '#ef4444' :
                CHOICES[Math.floor(Math.random() * 3)].name === 'paper' ? '#3b82f6' : '#eab308'
        }));

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            shapes.forEach(s => {
                s.x += s.vx; s.y += s.vy; s.rot += s.vRot;
                if (s.x < -50) s.x = W + 50; if (s.x > W + 50) s.x = -50;
                if (s.y < -50) s.y = H + 50; if (s.y > H + 50) s.y = -50;

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rot);
                ctx.fillStyle = s.color + '22';
                ctx.beginPath();
                if (s.type === 0) {
                    ctx.arc(0, 0, s.size, 0, Math.PI * 2);
                } else if (s.type === 1) {
                    ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
                } else {
                    ctx.moveTo(0, -s.size);
                    ctx.lineTo(s.size, s.size);
                    ctx.lineTo(-s.size, s.size);
                }
                ctx.fill();
                ctx.restore();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const determineWinner = (user, ai) => {
        if (user === ai) return 'draw';
        if (
            (user === 'rock' && ai === 'scissors') ||
            (user === 'paper' && ai === 'rock') ||
            (user === 'scissors' && ai === 'paper')
        ) return 'user';
        return 'ai';
    };

    // Save each round to backend as its own session
    const saveRound = async (outcome, userPick, aiPick) => {
        try {
            const { session } = await startSession('rps');
            if (!session?._id) return 0;

            const result = outcome === 'user' ? 'win' : outcome === 'draw' ? 'draw' : 'loss';
            const res = await endSession(session._id, {
                result,
                score: outcome === 'user' ? 1 : 0,
                finalState: { userPick, aiPick }
            });
            await refreshBalance();
            return res.coinChange || 0;
        } catch (err) {
            console.error('Could not save round:', err);
            return 0;
        }
    };

    const handleChoice = (choice) => {
        if (isRolling) return;
        setIsRolling(true);
        setUserChoice(choice);
        setResult(null);
        setCoinsEarned(0);

        let flashCount = 0;
        const flash = setInterval(() => {
            setAiChoice(CHOICES[Math.floor(Math.random() * 3)]);
            flashCount++;
            if (flashCount > 8) {
                clearInterval(flash);
                const finalAi = CHOICES[Math.floor(Math.random() * 3)];
                setAiChoice(finalAi);
                const outcome = determineWinner(choice.name, finalAi.name);
                setResult(outcome);

                if (outcome === 'user') {
                    setScore(s => ({ ...s, user: s.user + 1 }));
                } else if (outcome === 'ai') {
                    setScore(s => ({ ...s, ai: s.ai + 1 }));
                }

                // Save round to backend, then show earned coins
                saveRound(outcome, choice.name, finalAi.name).then((earned) => {
                    setCoinsEarned(earned);
                });

                setIsRolling(false);
            }
        }, 100);
    };

    const resetGame = () => {
        setUserChoice(null);
        setAiChoice(null);
        setResult(null);
        setScore({ user: 0, ai: 0 });
        setCoinsEarned(0);
    };

    const resultText = {
        user: coinsEarned > 0 ? `🎉 You Win! +${coinsEarned} Z Coins` : '🎉 You Win!',
        ai: '😢 You Lose',
        draw: '🤝 Draw'
    };

    return (
        <Layout>
            <div className="rps-root">
                <canvas ref={bgCanvasRef} className="rps-bg-canvas" />
                <div className="rps-blob rps-blob-1" />
                <div className="rps-blob rps-blob-2" />

                <div className="rps-inner">
                    <div className="rps-page-header">
                        <h1 className="rps-title">
                            <span className="rps-title-dark">Rock Paper</span>
                            <span className="rps-title-purple"> Scissors.</span>
                            <span className="rps-title-green"> Shoot!</span>
                        </h1>
                    </div>

                    <div className="rps-status-row">
                        <div className="rps-status">
                            {result ? (
                                <span style={{ color: result === 'user' ? '#10b981' : result === 'ai' ? '#ef4444' : 'var(--accent-primary)' }}>
                                    {resultText[result]}
                                </span>
                            ) : "Make your choice!"}
                        </div>
                        <div className="rps-score-chip">
                            <span style={{ color: '#3b82f6' }}>You: {score.user}</span>
                            <span style={{ color: '#444' }}>|</span>
                            <span style={{ color: '#ef4444' }}>Computer: {score.ai}</span>
                        </div>
                        {(score.user > 0 || score.ai > 0) && (
                            <button className="rps-restart-btn" onClick={resetGame}>
                                <RotateCcw size={15} /> Reset
                            </button>
                        )}
                    </div>

                    <div className="rps-board-wrap">
                        <div className="rps-arena">
                            <div className={`rps-player-box ${isRolling ? 'rps-shake' : ''}`}>
                                <div className="rps-emoji">{userChoice?.emoji || '❓'}</div>
                                <div className="rps-label">You</div>
                            </div>

                            <div className="rps-vs">VS</div>

                            <div className={`rps-player-box ${isRolling ? 'rps-shake' : ''}`}>
                                <div className="rps-emoji">{aiChoice?.emoji || '❓'}</div>
                                <div className="rps-label">Computer</div>
                            </div>
                        </div>

                        <div className="rps-controls">
                            {CHOICES.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => handleChoice(c)}
                                    disabled={isRolling}
                                    className={`rps-choice-btn ${isRolling ? 'disabled' : ''}`}
                                >
                                    <span className="rps-btn-emoji">{c.emoji}</span>
                                    <span className="rps-btn-label">{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

const styles = `
    .rps-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .rps-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .rps-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .rps-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .rps-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .rps-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .rps-page-header { margin-bottom: 2rem; text-align: center; }
    .rps-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .rps-title-dark { color: var(--text-primary); }
    .rps-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .rps-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .rps-status-row {
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
    .rps-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0; flex: 1;
    }
    .rps-score-chip {
        display: flex; gap: 0.5rem;
        font-family: var(--font-ui);
        font-weight: 800; font-size: 1rem;
        background: rgba(0,0,0,0.03);
        padding: 0.3rem 0.8rem; border-radius: 20px;
    }
    .rps-restart-btn {
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
    .rps-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }

    .rps-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 2.5rem 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 3rem;
        margin-bottom: 2rem;
    }

    .rps-arena {
        display: flex; align-items: center; justify-content: center; gap: 3rem;
        width: 100%; max-width: 500px;
    }
    .rps-player-box {
        display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        width: 140px;
    }
    .rps-emoji {
        font-size: 6rem; min-height: 110px;
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15));
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .rps-label {
        font-family: var(--font-ui); font-size: 1.2rem; font-weight: 700;
        color: var(--text-secondary);
        background: rgba(0,0,0,0.05); padding: 0.2rem 1rem; border-radius: 99px;
    }
    .rps-vs {
        font-family: var(--font-ui); font-size: 2.5rem; font-weight: 900;
        color: var(--accent-primary); opacity: 0.8;
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }

    @keyframes shake {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-15px) rotate(-10deg); }
        75% { transform: translateY(5px) rotate(10deg); }
    }
    .rps-shake .rps-emoji { animation: shake 0.3s ease infinite; }

    .rps-controls {
        display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center;
        width: 100%;
    }
    .rps-choice-btn {
        display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        padding: 1.5rem 2rem;
        background: white;
        border: 2px solid rgba(142,68,173,0.15);
        border-radius: 20px;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .rps-choice-btn:hover:not(.disabled) {
        transform: translateY(-8px);
        border-color: rgba(142,68,173,0.4);
        box-shadow: 0 15px 30px rgba(142,68,173,0.15);
    }
    .rps-choice-btn:active:not(.disabled) { transform: translateY(0); }
    .rps-choice-btn.disabled { opacity: 0.6; cursor: not-allowed; }

    .rps-btn-emoji { font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    .rps-btn-label { font-family: var(--font-ui); font-weight: 700; color: var(--text-primary); font-size: 1.1rem; }

    @media (max-width: 640px) {
        .rps-inner { padding: 2rem 1.25rem 3rem; }
        .rps-arena { gap: 1.5rem; }
        .rps-emoji { font-size: 4.5rem; min-height: 80px; }
        .rps-controls { gap: 1rem; }
        .rps-choice-btn { padding: 1rem 1.2rem; }
        .rps-btn-emoji { font-size: 2.5rem; }
    }
`;

export default RPS;