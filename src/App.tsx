import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import keyImage from './assets/key.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';

const chestOpenAudio = new Audio(chestOpenSound);
const evilLaughAudio = new Audio(evilLaughSound);

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

interface AuthUser {
  username: string;
  token: string;
}

interface ScoreRecord {
  score: number;
  result: string;
  played_at: string;
}

type Screen = 'landing' | 'login' | 'signup' | 'game';

interface AuthFormValues {
  username: string;
  password: string;
}

// Returns 'win', 'tie', or 'loss' based on final score
function getResult(score: number): 'win' | 'tie' | 'loss' {
  if (score > 0) return 'win';
  if (score === 0) return 'tie';
  return 'loss';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState('');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreRecord[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormValues>();

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('treasure_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    setScoreHistory([]);
  };

  const startGame = () => {
    initializeGame();
    setScreen('game');
  };

  // Fetch score history for logged-in user
  const fetchScoreHistory = async (token: string) => {
    try {
      const res = await fetch('/api/scores/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScoreHistory(data);
      }
    } catch {
      // silently ignore
    }
  };

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          if (box.hasTreasure) {
            chestOpenAudio.currentTime = 0;
            chestOpenAudio.play();
          } else {
            evilLaughAudio.currentTime = 0;
            evilLaughAudio.play();
          }
          const newScore = box.hasTreasure ? score + 150 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });

      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);

      if (treasureFound || allOpened) {
        setGameEnded(true);

        // Save score if logged in
        if (user) {
          const finalScore = updatedBoxes.reduce((acc, box) => {
            if (!box.isOpen) return acc;
            return acc + (box.hasTreasure ? 150 : -50);
          }, 0);
          const result = getResult(finalScore);
          fetch('/api/scores', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ score: finalScore, result }),
          }).then(() => fetchScoreHistory(user.token));
        }
      }

      return updatedBoxes;
    });
  };

  const handleAuth = async (data: AuthFormValues, mode: 'login' | 'signup') => {
    setAuthError('');
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.error || 'Something went wrong');
        return;
      }
      const authUser: AuthUser = { username: json.username, token: json.token };
      setUser(authUser);
      localStorage.setItem('treasure_user', JSON.stringify(authUser));
      reset();
      startGame();
    } catch {
      setAuthError('Cannot connect to server');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('treasure_user');
    setScreen('landing');
  };

  // ── Landing Screen ──────────────────────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-700 mb-10 text-sm">💰 Treasure: +$150 | 💀 Skeleton: -$50</p>

        {user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-800 text-lg">Welcome back, <strong>{user.username}</strong>!</p>
            <Button onClick={startGame} className="text-lg px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white">
              Play Game
            </Button>
            <button onClick={handleLogout} className="text-sm text-amber-500 hover:text-amber-700 underline mt-2">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <Button
              onClick={() => { setAuthError(''); reset(); setScreen('signup'); }}
              className="w-full text-lg py-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign Up
            </Button>
            <Button
              onClick={() => { setAuthError(''); reset(); setScreen('login'); }}
              variant="outline"
              className="w-full text-lg py-4 border-amber-500 text-amber-800 hover:bg-amber-100"
            >
              Login
            </Button>
            <button
              onClick={startGame}
              className="text-sm text-amber-500 hover:text-amber-700 underline mt-2"
            >
              Play as Guest (scores not saved)
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Auth Screen (Login / Signup) ────────────────────────────────────────────
  if (screen === 'login' || screen === 'signup') {
    const isSignup = screen === 'signup';
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-8">
          <h2 className="text-2xl text-center text-amber-900 mb-6">
            {isSignup ? '📝 Sign Up' : '🔑 Login'}
          </h2>

          <form onSubmit={handleSubmit(data => handleAuth(data, screen))} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="username" className="text-amber-800">Username</Label>
              <Input
                id="username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'At least 3 characters' },
                })}
                className="mt-1 border-amber-300 focus:border-amber-500"
                placeholder="Enter username"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-amber-800">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 4, message: 'At least 4 characters' },
                })}
                className="mt-1 border-amber-300 focus:border-amber-500"
                placeholder="Enter password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {authError && (
              <p className="text-red-600 text-sm text-center bg-red-50 rounded p-2">{authError}</p>
            )}

            <Button type="submit" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white">
              {isSignup ? 'Create Account & Play' : 'Login & Play'}
            </Button>
          </form>

          <button
            onClick={() => setScreen('landing')}
            className="mt-4 w-full text-sm text-amber-500 hover:text-amber-700 underline text-center"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Game Screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-2">Click on the treasure chests to discover what's inside!</p>
        <p className="text-amber-700 text-sm">💰 Treasure: +$150 | 💀 Skeleton: -$50</p>
        {user ? (
          <p className="text-amber-600 text-sm mt-2">
            Playing as <strong>{user.username}</strong> —{' '}
            <button onClick={handleLogout} className="underline hover:text-amber-800">Logout</button>
          </p>
        ) : (
          <p className="text-amber-500 text-sm mt-2">Guest mode — scores not saved</p>
        )}
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>${score}</span>
        </div>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`text-2xl font-bold px-4 py-2 rounded-lg border-2 ${
              score > 0
                ? 'bg-green-100 text-green-700 border-green-400'
                : score === 0
                ? 'bg-yellow-100 text-yellow-700 border-yellow-400'
                : 'bg-red-100 text-red-700 border-red-400'
            }`}
          >
            {score > 0 ? 'Win' : score === 0 ? 'Tie' : 'Loss'}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map(box => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center"
            style={{ cursor: box.isOpen ? 'default' : `url(${keyImage}), pointer` }}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: box.isOpen ? 180 : 0, scale: box.isOpen ? 1.1 : 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="relative"
            >
              <img
                src={box.isOpen ? (box.hasTreasure ? treasureChest : skeletonChest) : closedChest}
                alt={box.isOpen ? (box.hasTreasure ? 'Treasure!' : 'Skeleton!') : 'Treasure Chest'}
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>
            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$150' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">Click to open!</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-md"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score:{' '}
              <span className={score >= 0 ? 'text-green-600' : 'text-red-600'}>${score}</span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>
            {user && <p className="text-xs text-amber-500 mt-1">Score saved to your account ✓</p>}
          </div>

          {/* Score History for logged-in users */}
          {user && scoreHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-amber-200"
            >
              <h3 className="text-lg text-amber-900 mb-3">Your Recent Scores</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-amber-700 border-b border-amber-200">
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-center">Score</th>
                    <th className="pb-2 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreHistory.map((s, i) => (
                    <tr key={i} className="border-b border-amber-100 last:border-0">
                      <td className="py-1 text-amber-600 text-xs">
                        {new Date(s.played_at).toLocaleDateString()}
                      </td>
                      <td className={`py-1 text-center font-medium ${s.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${s.score}
                      </td>
                      <td className={`py-1 text-right font-bold ${
                        s.result === 'win' ? 'text-green-600' :
                        s.result === 'tie' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {s.result.charAt(0).toUpperCase() + s.result.slice(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          <Button
            onClick={() => { initializeGame(); }}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
