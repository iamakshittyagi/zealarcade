import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const HandSlap = () => {
    const { updateBalance, refreshBalance } = useGame();
    const [gameState, setGameState] = useState('IDLE');
    const [score, setScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [isSearching, setIsSearching] = useState(true);
    const [handPos, setHandPos] = useState({ user: 'base', ai: 'base' });
    const [status, setStatus] = useState("Wait for the right moment...");
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('hand-slap');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session with A1 reward (skill bonus per slap)
    const finishBackendSession = async (playerScore, opponentScore) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const result = playerScore > opponentScore ? 'win' : 'loss';
            const res = await endSession(sessionIdRef.current, {
                result,
                score: playerScore,
                finalState: { playerSlaps: playerScore, aiSlaps: opponentScore }
            });

            // Skill bonus: 2 coins per slap landed, capped at +20
            const skillBonus = result === 'win' ? Math.min(20, playerScore * 2) : 0;
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

    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const dots = Array.from({ length: 40 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            color: Math.random() > 0.5 ? '#ff4b2b' : '#3b82f6',
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
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(155,89,182,${0.10 * (1 - dist / 100)})`;
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSearching(false);
            setGameState('ATTACKING');
            beginBackendSession();
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const resetGame = () => {
        setScore(0);
        setAiScore(0);
        setCoinsEarned(0);
        setGameState('IDLE');
        setStatus("Wait for the right moment...");
        setHandPos({ user: 'base', ai: 'base' });
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            setGameState('ATTACKING');
            beginBackendSession();
        }, 2000);
    };

    const handleAction = useCallback(() => {
        if (gameState === 'ATTACKING') {
            setHandPos(prev => ({ ...prev, user: 'slap' }));
            setTimeout(() => {
                const aiDodged = Math.random() > 0.4;
                if (aiDodged) {
                    setHandPos(prev => ({ ...prev, ai: 'dodge' }));
                    setStatus("Opponent dodged! You are now defending.");
                    setGameState('DEFENDING');
                } else {
                    setScore(s => s + 1);
                    setStatus("You slapped! Keep attacking.");
                }
                setTimeout(() => setHandPos({ user: 'base', ai: 'base' }), 300);
            }, 100);
        } else if (gameState === 'DEFENDING') {
            setHandPos(prev => ({ ...prev, user: 'dodge' }));
            setTimeout(() => setHandPos(prev => ({ ...prev, user: 'base' })), 300);
        }
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'DEFENDING') {
            const timer = setTimeout(() => {
                setHandPos(prev => ({ ...prev, ai: 'slap' }));
                const userDodged = handPos.user === 'dodge';
                if (userDodged) {
                    setStatus("Great dodge! You are now attacking.");
                    setGameState('ATTACKING');
                } else {
                    const newAiScore = aiScore + 1;
                    setAiScore(newAiScore);
                    setStatus("Ouch! Opponent slapped you.");
                    if (newAiScore >= 5) {
                        setGameState('GAME_OVER');
                        finishBackendSession(score, newAiScore);
                    }
                }
                setTimeout(() => setHandPos({ user: 'base', ai: 'base' }), 300);
            }, Math.random() * 2000 + 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, handPos.user, score, aiScore]);

    return (
        <Layout>
            <div className="hs-root">
                <canvas ref={bgCanvasRef} className="hs-bg-canvas" />
                <div className="hs-blob hs-blob-1" />
                <div className="hs-blob hs-blob-2" />

                <div className="hs-inner">
                    <div className="hs-page-header">
                        <h1 className="hs-title">
                            <span className="hs-title-dark">Hand</span>
                            <span className="hs-title-purple"> Slap.</span>
                            <span className="hs-title-red"> Fast Reflexes.</span>
                        </h1>
                    </div>

                    <div className="hs-status-row">
                        <div className="hs-status">{status}</div>
                        <div className="hs-score-chip">
                            <span style={{ color: '#3b82f6' }}>You: {score}</span>
                            <span style={{ color: '#444' }}>|</span>
                            <span style={{ color: '#ef4444' }}>Computer: {aiScore}</span>
                        </div>
                        <button className="hs-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="hs-board-wrap">
                        <div className="hs-arena">
                            <div className="hs-hand hs-hand-ai" style={{
                                top: handPos.ai === 'slap' ? '30%' : (handPos.ai === 'dodge' ? '-10%' : '10%'),
                                opacity: handPos.ai === 'dodge' ? 0.5 : 1,
                                filter: 'hue-rotate(150deg)'
                            }}>🖐️</div>

                            <div className="hs-hand hs-hand-user" style={{
                                bottom: handPos.user === 'slap' ? '30%' : (handPos.user === 'dodge' ? '-10%' : '10%'),
                                opacity: handPos.user === 'dodge' ? 0.5 : 1
                            }}>🖐️</div>

                            {isSearching && (
                                <div className="hs-searching-overlay">
                                    <div className="hs-spinner" />
                                    Finding an opponent with fast hands...
                                </div>
                            )}
                        </div>

                        <div className="hs-controls">
                            <button
                                onMouseDown={handleAction}
                                onTouchStart={handleAction}
                                className={`hs-action-btn ${gameState === 'ATTACKING' ? 'hs-btn-attack' : 'hs-btn-dodge'}`}
                                disabled={gameState === 'GAME_OVER' || isSearching}
                            >
                                {gameState === 'ATTACKING' ? 'SLAP!' : gameState === 'DEFENDING' ? 'DODGE!' : 'WAIT...'}
                            </button>
                        </div>
                    </div>
                </div>

                {gameState === 'GAME_OVER' && (
                    <div className="hs-modal-overlay">
                        <div className="hs-modal-content">
                            <h2>{score > aiScore ? '🎉 You Win!' : '💔 You Lose'}</h2>
                            <p>You scored {score} slaps. Computer scored {aiScore}.</p>
                            <p className="hs-coin-reward">+{coinsEarned} Z Coins</p>
                            <button onClick={resetGame} className="hs-btn-attack" style={{ marginTop: '1.5rem', padding: '1rem 3rem' }}>
                                Play Again
                            </button>
                        </div>
                    </div>
                )}

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

const styles = `
    .hs-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #fef5f5 50%, #f0f9ff 100%);
    }
    .hs-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .hs-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .hs-blob-1 { width: 500px; height: 500px; background: rgba(255, 75, 43, 0.07); top: -100px; right: -100px; }
    .hs-blob-2 { width: 400px; height: 400px; background: rgba(59, 130, 246, 0.06); bottom: 80px; left: -80px; }

    .hs-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .hs-page-header { margin-bottom: 2rem; text-align: center; }
    .hs-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .hs-title-dark { color: var(--text-primary); }
    .hs-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .hs-title-red {
        background: linear-gradient(135deg, #ff4b2b, #ef4444);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hs-status-row {
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
    .hs-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0; flex: 1;
    }
    .hs-score-chip {
        display: flex; gap: 0.5rem;
        font-family: var(--font-ui);
        font-weight: 800; font-size: 1rem;
        background: rgba(0,0,0,0.03);
        padding: 0.3rem 0.8rem; border-radius: 20px;
    }

    .hs-restart-btn {
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
    .hs-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }

    .hs-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .hs-arena {
        position: relative;
        width: 100%; max-width: 400px; height: 450px;
        background: radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(240,240,245,1) 100%);
        border-radius: 24px;
        border: 2px solid rgba(142,68,173,0.1);
        box-shadow: inset 0 10px 30px rgba(0,0,0,0.05);
        overflow: hidden;
    }

    .hs-hand {
        position: absolute; left: 50%;
        font-size: 7rem;
        transition: all 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
        user-select: none;
        filter: drop-shadow(0 15px 15px rgba(0,0,0,0.2));
    }
    .hs-hand-ai { transform: translateX(-50%); }
    .hs-hand-user { transform: translateX(-50%) scaleY(-1); }

    .hs-searching-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.65);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        backdrop-filter: blur(6px); z-index: 10;
        color: white; font-weight: 600; font-family: var(--font-ui);
    }
    .hs-spinner {
        width: 50px; height: 50px;
        border: 4px solid rgba(255,255,255,0.3);
        border-top-color: #ff4b2b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hs-controls { text-align: center; width: 100%; }
    .hs-action-btn {
        width: 100%; max-width: 350px;
        padding: 1.5rem; font-size: 1.8rem; font-weight: 900;
        border-radius: 20px; border: none; color: white;
        cursor: pointer; font-family: var(--font-ui);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        transition: transform 0.1s, box-shadow 0.1s;
        user-select: none;
    }
    .hs-action-btn:active { transform: translateY(4px); box-shadow: 0 5px 10px rgba(0,0,0,0.2); }
    .hs-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .hs-btn-attack { background: linear-gradient(135deg, #ff4b2b, #ff416c); }
    .hs-btn-dodge { background: linear-gradient(135deg, #3b82f6, #1e3a8a); }

    .hs-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.7);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .hs-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .hs-modal-content h2 { font-size: 2.5rem; margin: 0 0 1rem; color: var(--text-primary); }
    .hs-modal-content p { font-size: 1.2rem; color: var(--text-secondary); margin: 0.5rem 0; }
    .hs-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; }

    @media (max-width: 640px) {
        .hs-inner { padding: 2rem 1.25rem 3rem; }
        .hs-status-row { flex-wrap: wrap; }
    }
`;

export default HandSlap;