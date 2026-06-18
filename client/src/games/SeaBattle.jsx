import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { RotateCcw } from 'lucide-react';

const GRID_SIZE = 10;

const SeaBattle = () => {
    const { refreshBalance } = useGame();
    const [userGrid, setUserGrid] = useState(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null)));
    const [aiGrid, setAiGrid] = useState(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null)));
    const [aiShips, setAiShips] = useState([]);
    const [isSearching, setIsSearching] = useState(true);
    const [turn, setTurn] = useState('user');
    const [status, setStatus] = useState("Your turn! Target the enemy grid.");
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('sea-battle');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

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
                finalState: { userGrid, aiGrid }
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
        let angle = 0;

        const draw = () => {
            let W = canvas.width = window.innerWidth;
            let H = canvas.height = window.innerHeight;
            let cx = W / 2, cy = H / 2;
            let radius = Math.max(W, H);

            ctx.clearRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
            for (let i = 0; i < H; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, 0, 0.2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
            ctx.fill();
            ctx.lineTo(0, 0);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.stroke();
            ctx.restore();

            angle += 0.02;
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => cancelAnimationFrame(animId);
    }, []);

    useEffect(() => {
        initGame();
        const timer = setTimeout(() => setIsSearching(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const initGame = async () => {
        const ships = generateShips();
        setAiShips(ships);
        setAiGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null)));
        setUserGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null)));
        setGameOver(false);
        setWinner(null);
        setCoinsEarned(0);
        setTurn('user');
        setStatus("Your turn! Target the enemy grid.");
        await beginBackendSession();
    };

    const generateShips = () => {
        const ships = [];
        const lengths = [5, 4, 3, 3, 2];
        const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false));

        lengths.forEach(len => {
            let placed = false;
            while (!placed) {
                const horizontal = Math.random() > 0.5;
                const r = Math.floor(Math.random() * (horizontal ? GRID_SIZE : GRID_SIZE - len));
                const c = Math.floor(Math.random() * (horizontal ? GRID_SIZE - len : GRID_SIZE));
                let conflict = false;
                for (let i = 0; i < len; i++) {
                    if (grid[horizontal ? r : r + i][horizontal ? c + i : c]) conflict = true;
                }
                if (!conflict) {
                    const positions = [];
                    for (let i = 0; i < len; i++) {
                        const rr = horizontal ? r : r + i;
                        const cc = horizontal ? c + i : c;
                        grid[rr][cc] = true;
                        positions.push({ r: rr, c: cc });
                    }
                    ships.push({ positions, hits: 0 });
                    placed = true;
                }
            }
        });
        return ships;
    };

    const handleAttack = (r, c) => {
        if (turn !== 'user' || gameOver || isSearching || aiGrid[r][c] !== null) return;
        const newGrid = aiGrid.map(row => [...row]);
        const hit = aiShips.some(ship => ship.positions.some(pos => pos.r === r && pos.c === c));
        newGrid[r][c] = hit ? 'hit' : 'miss';
        setAiGrid(newGrid);

        if (hit) {
            setStatus("Direct hit! Fire again.");
            checkWin(newGrid, 'user');
        } else {
            setStatus("Miss! Enemy is returning fire...");
            setTurn('ai');
            setTimeout(aiMove, 1000);
        }
    };

    const aiMove = () => {
        let r, c;
        do {
            r = Math.floor(Math.random() * GRID_SIZE);
            c = Math.floor(Math.random() * GRID_SIZE);
        } while (userGrid[r][c] !== null);

        const newGrid = userGrid.map(row => [...row]);
        const hit = Math.random() > 0.8;
        newGrid[r][c] = hit ? 'hit' : 'miss';
        setUserGrid(newGrid);

        if (hit) {
            setStatus("Enemy hit your ship!");
            checkWin(newGrid, 'ai');
            setTimeout(aiMove, 1000);
        } else {
            setStatus("Enemy missed! Your turn.");
            setTurn('user');
        }
    };

    const checkWin = (grid, player) => {
        let hits = 0;
        grid.forEach(row => row.forEach(cell => { if (cell === 'hit') hits++; }));
        if (hits >= 17) {
            setGameOver(true);
            const didWin = player === 'user';
            setWinner(didWin ? 'player' : 'cpu');
            setStatus(didWin ? "🎉 Victory! You sank the entire fleet!" : "💔 Defeat! Your fleet is destroyed.");
            finishBackendSession(didWin);
        }
    };

    return (
        <Layout>
            <div className="sb-root">
                <canvas ref={bgCanvasRef} className="sb-bg-canvas" />
                <div className="sb-blob sb-blob-1" />
                <div className="sb-blob sb-blob-2" />

                <div className="sb-inner">
                    <div className="sb-page-header">
                        <h1 className="sb-title">
                            <span className="sb-title-dark">Sea</span>
                            <span className="sb-title-blue"> Battle.</span>
                            <span className="sb-title-red"> Tactical.</span>
                        </h1>
                    </div>

                    <div className="sb-status-row">
                        <div className="sb-status">
                            {isSearching ? "Establishing Satellite Connection..." : status}
                        </div>
                        <button className="sb-restart-btn" onClick={initGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="sb-board-wrap">
                        <div className="sb-grid-container">
                            <div className="sb-grid-section">
                                <h2 className="sb-grid-title">ENEMY FLEET</h2>
                                <div className="sb-grid">
                                    {aiGrid.map((row, r) => row.map((cell, c) => (
                                        <div
                                            key={`ai-${r}-${c}`}
                                            onClick={() => handleAttack(r, c)}
                                            className={`sb-cell ${turn === 'user' && !gameOver && cell === null ? 'sb-cell-targetable' : ''}`}
                                            data-status={cell}
                                        >
                                            {cell === 'hit' && '💥'}
                                            {cell === 'miss' && '💧'}
                                        </div>
                                    )))}
                                </div>
                            </div>

                            <div className="sb-grid-section">
                                <h2 className="sb-grid-title">YOUR FLEET</h2>
                                <div className="sb-grid">
                                    {userGrid.map((row, r) => row.map((cell, c) => (
                                        <div
                                            key={`user-${r}-${c}`}
                                            className="sb-cell"
                                            data-status={cell}
                                        >
                                            {cell === 'hit' && '💥'}
                                            {cell === 'miss' && '💧'}
                                        </div>
                                    )))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {gameOver && (
                        <div className="sb-modal-overlay">
                            <div className="sb-modal-content">
                                <h2>{winner === 'player' ? '🎉 Victory!' : '💔 Defeat'}</h2>
                                <p className="sb-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={initGame} className="sb-modal-btn">
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
    .sb-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #f0f4ff 0%, #eef2ff 50%, #f8fafc 100%);
    }
    .sb-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .sb-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .sb-blob-1 { width: 500px; height: 500px; background: rgba(59, 130, 246, 0.08); top: -100px; right: -100px; }
    .sb-blob-2 { width: 400px; height: 400px; background: rgba(16, 185, 129, 0.06); bottom: 80px; left: -80px; }

    .sb-inner {
        position: relative; z-index: 1;
        max-width: 1000px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .sb-page-header { margin-bottom: 2rem; text-align: center; }
    .sb-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .sb-title-dark { color: var(--text-primary); }
    .sb-title-blue {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .sb-title-red {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .sb-status-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1.2rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(59, 130, 246, 0.14);
        border-radius: 14px;
        padding: 0.75rem 1.2rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.06);
        gap: 1rem;
        flex-wrap: wrap;
    }
    .sb-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0; flex: 1;
    }
    .sb-restart-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: rgba(59, 130, 246, 0.08);
        border: 1px solid rgba(59, 130, 246, 0.18);
        color: #2563eb;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-weight: 700; font-size: 0.85rem;
        font-family: var(--font-ui);
        cursor: pointer;
        transition: all 0.2s;
    }
    .sb-restart-btn:hover { background: rgba(59, 130, 246, 0.15); transform: translateY(-1px); }

    .sb-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(59, 130, 246, 0.14);
        border-radius: 20px;
        padding: 2.5rem 1.5rem;
        box-shadow: 0 20px 60px rgba(59, 130, 246, 0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        margin-bottom: 2rem;
    }

    .sb-grid-container {
        display: flex; gap: 3rem; flex-wrap: wrap; justify-content: center;
    }
    .sb-grid-section {
        display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .sb-grid-title {
        font-family: var(--font-ui);
        font-size: 1.2rem; font-weight: 800; color: var(--text-secondary);
        margin: 0; letter-spacing: 1px;
    }

    .sb-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 2px;
        background: rgba(59, 130, 246, 0.1);
        padding: 4px;
        border-radius: 8px;
        border: 2px solid rgba(59, 130, 246, 0.2);
    }

    .sb-cell {
        width: clamp(25px, 6vw, 38px);
        height: clamp(25px, 6vw, 38px);
        background: rgba(15, 23, 42, 0.8);
        border-radius: 2px;
        display: flex; align-items: center; justify-content: center;
        font-size: clamp(0.9rem, 2.5vw, 1.4rem);
        transition: all 0.15s;
    }
    .sb-cell-targetable { cursor: crosshair; }
    .sb-cell-targetable:hover { background: rgba(59, 130, 246, 0.8); transform: scale(1.05); z-index: 1; }

    .sb-cell[data-status="hit"] {
        background: rgba(239, 68, 68, 0.2);
        animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .sb-cell[data-status="miss"] {
        background: rgba(59, 130, 246, 0.2);
        animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes pop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }

    .sb-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .sb-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .sb-modal-content h2 { font-size: 2.2rem; margin: 0 0 1rem; color: var(--text-primary); }
    .sb-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }
    .sb-modal-btn {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
    .sb-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(59, 130, 246, 0.4); }

    @media (max-width: 768px) {
        .sb-inner { padding: 2rem 1rem 3rem; }
        .sb-grid-container { gap: 2rem; }
        .sb-board-wrap { padding: 1.5rem 1rem; }
    }
`;

export default SeaBattle;