import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const SNAKES_AND_LADDERS = {
    4: 26, 13: 46, 27: 5, 33: 49, 39: 3, 42: 63, 43: 18, 50: 69,
    54: 31, 62: 81, 66: 45, 74: 92, 89: 51, 95: 75, 99: 41
};

const SnakeLadder = () => {
    const { refreshBalance } = useGame();
    const [playerPos, setPlayerPos] = useState(1);
    const [cpuPos, setCpuPos] = useState(1);
    const [diceValue, setDiceValue] = useState(null);
    const [status, setStatus] = useState("Your turn! Roll the dice.");
    const [isRolling, setIsRolling] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [winner, setWinner] = useState(null);  // 'player' | 'cpu' | null
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

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
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
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
                        ctx.lineWidth = 0.6;
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

    // Start backend session on mount
    useEffect(() => {
        const begin = async () => {
            try {
                const { session } = await startSession('snake-ladder');
                sessionIdRef.current = session._id;
            } catch (err) {
                console.error('Could not start session:', err);
                sessionIdRef.current = null;
            }
        };
        begin();
    }, []);

    // End backend session
    const finishBackendSession = async (didWin) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const result = didWin ? 'win' : 'loss';
            const res = await endSession(sessionIdRef.current, {
                result,
                score: didWin ? 1 : 0,
                finalState: { playerPos, cpuPos }
            });
            await refreshBalance();
            setCoinsEarned(res.coinChange || 0);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    const squares = [];
    let currentNum = 100;
    for (let row = 0; row < 10; row++) {
        let rowArray = [];
        for (let col = 0; col < 10; col++) {
            rowArray.push(currentNum - col);
        }
        if (row % 2 !== 0) rowArray.reverse();
        squares.push(...rowArray);
        currentNum -= 10;
    }

    // Process a roll for a given pawn, returns the final position after snakes/ladders
    const movePawn = (currentPosition, roll) => {
        let next = currentPosition + roll;
        if (next > 100) return currentPosition;  // Can't go over 100
        if (SNAKES_AND_LADDERS[next]) {
            next = SNAKES_AND_LADDERS[next];
        }
        return next;
    };

    const rollDice = () => {
        if (isRolling || isGameOver || !isPlayerTurn) return;
        setIsRolling(true);
        const finalRoll = Math.floor(Math.random() * 6) + 1;

        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 10) {
                clearInterval(interval);
                setDiceValue(finalRoll);
                processPlayerRoll(finalRoll);
            }
        }, 50);
    };

    const processPlayerRoll = (roll) => {
        const nextRaw = playerPos + roll;
        if (nextRaw > 100) {
            setStatus(`You rolled ${roll}. Too high to land on 100. CPU's turn.`);
            setIsRolling(false);
            setIsPlayerTurn(false);
            return;
        }

        setPlayerPos(nextRaw);
        setStatus(`You rolled ${roll}! Moved to ${nextRaw}.`);

        setTimeout(() => {
            const finalPos = SNAKES_AND_LADDERS[nextRaw] || nextRaw;
            if (finalPos !== nextRaw) {
                setPlayerPos(finalPos);
                setStatus(finalPos > nextRaw ? `🪜 Ladder! Climbed to ${finalPos}.` : `🐍 Snake! Slid to ${finalPos}.`);
            }

            if (finalPos === 100) {
                setStatus("🎉 You Win!");
                setWinner('player');
                setIsGameOver(true);
                finishBackendSession(true);
                setIsRolling(false);
                return;
            }

            // CPU's turn
            setIsRolling(false);
            setIsPlayerTurn(false);
        }, 600);
    };

    // CPU automatic turn
    useEffect(() => {
        if (isPlayerTurn || isGameOver) return;

        const cpuRoll = Math.floor(Math.random() * 6) + 1;
        setStatus(`CPU rolling...`);

        const timeout = setTimeout(() => {
            setDiceValue(cpuRoll);
            const nextRaw = cpuPos + cpuRoll;
            if (nextRaw > 100) {
                setStatus(`CPU rolled ${cpuRoll}. Too high. Your turn!`);
                setIsPlayerTurn(true);
                return;
            }

            setCpuPos(nextRaw);
            setStatus(`CPU rolled ${cpuRoll}! Moved to ${nextRaw}.`);

            setTimeout(() => {
                const finalPos = SNAKES_AND_LADDERS[nextRaw] || nextRaw;
                if (finalPos !== nextRaw) {
                    setCpuPos(finalPos);
                    setStatus(finalPos > nextRaw ? `CPU climbed a ladder to ${finalPos}.` : `CPU hit a snake! Slid to ${finalPos}.`);
                }

                if (finalPos === 100) {
                    setStatus("💔 CPU Wins!");
                    setWinner('cpu');
                    setIsGameOver(true);
                    finishBackendSession(false);
                    return;
                }

                // Back to player
                setIsPlayerTurn(true);
                setStatus("Your turn! Roll the dice.");
            }, 600);
        }, 800);

        return () => clearTimeout(timeout);
    }, [isPlayerTurn, isGameOver]);

    const resetGame = async () => {
        setPlayerPos(1);
        setCpuPos(1);
        setDiceValue(null);
        setStatus("Your turn! Roll the dice.");
        setIsGameOver(false);
        setIsPlayerTurn(true);
        setWinner(null);
        setCoinsEarned(0);
        try {
            const { session } = await startSession('snake-ladder');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    const ladderStarts = Object.keys(SNAKES_AND_LADDERS).filter(k => SNAKES_AND_LADDERS[k] > parseInt(k)).map(Number);
    const snakeStarts = Object.keys(SNAKES_AND_LADDERS).filter(k => SNAKES_AND_LADDERS[k] < parseInt(k)).map(Number);

    const renderSVGOverlay = () => {
        return (
            <svg className="sl-svg-overlay" width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                {Object.entries(SNAKES_AND_LADDERS).map(([startStr, end]) => {
                    const start = parseInt(startStr);
                    const isLadder = end > start;

                    const getCoords = (N) => {
                        const row = Math.floor((N - 1) / 10);
                        const col = row % 2 === 0 ? (N - 1) % 10 : 9 - ((N - 1) % 10);
                        return { x: col * 10 + 5, y: (9 - row) * 10 + 5 };
                    };

                    const c1 = getCoords(start);
                    const c2 = getCoords(end);

                    if (isLadder) {
                        return (
                            <g key={`ladder-${start}`}>
                                <line x1={`${c1.x}%`} y1={`${c1.y}%`} x2={`${c2.x}%`} y2={`${c2.y}%`} stroke="#fcd34d" strokeWidth="12" strokeLinecap="round" opacity="0.9" />
                                <line x1={`${c1.x}%`} y1={`${c1.y}%`} x2={`${c2.x}%`} y2={`${c2.y}%`} stroke="#d97706" strokeWidth="12" strokeDasharray="4 8" opacity="0.9" />
                                <text x={`${c1.x}%`} y={`${c1.y}%`} fontSize="18" textAnchor="middle" dominantBaseline="central" dy="12">🪜</text>
                            </g>
                        );
                    } else {
                        const dx = c2.x - c1.x;
                        const dy = c2.y - c1.y;
                        const cx = (c1.x + c2.x) / 2 - dy * 0.25;
                        const cy = (c1.y + c2.y) / 2 + dx * 0.25;

                        return (
                            <g key={`snake-${start}`}>
                                <path d={`M ${c1.x}% ${c1.y}% Q ${cx}% ${cy}% ${c2.x}% ${c2.y}%`} fill="none" stroke="#fca5a5" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
                                <path d={`M ${c1.x}% ${c1.y}% Q ${cx}% ${cy}% ${c2.x}% ${c2.y}%`} fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="6 8" strokeLinecap="round" />
                                <text x={`${c1.x}%`} y={`${c1.y}%`} fontSize="18" textAnchor="middle" dominantBaseline="central" dy="12">🐍</text>
                            </g>
                        );
                    }
                })}
            </svg>
        );
    };

    return (
        <Layout>
            <div className="sl-root">
                <canvas ref={bgCanvasRef} className="sl-bg-canvas" />
                <div className="sl-blob sl-blob-1" />
                <div className="sl-blob sl-blob-2" />

                <div className="sl-inner">
                    <div className="sl-page-header">
                        <h1 className="sl-title">
                            <span className="sl-title-dark">Snake &</span>
                            <span className="sl-title-purple"> Ladder.</span>
                            <span className="sl-title-green"> Race the CPU!</span>
                        </h1>
                        <p className="sl-subtitle">You're 🔴 Red. CPU is 🔵 Blue. First to 100 wins.</p>
                    </div>

                    <div className="sl-status-row">
                        <div className="sl-status">{status}</div>
                        <div className="sl-score-chip">
                            <span style={{ color: '#ff416c' }}>You: {playerPos}</span>
                            <span style={{ color: '#444' }}>|</span>
                            <span style={{ color: '#3b82f6' }}>CPU: {cpuPos}</span>
                        </div>
                        <button className="sl-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="sl-board-wrap">
                        <div className="sl-board">
                            {renderSVGOverlay()}
                            {squares.map((num, i) => {
                                const isEven = (Math.floor(i / 10) + (i % 10)) % 2 === 0;
                                let cellType = '';
                                if (ladderStarts.includes(num)) cellType = 'sl-cell-ladder';
                                if (snakeStarts.includes(num)) cellType = 'sl-cell-snake';

                                return (
                                    <div key={num} className={`sl-cell ${isEven ? 'sl-cell-even' : 'sl-cell-odd'} ${cellType}`}>
                                        <span className="sl-cell-num">{num}</span>
                                        {playerPos === num && <div className="sl-pawn sl-pawn-player" />}
                                        {cpuPos === num && <div className="sl-pawn sl-pawn-cpu" />}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sl-controls">
                            <button
                                onClick={rollDice}
                                disabled={isRolling || isGameOver || !isPlayerTurn}
                                className="sl-roll-btn"
                            >
                                {isGameOver ? 'Game Over' : isPlayerTurn ? 'Roll Dice 🎲' : 'CPU Turn...'}
                            </button>

                            <div className="sl-dice">{diceValue || '–'}</div>
                        </div>
                    </div>

                    {isGameOver && (
                        <div className="sl-modal-overlay">
                            <div className="sl-modal-content">
                                <h2>{winner === 'player' ? '🎉 You Win!' : '💔 CPU Wins'}</h2>
                                <p className="sl-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={resetGame} className="sl-modal-btn">
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
    .sl-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .sl-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .sl-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .sl-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .sl-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .sl-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .sl-page-header { margin-bottom: 2rem; text-align: center; }
    .sl-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .sl-title-dark { color: var(--text-primary); }
    .sl-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .sl-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .sl-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0.4rem auto 0;
    }

    .sl-status-row {
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
    .sl-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0; flex: 1; min-width: 0;
    }
    .sl-score-chip {
        display: flex; gap: 0.5rem;
        font-family: var(--font-ui);
        font-weight: 800; font-size: 1rem;
        background: rgba(0,0,0,0.03);
        padding: 0.3rem 0.8rem; border-radius: 20px;
    }
    .sl-restart-btn {
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
    .sl-restart-btn:hover {
        background: rgba(142,68,173,0.12);
        transform: translateY(-1px);
    }

    .sl-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .sl-board {
        position: relative;
        width: 100%;
        max-width: 520px;
        aspect-ratio: 1;
        background-color: white;
        border: 4px solid var(--accent-primary);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(142,68,173,0.25);
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        grid-template-rows: repeat(10, 1fr);
        overflow: hidden;
    }
    .sl-cell {
        position: relative; display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(0,0,0,0.04);
        gap: 4px;
    }
    .sl-cell-even { background-color: rgba(142,68,173,0.03); }
    .sl-cell-odd { background-color: rgba(255,255,255,0.8); }
    .sl-cell-ladder { background-color: rgba(34,197,94,0.12) !important; }
    .sl-cell-snake { background-color: rgba(239,68,68,0.12) !important; }

    .sl-cell-num {
        position: absolute;
        top: 3px; left: 5px;
        font-size: 0.7rem;
        font-weight: 700;
        color: rgba(0,0,0,0.25);
        font-family: var(--font-ui);
    }

    .sl-pawn {
        position: relative;
        width: 38%; height: 38%;
        border-radius: 50%;
        z-index: 10;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        animation: slPulse 1s infinite;
    }
    .sl-pawn-player {
        background: radial-gradient(circle at 30% 30%, #ff4b2b, #ff416c);
    }
    .sl-pawn-cpu {
        background: radial-gradient(circle at 30% 30%, #3b82f6, #1e3a8a);
    }

    .sl-controls {
        display: flex; align-items: center; justify-content: center;
        gap: 1.5rem; flex-wrap: wrap; width: 100%;
    }
    .sl-roll-btn {
        padding: 0.95rem 2rem;
        background: linear-gradient(135deg, #8e44ad, #732d91);
        color: white; border: none;
        border-radius: 999px;
        font-weight: 700; font-family: var(--font-ui);
        font-size: 1rem; cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 6px 20px rgba(142,68,173,0.28);
    }
    .sl-roll-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(142,68,173,0.38);
    }
    .sl-roll-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .sl-dice {
        width: 64px; height: 64px;
        background: rgba(142,68,173,0.08);
        border: 2px solid var(--accent-primary);
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 2rem; font-weight: 900;
        color: var(--accent-primary);
        font-family: var(--font-ui);
        box-shadow: 0 8px 18px rgba(142,68,173,0.18);
    }

    @keyframes slPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .sl-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .sl-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .sl-modal-content h2 { font-size: 2.2rem; margin: 0 0 1rem; color: var(--text-primary); }
    .sl-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }
    .sl-modal-btn {
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(142,68,173,0.3);
    }
    .sl-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(142,68,173,0.4); }

    @media (max-width: 640px) {
        .sl-inner { padding: 2rem 1.25rem 3rem; }
    }
`;

export default SnakeLadder;