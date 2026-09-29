import { useState, useEffect, useCallback, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Board } from './Board';
import { Dice } from './Dice';
import { GameState, SNAKES, LADDERS, TOTAL_CELLS, Player, PLAYER_COLORS } from '../constants';
import { toast } from 'sonner';
import { ArrowLeft, RotateCcw, Trophy, UserPlus, Info, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameRoomProps {
  gameId: string;
  onExit: () => void;
  user: User;
}

export function GameRoom({ gameId, onExit, user }: GameRoomProps) {
  const [game, setGame] = useState<GameState | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'games', gameId), (snapshot) => {
      if (!snapshot.exists()) {
        toast.error("Game not found or deleted");
        onExit();
        return;
      }
      const data = snapshot.data() as GameState;
      setGame({ ...data, id: snapshot.id });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
    });

    return () => {
      unsubscribe();
      if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);
    };
  }, [gameId, onExit]);

  const currentPlayer = game?.players[game.turnIndex];
  const isMyTurn = currentPlayer?.uid === user.uid;
  const isAITurn = currentPlayer?.type === 'ai';

  const movePlayer = useCallback(async (roll: number) => {
    if (!game) return;

    const players = [...game.players];
    const player = { ...players[game.turnIndex] };
    
    let newPos = player.position + roll;
    
    // Check if overshoot
    if (newPos > TOTAL_CELLS) {
      newPos = player.position; // Stay put
      toast.info(`${player.name} needs exact roll to win!`);
    } else {
      // Check for snakes or ladders
      if (LADDERS[newPos]) {
        toast.success(`${player.name} found a ladder! ${newPos} -> ${LADDERS[newPos]}`);
        newPos = LADDERS[newPos];
      } else if (SNAKES[newPos]) {
        toast.error(`${player.name} hit a snake! ${newPos} -> ${SNAKES[newPos]}`);
        newPos = SNAKES[newPos];
      }
    }

    player.position = newPos;
    players[game.turnIndex] = player;

    const isWinner = newPos === TOTAL_CELLS;
    const nextTurnIndex = (game.turnIndex + 1) % game.players.length;

    const updates: any = {
      players,
      turnIndex: isWinner ? game.turnIndex : nextTurnIndex,
      lastRoll: roll,
      updatedAt: Timestamp.now(),
    };

    if (isWinner) {
      updates.status = 'finished';
      updates.winner = player.uid;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    try {
      await updateDoc(doc(db, 'games', gameId), updates);
    } catch (error) {
      console.error("Failed to update game", error);
    }
  }, [game, gameId]);

  const rollDice = useCallback(async () => {
    if (isRolling || !game || game.status !== 'playing') return;
    
    setIsRolling(true);
    
    // Simulate rolling animation
    setTimeout(async () => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setIsRolling(false);
      await movePlayer(roll);
    }, 1000);
  }, [isRolling, game, movePlayer]);

  // AI Logic
  useEffect(() => {
    if (game?.status === 'playing' && isAITurn && !isRolling) {
      aiTurnTimeoutRef.current = setTimeout(() => {
        rollDice();
      }, 2000);
    }
    return () => {
      if (aiTurnTimeoutRef.current) clearTimeout(aiTurnTimeoutRef.current);
    };
  }, [game?.status, isAITurn, isRolling, rollDice]);

  const joinGame = async () => {
    if (!game || game.players.length >= 4) return;
    if (game.players.some(p => p.uid === user.uid)) return;

    const newPlayer: Player = {
      uid: user.uid,
      name: user.displayName || 'Player',
      color: PLAYER_COLORS[game.players.length],
      position: 1,
      type: 'human'
    };

    try {
      await updateDoc(doc(db, 'games', gameId), {
        players: [...game.players, newPlayer],
        updatedAt: Timestamp.now()
      });
      toast.success("Joined game!");
    } catch (error) {
      console.error(error);
    }
  };

  const startGame = async () => {
    if (!game || game.hostId !== user.uid) return;
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'playing',
        updatedAt: Timestamp.now()
      });
      toast.success("Game started!");
    } catch (error) {
      console.error(error);
    }
  };

  const resetGame = async () => {
    if (!game || game.hostId !== user.uid) return;
    const resetPlayers = game.players.map(p => ({ ...p, position: 1 }));
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'playing',
        players: resetPlayers,
        turnIndex: 0,
        winner: null,
        lastRoll: null,
        updatedAt: Timestamp.now()
      });
      toast.success("Game reset!");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>;
  if (!game) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onExit} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Lobby
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={game.status === 'playing' ? 'default' : 'secondary'}>
              {game.status.toUpperCase()}
            </Badge>
            {game.status === 'waiting' && game.hostId === user.uid && (
              <Button size="sm" onClick={startGame} disabled={game.players.length < 2}>
                Start Game
              </Button>
            )}
          </div>
        </div>

        <Board players={game.players} />
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Players</span>
              <span className="text-xs font-normal text-slate-500">{game.players.length}/4</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {game.players.map((p, i) => (
              <div 
                key={p.uid} 
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  game.turnIndex === i && game.status === 'playing'
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-transparent bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {p.name}
                      {p.uid === user.uid && <span className="text-[10px] bg-slate-200 px-1 rounded">You</span>}
                      {p.type === 'ai' && <Bot className="w-3 h-3" />}
                    </p>
                    <p className="text-xs text-slate-500">Position: {p.position}</p>
                  </div>
                </div>
                {game.turnIndex === i && game.status === 'playing' && (
                  <Badge className="animate-pulse">TURN</Badge>
                )}
                {game.winner === p.uid && <Trophy className="w-5 h-5 text-yellow-500" />}
              </div>
            ))}

            {game.status === 'waiting' && !game.players.some(p => p.uid === user.uid) && (
              <Button variant="outline" className="w-full gap-2" onClick={joinGame}>
                <UserPlus className="w-4 h-4" />
                Join this Game
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-900 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Game Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 gap-6">
            {game.status === 'playing' ? (
              <>
                <Dice value={game.lastRoll || 1} isRolling={isRolling} />
                <Button 
                  size="lg" 
                  className="w-full h-16 text-xl font-bold bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                  onClick={rollDice}
                  disabled={!isMyTurn || isRolling}
                >
                  {isMyTurn ? 'ROLL DICE' : `${currentPlayer?.name}'s Turn`}
                </Button>
              </>
            ) : game.status === 'finished' ? (
              <div className="text-center space-y-4 py-4">
                <div className="bg-yellow-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold">Winner!</h3>
                <p className="text-slate-300">
                  {game.players.find(p => p.uid === game.winner)?.name} has won the game!
                </p>
                {game.hostId === user.uid && (
                  <Button onClick={resetGame} variant="secondary" className="w-full gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Info className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400">Waiting for host to start the game...</p>
                {game.players.length < 2 && (
                  <p className="text-xs text-yellow-500">Need at least 2 players to start</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
