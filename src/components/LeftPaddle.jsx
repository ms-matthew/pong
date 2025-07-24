import { useEffect, useRef, useState } from "react";

const LeftPaddle = ({ gameArea, paddleY, onMove, theme, isPaused, isMobile }) => {
  const keys = useRef({ ArrowUp: false, ArrowDown: false });
  const animationRef = useRef(null);
  
  const paddleWidth = gameArea.width * 0.02;
  const paddleHeight = gameArea.height * 0.2;
  
  // Różna prędkość dla desktop i mobile (mobile jest kontrolowane z zewnątrz)
  const paddleSpeed = isMobile ? 
    gameArea.height * 0.02 :  // Mobile - mniejsza prędkość (kontrola z App.js)
    gameArea.height * 0.008;  // Desktop - frame-by-frame kontrola

  useEffect(() => {
    if (isPaused) return;
    
    // Na mobile nie używamy keyboard input - kontrola jest z App.js przez touch eventy
    if (isMobile) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault(); // Zapobiega scrollowaniu strony
        keys.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        keys.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Płynna animacja dla desktop
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const loop = (currentTime) => {
      // Frame rate limiting
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameTime = currentTime;

      let newY = paddleY;
      let moved = false;
      
      if (keys.current.ArrowUp) {
        newY = Math.max(-gameArea.height/2 + paddleHeight/2, newY - paddleSpeed);
        moved = true;
      }
      if (keys.current.ArrowDown) {
        newY = Math.min(gameArea.height/2 - paddleHeight/2, newY + paddleSpeed);
        moved = true;
      }
      
      // Tylko aktualizuj jeśli faktycznie się poruszył
      if (moved && Math.abs(newY - paddleY) > 0.1) {
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
  }, [paddleY, onMove, gameArea, paddleHeight, paddleSpeed, isPaused, isMobile]);

  // Mobile gesture hints (opcjonalne - można dodać wskazówki wizualne)
  const showMobileHints = isMobile && !isPaused;

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
        backfaceVisibility: 'hidden',
        // Lepszy rendering na mobile
        ...(isMobile && {
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        })
      }}
    >
      {/* Opcjonalne: wskaźnik dla mobile */}
      {showMobileHints && (
        <div
          className="absolute -left-2 top-1/2 transform -translate-y-1/2 opacity-30"
          style={{
            width: '4px',
            height: '60%',
            backgroundColor: theme.primary,
            borderRadius: '2px'
          }}
        />
      )}
    </div>
  );
};

export default LeftPaddle;