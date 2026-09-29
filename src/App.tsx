/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GameRoom } from './components/GameRoom';
import { GameLobby } from './components/GameLobby';
import { Button } from './components/ui/button';
import { LogIn, LogOut, Trophy, Gamepad2 } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-center" />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentGameId(null)}>
            <div className="bg-primary p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Snake & Ladder</h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-slate-100"
                  referrerPolicy="no-referrer"
                />
                <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={signInWithGoogle} className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="login-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md">
                <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gamepad2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Welcome to the Board!</h2>
                <p className="text-slate-600 mb-8">
                  Sign in to play Snake & Ladder with friends or AI opponents. 
                  Track your wins and climb the leaderboard!
                </p>
                <Button size="lg" onClick={signInWithGoogle} className="w-full gap-2 text-lg h-14">
                  <LogIn className="w-5 h-5" />
                  Get Started
                </Button>
              </div>
            </motion.div>
          ) : currentGameId ? (
            <motion.div
              key="game-room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GameRoom 
                gameId={currentGameId} 
                onExit={() => setCurrentGameId(null)} 
                user={user}
              />
            </motion.div>
          ) : (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameLobby onJoinGame={setCurrentGameId} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
