import { useState, useRef, useEffect } from "react";
import Background from './components/Background';
import Ball from './components/Ball';
import LeftPaddle from './components/LeftPaddle';
import RightPaddle from './components/RightPaddle';
import './index.css';
import AudioManager from './components/AudioManager';
import andrzejImage from '/src/assets/andrzej_grubba.jpg'
import nataliaImage from '/src/assets/Natalia_Partyka_Rio_2016.jpg'
import customImage from '/src/assets/custom.png'



// Ikony muzyczne - wersja kompaktowa dla landscape
const MusicIconCompact = ({ type, isActive, onClick }) => {
  const icons = {
    mute: { emoji: "🔇", color: "#64748b", label: "Mute" },
    retro: { emoji: "🎮", color: "#f59e0b", label: "Retro" },
    chill: { emoji: "🎵", color: "#10b981", label: "Chill" },
    rock: { emoji: "🎸", color: "#ef4444", label: "Rock" }
  };

  const icon = icons[type];

  return (
    <button
      onClick={onClick}
      className={`
        relative p-3 rounded-lg border-2 transition-all transform hover:scale-105 active:scale-95
        ${isActive ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-600 bg-black/40'}
        w-full h-16 flex flex-col items-center justify-center
      `}
      style={{
        borderColor: isActive ? icon.color : '#4b5563',
        backgroundColor: isActive ? `${icon.color}20` : 'rgba(0,0,0,0.4)'
      }}
    >
      <div className="text-xl">{icon.emoji}</div>
      <div className={`text-xs ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {icon.label}
      </div>
      {isActive && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: icon.color }}
        />
      )}
    </button>
  );
};

// Ikony muzyczne - wersja standardowa
const MusicIcon = ({ type, isActive, onClick }) => {
  const icons = {
    mute: { emoji: "🔇", color: "#64748b", label: "Mute" },
    retro: { emoji: "🎮", color: "#f59e0b", label: "Retro" },
    chill: { emoji: "🎵", color: "#10b981", label: "Chill" },
    rock: { emoji: "🎸", color: "#ef4444", label: "Rock" }
  };

  const icon = icons[type];

  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95
        ${isActive ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-600 bg-black/40'}
        w-full min-h-[80px]
      `}
      style={{
        borderColor: isActive ? icon.color : '#4b5563',
        backgroundColor: isActive ? `${icon.color}20` : 'rgba(0,0,0,0.4)'
      }}
    >
      <div className="text-3xl">{icon.emoji}</div>
      <div className={`text-sm mt-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {icon.label}
      </div>
      {isActive && (
        <div 
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
          style={{ backgroundColor: icon.color }}
        />
      )}
    </button>
  );
};

const PLAYERS = {
  natalia: {
    name: "Natalia Partyka",
    image: nataliaImage,
    theme: {
      primary: "#06b6d4", // cyan-500
      secondary: "#67e8f9", // cyan-300
      accent: "#0891b2" // cyan-600
    }
  },
  andrzej: {
    name: "Andrzej Grubba",
    image: andrzejImage,
    theme: {
      primary: "#06b6d4", // cyan-500
      secondary: "#67e8f9", // cyan-300
      accent: "#0891b2" // cyan-600
    }
  },
  custom: {
    name: "Custom Player",
    image: customImage,
    theme: {
      primary: "#06b6d4", // cyan-500
      secondary: "#67e8f9", // cyan-300
      accent: "#0891b2" // cyan-600
    }
  }
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameRestarted, setGameRestarted] = useState(false);
  const [playerPoints, setPlayerPoints] = useState(0);
  const [computerPoints, setComputerPoints] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [finalPlayerPoints, setFinalPlayerPoints] = useState(0);
  const [finalComputerPoints, setFinalComputerPoints] = useState(0);
  const [leftPaddleY, setLeftPaddleY] = useState(0);
  const [rightPaddleY, setRightPaddleY] = useState(0);
  const [gameArea, setGameArea] = useState({ width: 800, height: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerSelectionStep, setPlayerSelectionStep] = useState(false);
  const [customNick, setCustomNick] = useState("");

  // Nowe stany dla menu pauzy
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [musicType, setMusicType] = useState('mute');

  const animationFrameRef = useRef(null);
  const currentDirectionRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const countdownIntervalRef = useRef(null);

  document.body.style.background = "#0517C9";

  const currentTheme = selectedPlayer ? selectedPlayer.theme : PLAYERS.custom.theme;

  // Funkcja do obsługi pauzy
  // Również warto dodać warunek do funkcji togglePause dla dodatkowej ochrony

const togglePause = () => {
  if (!gameStarted || gameRestarted || countdown > 0) return; // Dodaj countdown > 0
  
  console.log('Toggle pause called, current isPaused:', isPaused); // DEBUG
  
  if (isPaused) {
    // Wznów grę z odliczaniem
    setShowPauseMenu(false);
    setCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsPaused(false);
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    // Pauzuj grę
    setIsPaused(true);
    setShowPauseMenu(true);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }
};

// Zaktualizowany useEffect dla obsługi klawiszy
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      // Nie pozwalaj na pauzowanie podczas odliczania
      if (countdown > 0) return;
      togglePause();
    } else if (e.code === 'Space') {
      e.preventDefault();
      
      if (!gameStarted && !gameRestarted && !selectedPlayer) {
        startPlayerSelection();
      } else if (gameRestarted && selectedPlayer) {
        restartGame();
      }
    }
  };

  // Dodajemy obsługę touch events dla mobile
  const handleTouchEvents = (e) => {
    // Zapobiegamy propagacji tylko dla przycisków pauzy
    if (e.target.closest('[data-pause-button]')) {
      e.stopPropagation();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  if (isMobile) {
    document.addEventListener('touchstart', handleTouchEvents, { passive: false });
    document.addEventListener('touchend', handleTouchEvents, { passive: false });
  }
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    if (isMobile) {
      document.removeEventListener('touchstart', handleTouchEvents);
      document.removeEventListener('touchend', handleTouchEvents);
    }
  };
}, [gameStarted, gameRestarted, selectedPlayer, isPaused, isMobile, countdown]); // Dodaj countdown do dependencies

  // Funkcje do zarządzania muzyką
  const handleMusicChange = (type) => {
    setMusicType(type);
    // Tutaj można dodać rzeczywistą obsługę muzyki
    console.log(`Music changed to: ${type}`);
  };

  useEffect(() => {
    if (isMobile) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.mozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      document.body.style.webkitTouchCallout = 'none';
      document.body.style.webkitTapHighlightColor = 'transparent';
      document.body.style.touchAction = 'manipulation';
      document.body.style.webkitUserDrag = 'none';
      document.body.style.webkitUserModify = 'none';
    }

    return () => {
      if (isMobile) {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.mozUserSelect = '';
        document.body.style.msUserSelect = '';
        document.body.style.webkitTouchCallout = '';
        document.body.style.webkitTapHighlightColor = '';
        document.body.style.touchAction = '';
        document.body.style.webkitUserDrag = '';
        document.body.style.webkitUserModify = '';
      }
    };
  }, [isMobile]);

  // Fragment z funkcją updateGameArea - poszerzona wersja dla desktop
useEffect(() => {
  const updateGameArea = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const mobile = isTouchDevice && (isAndroid || isIOS || vw < 1024);
    const portrait = vh > vw;
    
    setIsMobile(mobile);
    setIsPortrait(portrait);
    
    if (mobile) {
      if (portrait) {
        const headerHeight = 120;
        const buttonsHeight = 120;
        const availableHeight = vh - headerHeight - buttonsHeight - 60;
        const maxWidth = vw * 0.92;
        
        let width = Math.min(maxWidth, 350);
        let height = width * 0.75;
        
        if (height > availableHeight) {
          height = availableHeight;
          width = height * 1.33;
        }
        
        setGameArea({ width, height });
      } else {
        const buttonsWidth = 160;
        const availableWidth = vw - buttonsWidth - 40;
        const availableHeight = vh - 40;
        
        let width = availableWidth;
        let height = availableHeight;
        
        if (width / height > 1.5) {
          width = height * 1.5;
        } else {
          height = width * 0.67;
        }
        
        setGameArea({ width, height });
      }
    } else {
      // DESKTOP - Znacznie poszerzona gra
      const maxWidth = Math.min(vw * 0.9, 1200); // Zwiększone z 800 do 1200
      const maxHeight = vh * 0.7; // 70% wysokości ekranu
      
      // Preferowany stosunek szerokości do wysokości (16:10 zamiast 4:3)
      const preferredRatio = 1.6;
      
      let width = maxWidth;
      let height = width / preferredRatio;
      
      // Jeśli wysokość przekracza dostępną przestrzeń, dostosuj szerokość
      if (height > maxHeight) {
        height = maxHeight;
        width = height * preferredRatio;
      }
      
      setGameArea({ width, height });
    }
  };

  updateGameArea();
  window.addEventListener('resize', updateGameArea);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateGameArea, 100);
  });

  const preventScroll = (e) => {
    e.preventDefault();
  };

  if (isMobile) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.addEventListener('touchmove', preventScroll, { passive: false });
  }

  return () => {
    window.removeEventListener('resize', updateGameArea);
    window.removeEventListener('orientationchange', updateGameArea);
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.removeEventListener('touchmove', preventScroll);
  };
}, [isMobile]);

  const resetPaddles = () => {
    setLeftPaddleY(0);
    setRightPaddleY(0);
  };

  const startPlayerSelection = () => {
    setPlayerSelectionStep(true);
  };

  const selectPlayer = (playerKey) => {
    if (playerKey === 'custom') {
      setSelectedPlayer({
        ...PLAYERS.custom,
        name: customNick || "Custom Player"
      });
    } else {
      setSelectedPlayer(PLAYERS[playerKey]);
    }
    setPlayerSelectionStep(false);
    setGameStarted(true);
    setPlayerPoints(0);
    setComputerPoints(0);
    resetPaddles();
    setGameRestarted(false);
    setIsPaused(false);
    setShowPauseMenu(false);
  };

  const backToMenu = () => {
    setPlayerSelectionStep(false);
    setSelectedPlayer(null);
    setGameStarted(false);
    setGameRestarted(false);
    setIsPaused(false);
    setShowPauseMenu(false);
  };

  const restartGame = () => {
    setGameStarted(true);
    setPlayerPoints(0);
    setComputerPoints(0);
    resetPaddles();
    setGameRestarted(false);
    setIsPaused(false);
    setShowPauseMenu(false);
  };

  const changePlayer = () => {
    setPlayerSelectionStep(true);
    setSelectedPlayer(null);
    setGameStarted(false);
    setGameRestarted(false);
    setIsPaused(false);
    setShowPauseMenu(false);
  };

  const smoothPaddleMovement = (timestamp) => {
    if (!currentDirectionRef.current || isPaused) return;
    
    const deltaTime = timestamp - lastUpdateTimeRef.current;
    
    if (deltaTime >= 16) {
      const paddleSpeed = gameArea.height * 0.025;
      const paddleHeight = gameArea.height * 0.2;
      const maxY = gameArea.height/2 - paddleHeight/2;
      
      setLeftPaddleY(prev => {
        if (currentDirectionRef.current === 'up') {
          return Math.max(-maxY, prev - paddleSpeed);
        } else if (currentDirectionRef.current === 'down') {
          return Math.min(maxY, prev + paddleSpeed);
        }
        return prev;
      });
      
      lastUpdateTimeRef.current = timestamp;
    }
    
    animationFrameRef.current = requestAnimationFrame(smoothPaddleMovement);
  };

  const handleTouchStart = (direction) => {
    if (isPaused) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    currentDirectionRef.current = direction;
    lastUpdateTimeRef.current = performance.now();
    
    animationFrameRef.current = requestAnimationFrame(smoothPaddleMovement);
  };

  const handleTouchEnd = () => {
    currentDirectionRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    if (!isMobile) return;
    
    const handleGlobalTouchEnd = () => {
      handleTouchEnd();
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTouchEnd();
      }
    };
    
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleTouchEnd();
    };
  }, [isMobile]);

  useEffect(() => {
    handleTouchEnd();
  }, [playerPoints, computerPoints]);

  useEffect(() => {
    if (playerPoints === 10 || computerPoints === 10) {
      setFinalPlayerPoints(playerPoints);
      setFinalComputerPoints(computerPoints);
      setGameStarted(false);
      setGameRestarted(true);
      setIsPaused(false);
      setShowPauseMenu(false);
    }
  }, [playerPoints, computerPoints]);

  const buttonStyle = {
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitUserDrag: 'none',
    WebkitUserModify: 'none'
  };

  const globalMobileStyles = isMobile ? {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    WebkitUserDrag: 'none'
  } : {};

  const BackgroundSVG = () => (
    <div className="fixed inset-0 w-full h-full z-[-1] pointer-events-none">
      <svg 
        className="absolute bottom-5 left-5 w-[90%] h-[80%]" 
        viewBox="0 0 1440 320" 
        preserveAspectRatio="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M-58.2181 251C-38.2181 211 1155.7 -156.251 1394.92 -143.659C1322.55 -131.777 1260.03 -82.283 1082.78 -57C663.294 46.0244 164.423 469.454 -69.4135 658.779L-20 220Z" 
          fill="#FFFFFF" 
          opacity="0.08"
        />
      </svg>
    </div>
  );

  // Menu pauzy - poziomy layout dla mobile landscape
  const PauseMenu = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" style={globalMobileStyles}>
      <div className={`
        bg-black/90 rounded-xl border border-cyan-500/50 w-full mx-4
        ${isMobile && !isPortrait ? 'max-w-4xl p-4' : 'max-w-md p-6'}
      `}>
        <div className={`text-center ${isMobile && !isPortrait ? 'mb-4' : 'mb-6'}`}>
          <h2 className={`font-bold text-cyan-400 mb-2 ${isMobile && !isPortrait ? 'text-xl' : 'text-2xl'}`}>GAME PAUSED</h2>
          <p className={`text-gray-400 ${isMobile && !isPortrait ? 'text-sm' : 'text-base'}`}>Choose your music</p>
        </div>
        
        {isMobile && !isPortrait ? (
          // Layout poziomy - wszystko w jednym rzędzie
          <div className="flex items-center gap-4">
            {/* Ikony muzyczne w poziomie */}
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <MusicIconCompact
                  type="mute"
                  isActive={musicType === 'mute'}
                  onClick={() => handleMusicChange('mute')}
                />
              </div>
              <div className="flex-1">
                <MusicIconCompact
                  type="retro"
                  isActive={musicType === 'retro'}
                  onClick={() => handleMusicChange('retro')}
                />
              </div>
              <div className="flex-1">
                <MusicIconCompact
                  type="chill"
                  isActive={musicType === 'chill'}
                  onClick={() => handleMusicChange('chill')}
                />
              </div>
              <div className="flex-1">
                <MusicIconCompact
                  type="rock"
                  isActive={musicType === 'rock'}
                  onClick={() => handleMusicChange('rock')}
                />
              </div>
            </div>
            
            {/* Przycisk Resume po prawej */}
            <button
              onClick={togglePause}
              className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition font-bold text-base whitespace-nowrap"
              style={buttonStyle}
            >
              Resume Game
            </button>
          </div>
        ) : (
          // Layout pionowy - standardowy grid
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MusicIcon
                type="mute"
                isActive={musicType === 'mute'}
                onClick={() => handleMusicChange('mute')}
              />
              <MusicIcon
                type="retro"
                isActive={musicType === 'retro'}
                onClick={() => handleMusicChange('retro')}
              />
              <MusicIcon
                type="chill"
                isActive={musicType === 'chill'}
                onClick={() => handleMusicChange('chill')}
              />
              <MusicIcon
                type="rock"
                isActive={musicType === 'rock'}
                onClick={() => handleMusicChange('rock')}
              />
            </div>
            
            <button
              onClick={togglePause}
              className="w-full bg-cyan-600 text-white py-4 rounded-lg hover:bg-cyan-700 transition font-bold text-lg"
              style={buttonStyle}
            >
              Resume Game
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Overlay odliczania
  const CountdownOverlay = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40" style={globalMobileStyles}>
      <div className="text-center">
        <div 
          className="text-8xl font-bold mb-4 animate-pulse"
          style={{ color: currentTheme.primary }}
        >
          {countdown}
        </div>
        <p className="text-white text-xl">Game resumes in...</p>
      </div>
    </div>
  );

  // Sekcja wyboru gracza - ulepszona wersja
// Sekcja wyboru gracza - ulepszona wersja dla mobile landscape
if (playerSelectionStep) {
  return (
    <div className="w-screen flex flex-col items-center justify-start overflow-hidden" style={{ height: '100vh', paddingTop: '20px', ...globalMobileStyles }}>
      <BackgroundSVG />
      
      <div className={`text-center ${isMobile && !isPortrait ? 'mb-1' : 'mb-8'}`} style={globalMobileStyles}>
        <h2 className={`font-bold text-white ${isMobile ? (isPortrait ? 'text-2xl' : 'text-base') : 'text-5xl'}`}>
          CHOOSE YOUR PLAYER
        </h2>
      </div>
      
      <div className={`
        ${isMobile && !isPortrait ? 'flex flex-row gap-2 w-full px-3 justify-center items-center mb-1' : isMobile ? 'flex flex-col gap-4 w-full max-w-sm' : 'grid grid-cols-1 md:grid-cols-3 gap-8'} 
        ${!isMobile ? 'max-w-6xl w-full' : ''}
      `}>
        {/* Natalia Partyka */}
        <div 
          onClick={() => selectPlayer('natalia')}
          className={`
            bg-black/80 rounded-xl border-2 border-cyan-500 cursor-pointer hover:bg-cyan-500/10 transition-all transform hover:scale-105 overflow-hidden
            ${isMobile && !isPortrait ? 'flex-1 max-w-[180px] h-[160px]' : ''}
            ${!isMobile ? 'min-h-[400px]' : isMobile && isPortrait ? 'min-h-[120px]' : ''}
          `}
          style={buttonStyle}
        >
          {isMobile ? (
            isPortrait ? (
              // Mobile Portrait Layout - poziomy
              <div className="flex items-center p-4 gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.natalia.image}
                    alt="Natalia Partyka"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-cyan-400 font-bold text-lg mb-2">
                    Natalia Partyka
                  </h3>
                  <div className="bg-cyan-600 text-white px-3 py-1 rounded-lg">
                    <p className="font-bold text-center text-sm">
                      🏓 Paralympic Champion
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Mobile Landscape Layout - super kompaktowy
              <div className="flex flex-col h-full p-3 items-center justify-center text-center">
                <div className="w-12 h-12 mb-3 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.natalia.image}
                    alt="Natalia Partyka"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h3 className="text-cyan-400 font-bold text-sm mb-2 leading-tight">
                  Natalia Partyka
                </h3>
                
                <div className="bg-cyan-600 text-white px-2 py-1 rounded text-xs font-bold">
                  🏓 Paralympic Champion
                </div>
              </div>
            )
          ) : (
            // Desktop Layout - pionowy
            <>
              <div className="w-full h-64 border-b-2 border-cyan-500 overflow-hidden">
                <img
                  src={PLAYERS.natalia.image}
                  alt="Natalia Partyka"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-cyan-400 font-bold text-2xl mb-2">
                  Natalia Partyka
                </h3>
                
                <div className="bg-cyan-600 text-white px-4 py-2 rounded-lg mb-4">
                  <p className="text-lg font-bold text-center">🏓 Paralympic Champion</p>
                </div>
                
                <div className="text-cyan-300 text-sm space-y-1">
                  <p>• Multiple Paralympic medals</p>
                  <p>• World champion in table tennis</p>
                  <p>• Inspirational athlete</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Andrzej Grubba */}
        <div 
          onClick={() => selectPlayer('andrzej')}
          className={`
            bg-black/80 rounded-xl border-2 border-cyan-500 cursor-pointer hover:bg-cyan-500/10 transition-all transform hover:scale-105 overflow-hidden
            ${isMobile && !isPortrait ? 'flex-1 max-w-[180px] h-[160px]' : ''}
            ${!isMobile ? 'min-h-[400px]' : isMobile && isPortrait ? 'min-h-[120px]' : ''}
          `}
          style={buttonStyle}
        >
          {isMobile ? (
            isPortrait ? (
              // Mobile Portrait Layout - poziomy
              <div className="flex items-center p-4 gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.andrzej.image}
                    alt="Andrzej Grubba"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-cyan-400 font-bold text-lg mb-2">
                    Andrzej Grubba
                  </h3>
                  <div className="bg-cyan-600 text-white px-3 py-1 rounded-lg">
                    <p className="font-bold text-center text-sm">
                      🏓 World Champion
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Mobile Landscape Layout - super kompaktowy
              <div className="flex flex-col h-full p-3 items-center justify-center text-center">
                <div className="w-12 h-12 mb-3 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.andrzej.image}
                    alt="Andrzej Grubba"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h3 className="text-cyan-400 font-bold text-sm mb-2 leading-tight">
                  Andrzej Grubba
                </h3>
                
                <div className="bg-cyan-600 text-white px-2 py-1 rounded text-xs font-bold">
                  🏓 World Champion
                </div>
              </div>
            )
          ) : (
            // Desktop Layout - pionowy
            <>
              <div className="w-full h-64 border-b-2 border-cyan-500 overflow-hidden">
                <img
                  src={PLAYERS.andrzej.image}
                  alt="Andrzej Grubba"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-cyan-400 font-bold text-2xl mb-2">
                  Andrzej Grubba
                </h3>
                
                <div className="bg-cyan-600 text-white px-4 py-2 rounded-lg mb-4">
                  <p className="text-lg font-bold text-center">🏓 World Champion</p>
                </div>
                
                <div className="text-cyan-300 text-sm space-y-1">
                  <p>• Polish table tennis legend</p>
                  <p>• Multiple world championships</p>
                  <p>• Olympic medalist</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Custom Player */}
        <div className={`
          bg-black/80 rounded-xl border-2 border-cyan-500 overflow-hidden
          ${isMobile && !isPortrait ? 'flex-1 max-w-[180px] h-[160px]' : ''}
          ${!isMobile ? 'min-h-[400px]' : isMobile && isPortrait ? 'min-h-[140px]' : ''}
        `}>
          {isMobile ? (
            isPortrait ? (
              // Mobile Portrait Layout - poziomy z inputem
              <div className="flex items-center p-4 gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.custom.image}
                    alt="Custom Player"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-cyan-400 font-bold text-lg mb-2">
                    Custom Player
                  </h3>
                  <div className="bg-cyan-600 text-white px-3 py-1 rounded-lg mb-2">
                    <p className="font-bold text-center text-sm">
                      🏓 Future Champion
                    </p>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Enter your nick"
                    value={customNick}
                    onChange={(e) => setCustomNick(e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-800 text-white rounded border border-cyan-500 focus:outline-none focus:border-cyan-400 text-sm"
                    style={{
                      fontSize: '16px',
                      ...buttonStyle
                    }}
                    maxLength={12}
                  />
                  
                  <button
                    onClick={() => selectPlayer('custom')}
                    className="w-full bg-cyan-600 text-white py-1 rounded hover:bg-cyan-700 transition font-bold text-sm"
                    style={buttonStyle}
                  >
                    Select
                  </button>
                </div>
              </div>
            ) : (
              // Mobile Landscape Layout - super kompaktowy z inputem
              <div className="flex flex-col h-full p-2 items-center justify-center text-center">
                <div className="w-10 h-10 mb-2 rounded-full border-2 border-cyan-500 overflow-hidden flex-shrink-0">
                  <img
                    src={PLAYERS.custom.image}
                    alt="Custom Player"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h3 className="text-cyan-400 font-bold text-xs mb-1 leading-tight">
                  Custom Player
                </h3>
                
                <div className="bg-cyan-600 text-white px-1 py-0.5 rounded text-xs font-bold mb-2">
                  🏓 Future Champion
                </div>
                
                <input
                  type="text"
                  placeholder="Nick"
                  value={customNick}
                  onChange={(e) => setCustomNick(e.target.value)}
                  className="w-full p-1 mb-1 bg-gray-800 text-white rounded border border-cyan-500 focus:outline-none focus:border-cyan-400 text-xs text-center"
                  style={{
                    fontSize: '16px',
                    ...buttonStyle
                  }}
                  maxLength={12}
                />
                
                <button
                  onClick={() => selectPlayer('custom')}
                  className="w-full bg-cyan-600 text-white py-1 rounded hover:bg-cyan-700 transition font-bold text-xs"
                  style={buttonStyle}
                >
                  Select
                </button>
              </div>
            )
          ) : (
            // Desktop Layout - pionowy
            <>
              <div className="w-full h-64 border-b-2 border-cyan-500 overflow-hidden">
                <img
                  src={PLAYERS.custom.image}
                  alt="Custom Player"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-cyan-400 font-bold text-2xl mb-2">
                  Custom Player
                </h3>
                
                <div className="bg-cyan-600 text-white px-4 py-2 rounded-lg mb-4">
                  <p className="text-lg font-bold text-center">🏓 Future Champion</p>
                </div>
                
                <div className="text-cyan-300 text-sm mt-4 space-y-1">
                  <p>• Create your own legend</p>
                  <p>• Customize your experience</p>
                  <p>• Rise to greatness</p>
                </div>

                <input
                  type="text"
                  placeholder="Enter your nick"
                  value={customNick}
                  onChange={(e) => setCustomNick(e.target.value)}
                  className="w-full p-2 mb-2 bg-gray-800 text-white rounded border border-cyan-500 focus:outline-none focus:border-cyan-400 text-lg"
                  style={{
                    fontSize: 'inherit',
                    ...buttonStyle
                  }}
                  maxLength={12}
                />
                
                <button
                  onClick={() => selectPlayer('custom')}
                  className="w-full bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700 transition font-bold text-lg"
                  style={buttonStyle}
                >
                  Select Player
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={backToMenu}
        className={`
          bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-bold mt-4
          ${isMobile && !isPortrait ? 'text-sm' : isMobile ? 'text-base' : 'text-lg'}
        `}
        style={buttonStyle}
      >
        Back to Menu
      </button>
    </div>
  );
}

  if (gameRestarted) {
    const didPlayerWin = finalPlayerPoints === 10;
    
    return (
      <div className="w-screen flex flex-col items-center justify-top p-4 overflow-hidden" style={{ height: '100vh', ...globalMobileStyles }}>
        <BackgroundSVG />
        {isMobile ? <div/> : 
          <div className="text-center p-2 md:p-8" style={globalMobileStyles}>
            <h1 className={`font-bold text-white ${isMobile ? 'text-3xl' : 'text-6xl'}`}>
              PONG
            </h1>
          </div>  
        }
        
        <div className="text-center bg-black/80 p-4 rounded-lg border border-cyan-500/80 max-w-sm" style={globalMobileStyles}>
          <p className={`mb-4 font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: currentTheme.primary }}>
            {didPlayerWin ? 'YOU WON! 🎉' : 'YOU LOST! 😔'}
          </p>
          
          {selectedPlayer && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full border-2 overflow-hidden" style={{ borderColor: currentTheme.primary }}>
                <img
                  src={selectedPlayer.image}
                  alt={selectedPlayer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="font-bold" style={{ color: currentTheme.primary }}>{selectedPlayer.name}</p>
                <p className="text-xs text-gray-400">vs Computer</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-center gap-6 mb-4">
            <div style={{ color: currentTheme.primary }}>
              <p className="text-xs">Player</p>
              <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{finalPlayerPoints}</p>
            </div>
            <div className="text-gray-300">
              <p className="text-xs">Computer</p>
              <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{finalComputerPoints}</p>
            </div>
          </div>
          <p className={`text-yellow-400 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {isMobile ? 'Tap to play again' : 'Press SPACE to play again'}
          </p>
          {isMobile ? (
            <div className="space-x-2">
              <button
                onClick={() => selectPlayer(Object.keys(PLAYERS).find(key => PLAYERS[key].name === selectedPlayer.name) || 'custom')}
                style={{...buttonStyle, backgroundColor: currentTheme.primary}}
                className="w-50% text-white px-4 py-2 rounded-full text-sm hover:opacity-80 transition"
              >
                Play Again
              </button>
              <button
                onClick={changePlayer}
                style={buttonStyle}
                className="w-50% bg-gray-600 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-700 transition"
              >
                Change Player
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={restartGame}
                style={{...buttonStyle, backgroundColor: currentTheme.primary}}
                className="w-full text-white px-4 py-3 rounded-lg text-base hover:opacity-80 transition"
              >
                Play Again (SPACE)
              </button>
              <button
                onClick={changePlayer}
                style={buttonStyle}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg text-base hover:bg-gray-700 transition"
              >
                Change Player
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dodaj ten kod tuż przed końcowym return (przed sekcją gry)

// Ekran główny przed grą
if (!gameStarted && !gameRestarted) {
  return (
    <div className="w-screen flex flex-col items-center sm:justify-start md:justify-center p-4 overflow-hidden" style={{ height: '100vh', ...globalMobileStyles }}>
      <BackgroundSVG />
      <div className="text-center mb-6" style={globalMobileStyles}>
        <h1 className={`font-bold text-white ${isMobile ? 'text-3xl' : 'text-6xl'}`}>
          PONG
        </h1>
      </div>
      <div className="text-center bg-black/80 p-4 rounded-lg border border-cyan-500/80 max-w-sm" style={globalMobileStyles}>
        <p className={`text-cyan-300 mb-4 font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          {isMobile ? 'Tap to choose player' : 'Press SPACE to choose player'}
        </p>
        <div className="text-slate-300 text-xs space-y-1">
          <p>{isMobile ? 'Use buttons to control paddle' : 'Use ↑ and ↓ arrows'}</p>
          <p>Playing to 10 points</p>
          <p className="text-yellow-400">Ball speeds up after 5!</p>
          <p className="text-purple-400">{isMobile ? 'Tap pause button during game' : 'Press ESC to pause during game'}</p>
        </div>
        {isMobile && (
          <button
            onClick={startPlayerSelection}
            style={buttonStyle}
            className="mt-4 bg-cyan-600 text-white px-4 py-2 rounded-full text-sm hover:bg-cyan-700 transition"
          >
            Choose Player
          </button>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="w-screen flex flex-col overflow-hidden" style={{ height: '100vh', ...globalMobileStyles }}>
      <AudioManager musicType={musicType} volume={0.3} />
      <BackgroundSVG />
      

      {/* Menu pauzy */}
      {showPauseMenu && <PauseMenu />}
      
      {/* Overlay odliczania */}
      {countdown > 0 && <CountdownOverlay />}
      
      {/* Nagłówek tylko w trybie pionowym i na desktopie */}
      {(!isMobile || isPortrait) && (
        <>
          <div className="text-center py-2 flex-shrink-0" style={globalMobileStyles}>
            <h1 className={`font-bold text-white ${isMobile ? 'text-3xl' : 'text-6xl'}`}>
              PONG
            </h1>
            
            {selectedPlayer && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="w-12 h-12 rounded-full border-2 overflow-hidden" style={{ borderColor: currentTheme.primary, boxShadow: `0 0 10px ${currentTheme.primary}` }}>
                  <img
                    src={selectedPlayer.image}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: currentTheme.primary }}>
                    {selectedPlayer.name}
                  </p>
                  <p className="text-xs text-gray-400">vs Computer</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-6 mb-2 flex-shrink-0" style={globalMobileStyles}>
            <div className="bg-black/50 px-3 py-1 rounded border" style={{ borderColor: currentTheme.primary + '80' }}>
              <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: currentTheme.primary }}>{playerPoints}</p>
            </div>
            <div className="bg-black/50 px-3 py-1 rounded border border-gray-500/50">
              <p className={`text-gray-300 font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{computerPoints}</p>
            </div>
          </div>
        </>
      )}
      
      {/* Obszar gry - różny layout dla orientacji */}
      {isMobile && !isPortrait ? (
        // TRYB POZIOMY: PRZYCISK - GRA - PRZYCISK (wycentrowane)
        <div className="flex-1 flex items-start p-4 justify-center gap-4 px-4">
          {/* Lewy przycisk - UP */}
          <div className="flex items-center justify-center">
            <button
              onTouchStart={() => handleTouchStart('up')}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{...buttonStyle, backgroundColor: currentTheme.primary, height: `${gameArea.height}px`}}
              className="text-white px-8 rounded-full text-2xl select-none touch-none active:opacity-80 shadow-lg"
              disabled={isPaused}
            >
              ↑
            </button>
          </div>
          
          {/* Obszar gry w środku */}
          <div className="relative">
            <Background width={gameArea.width} height={gameArea.height} theme={currentTheme} />
            
            {/* Punkty w grze dla trybu poziomego */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-4 z-10" style={globalMobileStyles}>
              <div className="bg-black/80 px-2 py-1 rounded border text-xs" style={{ borderColor: currentTheme.primary + '80' }}>
                <p className="font-bold" style={{ color: currentTheme.primary }}>{playerPoints}</p>
              </div>
              <div className="bg-black/80 px-2 py-1 rounded border border-gray-500/50 text-xs">
                <p className="text-gray-300 font-bold">{computerPoints}</p>
              </div>
            </div>
            
            {/* Zdjęcie gracza w grze dla trybu poziomego */}
            {selectedPlayer && (
              <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 px-2 py-1 rounded-full border" style={{ borderColor: currentTheme.primary + '50' }}>
                <div className="w-6 h-6 rounded-full border overflow-hidden" style={{ borderColor: currentTheme.primary }}>
                  <img
                    src={selectedPlayer.image}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: currentTheme.primary }}>
                  {selectedPlayer.name}
                </span>
              </div>
            )}

            {/* Przycisk pauzy dla mobile landscape - po prawej stronie */}
            {gameStarted && !gameRestarted && (
              <button
                onClick={togglePause}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePause();
                }}
                data-pause-button="true"
                className="absolute top-2 right-2 bg-black/60 border border-gray-500/50 rounded-lg p-3 hover:bg-gray-700/60 transition z-20 touch-none"
                style={{...buttonStyle, minWidth: '48px', minHeight: '48px'}}
                title="Pause"
              >
                <span className="text-white text-xl">⏸️</span>
              </button>
            )}
            
            <LeftPaddle 
              gameArea={gameArea}
              paddleY={leftPaddleY}
              onMove={setLeftPaddleY}
              theme={currentTheme}
              isPaused={isPaused}
            />
            <RightPaddle 
              gameArea={gameArea}
              paddleY={rightPaddleY}
              onMove={setRightPaddleY}
              ballPosition={ballPosition}
              isMobile={isMobile}
              isPaused={isPaused}
            />
            <Ball
              gameArea={gameArea}
              setPlayerPoints={setPlayerPoints}
              setComputerPoints={setComputerPoints}
              resetPaddles={resetPaddles}
              leftPaddleY={leftPaddleY}
              rightPaddleY={rightPaddleY}
              onPositionChange={setBallPosition}
              playerPoints={playerPoints}
              isMobile={isMobile}
              theme={currentTheme}
              isPaused={isPaused}
              musicType={musicType}
            />
          </div>
          
          {/* Prawy przycisk - DOWN */}
          <div className="flex items-center">
            <button
              onTouchStart={() => handleTouchStart('down')}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{...buttonStyle, backgroundColor: currentTheme.primary, height:`${gameArea.height}px`}}
              className="text-white px-8 rounded-full text-2xl select-none touch-none active:opacity-80 shadow-lg"
              disabled={isPaused}
            >
              ↓
            </button>
          </div>
        </div>
      ) : (
        // TRYB PIONOWY I DESKTOP: Gra wycentrowana
        <div className="flex-1 flex flex-col items-center justify-start min-h-0">
          <div className="relative">
            <Background width={gameArea.width} height={gameArea.height} theme={currentTheme} />
            
            <LeftPaddle 
              gameArea={gameArea}
              paddleY={leftPaddleY}
              onMove={setLeftPaddleY}
              theme={currentTheme}
              isPaused={isPaused}
            />
            <RightPaddle 
              gameArea={gameArea}
              paddleY={rightPaddleY}
              onMove={setRightPaddleY}
              ballPosition={ballPosition}
              isMobile={isMobile}
              isPaused={isPaused}
            />
            <Ball
              gameArea={gameArea}
              setPlayerPoints={setPlayerPoints}
              setComputerPoints={setComputerPoints}
              resetPaddles={resetPaddles}
              leftPaddleY={leftPaddleY}
              rightPaddleY={rightPaddleY}
              onPositionChange={setBallPosition}
              playerPoints={playerPoints}
              isMobile={isMobile}
              theme={currentTheme}
              isPaused={isPaused}
              musicType={musicType}
            />
          </div>
          
          {/* Przycisk pauzy dla mobile portrait - pod polem gry */}
          {isMobile && isPortrait && gameStarted && !gameRestarted && (
            <div className="flex justify-center mt-4 mb-4">
              <button
                onClick={() => {
                  console.log('Pause button clicked!');
                  togglePause();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Pause button touched!');
                  togglePause();
                }}
                data-pause-button="true"
                className="bg-black/80 border border-gray-400 rounded-lg px-6 py-3 hover:bg-gray-700 transition flex items-center gap-3 touch-none shadow-lg"
                style={{...buttonStyle, minHeight: '50px'}}
              >
                <span className="text-white text-xl">⏸️</span>
                <span className="text-white text-base font-medium">Pause</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Kontrolki mobilne - tylko w trybie pionowym */}
      {isMobile && isPortrait && gameStarted && !gameRestarted && (
        <div 
          className="fixed bottom-0 left-0 right-0 px-4 z-50"
          style={{ 
            paddingBottom: '20px',
            paddingTop: '8px'
          }}
        >
          <div className="flex w-full gap-0">
            <button
              onTouchStart={() => handleTouchStart('up')}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{...buttonStyle, backgroundColor: currentTheme.primary}}
              className="text-white py-6 rounded-l-full text-2xl select-none touch-none active:opacity-80 shadow-lg flex-1"
              disabled={isPaused}
            >
              ↑
            </button>
            <button
              onTouchStart={() => handleTouchStart('down')}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{...buttonStyle, backgroundColor: currentTheme.primary}}
              className="text-white py-6 rounded-r-full text-2xl select-none touch-none active:opacity-80 shadow-lg flex-1"
              disabled={isPaused}
            >
              ↓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;