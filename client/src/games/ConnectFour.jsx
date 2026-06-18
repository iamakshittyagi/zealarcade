import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const ROWS = 6;
const COLS = 7;

const ConnectFour = () => {
    const { refreshBalance } = useGame();
    const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState('red');  // red = player, yellow = computer
    const [gameActive, setGameActive] = useState(true);
    const [status, setStatus] = useState("Your Turn (Red)");
    const [winner, setWinner] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Start backend session on mount
    useEffect(() => {
        const begin = async () => {
            try {
                const { session } = await startSession('connect-four');
                sessionIdRef.current = session._id;
            } catch (err) {
                console.error('Could not start session:', err);
                sessionIdRef.current = null;
            }
        };
        begin();
    }, []);

    // End backend session
    const finishBackendSession = async (result, finalBoard) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const res = await endSession(sessionIdRef.current, {
                result,
                score: result === 'win' ? 1 : 0,
                finalState: { board: finalBoard }
            });
            await refreshBalance();
            setCoinsEarned(res.coinChange || 0);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

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

    const checkWin = (grid, r, c) => {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        const player = grid[r][c];
        for (let dir of directions) {
            let count = 1;
            for (let way of dir) {
                let dr = r + way[0];
                let dc = c + way[1];
                while (dr >= 0 && dr < ROWS && dc >= 0 && dc < COLS && grid[dr][dc] === player) {
                    count++;
                    dr += way[0];
                    dc += way[1];
                }
            }
            if (count >= 4) return true;
        }
        return false;
    };

    // Drop a chip in a column, return [newBoard, droppedRow] or [null, -1] if column full
    const dropChip = (grid, c, player) => {
        for (let i = 0; i < ROWS; i++) {
            if (grid[i][c] === null) {
                const newBoard = grid.map(row => [...row]);
                newBoard[i][c] = player;
                return [newBoard, i];
            }
        }
        return [null, -1];
    };

    // Smart AI for computer (yellow): win > block > center-preference
    const findBestColumn = (grid, player) => {
        const opponent = player === 'yellow' ? 'red' : 'yellow';

        // 1. Try to win
        for (let c = 0; c < COLS; c++) {
            const [testBoard, r] = dropChip(grid, c, player);
            if (testBoard && checkWin(testBoard, r, c)) return c;
        }

        // 2. Block opponent's winning move
        for (let c = 0; c < COLS; c++) {
            const [testBoard, r] = dropChip(grid, c, opponent);
            if (testBoard && checkWin(testBoard, r, c)) return c;
        }

        // 3. Prefer center, then nearby cols
        const preference = [3, 2, 4, 1, 5, 0, 6];
        for (const c of preference) {
            if (grid[ROWS - 1][c] === null) return c;
        }
        return null;
    };

    // Computer's turn (yellow)
    useEffect(() => {
        if (currentPlayer !== 'yellow' || winner || !gameActive) return;
        const timeout = setTimeout(() => {
            const aiCol = findBestColumn(board, 'yellow');
            if (aiCol === null) return;
            const [newBoard, droppedRow] = dropChip(board, aiCol, 'yellow');
            if (!newBoard) return;
            setBoard(newBoard);

            if (checkWin(newBoard, droppedRow, aiCol)) {
                setWinner('yellow');
                setGameActive(false);
                setStatus("💔 Computer Wins");
                finishBackendSession('loss', newBoard);
                return;
            }

            const isDraw = newBoard.every(row => row.every(cell => cell !== null));
            if (isDraw) {
                setGameActive(false);
                setStatus("It's a Draw 🤝");
                finishBackendSession('draw', newBoard);
                return;
            }

            setCurrentPlayer('red');
            setStatus("Your Turn (Red)");
        }, 600);
        return () => clearTimeout(timeout);
    }, [currentPlayer, board, winner, gameActive]);

    const handleColumnClick = (c) => {
        if (!gameActive || winner || currentPlayer !== 'red') return;

        const [newBoard, droppedRow] = dropChip(board, c, 'red');
        if (!newBoard) return;
        setBoard(newBoard);

        if (checkWin(newBoard, droppedRow, c)) {
            setWinner('red');
            setGameActive(false);
            setStatus("🎉 You Win!");
            finishBackendSession('win', newBoard);
            return;
        }

        const isDraw = newBoard.every(row => row.every(cell => cell !== null));
        if (isDraw) {
            setGameActive(false);
            setStatus("It's a Draw 🤝");
            finishBackendSession('draw', newBoard);
            return;
        }

        setCurrentPlayer('yellow');
        setStatus("Computer Thinking...");
    };

    const resetGame = async () => {
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
        setCurrentPlayer('red');
        setGameActive(true);
        setStatus("Your Turn (Red)");
        setWinner(null);
        setCoinsEarned(0);
        try {
            const { session } = await startSession('connect-four');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    return (
        <Layout>
            <div className="c4-root">
                <canvas ref={bgCanvasRef} className="c4-bg-canvas" />
                <div className="c4-blob c4-blob-1" />
                <div className="c4-blob c4-blob-2" />

                <div className="c4-inner">
                    <div className="c4-page-header">
                        <h1 className="c4-title">
                            <span className="c4-title-dark">Connect</span>
                            <span className="c4-title-purple"> Four.</span>
                            <span className="c4-title-green"> Line 'em up.</span>
                        </h1>
                        <p className="c4-subtitle">You're Red. Get 4 in a row to beat the computer!</p>
                    </div>

                    <div className="c4-status-row">
                        <div className="c4-status" style={{ color: currentPlayer === 'red' ? '#ef4444' : '#eab308' }}>
                            {status}
                        </div>
                        <button className="c4-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="c4-board-wrap">
                        <div className="c4-board">
                            {Array.from({ length: COLS }).map((_, c) => (
                                <div key={c} onClick={() => handleColumnClick(c)} className="c4-col" style={{ cursor: gameActive && currentPlayer === 'red' ? 'pointer' : 'default' }}>
                                    {Array.from({ length: ROWS }).map((_, r) => {
                                        const chip = board[r][c];
                                        return (
                                            <div key={r} className={`c4-cell ${chip === 'red' ? 'c4-cell-red' : chip === 'yellow' ? 'c4-cell-yellow' : ''}`} />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {winner !== null || (!gameActive && winner === null) ? (
                        <div className="c4-modal-overlay">
                            <div className="c4-modal-content">
                                <h2>
                                    {winner === 'red' ? '🎉 You Win!' :
                                     winner === 'yellow' ? '💔 Computer Wins' :
                                     "It's a Draw 🤝"}
                                </h2>
                                <p className="c4-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={resetGame} className="c4-btn-primary">
                                    Play Again
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

const styles = `
    .c4-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .c4-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .c4-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .c4-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .c4-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .c4-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .c4-page-header { margin-bottom: 2rem; text-align: center; }
    .c4-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .c4-title-dark { color: var(--text-primary); }
    .c4-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .c4-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .c4-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0.4rem auto 0;
    }

    .c4-status-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1.2rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 14px;
        padding: 0.75rem 1.2rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(142,68,173,0.06);
    }
    .c4-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        margin: 0; flex: 1;
    }

    .c4-restart-btn {
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
    .c4-restart-btn:hover {
        background: rgba(142,68,173,0.12);
        transform: translateY(-1px);
    }

    .c4-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .c4-board {
        display: flex; gap: min(2vw, 10px);
        background: linear-gradient(145deg, #1e3a8a, #172554);
        padding: min(3vw, 15px); border-radius: 16px;
        box-shadow: 0 15px 35px rgba(30, 58, 138, 0.3), inset 0 5px 15px rgba(255,255,255,0.1);
        border: 3px solid #3b82f6;
    }
    .c4-col {
        display: flex; flex-direction: column-reverse; gap: min(2vw, 10px);
        cursor: pointer; padding: 5px; border-radius: 40px;
        transition: background 0.2s;
    }
    .c4-col:hover { background: rgba(255, 255, 255, 0.1); }

    .c4-cell {
        width: min(10vw, 50px);
        aspect-ratio: 1;
        border-radius: 50%;
        background-color: #0f071a;
        box-shadow: inset 0 5px 10px rgba(0,0,0,0.5);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .c4-cell-red {
        background: radial-gradient(circle at 30% 30%, #ef4444, #991b1b);
        box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4), inset 0 -5px 10px rgba(0,0,0,0.3);
    }
    .c4-cell-yellow {
        background: radial-gradient(circle at 30% 30%, #eab308, #a16207);
        box-shadow: 0 5px 15px rgba(234, 179, 8, 0.4), inset 0 -5px 10px rgba(0,0,0,0.3);
    }

    .c4-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .c4-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .c4-modal-content h2 { font-size: 2.2rem; margin: 0 0 1rem; color: var(--text-primary); }
    .c4-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }

    .c4-btn-primary {
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(142,68,173,0.3);
    }
    .c4-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(142,68,173,0.4); }

    @media (max-width: 640px) {
        .c4-inner { padding: 2rem 1.25rem 3rem; }
        .c4-board-wrap { padding: 1rem; }
    }
`;

export default ConnectFour;