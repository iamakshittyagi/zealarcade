import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import Layout from '../components/Layout';
import { RotateCcw } from 'lucide-react';

const TRACK_COORDS = [
    {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}, {r: 7, c: 6},
    {r: 6, c: 7}, {r: 5, c: 7}, {r: 4, c: 7}, {r: 3, c: 7}, {r: 2, c: 7}, {r: 1, c: 7},
    {r: 1, c: 8}, {r: 1, c: 9},
    {r: 2, c: 9}, {r: 3, c: 9}, {r: 4, c: 9}, {r: 5, c: 9}, {r: 6, c: 9},
    {r: 7, c: 10}, {r: 7, c: 11}, {r: 7, c: 12}, {r: 7, c: 13}, {r: 7, c: 14}, {r: 7, c: 15},
    {r: 8, c: 15}, {r: 9, c: 15},
    {r: 9, c: 14}, {r: 9, c: 13}, {r: 9, c: 12}, {r: 9, c: 11}, {r: 9, c: 10},
    {r: 10, c: 9}, {r: 11, c: 9}, {r: 12, c: 9}, {r: 13, c: 9}, {r: 14, c: 9}, {r: 15, c: 9},
    {r: 15, c: 8}, {r: 15, c: 7},
    {r: 14, c: 7}, {r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7},
    {r: 9, c: 6}, {r: 9, c: 5}, {r: 9, c: 4}, {r: 9, c: 3}, {r: 9, c: 2}, {r: 9, c: 1},
    {r: 8, c: 1}, {r: 7, c: 1}
];

const PATHS = {
    green: TRACK_COORDS.slice(0, 51).concat([{r: 8, c: 2}, {r: 8, c: 3}, {r: 8, c: 4}, {r: 8, c: 5}, {r: 8, c: 6}]),
    yellow: TRACK_COORDS.slice(13, 52).concat(TRACK_COORDS.slice(0, 12)).concat([{r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8}, {r: 6, c: 8}]),
    blue: TRACK_COORDS.slice(26, 52).concat(TRACK_COORDS.slice(0, 25)).concat([{r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}]),
    red: TRACK_COORDS.slice(39, 52).concat(TRACK_COORDS.slice(0, 38)).concat([{r: 14, c: 8}, {r: 13, c: 8}, {r: 12, c: 8}, {r: 11, c: 8}, {r: 10, c: 8}])
};

const BASE_COORDS = {
    red: [{r: 12, c: 3}, {r: 12, c: 4}, {r: 13, c: 3}, {r: 13, c: 4}],
    green: [{r: 3, c: 3}, {r: 3, c: 4}, {r: 4, c: 3}, {r: 4, c: 4}],
    blue: [{r: 12, c: 12}, {r: 12, c: 13}, {r: 13, c: 12}, {r: 13, c: 13}],
    yellow: [{r: 3, c: 12}, {r: 3, c: 13}, {r: 4, c: 12}, {r: 4, c: 13}]
};

const renderBoardCells = () => {
    const cells = [];
    for (let r = 1; r <= 15; r++) {
        for (let c = 1; c <= 15; c++) {
            if (r <= 6 && c <= 6) continue;
            if (r <= 6 && c >= 10) continue;
            if (r >= 10 && c <= 6) continue;
            if (r >= 10 && c >= 10) continue;
            if (r >= 7 && r <= 9 && c >= 7 && c <= 9) continue;

            let cellClass = "lu-cell";
            let content = null;

            if (r === 8 && c >= 2 && c <= 6) cellClass += " bg-green-safe";
            else if (c === 8 && r >= 2 && r <= 6) cellClass += " bg-yellow-safe";
            else if (r === 8 && c >= 10 && c <= 14) cellClass += " bg-blue-safe";
            else if (c === 8 && r >= 10 && r <= 14) cellClass += " bg-red-safe";
            else if (r === 7 && c === 2) { cellClass += " bg-green-safe lu-star-cell"; content = "★"; }
            else if (r === 2 && c === 9) { cellClass += " bg-yellow-safe lu-star-cell"; content = "★"; }
            else if (r === 9 && c === 14) { cellClass += " bg-blue-safe lu-star-cell"; content = "★"; }
            else if (r === 14 && c === 7) { cellClass += " bg-red-safe lu-star-cell"; content = "★"; }

            cells.push(
                <div key={`cell-${r}-${c}`} className={cellClass} style={{ gridArea: `${r} / ${c} / ${r + 1} / ${c + 1}` }}>
                    {content}
                </div>
            );
        }
    }
    return cells;
};

