// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function Mole({ isVisible }) {
  // ...（Moleコンポーネントのコードは変更なし）
}

function App() {
  // 状態管理
  const [holes, setHoles] = useState(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(13.01);
  const [gameActive, setGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const moleTimeouts = useRef({});

  // ユーザーの認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 匿名認証でサインイン
        signInAnonymously(auth)
          .then((result) => {
            setUser(result.user);
          })
          .catch((error) => {
            console.error('Authentication error:', error);
            setError('Faild, bolol');
          });
      }
    });
    return () => unsubscribe();
  }, []);

  // ゲームタイマーの管理
  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev - 0.1).toFixed(2));
      }, 100);
    } else if (timeLeft <= 0) {
      setGameActive(false);
      setTimeLeft(0);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  // モグラの出現管理
  useEffect(() => {
    let moleAppearanceInterval;
    if (gameActive) {
      moleAppearanceInterval = setInterval(() => {
        setHoles((prevHoles) => {
          const newHoles = [...prevHoles];
          if (Math.random() < 0.5) {
            const emptyIndices = newHoles
              .map((isVisible, index) => (!isVisible ? index : null))
              .filter((index) => index !== null);
            if (emptyIndices.length > 0) {
              const randomIndex =
                emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              newHoles[randomIndex] = true;

              const moleDuration = Math.random() * 1000 + 500;
              const timeoutId = setTimeout(() => {
                setHoles((prevHoles) => {
                  const updatedHoles = [...prevHoles];
                  updatedHoles[randomIndex] = false;
                  return updatedHoles;
                });
              }, moleDuration);

              moleTimeouts.current[randomIndex] = timeoutId;
            }
          }
          return newHoles;
        });
      }, 500);
    }

    return () => {
      clearInterval(moleAppearanceInterval);
      Object.values(moleTimeouts.current).forEach((timeoutId) =>
        clearTimeout(timeoutId)
      );
      moleTimeouts.current = {};
    };
  }, [gameActive]);

  // ゲーム終了時の処理
  useEffect(() => {
    if (!gameActive) {
      setHoles(Array(9).fill(false));
    }
  }, [gameActive]);

  // リーダーボードのデータを取得
  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const leaderboardData = [];
        querySnapshot.forEach((doc) => {
          leaderboardData.push(doc.data());
        });
        setLeaderboard(leaderboardData);
      },
      (error) => {
        console.error('Error fetching leaderboard:', error);
        setError('Faild, leaderbolol');
      }
    );
    return () => unsubscribe();
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(13.01);
    setGameActive(true);
    setMessage('');
    setError('');
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(13.01);
    setGameActive(false);
    setPlayerName('');
    setMessage('');
    setError('');
  };

  const hitMole = (index) => {
    if (holes[index]) {
      setScore((prev) => prev + 1);
      setHoles((prevHoles) => {
        const newHoles = [...prevHoles];
        newHoles[index] = false;
        return newHoles;
      });
      clearTimeout(moleTimeouts.current[index]);
      delete moleTimeouts.current[index];
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (playerName.trim() !== '') {
      if (user) {
        try {
          const playerDocRef = doc(db, 'leaderboard', user.uid);
          const playerDoc = await getDoc(playerDocRef);

          if (playerDoc.exists()) {
            const existingScore = playerDoc.data().score;
            if (score > existingScore) {
              // スコアを更新
              await setDoc(playerDocRef, {
                uid: user.uid,
                name: playerName,
                score: score,
              });
              setMessage('ǝɹɔos ɥƃᴉɥ ʍǝN');
            } else {
              setMessage('前回のスコアを上回っていません。スコアは更新されませんでした。');
            }
          } else {
            // 新しいユーザーとしてスコアを保存
            await setDoc(playerDocRef, {
              uid: user.uid,
              name: playerName,
              score: score,
            });
            setMessage('s͛cͨoͦrͬeͤ s͛aͣvͮdͩ');
          }
        } catch (err) {
          console.error('Error saving score:', err);
          setError('failed');
        }
      } else {
        setError('not authorized');
      }
    }
  };

  return (
    <div className="App">
      <h1>Whac-a-bol</h1>
      <img src="/bolana.png" alt="Bolana" className="header-image" />

      {error && <p className="error-message">{error}</p>}

      <p>スコア: {score}</p>
      <p>残り時間: {timeLeft}秒</p>

      {!gameActive && timeLeft === 13.01 && (
        <button onClick={startGame}>ゲーム開始</button>
      )}

      {!gameActive && timeLeft === 0 && (
        <div>
          <p>ゲーム終了！あなたのスコアは {score} です。</p>
          {/* メッセージの表示 */}
          {message && <p className="success-message">{message}</p>}
          {/* エラーメッセージの表示 */}
          {error && <p className="error-message">{error}</p>}
          {/* 名前の入力フォームまたはリプレイボタン */}
          {message === '' && error === '' ? (
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                placeholder="あなたの名前を入力"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
              />
              <button type="submit">WE BOL</button>
            </form>
          ) : (
            <button onClick={resetGame}>Replya</button>
          )}
        </div>
      )}

      {/* ゲーム中のみ表示 */}
      {gameActive && (
        <div className="game-board">
          {holes.map((isMoleVisible, index) => (
            <div
              key={index}
              className="hole"
              onClick={() => hitMole(index)}
              onTouchStart={() => hitMole(index)}
            >
              <Mole isVisible={isMoleVisible} />
            </div>
          ))}
        </div>
      )}

      {/* リーダーボードの表示 */}
      {!gameActive && leaderboard.length > 0 && (
        <div className="leaderboard">
          <h2>Leaderbol</h2>
          <ol>
            {leaderboard.map((entry, index) => (
              <li key={index}>
                {entry.name}: {entry.score} 点
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default App;
