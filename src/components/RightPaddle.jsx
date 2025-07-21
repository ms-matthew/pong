import { useEffect, useRef, useState, forwardRef } from "react";

const RightPaddle = ({ gameArea, paddleY, onMove, ballPosition, isMobile, isPaused}) => {
  const animationRef = useRef(null);
  
  const paddleWidth = gameArea.width * 0.02;
  const paddleHeight = gameArea.height * 0.2;
  const paddleSpeed = gameArea.height * (isMobile ? 0.005 : 0.003);

  useEffect(() => {
    if (isPaused) return;

    const loop = () => {
      const targetY = ballPosition.y;
      const diff = targetY - paddleY;
      
      let newY = paddleY;
      if (Math.abs(diff) > 10) {
        newY = paddleY + Math.sign(diff) * Math.min(Math.abs(diff), paddleSpeed);
      }
      
      newY = Math.max(-gameArea.height/2 + paddleHeight/2, 
                     Math.min(gameArea.height/2 - paddleHeight/2, newY));
      
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
    };
  }, [paddleY, onMove, ballPosition, gameArea, paddleHeight, paddleSpeed, isPaused]);

  return (
    <div
      className="absolute"
      style={{
        width: paddleWidth,
        height: paddleHeight,
        backgroundColor: '#fff',
        boxShadow: '0 0 10px #fff',
        right: gameArea.width * 0.02,
        top: '50%',
        transform: `translate3d(0, ${paddleY}px, 0)`,
        marginTop: -paddleHeight/2,
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    />
  );
};

export default RightPaddle;