const renderBoardVisuals = () => {
    return (
        <>
            <div className="lu-base bg-green" style={{ gridArea: '1 / 1 / 7 / 7' }} />
            <div className="lu-base-inner" style={{ gridArea: '2 / 2 / 6 / 6' }} />

            <div className="lu-base bg-yellow" style={{ gridArea: '1 / 10 / 7 / 16' }} />
            <div className="lu-base-inner" style={{ gridArea: '2 / 11 / 6 / 15' }} />

            <div className="lu-base bg-blue" style={{ gridArea: '10 / 10 / 16 / 16' }} />
            <div className="lu-base-inner" style={{ gridArea: '11 / 11 / 15 / 15' }} />

            <div className="lu-base bg-red" style={{ gridArea: '10 / 1 / 16 / 7' }} />
            <div className="lu-base-inner" style={{ gridArea: '11 / 2 / 15 / 6' }} />

            {['green', 'yellow', 'blue', 'red'].map(color => (
                BASE_COORDS[color].map((pos, i) => (
                    <div key={`${color}-spot-${i}`} className="lu-base-spot-wrap" style={{ gridArea: `${pos.r} / ${pos.c} / ${pos.r+1} / ${pos.c+1}` }}>
                        <div className={`lu-base-spot bg-${color}`} />
                    </div>
                ))
            ))}

            <div className="lu-center-home" style={{ gridArea: '7 / 7 / 10 / 10' }}>
                <div className="lu-center-t-top bg-yellow" />
                <div className="lu-center-t-right bg-blue" />
                <div className="lu-center-t-bottom bg-red" />
                <div className="lu-center-t-left bg-green" />
            </div>

            {renderBoardCells()}
        </>
    );
};

const initialPlayers = (username) => ([
    { name: username || 'You', color: 'red', isAI: false, pawns: Array(4).fill(null).map(() => ({ pos: -1, finished: false })) },
    { name: 'Green CPU', color: 'green', isAI: true, pawns: Array(4).fill(null).map(() => ({ pos: -1, finished: false })) },
    { name: 'Blue CPU', color: 'blue', isAI: true, pawns: Array(4).fill(null).map(() => ({ pos: -1, finished: false })) },
    { name: 'Yellow CPU', color: 'yellow', isAI: true, pawns: Array(4).fill(null).map(() => ({ pos: -1, finished: false })) },
]);

