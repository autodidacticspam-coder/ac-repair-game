import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMap, generateMathProblem, characters } from '../utils/gameState';
import NumberPad from './NumberPad';
import './GameScreen.css';

export default function GameScreen({ settings, selectedCharacter, onGameEnd, onStarsEarned, savedGame, onSaveGame }) {
  const [gameState, setGameState] = useState(() => {
    if (savedGame) {
      return savedGame;
    }
    const map = generateMap(settings.numACs);
    return {
      currentRound: 1,
      map,
      repairman: { ...map.repairman, direction: 'down', isMoving: false },
      activeAC: null,
      mathProblem: null,
      userAnswer: '',
      attempts: 0,
      showingAnswer: false,
      isRepairing: false,
      starsThisGame: 0,
      roundComplete: false,
    };
  });

  const gameLoopRef = useRef(null);
  const keysPressed = useRef(new Set());
  const canvasRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const tryStartRepairRef = useRef(null);
  const moveRepairmanRef = useRef(null);
  const containerRef = useRef(null);
  const audioContextRef = useRef(null);
  const musicNodesRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(settings.musicEnabled);
  const [characterImage, setCharacterImage] = useState(null);

  // Get current character data
  const currentCharacter = characters.find(c => c.id === selectedCharacter) || characters[0];

  // Check for custom character image on mount or when character changes
  useEffect(() => {
    const img = new Image();
    img.onload = () => setCharacterImage(currentCharacter.image);
    img.onerror = () => setCharacterImage(null);
    img.src = currentCharacter.image;
  }, [currentCharacter]);

  // Focus the container on mount to ensure keyboard events work
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Background music system
  const startMusic = useCallback(() => {
    if (audioContextRef.current) return; // Already playing

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.15; // Keep it quiet for background
    masterGain.connect(audioContext.destination);

    // Create a cheerful, simple melody loop
    const playMelody = () => {
      if (!audioContextRef.current) return;

      const now = audioContext.currentTime;

      // Cheerful major scale melody - kid friendly
      const melody = [
        { note: 'C4', duration: 0.25 },
        { note: 'E4', duration: 0.25 },
        { note: 'G4', duration: 0.25 },
        { note: 'E4', duration: 0.25 },
        { note: 'F4', duration: 0.25 },
        { note: 'A4', duration: 0.25 },
        { note: 'G4', duration: 0.5 },
        { note: 'E4', duration: 0.25 },
        { note: 'D4', duration: 0.25 },
        { note: 'C4', duration: 0.5 },
        { note: 'D4', duration: 0.25 },
        { note: 'E4', duration: 0.25 },
        { note: 'F4', duration: 0.25 },
        { note: 'G4', duration: 0.25 },
        { note: 'A4', duration: 0.25 },
        { note: 'G4', duration: 0.25 },
        { note: 'E4', duration: 0.25 },
        { note: 'C4', duration: 0.25 },
        { note: 'D4', duration: 0.5 },
        { note: 'G3', duration: 0.25 },
        { note: 'C4', duration: 0.75 },
      ];

      const noteFreqs = {
        'G3': 196.00, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
        'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
      };

      let time = now;
      melody.forEach(({ note, duration }) => {
        // Main melody oscillator
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'triangle'; // Soft, kid-friendly tone
        osc.frequency.value = noteFreqs[note];

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
        gain.gain.linearRampToValueAtTime(0.2, time + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, time + duration * 0.9);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(time);
        osc.stop(time + duration);

        time += duration;
      });

      // Add a simple bass line
      const bassNotes = [
        { note: 'C4', duration: 1 },
        { note: 'G3', duration: 1 },
        { note: 'C4', duration: 1 },
        { note: 'G3', duration: 1 },
        { note: 'C4', duration: 1 },
        { note: 'G3', duration: 0.5 },
        { note: 'C4', duration: 0.5 },
      ];

      let bassTime = now;
      bassNotes.forEach(({ note, duration }) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = noteFreqs[note] / 2; // One octave lower

        gain.gain.setValueAtTime(0.15, bassTime);
        gain.gain.linearRampToValueAtTime(0.1, bassTime + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, bassTime + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(bassTime);
        osc.stop(bassTime + duration);

        bassTime += duration;
      });

      // Calculate total duration and schedule next loop
      const totalDuration = melody.reduce((sum, n) => sum + n.duration, 0);
      musicNodesRef.current = setTimeout(() => playMelody(), totalDuration * 1000);
    };

    playMelody();
    musicNodesRef.current = { masterGain };
  }, []);

  const stopMusic = useCallback(() => {
    if (musicNodesRef.current && typeof musicNodesRef.current === 'number') {
      clearTimeout(musicNodesRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    musicNodesRef.current = null;
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      stopMusic();
      setMusicPlaying(false);
    } else {
      startMusic();
      setMusicPlaying(true);
    }
  }, [musicPlaying, startMusic, stopMusic]);

  // Start/stop music based on setting
  useEffect(() => {
    if (settings.musicEnabled && musicPlaying) {
      startMusic();
    }
    return () => stopMusic();
  }, []);

  // Keep ref in sync with state (set immediately, not in useEffect)
  gameStateRef.current = gameState;

  // Save game state whenever it changes
  useEffect(() => {
    onSaveGame(gameState);
  }, [gameState, onSaveGame]);

  // Movement handling
  const moveRepairman = useCallback((dx, dy, direction) => {
    setGameState(prev => {
      if (prev.activeAC || prev.roundComplete) return prev;

      const speed = 10;
      let newX = prev.repairman.x + dx * speed;
      let newY = prev.repairman.y + dy * speed;

      // Boundary checks
      const margin = 20;
      newX = Math.max(margin, Math.min(prev.map.mapWidth - prev.repairman.width - margin, newX));
      newY = Math.max(margin, Math.min(prev.map.mapHeight - prev.repairman.height - margin, newY));

      // Collision with house
      if (rectsCollide(
        { x: newX, y: newY, width: prev.repairman.width, height: prev.repairman.height },
        prev.map.house
      )) {
        return { ...prev, repairman: { ...prev.repairman, direction, isMoving: false } };
      }

      // Trees are purely decorative - no collision

      return {
        ...prev,
        repairman: { ...prev.repairman, x: newX, y: newY, direction, isMoving: true }
      };
    });
  }, []);

  // Set ref immediately (not in useEffect to avoid race condition)
  moveRepairmanRef.current = moveRepairman;

  // Refs for keyboard handlers to access latest state
  const handleNumberInputRef = useRef(null);
  const handleSubmitRef = useRef(null);
  const handleBackspaceRef = useRef(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Movement keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key.toLowerCase());
      }

      // Space bar to start repair (only when not in math modal)
      if (e.key === ' ') {
        const currentState = gameStateRef.current;
        if (!currentState.mathProblem) {
          e.preventDefault();
          if (tryStartRepairRef.current) {
            tryStartRepairRef.current();
          }
        }
      }

      // Number keys for math input
      if (/^[0-9]$/.test(e.key)) {
        const currentState = gameStateRef.current;
        if (currentState.mathProblem && !currentState.showingAnswer) {
          e.preventDefault();
          if (handleNumberInputRef.current) {
            handleNumberInputRef.current(e.key);
          }
        }
      }

      // Enter to submit answer
      if (e.key === 'Enter') {
        const currentState = gameStateRef.current;
        if (currentState.mathProblem && !currentState.showingAnswer) {
          e.preventDefault();
          if (handleSubmitRef.current) {
            handleSubmitRef.current();
          }
        }
      }

      // Backspace to delete last digit
      if (e.key === 'Backspace') {
        const currentState = gameStateRef.current;
        if (currentState.mathProblem && !currentState.showingAnswer) {
          e.preventDefault();
          if (handleBackspaceRef.current) {
            handleBackspaceRef.current();
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
      if (keysPressed.current.size === 0) {
        setGameState(prev => ({
          ...prev,
          repairman: { ...prev.repairman, isMoving: false }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop for smooth movement
  useEffect(() => {
    const gameLoop = () => {
      const keys = keysPressed.current;

      if (keys.has('arrowup') || keys.has('w')) {
        if (moveRepairmanRef.current) moveRepairmanRef.current(0, -1, 'up');
      }
      if (keys.has('arrowdown') || keys.has('s')) {
        if (moveRepairmanRef.current) moveRepairmanRef.current(0, 1, 'down');
      }
      if (keys.has('arrowleft') || keys.has('a')) {
        if (moveRepairmanRef.current) moveRepairmanRef.current(-1, 0, 'left');
      }
      if (keys.has('arrowright') || keys.has('d')) {
        if (moveRepairmanRef.current) moveRepairmanRef.current(1, 0, 'right');
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []); // No dependencies - uses refs

  // Check if near an AC - uses ref to always get current state
  const getNearbyAC = useCallback(() => {
    const currentState = gameStateRef.current;
    const { repairman, map } = currentState;
    const repairmanCenter = {
      x: repairman.x + repairman.width / 2,
      y: repairman.y + repairman.height / 2
    };

    for (const ac of map.acs) {
      if (ac.fixed) continue;

      const acCenter = {
        x: ac.x + ac.width / 2,
        y: ac.y + ac.height / 2
      };

      const distance = Math.hypot(repairmanCenter.x - acCenter.x, repairmanCenter.y - acCenter.y);
      if (distance < 120) {
        return ac;
      }
    }
    return null;
  }, []);

  const tryStartRepair = useCallback(() => {
    const currentState = gameStateRef.current;
    if (currentState.activeAC || currentState.roundComplete) return;

    const nearbyAC = getNearbyAC();
    if (nearbyAC) {
      const problem = generateMathProblem(settings.mathMode, settings.minValue1, settings.maxValue1, settings.minValue2, settings.maxValue2, settings.blankMode);
      setGameState(prev => ({
        ...prev,
        isRepairing: true,
        activeAC: nearbyAC,
        mathProblem: problem,
        userAnswer: '',
        attempts: 0,
      }));

      // Play tool animation (simulate with timeout)
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isRepairing: false }));
      }, 500);
    }
  }, [getNearbyAC, settings.mathMode, settings.minValue, settings.maxValue]);

  // Set ref immediately (not in useEffect to avoid race condition)
  tryStartRepairRef.current = tryStartRepair;

  const handleNumberInput = useCallback((num) => {
    setGameState(prev => {
      if (prev.showingAnswer) return prev;
      return {
        ...prev,
        userAnswer: prev.userAnswer + num
      };
    });
  }, []);

  // Set ref immediately
  handleNumberInputRef.current = handleNumberInput;

  const handleClear = useCallback(() => {
    setGameState(prev => ({ ...prev, userAnswer: '' }));
  }, []);

  const handleBackspace = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      userAnswer: prev.userAnswer.slice(0, -1)
    }));
  }, []);

  // Set ref immediately
  handleBackspaceRef.current = handleBackspace;

  const handleSubmit = useCallback(() => {
    const currentState = gameStateRef.current;
    if (currentState.showingAnswer || !currentState.userAnswer) return;

    const userNum = parseInt(currentState.userAnswer, 10);
    const correct = userNum === currentState.mathProblem.answer;

    if (correct) {
      // Play AC startup sound
      playACSound();

      setGameState(prev => {
        // Mark AC as fixed
        const newAcs = prev.map.acs.map(ac =>
          ac.id === prev.activeAC.id ? { ...ac, fixed: true } : ac
        );

        const allFixed = newAcs.every(ac => ac.fixed);
        const newStars = prev.starsThisGame + 1;

        if (allFixed) {
          // Round complete
          if (prev.currentRound >= settings.numRounds) {
            // Game complete - will be handled after state update
            setTimeout(() => {
              onStarsEarned(newStars);
              onGameEnd(newStars);
            }, 0);
            return prev; // Return unchanged, game ending
          } else {
            // Next round
            return {
              ...prev,
              roundComplete: true,
              starsThisGame: newStars,
              map: { ...prev.map, acs: newAcs },
              activeAC: null,
              mathProblem: null,
            };
          }
        } else {
          return {
            ...prev,
            map: { ...prev.map, acs: newAcs },
            activeAC: null,
            mathProblem: null,
            userAnswer: '',
            starsThisGame: newStars,
          };
        }
      });
    } else {
      // Wrong answer
      setGameState(prev => {
        const newAttempts = prev.attempts + 1;

        if (newAttempts >= 5) {
          // Show answer and move on
          setTimeout(() => {
            setGameState(innerPrev => {
              // Mark AC as fixed anyway (no star)
              const newAcs = innerPrev.map.acs.map(ac =>
                ac.id === innerPrev.activeAC.id ? { ...ac, fixed: true } : ac
              );

              const allFixed = newAcs.every(ac => ac.fixed);

              if (allFixed) {
                if (innerPrev.currentRound >= settings.numRounds) {
                  setTimeout(() => {
                    onStarsEarned(innerPrev.starsThisGame);
                    onGameEnd(innerPrev.starsThisGame);
                  }, 0);
                  return innerPrev;
                } else {
                  return {
                    ...innerPrev,
                    roundComplete: true,
                    map: { ...innerPrev.map, acs: newAcs },
                    activeAC: null,
                    mathProblem: null,
                    showingAnswer: false,
                  };
                }
              } else {
                return {
                  ...innerPrev,
                  map: { ...innerPrev.map, acs: newAcs },
                  activeAC: null,
                  mathProblem: null,
                  userAnswer: '',
                  showingAnswer: false,
                };
              }
            });
          }, 3000);

          return {
            ...prev,
            attempts: newAttempts,
            showingAnswer: true,
          };
        } else {
          return {
            ...prev,
            attempts: newAttempts,
            userAnswer: '',
          };
        }
      });
    }
  }, [settings.numRounds, onStarsEarned, onGameEnd]);

  // Set ref immediately
  handleSubmitRef.current = handleSubmit;

  const startNextRound = () => {
    const newMap = generateMap(settings.numACs);
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      map: newMap,
      repairman: { ...newMap.repairman, direction: 'down', isMoving: false },
      roundComplete: false,
    }));
  };

  const playACSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const duration = 5.0; // Total sound duration

    // Random variant for different AC unit sounds
    const variant = Math.floor(Math.random() * 6);

    // Master gain for overall volume control
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.connect(audioContext.destination);

    // === 1. INITIAL ELECTRICAL CLICK/RELAY SOUND ===
    const clickBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.08, audioContext.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      // Sharp transient with quick decay
      const t = i / audioContext.sampleRate;
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.8;
    }
    const clickSource = audioContext.createBufferSource();
    clickSource.buffer = clickBuffer;
    const clickFilter = audioContext.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 800 + variant * 200;
    clickFilter.Q.value = 2;
    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0.7, now);
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(masterGain);
    clickSource.start(now);

    // === 2. COMPRESSOR THUNK (low frequency impact) ===
    const thunkOsc = audioContext.createOscillator();
    const thunkGain = audioContext.createGain();
    const thunkFilter = audioContext.createBiquadFilter();
    thunkOsc.type = 'sine';
    thunkOsc.frequency.setValueAtTime(80 + variant * 10, now + 0.05);
    thunkOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    thunkFilter.type = 'lowpass';
    thunkFilter.frequency.value = 150;
    thunkGain.gain.setValueAtTime(0, now);
    thunkGain.gain.linearRampToValueAtTime(0.5, now + 0.06);
    thunkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    thunkOsc.connect(thunkFilter);
    thunkFilter.connect(thunkGain);
    thunkGain.connect(masterGain);
    thunkOsc.start(now + 0.05);
    thunkOsc.stop(now + 0.6);

    // === 3. MOTOR SPIN-UP (increasing frequency whine) ===
    const motorOsc = audioContext.createOscillator();
    const motorGain = audioContext.createGain();
    const motorFilter = audioContext.createBiquadFilter();
    motorOsc.type = 'sawtooth';
    // Start slow, speed up to operating frequency over longer time
    const baseMotorFreq = 55 + variant * 5;
    motorOsc.frequency.setValueAtTime(baseMotorFreq * 0.2, now + 0.15);
    motorOsc.frequency.exponentialRampToValueAtTime(baseMotorFreq * 0.6, now + 1.5);
    motorOsc.frequency.exponentialRampToValueAtTime(baseMotorFreq, now + 2.5);
    motorOsc.frequency.setValueAtTime(baseMotorFreq, now + 2.5);
    motorFilter.type = 'lowpass';
    motorFilter.frequency.setValueAtTime(150, now + 0.15);
    motorFilter.frequency.linearRampToValueAtTime(300 + variant * 50, now + 2.5);
    motorFilter.frequency.setValueAtTime(300 + variant * 50, now + 2.5);
    motorGain.gain.setValueAtTime(0, now + 0.15);
    motorGain.gain.linearRampToValueAtTime(0.1, now + 0.8);
    motorGain.gain.linearRampToValueAtTime(0.12, now + 2.0);
    motorGain.gain.setValueAtTime(0.1, now + 3.5);
    motorGain.gain.linearRampToValueAtTime(0, now + duration);
    motorOsc.connect(motorFilter);
    motorFilter.connect(motorGain);
    motorGain.connect(masterGain);
    motorOsc.start(now + 0.15);
    motorOsc.stop(now + duration);

    // === 4. FAN WHOOSH (filtered noise that speeds up) ===
    const fanBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const fanData = fanBuffer.getChannelData(0);
    for (let i = 0; i < fanData.length; i++) {
      fanData[i] = Math.random() * 2 - 1;
    }
    const fanSource = audioContext.createBufferSource();
    fanSource.buffer = fanBuffer;
    const fanFilter = audioContext.createBiquadFilter();
    fanFilter.type = 'bandpass';
    fanFilter.frequency.setValueAtTime(80, now + 0.2);
    fanFilter.frequency.exponentialRampToValueAtTime(200 + variant * 30, now + 2.0);
    fanFilter.frequency.exponentialRampToValueAtTime(300 + variant * 40, now + 3.0);
    fanFilter.Q.value = 0.5;
    const fanGain = audioContext.createGain();
    fanGain.gain.setValueAtTime(0, now + 0.2);
    fanGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
    fanGain.gain.linearRampToValueAtTime(0.15, now + 2.5);
    fanGain.gain.setValueAtTime(0.12, now + 3.5);
    fanGain.gain.linearRampToValueAtTime(0, now + duration);
    fanSource.connect(fanFilter);
    fanFilter.connect(fanGain);
    fanGain.connect(masterGain);
    fanSource.start(now + 0.2);

    // === 5. COMPRESSOR HUM (low drone with harmonics) ===
    const hum1 = audioContext.createOscillator();
    const hum2 = audioContext.createOscillator();
    const hum3 = audioContext.createOscillator();
    const humGain = audioContext.createGain();
    const humFilter = audioContext.createBiquadFilter();
    const humFreq = 58 + variant * 2; // ~60Hz hum with variation
    hum1.type = 'sine';
    hum1.frequency.value = humFreq;
    hum2.type = 'sine';
    hum2.frequency.value = humFreq * 2; // 2nd harmonic
    hum3.type = 'sine';
    hum3.frequency.value = humFreq * 3; // 3rd harmonic
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 250;
    humGain.gain.setValueAtTime(0, now + 0.3);
    humGain.gain.linearRampToValueAtTime(0.04, now + 1.0);
    humGain.gain.linearRampToValueAtTime(0.06, now + 2.0);
    humGain.gain.setValueAtTime(0.06, now + 3.5);
    humGain.gain.linearRampToValueAtTime(0, now + duration);

    const hum1Gain = audioContext.createGain();
    hum1Gain.gain.value = 0.5;
    const hum2Gain = audioContext.createGain();
    hum2Gain.gain.value = 0.3;
    const hum3Gain = audioContext.createGain();
    hum3Gain.gain.value = 0.15;

    hum1.connect(hum1Gain);
    hum2.connect(hum2Gain);
    hum3.connect(hum3Gain);
    hum1Gain.connect(humFilter);
    hum2Gain.connect(humFilter);
    hum3Gain.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(masterGain);

    hum1.start(now + 0.3);
    hum2.start(now + 0.3);
    hum3.start(now + 0.3);
    hum1.stop(now + duration);
    hum2.stop(now + duration);
    hum3.stop(now + duration);

    // === 6. VIBRATION/RATTLE (subtle mechanical noise) ===
    const rattleOsc = audioContext.createOscillator();
    const rattleGain = audioContext.createGain();
    const rattleFilter = audioContext.createBiquadFilter();
    rattleOsc.type = 'triangle';
    rattleOsc.frequency.setValueAtTime(220 + variant * 30, now + 0.5);
    // Add slight wobble
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 8 + variant;
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(rattleOsc.frequency);
    rattleFilter.type = 'bandpass';
    rattleFilter.frequency.value = 300 + variant * 50;
    rattleFilter.Q.value = 5;
    rattleGain.gain.setValueAtTime(0, now + 0.5);
    rattleGain.gain.linearRampToValueAtTime(0.02, now + 1.2);
    rattleGain.gain.linearRampToValueAtTime(0.03, now + 2.5);
    rattleGain.gain.setValueAtTime(0.025, now + 3.5);
    rattleGain.gain.linearRampToValueAtTime(0, now + duration);
    rattleOsc.connect(rattleFilter);
    rattleFilter.connect(rattleGain);
    rattleGain.connect(masterGain);
    lfo.start(now + 0.5);
    rattleOsc.start(now + 0.5);
    lfo.stop(now + duration);
    rattleOsc.stop(now + duration);

    // === 7. STEADY-STATE AIRFLOW (continuous white noise at the end) ===
    const airflowBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const airflowData = airflowBuffer.getChannelData(0);
    for (let i = 0; i < airflowData.length; i++) {
      airflowData[i] = Math.random() * 2 - 1;
    }
    const airflowSource = audioContext.createBufferSource();
    airflowSource.buffer = airflowBuffer;
    const airflowFilter = audioContext.createBiquadFilter();
    airflowFilter.type = 'lowpass';
    airflowFilter.frequency.value = 800 + variant * 100;
    const airflowGain = audioContext.createGain();
    airflowGain.gain.setValueAtTime(0, now + 2.0);
    airflowGain.gain.linearRampToValueAtTime(0.08, now + 3.0);
    airflowGain.gain.setValueAtTime(0.08, now + 4.0);
    airflowGain.gain.linearRampToValueAtTime(0, now + duration);
    airflowSource.connect(airflowFilter);
    airflowFilter.connect(airflowGain);
    airflowGain.connect(masterGain);
    airflowSource.start(now + 2.0);
  };

  const nearbyAC = getNearbyAC();

  return (
    <div className="game-screen" ref={containerRef} tabIndex={-1}>
      <div className="game-hud">
        <div className="hud-item">
          Round: {gameState.currentRound} / {settings.numRounds}
        </div>
        <div className="hud-item">
          <span className="star-icon">⭐</span> {gameState.starsThisGame}
        </div>
        <div className="hud-item">
          ACs Fixed: {gameState.map.acs.filter(ac => ac.fixed).length} / {settings.numACs}
        </div>
        <button className="music-toggle" onClick={toggleMusic} title={musicPlaying ? 'Turn music off' : 'Turn music on'}>
          {musicPlaying ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="game-container">
        <div
          className="game-map isometric"
          style={{ width: gameState.map.mapWidth, height: gameState.map.mapHeight }}
        >
          {/* Grass background */}
          <div className="grass-bg"></div>

          {/* House */}
          <div
            className="house"
            style={{
              left: gameState.map.house.x,
              top: gameState.map.house.y,
              width: gameState.map.house.width,
              height: gameState.map.house.height,
            }}
          >
            <div className="house-roof"></div>
            <div className="house-body">
              <div className="house-door"></div>
              <div className="house-window"></div>
              <div className="house-window"></div>
            </div>
          </div>

          {/* Obstacles */}
          {gameState.map.obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className={`obstacle ${obstacle.type}`}
              style={{
                left: obstacle.x,
                top: obstacle.y,
                width: obstacle.width,
                height: obstacle.height,
              }}
            />
          ))}

          {/* AC Units */}
          {gameState.map.acs.map(ac => (
            <div
              key={ac.id}
              className={`ac-unit variant-${ac.variant} ${ac.fixed ? 'fixed' : 'broken'} ${gameState.activeAC?.id === ac.id ? 'active' : ''}`}
              style={{
                left: ac.x,
                top: ac.y,
                width: ac.width,
                height: ac.height,
              }}
            >
              <div className="ac-body">
                <div className="ac-vent"></div>
                <div className="ac-vent"></div>
                <div className="ac-vent"></div>
              </div>
              <div className={`ac-light ${ac.fixed ? 'green' : 'red'}`}></div>
              {!ac.fixed && <div className="ac-smoke"></div>}
            </div>
          ))}

          {/* Repairman */}
          <div
            className={`repairman direction-${gameState.repairman.direction} ${gameState.repairman.isMoving ? 'walking' : ''} ${gameState.isRepairing ? 'repairing' : ''}`}
            style={{
              left: gameState.repairman.x,
              top: gameState.repairman.y,
              width: gameState.repairman.width,
              height: gameState.repairman.height,
            }}
          >
            {characterImage ? (
              <img
                src={characterImage}
                alt="Character"
                className="character-sprite"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div className="repairman-body">
                <div className="repairman-head"></div>
                <div className="repairman-torso" style={{ background: `linear-gradient(180deg, ${currentCharacter.color} 0%, ${currentCharacter.color}dd 100%)` }}></div>
                <div className="repairman-legs"></div>
              </div>
            )}
            {gameState.isRepairing && <div className="tool-animation">🔧</div>}
          </div>

          {/* Interaction prompt */}
          {nearbyAC && !gameState.activeAC && !gameState.roundComplete && (
            <div
              className="interaction-prompt"
              style={{
                left: nearbyAC.x + nearbyAC.width / 2,
                top: nearbyAC.y - 40,
              }}
            >
              Press SPACE to repair
            </div>
          )}
        </div>

        {/* Math Problem Modal */}
        {gameState.mathProblem && !gameState.isRepairing && (
          <div className="math-modal">
            <div className="math-content">
              <h2>Fix the AC!</h2>
              <div className="math-problem">
                {gameState.mathProblem.displayType === 'blank' ? (
                  <>{gameState.mathProblem.num1} {gameState.mathProblem.operation} <span className="blank-box">?</span> = {gameState.mathProblem.result}</>
                ) : (
                  <>{gameState.mathProblem.num1} {gameState.mathProblem.operation} {gameState.mathProblem.num2} = ?</>
                )}
              </div>

              {gameState.showingAnswer ? (
                <div className="answer-reveal">
                  The answer was: {gameState.mathProblem.answer}
                </div>
              ) : (
                <>
                  <div className="answer-display">
                    {gameState.userAnswer || '?'}
                  </div>

                  <div className="attempts-display">
                    Attempts: {gameState.attempts} / 5
                  </div>

                  <NumberPad
                    onNumber={handleNumberInput}
                    onClear={handleClear}
                    onBackspace={handleBackspace}
                    onSubmit={handleSubmit}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Round Complete Modal */}
        {gameState.roundComplete && (
          <div className="round-modal">
            <div className="round-content">
              <h2>Round {gameState.currentRound} Complete!</h2>
              <p>Stars earned this game: {gameState.starsThisGame}</p>
              <button onClick={startNextRound}>
                Next Round ({gameState.currentRound + 1} / {settings.numRounds})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Controls - Always Visible */}
      <div className="game-controls">
        <div className="dpad">
          <button
            className="dpad-btn up"
            onTouchStart={() => keysPressed.current.add('arrowup')}
            onTouchEnd={() => { keysPressed.current.delete('arrowup'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
            onMouseDown={() => keysPressed.current.add('arrowup')}
            onMouseUp={() => { keysPressed.current.delete('arrowup'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
            onMouseLeave={() => { keysPressed.current.delete('arrowup'); }}
          >↑</button>
          <div className="dpad-middle">
            <button
              className="dpad-btn left"
              onTouchStart={() => keysPressed.current.add('arrowleft')}
              onTouchEnd={() => { keysPressed.current.delete('arrowleft'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
              onMouseDown={() => keysPressed.current.add('arrowleft')}
              onMouseUp={() => { keysPressed.current.delete('arrowleft'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
              onMouseLeave={() => { keysPressed.current.delete('arrowleft'); }}
            >←</button>
            <button
              className="dpad-btn right"
              onTouchStart={() => keysPressed.current.add('arrowright')}
              onTouchEnd={() => { keysPressed.current.delete('arrowright'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
              onMouseDown={() => keysPressed.current.add('arrowright')}
              onMouseUp={() => { keysPressed.current.delete('arrowright'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
              onMouseLeave={() => { keysPressed.current.delete('arrowright'); }}
            >→</button>
          </div>
          <button
            className="dpad-btn down"
            onTouchStart={() => keysPressed.current.add('arrowdown')}
            onTouchEnd={() => { keysPressed.current.delete('arrowdown'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
            onMouseDown={() => keysPressed.current.add('arrowdown')}
            onMouseUp={() => { keysPressed.current.delete('arrowdown'); setGameState(prev => ({ ...prev, repairman: { ...prev.repairman, isMoving: false } })); }}
            onMouseLeave={() => { keysPressed.current.delete('arrowdown'); }}
          >↓</button>
          <div className="control-hint">Arrow keys / WASD</div>
        </div>
        <div className="action-section">
          <button
            className="action-btn"
            onClick={tryStartRepair}
            disabled={!!gameState.mathProblem}
          >
            🔧 Repair
          </button>
          <div className="control-hint">Spacebar</div>
        </div>
      </div>
    </div>
  );
}

function rectsCollide(rect1, rect2) {
  return !(rect1.x + rect1.width < rect2.x ||
           rect2.x + rect2.width < rect1.x ||
           rect1.y + rect1.height < rect2.y ||
           rect2.y + rect2.height < rect1.y);
}
