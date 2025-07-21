import { useEffect, useRef } from 'react';

import paddleHitSound from '/src/assets/paddle.mp3';
import wallHitSound from '/src/assets/wall.mp3';

import retroMusic from '/src/assets/music/retro.mp3'
import chillMusic from '/src/assets/music/chill.mp3'
import rockMusic from '/src/assets/music/rock.mp3'

// Eksportuj funkcję do odtwarzania efektów:
export const playSound = (soundName, volume = 0.5) => {
  const sounds = {
    paddleHit: paddleHitSound,
    wallHit: wallHitSound,
    score: scoreSound
  };
  
  if (sounds[soundName]) {
    const audio = new Audio(sounds[soundName]);
    audio.volume = volume;
    audio.play().catch(e => console.log('Error playing sound:', e));
  }
};

const AudioManager = ({ musicType, volume = 0.3 }) => {
  const audioRef = useRef(null);

  const musicTracks = {
    retro: retroMusic,
    chill: chillMusic, 
    rock: rockMusic
  };

  useEffect(() => {
    // Stop current music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Start new music if not muted
    if (musicType !== 'mute' && musicTracks[musicType]) {
      audioRef.current = new Audio(musicTracks[musicType]);
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      audioRef.current.play().catch(error => {
        console.log('Music autoplay blocked:', error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicType, volume]);

  return null; // This component doesn't render anything
};

export default AudioManager;