const Ludo = () => {
    const { user, refreshBalance } = useGame();
    const [players, setPlayers] = useState(() => initialPlayers(user?.username));
    const [currentTurn, setCurrentTurn] = useState(0);
    const [diceValue, setDiceValue] = useState(null);
    const [status, setStatus] = useState("Your turn! Roll the dice 🎲");
    const [isRolling, setIsRolling] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [waitingForChoice, setWaitingForChoice] = useState(false);
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Background particles
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

    // Begin backend session on mount
    useEffect(() => {
        const begin = async () => {
            try {
                const { session } = await startSession('ludo');
                sessionIdRef.current = session._id;
            } catch (err) {
                console.error('Could not start session:', err);
                sessionIdRef.current = null;
            }
        };
        begin();
    }, []);

    // End backend session
    const finishBackendSession = async (didWin, winnerName) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const result = didWin ? 'win' : 'loss';
            const res = await endSession(sessionIdRef.current, {
                result,
                score: didWin ? 1 : 0,
                finalState: { winner: winnerName }
            });
            await refreshBalance();
            setCoinsEarned(res.coinChange || 0);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    const getMovablePawns = (player, roll) => {
        return player.pawns.reduce((acc, pawn, idx) => {
            if (pawn.finished) return acc;
            if (pawn.pos === -1 && roll === 6) acc.push(idx);
            else if (pawn.pos >= 0) {
                if (pawn.pos + roll < PATHS[player.color].length) acc.push(idx);
            }
            return acc;
        }, []);
    };

    const aiChoosePawn = (player, movableIndices, roll) => {
        const finishers = movableIndices.filter(idx => player.pawns[idx].pos + roll === PATHS[player.color].length - 1);
        if (finishers.length > 0) return finishers[0];
        const onTrack = movableIndices.filter(idx => player.pawns[idx].pos >= 0);
        if (onTrack.length > 0) {
            return onTrack.reduce((prev, curr) => (player.pawns[curr].pos > player.pawns[prev].pos ? curr : prev));
        }
        return movableIndices[0];
    };

    // CPU auto-rolls and plays
    useEffect(() => {
        if (isGameOver || isRolling || waitingForChoice) return;
        const p = players[currentTurn];
        if (!p || !p.isAI) return;

        const timeout = setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceValue(roll);
            setStatus(`${p.name} rolled a ${roll}.`);
            const movable = getMovablePawns(p, roll);
            if (movable.length === 0) {
                setTimeout(() => nextTurn(), 800);
            } else {
                const choice = aiChoosePawn(p, movable, roll);
                setTimeout(() => doMovePawn(choice, roll), 600);
            }
        }, 800);

        return () => clearTimeout(timeout);
    }, [currentTurn, isGameOver, isRolling, waitingForChoice, players]);

    const rollDice = () => {
        if (isRolling || isGameOver || waitingForChoice) return;
        if (players[currentTurn].isAI) return;
        setIsRolling(true);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 10) {
                clearInterval(interval);
                setDiceValue(finalRoll);
                processHumanRoll(finalRoll);
            }
        }, 50);
    };

    const processHumanRoll = (roll) => {
        const p = players[currentTurn];
        const movable = getMovablePawns(p, roll);
        if (movable.length === 0) {
            setStatus(`You rolled ${roll}. No moves possible!`);
            setTimeout(() => { nextTurn(); setIsRolling(false); }, 1000);
        } else if (movable.length === 1) {
            doMovePawn(movable[0], roll);
        } else {
            setStatus(`You rolled ${roll}! Choose a pawn to move.`);
            setWaitingForChoice(true);
            setIsRolling(false);
        }
    };

    const doMovePawn = (pawnIdx, roll) => {
        const p = players[currentTurn];
        const newPlayers = players.map((pl, i) => i === currentTurn ? {
            ...pl,
            pawns: pl.pawns.map((pn, j) => {
                if (j !== pawnIdx) return pn;
                const newPos = pn.pos === -1 ? 0 : pn.pos + roll;
                const finished = newPos === PATHS[p.color].length - 1;
                return { pos: newPos, finished };
            })
        } : pl);
        setPlayers(newPlayers);
        setWaitingForChoice(false);

        const updatedPlayer = newPlayers[currentTurn];
        const allFinished = updatedPlayer.pawns.every(pn => pn.finished);

        if (allFinished) {
            setIsGameOver(true);
            setWinner(updatedPlayer);
            setStatus(`${updatedPlayer.name} wins! 🎉`);
            finishBackendSession(!updatedPlayer.isAI, updatedPlayer.name);
            setIsRolling(false);
            return;
        }

        setTimeout(() => {
            if (roll === 6) {
                setStatus(`${p.name} rolled a 6! Roll again 🎲`);
                setIsRolling(false);
            } else {
                nextTurn(newPlayers);
                setIsRolling(false);
            }
        }, 800);
    };

    const nextTurn = (currentPlayers = players) => {
        const nextIdx = (currentTurn + 1) % 4;
        setCurrentTurn(nextIdx);
        const nextPlayer = currentPlayers[nextIdx];
        if (!nextPlayer.isAI) {
            setStatus(`Your turn! Roll the dice 🎲`);
        } else {
            setStatus(`${nextPlayer.name}'s turn...`);
        }
    };

    const handlePawnClick = (pIdx) => {
        if (!waitingForChoice || players[currentTurn].isAI) return;
        const movable = getMovablePawns(players[currentTurn], diceValue);
        if (movable.includes(pIdx)) doMovePawn(pIdx, diceValue);
    };

    const resetGame = async () => {
        setPlayers(initialPlayers(user?.username));
        setCurrentTurn(0);
        setDiceValue(null);
        setStatus("Your turn! Roll the dice 🎲");
        setIsGameOver(false);
        setWinner(null);
        setCoinsEarned(0);
        setWaitingForChoice(false);
        try {
            const { session } = await startSession('ludo');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    const getTokenStyle = (color) => {
        switch (color) {
            case 'red': return 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b)';
            case 'green': return 'radial-gradient(circle at 30% 30%, #22c55e, #14532d)';
            case 'yellow': return 'radial-gradient(circle at 30% 30%, #eab308, #713f12)';
            case 'blue': return 'radial-gradient(circle at 30% 30%, #3b82f6, #1e3a8a)';
            default: return 'white';
        }
    };

    return (
        <Layout>
            <div className="lu-root">
                <canvas ref={bgCanvasRef} className="lu-bg-canvas" />
                <div className="lu-blob lu-blob-1" />
                <div className="lu-blob lu-blob-2" />

                <div className="lu-inner">
                    <div className="lu-page-header">
                        <h1 className="lu-title">
                            <span className="lu-title-dark">Ludo.</span>
                            <span className="lu-title-purple"> Roll.</span>
                            <span className="lu-title-green"> Race. Win.</span>
                        </h1>
                        <p className="lu-subtitle">You're 🔴 Red vs 3 computer opponents. First to finish all 4 pawns wins.</p>
                    </div>

                    <div className="lu-status-row">
                        <div className="lu-status" style={{
                            color: players[currentTurn] ? (
                                players[currentTurn].color === 'red' ? '#ef4444' :
                                players[currentTurn].color === 'green' ? '#22c55e' :
                                players[currentTurn].color === 'yellow' ? '#eab308' : '#3b82f6'
                            ) : 'var(--text-primary)'
                        }}>{status}</div>
                        <button className="lu-restart-btn" onClick={resetGame}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="lu-board-wrap">
                        <div className="lu-board">
                            {renderBoardVisuals()}
                            {players.map((player, pIdx) => (
                                player.pawns.map((pawn, pnIdx) => {
                                    const coord = pawn.pos === -1
                                        ? BASE_COORDS[player.color][pnIdx]
                                        : (PATHS[player.color] ? PATHS[player.color][pawn.pos] : null);
                                    if (!coord) return null;
                                    const isMovable = waitingForChoice && currentTurn === pIdx && !player.isAI &&
                                        getMovablePawns(player, diceValue).includes(pnIdx);
                                    return (
                                        <div
                                            key={`${player.color}-${pnIdx}`}
                                            onClick={() => handlePawnClick(pnIdx)}
                                            className="lu-pawn-wrap"
                                            style={{
                                                gridArea: `${coord.r} / ${coord.c} / ${coord.r + 1} / ${coord.c + 1}`,
                                                zIndex: 10 + pnIdx + (pIdx * 4),
                                                cursor: isMovable ? 'pointer' : 'default'
                                            }}
                                        >
                                            <div
                                                className={`lu-pawn ${isMovable ? 'lu-pawn--movable' : ''}`}
                                                style={{
                                                    background: getTokenStyle(player.color),
                                                    opacity: pawn.finished ? 0.3 : 1,
                                                }}
                                            />
                                        </div>
                                    );
                                })
                            ))}
                        </div>

                        <div className="lu-controls">
                            <button
                                onClick={rollDice}
                                disabled={isRolling || isGameOver || (players[currentTurn] && players[currentTurn].isAI) || waitingForChoice}
                                className="lu-roll-btn"
                            >
                                {isGameOver
                                    ? 'Game Over'
                                    : (waitingForChoice ? 'Choose Pawn' : (players[currentTurn]?.isAI ? `${players[currentTurn].name} thinking…` : 'Roll Dice 🎲'))}
                            </button>
                            <div className="lu-dice">{diceValue || '–'}</div>
                        </div>
                    </div>

                    {isGameOver && (
                        <div className="lu-modal-overlay">
                            <div className="lu-modal-content">
                                <h2>{winner && !winner.isAI ? '🎉 You Win!' : `💔 ${winner?.name} Wins`}</h2>
                                <p className="lu-coin-reward">+{coinsEarned} Z Coins</p>
                                <button onClick={resetGame} className="lu-modal-btn">
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
    .lu-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .lu-bg-canvas {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0;
    }
    .lu-blob {
        position: fixed; border-radius: 50%;
        filter: blur(80px); pointer-events: none; z-index: 0;
    }
    .lu-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .lu-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .lu-inner {
        position: relative; z-index: 1;
        max-width: 720px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .lu-page-header { margin-bottom: 2rem; text-align: center; }
    .lu-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .lu-title-dark { color: var(--text-primary); }
    .lu-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .lu-title-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .lu-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0.4rem auto 0;
    }

    .lu-status-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1.2rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 14px;
        padding: 0.75rem 1.2rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(142,68,173,0.06);
    }
    .lu-status {
        font-family: var(--font-ui);
        font-size: 1.1rem; font-weight: 800;
        margin: 0; flex: 1;
    }
    .lu-restart-btn {
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
    .lu-restart-btn:hover {
        background: rgba(142,68,173,0.12);
        transform: translateY(-1px);
    }

    .lu-board-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .lu-board {
        position: relative;
        width: 100%;
        max-width: 520px;
        aspect-ratio: 1;
        background-color: white;
        border: 4px solid var(--accent-primary);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(142,68,173,0.25);
        display: grid;
        grid-template-columns: repeat(15, 1fr);
        grid-template-rows: repeat(15, 1fr);
        overflow: hidden;
    }

    .bg-green { background-color: #22c55e; }
    .bg-yellow { background-color: #eab308; }
    .bg-blue { background-color: #3b82f6; }
    .bg-red { background-color: #ef4444; }

    .bg-green-safe { background-color: rgba(34,197,94,0.2); }
    .bg-yellow-safe { background-color: rgba(234,179,8,0.2); }
    .bg-blue-safe { background-color: rgba(59,130,246,0.2); }
    .bg-red-safe { background-color: rgba(239,68,68,0.2); }

    .lu-base { border-radius: 8px; z-index: 1; }
    .lu-base-inner {
        background: white;
        border-radius: 16%;
        border: 2px solid rgba(0,0,0,0.06);
        z-index: 2;
    }
    .lu-base-spot-wrap {
        display: flex; align-items: center; justify-content: center;
        z-index: 3;
    }
    .lu-base-spot {
        width: 65%; height: 65%;
        border-radius: 50%;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
    }

    .lu-cell {
        border: 1px solid rgba(0,0,0,0.05);
        display: flex; align-items: center; justify-content: center;
        z-index: 1;
    }
    .lu-star-cell {
        font-size: 1.2rem;
        color: rgba(0,0,0,0.2);
    }

    .lu-center-home {
        position: relative;
        z-index: 1;
    }
    .lu-center-t-top { position: absolute; inset: 0; clip-path: polygon(0 0, 100% 0, 50% 50%); }
    .lu-center-t-right { position: absolute; inset: 0; clip-path: polygon(100% 0, 100% 100%, 50% 50%); }
    .lu-center-t-bottom { position: absolute; inset: 0; clip-path: polygon(0 100%, 100% 100%, 50% 50%); }
    .lu-center-t-left { position: absolute; inset: 0; clip-path: polygon(0 0, 0 100%, 50% 50%); }

    .lu-pawn-wrap {
        display: flex; align-items: center; justify-content: center;
        position: relative;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .lu-pawn {
        width: 70%; height: 70%;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        border: 1px solid white;
        z-index: 2;
    }
    .lu-pawn--movable {
        box-shadow: 0 0 10px #fff, 0 4px 8px rgba(0,0,0,0.4);
        border: 2px solid white;
        animation: luPulse 1s infinite;
    }

    .lu-controls {
        display: flex; align-items: center; justify-content: center;
        gap: 1.5rem; flex-wrap: wrap; width: 100%;
    }
    .lu-roll-btn {
        padding: 0.95rem 2rem;
        background: linear-gradient(135deg, #8e44ad, #732d91);
        color: white; border: none;
        border-radius: 999px;
        font-weight: 700; font-family: var(--font-ui);
        font-size: 1rem; cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 6px 20px rgba(142,68,173,0.28);
    }
    .lu-roll-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(142,68,173,0.38);
    }
    .lu-roll-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .lu-dice {
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

    @keyframes luPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .lu-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 100; backdrop-filter: blur(8px);
    }
    .lu-modal-content {
        background: white; padding: 3rem; border-radius: 24px;
        text-align: center; font-family: var(--font-ui);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .lu-modal-content h2 { font-size: 2.2rem; margin: 0 0 1rem; color: var(--text-primary); }
    .lu-coin-reward { font-size: 1.5rem !important; color: #FFD700 !important; font-weight: 800; margin-bottom: 2rem; }
    .lu-modal-btn {
        background: linear-gradient(135deg, #8e44ad, #ef4444);
        color: white; border: none; padding: 1rem 3rem; border-radius: 99px;
        font-size: 1.2rem; font-weight: 800; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 10px 20px rgba(142,68,173,0.3);
    }
    .lu-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(142,68,173,0.4); }

    @media (max-width: 640px) {
        .lu-inner { padding: 2rem 1.25rem 3rem; }
    }
`;

export default Ludo;