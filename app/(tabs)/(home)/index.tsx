
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 40;
const INITIAL_TARGET_WIDTH = 80;
const INITIAL_SPEED = 2;

type GameState = 'menu' | 'playing' | 'failed';
type StreakLevel = 'none' | 'bronze' | 'silver' | 'gold';

interface GameStats {
  currentStreak: number;
  bestStreak: number;
  totalTaps: number;
  perfectTaps: number;
}

export default function HomeScreen() {
  console.log('HomeScreen: Component mounted');
  
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalTaps: 0,
    perfectTaps: 0,
  });
  
  const [ballPosition] = useState(new Animated.Value(0));
  const [targetPosition, setTargetPosition] = useState(SCREEN_WIDTH / 2);
  const [targetWidth, setTargetWidth] = useState(INITIAL_TARGET_WIDTH);
  const [ballSize, setBallSize] = useState(BALL_SIZE);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [direction, setDirection] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackColor, setFeedbackColor] = useState(colors.primary);
  const [ghostPosition, setGhostPosition] = useState<number | null>(null);
  const [backgroundDarkness, setBackgroundDarkness] = useState(0);
  
  const animationRef = useRef<any>(null);
  const gameLoopRef = useRef<any>(null);

  const streakLevel: StreakLevel = 
    stats.currentStreak >= 10 ? 'gold' :
    stats.currentStreak >= 5 ? 'silver' :
    stats.currentStreak >= 3 ? 'bronze' : 'none';

  const streakLevelText = 
    streakLevel === 'gold' ? '🏆 GOLD STREAK' :
    streakLevel === 'silver' ? '🥈 SILVER STREAK' :
    streakLevel === 'bronze' ? '🥉 BRONZE STREAK' : '';

  const startGame = () => {
    console.log('User tapped Start Game button');
    setGameState('playing');
    setStats(prev => ({ ...prev, currentStreak: 0 }));
    setSpeed(INITIAL_SPEED);
    setTargetWidth(INITIAL_TARGET_WIDTH);
    setBallSize(BALL_SIZE);
    setBackgroundDarkness(0);
    ballPosition.setValue(0);
    startBallAnimation();
  };

  const startBallAnimation = () => {
    const randomTargetPos = Math.random() * (SCREEN_WIDTH - INITIAL_TARGET_WIDTH) + INITIAL_TARGET_WIDTH / 2;
    setTargetPosition(randomTargetPos);
    
    const randomTargetWidth = INITIAL_TARGET_WIDTH + (Math.random() * 40 - 20);
    setTargetWidth(randomTargetWidth);
    
    const randomBallSize = BALL_SIZE + (Math.random() * 20 - 10);
    setBallSize(randomBallSize);
    
    const currentSpeed = speed + (Math.random() * 0.5 - 0.25);
    
    const animate = () => {
      ballPosition.setValue(0);
      
      animationRef.current = Animated.timing(ballPosition, {
        toValue: SCREEN_WIDTH,
        duration: (SCREEN_WIDTH / currentSpeed) * 16,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && gameState === 'playing') {
          setDirection(prev => prev * -1);
          animate();
        }
      });
    };
    
    animate();
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;
    
    console.log('User tapped screen during game');
    
    const currentPosition = (ballPosition as any)._value;
    const targetLeft = targetPosition - targetWidth / 2;
    const targetRight = targetPosition + targetWidth / 2;
    
    const distance = Math.min(
      Math.abs(currentPosition - targetLeft),
      Math.abs(currentPosition - targetRight)
    );
    
    const isInTarget = currentPosition >= targetLeft && currentPosition <= targetRight;
    
    if (isInTarget) {
      console.log('Perfect tap! Streak:', stats.currentStreak + 1);
      handleSuccess(distance);
    } else {
      console.log('Missed! Distance:', distance.toFixed(2));
      handleFailure(distance, currentPosition);
    }
  };

  const handleSuccess = (distance: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const newStreak = stats.currentStreak + 1;
    const isPerfect = distance < 5;
    
    setStats(prev => ({
      ...prev,
      currentStreak: newStreak,
      bestStreak: Math.max(prev.bestStreak, newStreak),
      totalTaps: prev.totalTaps + 1,
      perfectTaps: isPerfect ? prev.perfectTaps + 1 : prev.perfectTaps,
    }));
    
    const feedbackMessage = isPerfect ? '🎯 PERFECT!' : '✓ SUCCESS!';
    setFeedbackText(feedbackMessage);
    setFeedbackColor(colors.highlight);
    setShowFeedback(true);
    
    setTimeout(() => setShowFeedback(false), 800);
    
    const newSpeed = speed + 0.15;
    setSpeed(newSpeed);
    
    const newTargetWidth = Math.max(40, targetWidth - 2);
    setTargetWidth(newTargetWidth);
    
    const newDarkness = Math.min(0.5, backgroundDarkness + 0.02);
    setBackgroundDarkness(newDarkness);
    
    if (animationRef.current) {
      animationRef.current.stop();
    }
    ballPosition.setValue(0);
    startBallAnimation();
  };

  const handleFailure = (distance: number, currentPosition: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    setGameState('failed');
    setGhostPosition(currentPosition);
    
    const timingError = (distance / speed * 16).toFixed(3);
    const feedbackMessage = `${timingError}s too ${currentPosition < targetPosition ? 'early' : 'late'}!`;
    
    setFeedbackText(feedbackMessage);
    setFeedbackColor(colors.primary);
    setShowFeedback(true);
    
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    setStats(prev => ({
      ...prev,
      currentStreak: 0,
      totalTaps: prev.totalTaps + 1,
    }));
  };

  const restartGame = () => {
    console.log('User tapped to restart game');
    setShowFeedback(false);
    setGhostPosition(null);
    setGameState('playing');
    setSpeed(INITIAL_SPEED);
    setTargetWidth(INITIAL_TARGET_WIDTH);
    setBallSize(BALL_SIZE);
    setBackgroundDarkness(0);
    ballPosition.setValue(0);
    startBallAnimation();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  const backgroundOpacity = `rgba(0, 0, 0, ${backgroundDarkness})`;
  const currentStreakText = `${stats.currentStreak}`;
  const bestStreakText = `Best: ${stats.bestStreak}`;
  const accuracyPercent = stats.totalTaps > 0 
    ? ((stats.perfectTaps / stats.totalTaps) * 100).toFixed(1) 
    : '0.0';
  const accuracyText = `${accuracyPercent}%`;

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.menuContainer}>
          <Text style={styles.titleMain}>EDGE OF</Text>
          <Text style={styles.titleInsanity}>INSANITY</Text>
          <Text style={styles.subtitle}>Ultimate Tap</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Best Streak</Text>
              <Text style={styles.statValue}>{bestStreakText}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Perfect Accuracy</Text>
              <Text style={styles.statValue}>{accuracyText}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>Tap when the ball enters the target zone</Text>
            <Text style={styles.instructionText}>Miss by a fraction = instant fail</Text>
            <Text style={styles.instructionText}>Build streaks for bronze, silver, gold</Text>
          </View>
        </View>
      </View>
    );
  }

  if (gameState === 'failed') {
    return (
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={restartGame}
      >
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.gameArea}>
          <View style={styles.topBar}>
            <Text style={styles.streakText}>{currentStreakText}</Text>
            {streakLevelText !== '' && (
              <Text style={styles.streakBadge}>{streakLevelText}</Text>
            )}
          </View>
          
          <View style={styles.playArea}>
            <View 
              style={[
                styles.targetZone, 
                { 
                  left: targetPosition - targetWidth / 2, 
                  width: targetWidth 
                }
              ]} 
            />
            
            {ghostPosition !== null && (
              <View style={[styles.ghostBall, { left: ghostPosition - ballSize / 2 }]}>
                <View style={[styles.ball, { width: ballSize, height: ballSize, opacity: 0.3 }]} />
              </View>
            )}
            
            <Animated.View
              style={[
                styles.ballContainer,
                {
                  transform: [{ translateX: ballPosition }],
                },
              ]}
            >
              <View style={[styles.ball, { width: ballSize, height: ballSize }]} />
            </Animated.View>
            
            <View style={[styles.perfectLine, { left: targetPosition }]} />
          </View>
          
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                {feedbackText}
              </Text>
              <Text style={styles.feedbackSubtext}>TAP TO RETRY</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={handleTap}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.darknessOverlay, { backgroundColor: backgroundOpacity }]} />
      
      <View style={styles.gameArea}>
        <View style={styles.topBar}>
          <Text style={styles.streakText}>{currentStreakText}</Text>
          {streakLevelText !== '' && (
            <Text style={styles.streakBadge}>{streakLevelText}</Text>
          )}
        </View>
        
        <View style={styles.playArea}>
          <View 
            style={[
              styles.targetZone, 
              { 
                left: targetPosition - targetWidth / 2, 
                width: targetWidth 
              }
            ]} 
          />
          
          {stats.bestStreak > 0 && (
            <View style={[styles.ghostIndicator, { left: targetPosition }]} />
          )}
          
          <Animated.View
            style={[
              styles.ballContainer,
              {
                transform: [{ translateX: ballPosition }],
              },
            ]}
          >
            <View style={[styles.ball, { width: ballSize, height: ballSize }]} />
          </Animated.View>
        </View>
        
        {showFeedback && (
          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackText}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  titleMain: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  titleInsanity: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 60,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 40,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 80,
    borderRadius: 30,
    marginBottom: 40,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 4,
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  darknessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  streakText: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.text,
  },
  streakBadge: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 8,
  },
  playArea: {
    height: 200,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 5,
  },
  targetZone: {
    position: 'absolute',
    height: 200,
    backgroundColor: colors.targetZone,
    opacity: 0.3,
  },
  perfectLine: {
    position: 'absolute',
    width: 2,
    height: 200,
    backgroundColor: colors.text,
    opacity: 0.5,
  },
  ghostIndicator: {
    position: 'absolute',
    width: 4,
    height: 200,
    backgroundColor: colors.accent,
    opacity: 0.3,
  },
  ballContainer: {
    position: 'absolute',
    left: 0,
    top: 80,
  },
  ball: {
    borderRadius: 100,
    backgroundColor: colors.text,
  },
  ghostBall: {
    position: 'absolute',
    top: 80,
    zIndex: 1,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },
});
