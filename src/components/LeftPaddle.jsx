import { useEffect, useRef, useState, forwardRef } from "react";

const LeftPaddle = ({ gameArea, paddleY, onMove, theme, isPaused }) => {
  const keys = useRef({ ArrowUp: false, ArrowDown: false });
  const animationRef = useRef(null);
  
  const paddleWidth = gameArea.width * 0.02;
  const paddleHeight = gameArea.height * 0.2;
  const paddleSpeed = gameArea.height * 0.005;

  useEffect(() => {
    if (isPaused) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        keys.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        keys.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = () => {
      let newY = paddleY;
      if (keys.current.ArrowUp) {
        newY = Math.max(-gameArea.height/2 + paddleHeight/2, newY - paddleSpeed);
      }
      if (keys.current.ArrowDown) {
        newY = Math.min(gameArea.height/2 - paddleHeight/2, newY + paddleSpeed);
      }
      
      if (newY !== paddleY) {
        onMove(newY);
      }
      
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [paddleY, onMove, gameArea, paddleHeight, paddleSpeed, isPaused]);

  return (
    <div
      className="absolute"
      style={{
        width: paddleWidth,
        height: paddleHeight,
        backgroundColor: theme.primary,
        boxShadow: `0 0 10px ${theme.primary}`,
        left: gameArea.width * 0.02,
        top: '50%',
        transform: `translate3d(0, ${paddleY}px, 0)`,
        marginTop: -paddleHeight/2,
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    />
  );
};

export default LeftPaddle;