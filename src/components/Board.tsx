import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BOARD_SIZE, TOTAL_CELLS, LADDERS, SNAKES, Player } from '../constants';

interface BoardProps {
  players: Player[];
}

export function Board({ players }: BoardProps) {
  const cells = useMemo(() => {
    const arr = [];
    for (let i = TOTAL_CELLS; i >= 1; i--) {
      arr.push(i);
    }
    return arr;
  }, []);

  const getCellCoords = (cellNum: number) => {
    const zeroIndexed = cellNum - 1;
    const row = Math.floor(zeroIndexed / BOARD_SIZE);
    const col = zeroIndexed % BOARD_SIZE;
    
    // Zig-zag logic
    const x = row % 2 === 0 ? col : (BOARD_SIZE - 1 - col);
    const y = (BOARD_SIZE - 1 - row);
    
    return { x, y };
  };

  const renderSnakesAndLadders = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="ladderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Ladders */}
        {Object.entries(LADDERS).map(([start, end]) => {
          const s = getCellCoords(Number(start));
          const e = getCellCoords(Number(end));
          const x1 = s.x * 10 + 5;
          const y1 = s.y * 10 + 5;
          const x2 = e.x * 10 + 5;
          const y2 = e.y * 10 + 5;
          
          return (
            <g key={`ladder-${start}`}>
              <line 
                x1={x1-1} y1={y1} x2={x2-1} y2={y2} 
                stroke="url(#ladderGradient)" strokeWidth="1.5" strokeLinecap="round" 
              />
              <line 
                x1={x1+1} y1={y1} x2={x2+1} y2={y2} 
                stroke="url(#ladderGradient)" strokeWidth="1.5" strokeLinecap="round" 
              />
              {/* Rungs */}
              {Array.from({ length: 6 }).map((_, i) => {
                const t = (i + 1) / 7;
                const rx = x1 + (x2 - x1) * t;
                const ry = y1 + (y2 - y1) * t;
                const dx = (x2 - x1);
                const dy = (y2 - y1);
                const len = Math.sqrt(dx*dx + dy*dy);
                const nx = -dy / len * 2;
                const ny = dx / len * 2;
                return (
                  <line 
                    key={i}
                    x1={rx - nx} y1={ry - ny} x2={rx + nx} y2={ry + ny}
                    stroke="#94a3b8" strokeWidth="0.8"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Snakes */}
        {Object.entries(SNAKES).map(([start, end]) => {
          const s = getCellCoords(Number(start));
          const e = getCellCoords(Number(end));
          const x1 = s.x * 10 + 5;
          const y1 = s.y * 10 + 5;
          const x2 = e.x * 10 + 5;
          const y2 = e.y * 10 + 5;
          
          // Bezier curve for snake
          const midX = (x1 + x2) / 2 + (Math.random() > 0.5 ? 5 : -5);
          const midY = (y1 + y2) / 2;
          
          return (
            <path 
              key={`snake-${start}`}
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="2,1"
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="relative aspect-square w-full max-w-[600px] bg-white rounded-xl shadow-2xl border-8 border-slate-800 p-1 overflow-hidden">
      <div className="grid grid-cols-10 grid-rows-10 w-full h-full gap-0.5 bg-slate-200">
        {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
          const cellNum = TOTAL_CELLS - i;
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          
          // Calculate actual cell number based on zig-zag
          const actualRow = BOARD_SIZE - 1 - row;
          const actualCol = actualRow % 2 === 0 ? col : (BOARD_SIZE - 1 - col);
          const num = actualRow * BOARD_SIZE + actualCol + 1;
          
          const isEven = (actualRow + actualCol) % 2 === 0;
          
          return (
            <div 
              key={num}
              className={`relative flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                isEven ? 'bg-slate-50' : 'bg-slate-100'
              } text-slate-400`}
            >
              <span className="absolute top-0.5 left-1 opacity-50">{num}</span>
              
              {/* Special Cell Indicators */}
              {LADDERS[num] && <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
              {SNAKES[num] && <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
            </div>
          );
        })}
      </div>

      {renderSnakesAndLadders()}

      {/* Player Tokens */}
      <AnimatePresence>
        {players.map((player, index) => {
          const coords = getCellCoords(player.position);
          // Offset players in the same cell
          const playersInSameCell = players.filter(p => p.position === player.position);
          const playerIdxInCell = playersInSameCell.findIndex(p => p.uid === player.uid);
          const offset = playersInSameCell.length > 1 
            ? { 
                x: (playerIdxInCell % 2 === 0 ? -1 : 1) * 1.5, 
                y: (playerIdxInCell < 2 ? -1 : 1) * 1.5 
              } 
            : { x: 0, y: 0 };

          return (
            <motion.div
              key={player.uid}
              initial={false}
              animate={{
                left: `${coords.x * 10 + 5 + offset.x}%`,
                top: `${coords.y * 10 + 5 + offset.y}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute w-[6%] h-[6%] -translate-x-1/2 -translate-y-1/2 z-40"
            >
              <div 
                className="w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[8px] font-black text-white"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0].toUpperCase()}
              </div>
              {/* Indicator for current turn */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
