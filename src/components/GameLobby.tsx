import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Users, Bot, Play, Search } from 'lucide-react';
import { GameState, PLAYER_COLORS } from '../constants';
import { toast } from 'sonner';

interface GameLobbyProps {
  onJoinGame: (gameId: string) => void;
  user: User;
}

export function GameLobby({ onJoinGame, user }: GameLobbyProps) {
  const [games, setGames] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'games'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameState[];
      setGames(gamesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });

    return unsubscribe;
  }, []);

  const createGame = async (withAI: boolean) => {
    try {
      const newGame = {
        status: 'waiting',
        players: [
          {
            uid: user.uid,
            name: user.displayName || 'Player 1',
            color: PLAYER_COLORS[0],
            position: 1,
            type: 'human'
          }
        ],
        turnIndex: 0,
        hostId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (withAI) {
        newGame.players.push({
          uid: 'ai-opponent',
          name: 'AI Master',
          color: PLAYER_COLORS[1],
          position: 1,
          type: 'ai'
        });
        newGame.status = 'playing';
      }

      const docRef = await addDoc(collection(db, 'games'), newGame);
      onJoinGame(docRef.id);
      toast.success(withAI ? "AI Game Started!" : "Lobby Created!");
    } catch (error) {
      toast.error("Failed to create game");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Game Lobby</h2>
          <p className="text-slate-500">Join an existing game or create your own.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => createGame(true)} variant="outline" className="gap-2">
            <Bot className="w-4 h-4" />
            Play vs AI
          </Button>
          <Button onClick={() => createGame(false)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Lobby
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-slate-100" />
              <CardContent className="h-32" />
            </Card>
          ))
        ) : games.length === 0 ? (
          <Card className="col-span-full py-12 border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold">No active lobbies</h3>
              <p className="text-slate-500 mb-6">Be the first to create a game!</p>
              <Button onClick={() => createGame(false)}>Create New Lobby</Button>
            </CardContent>
          </Card>
        ) : (
          games.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Game by {game.players[0].name}</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    Waiting
                  </Badge>
                </div>
                <CardDescription>
                  Created {new Date(game.createdAt?.seconds * 1000).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{game.players.length} / 4 Players</span>
                </div>
                <div className="mt-4 flex -space-x-2">
                  {game.players.map((p, i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => onJoinGame(game.id)}
                  disabled={game.players.length >= 4}
                >
                  <Play className="w-4 h-4" />
                  Join Game
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
