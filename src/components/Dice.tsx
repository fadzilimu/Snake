import { useState } from 'react';
import { motion, useAnimation } from 'motion/react';

interface DiceProps {
  value: number;
  isRolling: boolean;
}

export function Dice({ value, isRolling }: DiceProps) {
  const controls = useAnimation();

  const diceFaces = [
    [], // 0
    [4], // 1
    [0, 8], // 2
    [0, 4, 8], // 3
    [0, 2, 6, 8], // 4
    [0, 2, 4, 6, 8], // 5
    [0, 2, 3, 5, 6, 8], // 6
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={isRolling ? {
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.2, 1],
          x: [0, -10, 10, -10, 0],
          y: [0, -20, 0, -20, 0],
        } : { rotate: 0, scale: 1, x: 0, y: 0 }}
        transition={isRolling ? {
          duration: 0.5,
          repeat: Infinity,
          ease: "linear"
        } : { duration: 0.2 }}
        className="w-16 h-16 bg-white rounded-xl shadow-lg border-2 border-slate-200 p-2 grid grid-cols-3 grid-rows-3 gap-1 relative"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {diceFaces[value].includes(i) && (
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full shadow-inner" />
            )}
          </div>
        ))}
      </motion.div>
      <div className="text-center">
        <span className="text-2xl font-bold text-primary">{isRolling ? '?' : value}</span>
      </div>
    </div>
  );
}
