import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const TicTacToe = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const { refreshBalance } = useGame();
    const [winner, setWinner] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Start backend session on mount
    useEffect(() => {
        const begin = async () => {
            try {
                const { session } = await startSession('tic-tac-toe');
                sessionIdRef.current = session._id;
            } catch (err) {
                console.error('Could not start session:', err);
                sessionIdRef.current = null;
            }
        };
        begin();
    }, []);

    // End backend session (pure win/loss, no skill bonus)
    const finishBackendSession = async (result) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const res = await endSession(sessionIdRef.current, {
                result,
                score: result === 'win' ? 1 : 0,
                finalState: { board }
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

    // Background canvas animation
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const shapes = Array.from({ length: 20 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 30 + 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.02,
            isX: Math.random() > 0.5
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
                ctx.lineWidth = 2;

                if (s.isX) {
                    ctx.strokeStyle = 'rgba(142,68,173,0.1)';
                    ctx.beginPath();
                    ctx.moveTo(-s.size / 2, -s.size / 2); ctx.lineTo(s.size / 2, s.size / 2);
                    ctx.moveTo(s.size / 2, -s.size / 2); ctx.lineTo(-s.size / 2, s.size / 2);
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = 'rgba(34,197,94,0.1)';
                    ctx.beginPath();
                    ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    // Smart AI: win > block > center > corners > sides
    const findBestMove = (squares, player) => {
        const opponent = player === 'O' ? 'X' : 'O';
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        // 1. Try to win
        for (const [a, b, c] of lines) {
            const cells = [squares[a], squares[b], squares[c]];
            const playerCount = cells.filter(x => x === player).length;
            const emptyCount = cells.filter(x => !x).length;
            if (playerCount === 2 && emptyCount === 1) {
                if (!squares[a]) return a;
                if (!squares[b]) return b;
                if (!squares[c]) return c;
            }
        }

        // 2. Block opponent from winning
        for (const [a, b, c] of lines) {
            const cells = [squares[a], squares[b], squares[c]];
            const oppCount = cells.filter(x => x === opponent).length;
            const emptyCount = cells.filter(x => !x).length;
            if (oppCount === 2 && emptyCount === 1) {
                if (!squares[a]) return a;
                if (!squares[b]) return b;
                if (!squares[c]) return c;
            }
        }

        // 3. Take center
        if (!squares[4]) return 4;

        // 4. Take a corner
        const corners = [0, 2, 6, 8].filter(i => !squares[i]);
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

        // 5. Take any side
        const sides = [1, 3, 5, 7].filter(i => !squares[i]);
        if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];

        return null;
    };

    // Computer makes its move after a short delay
    useEffect(() => {
        if (isPlayerTurn || winner) return;
        const timeout = setTimeout(() => {
            const move = findBestMove(board, 'O');
            if (move !== null) {
                const newBoard = board.slice();
                newBoard[move] = 'O';
                setBoard(newBoard);
                setIsPlayerTurn(true);

                const win = calculateWinner(newBoard);
                if (win === 'O') {
                    setWinner('O');
                    finishBackendSession('loss');
                } else if (!newBoard.includes(null)) {
                    setWinner('Draw');
                    finishBackendSession('draw');
                }
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [isPlayerTurn, board, winner]);

    const handleClick = (i) => {
        if (winner || board[i] || !isPlayerTurn) return;
        const newBoard = board.slice();
        newBoard[i] = 'X';
        setBoard(newBoard);

        const win = calculateWinner(newBoard);
        if (win === 'X') {
            setWinner('X');
            finishBackendSession('win');
            return;
        } else if (!newBoard.includes(null)) {
            setWinner('Draw');
            finishBackendSession('draw');
            return;
        }
        setIsPlayerTurn(false);
    };

    const reset = async () => {
        setBoard(Array(9).fill(null));
        setIsPlayerTurn(true);
        setWinner(null);
        setCoinsEarned(0);
        try {
            const { session } = await startSession('tic-tac-toe');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    const statusText = winner
        ? (winner === 'Draw'
            ? "It's a Draw!"
            : winner === 'X' ? 'You Win! 🎉' : 'Computer Wins!')
        : (isPlayerTurn ? 'Your Turn (X)' : 'Computer Thinking...');

    return (
        <Layout>
            <div className="ttt-root">
                <canvas ref={bgCanvasRef} className="ttt-bg-canvas" />
                <div className="ttt-blob ttt-blob-1" />
                <div className="ttt-blob ttt-blob-2" />

                <div className="ttt-inner">
                    <div className="ttt-page-header">
                        <h1 className="ttt-title">
                            <span className="ttt-title-dark">Tic</span>
                            <span className="ttt-title-purple"> Tac</span>
                            <span className="ttt-title-green"> Toe.</span>
                        </h1>
                        <p className="ttt-subtitle">You're X. Beat the computer to earn coins!</p>
                    </div>

                    <div className="ttt-status-row">
                        <div className="ttt-status">{statusText}</div>
                        <button className="ttt-restart-btn" onClick={reset}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="ttt-board-wrap">
                        <div className="ttt-board">
                            {board.map((cell, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleClick(i)}
                                    className={`ttt-cell ${cell ? 'filled' : ''} ${!cell && !winner && isPlayerTurn ? 'playable' : ''}`}
                                    data-value={cell}
                                    disabled={!!winner || !!cell || !isPlayerTurn}
                                >
                                    {cell}
                                </button>
                            ))}
                        </div>
                    </div>

                    {winner && (
                        <div className="ttt-modal-overlay">
                            <div className="ttt-modal-content">
                                <h2>
                                    {winner === 'Draw'
                                        ? "It's a Draw!"
                                        : winner === 'X' ? '🎉 You Win!' : '💔 Computer Wins'}
                                </h2>
                                <p className="ttt-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={reset} className="ttt-btn-primary">
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
    .ttt-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .ttt-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .ttt-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .ttt-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .ttt-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .ttt-inner {
        position: relative; z-index: 1;
        max-width: 600px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .ttt-page-header { margin-bottom: 2rem; text-align: center; }
    .ttt-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .ttt-title-dark { color: var(--text-primary); }
    .ttt-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ttt-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ttt-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0.4rem auto 0;
    }

    .ttt-status-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 2rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 14px;
        padding: 0.75rem 1.2rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(142,68,173,0.06);
    }
    .ttt-status {
        font-family: var(--font-ui);
        font-size: 1.2rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0;
    }
    .ttt-restart-btn {
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
    .ttt-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }

    .ttt-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
    }

    .ttt-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .ttt-cell {
        aspect-ratio: 1;
        border: 2px solid rgba(142,68,173,0.15);
        background: rgba(255,255,255,0.5);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 4rem; font-family: var(--font-ui); font-weight: 900;
        cursor: default;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 4px 10px rgba(0,0,0,0.02);
    }
    .ttt-cell.playable { cursor: pointer; }
    .ttt-cell.playable:hover {
        background: white;
        border-color: rgba(142,68,173,0.4);
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(142,68,173,0.1);
    }
    .ttt-cell.filled {
        animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .ttt-cell[data-value="X"] { color: #8e44ad; }
    .ttt-cell[data-value="O"] { color: #22c55e; }

    @keyframes popIn {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }

    .ttt-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .ttt-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .ttt-modal-content h2 { font-size: 2.5rem; margin: 0 0 1rem; color: var(--text-primary); }
    .ttt-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }

    .ttt-btn-primary {
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(142,68,173,0.3);
    }
    .ttt-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(142,68,173,0.4); }

    @media (max-width: 640px) {
        .ttt-inner { padding: 2rem 1.25rem 3rem; }
        .ttt-board { gap: 0.5rem; }
        .ttt-cell { font-size: 3rem; border-radius: 12px; }
    }
`;

export default TicTacToe;