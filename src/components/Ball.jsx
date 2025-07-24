import { useEffect, useRef, useState, useCallback } from "react";
import ballLogo from '/src/assets/logoBlack.png'
// Importy plików audio
import wallSoundFile from '/src/assets/wall.mp3';
import paddleSoundFile from '/src/assets/paddle.mp3';

const Ball = ({ 
  gameArea, 
  setPlayerPoints, 
  setComputerPoints, 
  resetPaddles, 
  leftPaddleY, 
  rightPaddleY, 
  onPositionChange, 
  playerPoints,
  isMobile,
  theme,
  isPaused,
  musicType
}) => {
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ dx: -1, dy: -1 });
  const [renderPosition, setRenderPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animationRef = useRef(null);
  const speedRef = useRef(1);
  
  // Nowy ref do liczenia odbić w trakcie jednego punktu
  const rallyBouncesRef = useRef(0);
  const baseSpeedRef = useRef(1);

  // Web Audio API refs for better performance
  const audioContextRef = useRef(null);
  const audioBuffersRef = useRef({});
  const gainNodeRef = useRef(null);
  const lastSoundTimeRef = useRef({ wall: 0, paddle: 0 });

  const ballSize = Math.min(gameArea.width, gameArea.height) * (isMobile ? 0.07 : 0.05);
  const paddleWidth = gameArea.width * 0.02;
  const paddleHeight = gameArea.height * 0.2;

  // Initialize Web Audio API with pre-loaded buffers - only when no music is playing
  useEffect(() => {
    if (musicType !== 'mute') return; // Only play sound effects when music is muted

    const initAudio = async () => {
      try {
        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.setValueAtTime(isMobile ? 0.2 : 0.4, audioContextRef.current.currentTime);
        gainNodeRef.current.connect(audioContextRef.current.destination);

        // Load and decode audio files using imported files
        const loadAudioBuffer = async (audioFile, name) => {
          try {
            const response = await fetch(audioFile);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            audioBuffersRef.current[name] = audioBuffer;
          } catch (error) {
            console.warn(`Failed to load ${name} sound:`, error);
            // Create fallback synthetic sound
            audioBuffersRef.current[name] = createSyntheticSound(name === 'wall' ? 800 : 400);
          }
        };

        // Create synthetic sound as fallback
        const createSyntheticSound = (frequency) => {
          const sampleRate = audioContextRef.current.sampleRate;
          const duration = 0.1;
          const buffer = audioContextRef.current.createBuffer(1, sampleRate * duration, sampleRate);
          const data = buffer.getChannelData(0);
          
          for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10);
          }
          return buffer;
        };

        // Load audio files using imported paths
        await Promise.all([
          loadAudioBuffer(wallSoundFile, 'wall'),
          loadAudioBuffer(paddleSoundFile, 'paddle')
        ]);

      } catch (error) {
        console.warn('Web Audio API initialization failed:', error);
        // Disable audio if initialization fails
        audioContextRef.current = null;
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
      audioBuffersRef.current = {};
    };
  }, [musicType, isMobile]);

  // Optimized sound playing using Web Audio API - only when music is muted
  const playSound = useCallback((soundType) => {
    if (musicType !== 'mute' || !audioContextRef.current || !audioBuffersRef.current[soundType]) {
      return;
    }

    const now = performance.now();
    const minInterval = isMobile ? 80 : 50; // Longer interval on mobile
    
    if (now - lastSoundTimeRef.current[soundType] < minInterval) {
      return;
    }

    try {
      // Resume AudioContext if suspended (required by some browsers)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create buffer source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffersRef.current[soundType];
      source.connect(gainNodeRef.current);
      
      // Start playback immediately
      source.start(0);
      
      // Clean up source after playback
      source.onended = () => {
        source.disconnect();
      };

      lastSoundTimeRef.current[soundType] = now;

    } catch (error) {
      // Silently handle errors
    }
  }, [musicType, isMobile]);

  // Funkcja do obliczania realistycznego odbicia od paletki
  const calculatePaddleReflection = useCallback((ballX, ballY, ballVelX, ballVelY, paddleY, isLeft) => {
    // Oblicz pozycję kontaktu na paletce (-1 to góra, 0 to środek, 1 to dół)
    const relativeIntersectY = (ballY - paddleY) / (paddleHeight / 2);
    
    // Ograniczamy wartość do zakresu [-1, 1]
    const normalizedIntersectY = Math.max(-1, Math.min(1, relativeIntersectY));
    
    // Maksymalny kąt odbicia (w radianach) - około 60 stopni
    const maxBounceAngle = Math.PI / 3;
    
    // Oblicz kąt odbicia na podstawie miejsca trafienia
    const bounceAngle = normalizedIntersectY * maxBounceAngle;
    
    // Oblicz bazową prędkość (zachowaj energię kinetyczną)
    const speed = Math.sqrt(ballVelX * ballVelX + ballVelY * ballVelY);
    
    // Nowy kierunek X - odwróć w zależności od strony paletki
    let newDx = Math.cos(bounceAngle) * speed;
    if (isLeft) {
      newDx = Math.abs(newDx); // Piłka leci w prawo
    } else {
      newDx = -Math.abs(newDx); // Piłka leci w lewo
    }
    
    // Nowy kierunek Y - zależny od kąta odbicia
    let newDy = Math.sin(bounceAngle) * speed;
    
    // Dodaj trochę losowości dla większej nieprzewidywalności (jak w klasycznym Pongu)
    const randomFactor = 0.1;
    newDy += (Math.random() - 0.5) * randomFactor * speed;
    
    // Minimalna prędkość pozioma, żeby piłka nie leciała zbyt pionowo
    const minHorizontalSpeed = speed * 0.3;
    if (Math.abs(newDx) < minHorizontalSpeed) {
      newDx = newDx >= 0 ? minHorizontalSpeed : -minHorizontalSpeed;
    }
    
    // Ograniczenie maksymalnej prędkości pionowej
    const maxVerticalSpeed = speed * 0.8;
    if (Math.abs(newDy) > maxVerticalSpeed) {
      newDy = newDy >= 0 ? maxVerticalSpeed : -maxVerticalSpeed;
    }
    
    return { dx: newDx, dy: newDy };
  }, [paddleHeight]);

  const checkPaddleCollision = useCallback((ballX, ballY, ballVelX, ballVelY, isLeft) => {
    const ballRadius = ballSize / 2;
    const paddleY = isLeft ? leftPaddleY : rightPaddleY;
    
    const paddleX = isLeft ? 
      -gameArea.width/2 + paddleWidth/2 + gameArea.width * 0.02 : 
      gameArea.width/2 - paddleWidth/2 - gameArea.width * 0.02;
    
    // Sprawdź czy piłka leci w kierunku paletki
    if (isLeft && ballVelX >= 0) return null;
    if (!isLeft && ballVelX <= 0) return null;
    
    const ballLeft = ballX - ballRadius;
    const ballRight = ballX + ballRadius;
    const ballTop = ballY - ballRadius;
    const ballBottom = ballY + ballRadius;
    
    const paddleLeft = paddleX - paddleWidth/2;
    const paddleRight = paddleX + paddleWidth/2;
    const paddleTop = paddleY - paddleHeight/2;
    const paddleBottom = paddleY + paddleHeight/2;
    
    // Sprawdź kolizję
    const collision = ballRight > paddleLeft && ballLeft < paddleRight &&
                     ballBottom > paddleTop && ballTop < paddleBottom;
    
    if (collision) {
      // Zwiększ licznik odbić w trakcie rally
      rallyBouncesRef.current += 1;
      
      // Oblicz nową prędkość na podstawie odbicia
      const newVelocity = calculatePaddleReflection(ballX, ballY, ballVelX, ballVelY, paddleY, isLeft);
      
      // Aktualizuj prędkość na podstawie liczby odbić
      updateSpeedFromRallyBounces();
      
      console.log(`Rally bounce #${rallyBouncesRef.current}, Speed: ${speedRef.current.toFixed(3)}`);
      
      return newVelocity;
    }
    
    return null;
  }, [leftPaddleY, rightPaddleY, gameArea, ballSize, paddleWidth, paddleHeight, calculatePaddleReflection]);

  // Funkcja do aktualizacji prędkości na podstawie odbić w rally
  const updateSpeedFromRallyBounces = useCallback(() => {
    const bounces = rallyBouncesRef.current;
    
    // Przyspieszenie na podstawie odbić - stopniowe i kontrolowane
    let rallySpeedMultiplier = 1;
    
    if (bounces >= 3) rallySpeedMultiplier = 1.1;    // +10% po 3 odbiciach
    if (bounces >= 6) rallySpeedMultiplier = 1.2;    // +20% po 6 odbiciach
    if (bounces >= 10) rallySpeedMultiplier = 1.35;  // +35% po 10 odbiciach
    if (bounces >= 15) rallySpeedMultiplier = 1.5;   // +50% po 15 odbiciach
    if (bounces >= 20) rallySpeedMultiplier = 1.65;  // +65% po 20 odbiciach (max)
    
    // Aktualizuj prędkość: bazowa prędkość * rally multiplier
    speedRef.current = baseSpeedRef.current * rallySpeedMultiplier;
  }, []);

  // Ulepszone skalowanie prędkości piłki
  useEffect(() => {
    // Bazowa prędkość skalowana do rozmiaru pola gry
    const gameAreaSize = Math.sqrt(gameArea.width * gameArea.width + gameArea.height * gameArea.height);
    const baseSpeedMultiplier = isMobile ? 0.024 : 0.003; // Zmniejszone bo będzie przyspieszać w rally
    
    // Normalizacja do standardowego rozmiaru (800x600 = ~1000px diagonal)
    const standardSize = 1000;
    const sizeRatio = gameAreaSize / standardSize;
    
    // Bazowa prędkość proporcjonalna do rozmiaru gry
    const baseSpeed = gameAreaSize * baseSpeedMultiplier * sizeRatio;
    
    // Progresywne przyspieszenie w trakcie gry (na podstawie punktów)
    let gameSpeedMultiplier = 1;
    if (playerPoints >= 3) gameSpeedMultiplier = 1.1;   // +10% po 3 punktach
    if (playerPoints >= 5) gameSpeedMultiplier = 1.2;   // +20% po 5 punktach  
    if (playerPoints >= 7) gameSpeedMultiplier = 1.3;   // +30% po 7 punktach
    if (playerPoints >= 9) gameSpeedMultiplier = 1.4;   // +40% po 9 punktach
    
    // Zapisz bazową prędkość (bez rally multiplier)
    baseSpeedRef.current = baseSpeed * gameSpeedMultiplier;
    
    // Ustaw aktualną prędkość (z uwzględnieniem rally)
    updateSpeedFromRallyBounces();
    
    console.log(`Game area: ${gameArea.width}x${gameArea.height}, Base Speed: ${baseSpeedRef.current.toFixed(3)}, Rally bounces: ${rallyBouncesRef.current}`);
    
  }, [playerPoints, gameArea, isMobile, updateSpeedFromRallyBounces]);

  useEffect(() => {
    if (isPaused) return;

    // Optimize animation loop for mobile
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 60 : 60;
    const frameInterval = 1000 / targetFPS;

    const update = (currentTime) => {
      // Frame rate limiting
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      lastFrameTime = currentTime;

      let { x, y } = positionRef.current;
      let { dx, dy } = velocityRef.current;
      
      const speed = speedRef.current;
      let newX = x + dx * speed;
      let newY = y + dy * speed;
      
      // Check left paddle collision
      const leftCollision = checkPaddleCollision(newX, newY, dx, dy, true);
      if (leftCollision) {
        dx = leftCollision.dx;
        dy = leftCollision.dy;
        newX = x + dx * speed;
        newY = y + dy * speed;
        setTimeout(() => playSound('paddle'), 0);
      }
      
      // Check right paddle collision
      const rightCollision = checkPaddleCollision(newX, newY, dx, dy, false);
      if (rightCollision) {
        dx = rightCollision.dx;
        dy = rightCollision.dy;
        newX = x + dx * speed;
        newY = y + dy * speed;
        setTimeout(() => playSound('paddle'), 0);
      }
      
      // Check if ball goes out of bounds (scoring)
      if (newX <= -gameArea.width/2) {
        setComputerPoints(prev => prev + 1);
        positionRef.current = { x: 0, y: 0 };
        velocityRef.current = { dx: 1, dy: Math.random() > 0.5 ? 1 : -1 };
        setRenderPosition({ x: 0, y: 0 });
        rotationRef.current = 0;
        setRotation(0);
        // Reset rally bounces po punkcie
        rallyBouncesRef.current = 0;
        updateSpeedFromRallyBounces();
        resetPaddles();
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      
      if (newX >= gameArea.width/2) {
        setPlayerPoints(prev => prev + 1);
        positionRef.current = { x: 0, y: 0 };
        velocityRef.current = { dx: -1, dy: Math.random() > 0.5 ? 1 : -1 };
        setRenderPosition({ x: 0, y: 0 });
        rotationRef.current = 0;
        setRotation(0);
        // Reset rally bounces po punkcie
        rallyBouncesRef.current = 0;
        updateSpeedFromRallyBounces();
        resetPaddles();
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      
      // Check wall collision (top and bottom walls)
      if (newY >= gameArea.height/2 - ballSize/2 || newY <= -gameArea.height/2 + ballSize/2) {
        dy = -dy;
        newY = y + dy * speed;
        setTimeout(() => playSound('wall'), 0);
      }
      
      // Calculate rotation based on ball movement - skalowana do prędkości
      const totalSpeed = Math.sqrt(dx * dx + dy * dy) * speed;
      const rotationSpeed = totalSpeed * 0.08; // Zmniejszone z 0.1 dla płynniejszej rotacji
      rotationRef.current += rotationSpeed;
      
      positionRef.current = { x: newX, y: newY };
      velocityRef.current = { dx, dy };
      setRenderPosition({ x: newX, y: newY });
      setRotation(rotationRef.current);
      
      if (onPositionChange) {
        onPositionChange({ x: newX, y: newY });
      }
      
      animationRef.current = requestAnimationFrame(update);
    };
    
    animationRef.current = requestAnimationFrame(update);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [checkPaddleCollision, setPlayerPoints, setComputerPoints, resetPaddles, onPositionChange, gameArea, ballSize, isPaused, playSound, isMobile, updateSpeedFromRallyBounces]);

  return (
    <div
      className="rounded-full absolute"
      style={{
        width: ballSize,
        height: ballSize,
        backgroundColor: '#fff',
        transform: `translate3d(${renderPosition.x}px, ${renderPosition.y}px, 0) rotate(${rotation}deg)`,
        left: '50%',
        top: '50%',
        marginLeft: -ballSize/2,
        marginTop: -ballSize/2,
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    >
      <img src={ballLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
};

export default Ball;