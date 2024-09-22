import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function Mole({ isVisible }) {
  const [show, setShow] = useState(isVisible);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      setAnimate(true);
    } else if (show) {
      // モグラが引っ込むアニメーションを開始
      setAnimate(false);
      // アニメーションが終わったらモグラを非表示にする
      const timer = setTimeout(() => {
        setShow(false);
      }, 300); // アニメーションの長さに合わせる
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) {
    return null;
  }

  return (
    <img
      src="/bolana.png"
      alt="モグラ"
      className={`mole ${animate ? 'enter' : 'exit'}`}
    />
  );
}

function App() {
  const [holes, setHoles] = useState(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(13.01);
  const [gameActive, setGameActive] = useState(false);
  const moleTimeouts = useRef({});

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev - 0.1).toFixed(2));
      }, 100);
    } else if (timeLeft <= 0) {
      setGameActive(false);
      setTimeLeft(0);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  useEffect(() => {
    let moleAppearanceInterval;
    if (gameActive) {
      moleAppearanceInterval = setInterval(() => {
        setHoles(prevHoles => {
          const newHoles = [...prevHoles];
          // 50%の確率でモグラを追加
          if (Math.random() < 0.5) {
            // 空いている穴を探す
            const emptyIndices = newHoles
              .map((isVisible, index) => (!isVisible ? index : null))
              .filter(index => index !== null);
            if (emptyIndices.length > 0) {
              const randomIndex =
                emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              newHoles[randomIndex] = true;

              // モグラが引っ込むタイマーを設定
              const moleDuration = Math.random() * 1000 + 500; // 500ms〜1500ms
              const timeoutId = setTimeout(() => {
                setHoles(prevHoles => {
                  const updatedHoles = [...prevHoles];
                  updatedHoles[randomIndex] = false;
                  return updatedHoles;
                });
              }, moleDuration);

              // タイマーIDを保存
              moleTimeouts.current[randomIndex] = timeoutId;
            }
          }
          return newHoles;
        });
      }, 500); // 500msごとに実行
    }

    return () => {
      clearInterval(moleAppearanceInterval);
      // すべてのタイマーをクリア
      Object.values(moleTimeouts.current).forEach(timeoutId =>
        clearTimeout(timeoutId)
      );
      moleTimeouts.current = {};
    };
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) {
      setHoles(Array(9).fill(false));
    }
  }, [gameActive]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(13.01);
    setGameActive(true);
  };

  const hitMole = index => {
    if (holes[index]) {
      setScore(prev => prev + 1);
      setHoles(prevHoles => {
        const newHoles = [...prevHoles];
        newHoles[index] = false;
        return newHoles;
      });
      // モグラのタイマーをクリア
      clearTimeout(moleTimeouts.current[index]);
      delete moleTimeouts.current[index];
    }
  };

  return (
    <div className="App">
      <h1>Whac-a-bol</h1>
      <p>Score: {score}</p>
      <p>Time remaining: {timeLeft}sec</p>
      {!gameActive && <button onClick={startGame}>FUCK IT</button>}
      {!gameActive && timeLeft === 0 && (
        <p>Your score is {score} </p>
      )}
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
    </div>
  );
}

export default App;
