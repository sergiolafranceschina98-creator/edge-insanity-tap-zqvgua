
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, Platform, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 40;
const INITIAL_TARGET_WIDTH = 80;
const INITIAL_SPEED = 2;
const AUTO_RESTART_DELAY = 1000;

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
  
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalTaps: 0,
    perfectTaps: 0,
  });
  
  const ballPosition = useRef(new Animated.Value(0)).current;
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
  const autoRestartTimerRef = useRef<any>(null);
  const currentPositionRef = useRef(0);
  const animationDurationRef = useRef(0);

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
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    ballPosition.removeAllListeners();
    
    ballPosition.setValue(0);
    currentPositionRef.current = 0;
    
    setTimeout(() => {
      startBallAnimation();
    }, 50);
  };

  const startBallAnimation = () => {
    console.log('Starting ball animation - current position:', currentPositionRef.current);
    
    const randomTargetPos = Math.random() * (SCREEN_WIDTH - INITIAL_TARGET_WIDTH) + INITIAL_TARGET_WIDTH / 2;
    setTargetPosition(randomTargetPos);
    
    const randomTargetWidth = INITIAL_TARGET_WIDTH + (Math.random() * 40 - 20);
    setTargetWidth(randomTargetWidth);
    
    const randomBallSize = BALL_SIZE + (Math.random() * 20 - 10);
    setBallSize(randomBallSize);
    
    const currentSpeed = speed + (Math.random() * 0.5 - 0.25);
    
    const duration = (SCREEN_WIDTH / currentSpeed) * 16;
    animationDurationRef.current = duration;
    
    ballPosition.setValue(0);
    currentPositionRef.current = 0;
    
    ballPosition.removeAllListeners();
    
    ballPosition.addListener(({ value }) => {
      currentPositionRef.current = value;
    });
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(ballPosition, {
          toValue: SCREEN_WIDTH - randomBallSize,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(ballPosition, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );
    
    animationRef.current = animation;
    animation.start();
    console.log('Ball animation started successfully');
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;
    
    console.log('User tapped screen during game - ball position:', currentPositionRef.current);
    
    const currentPosition = currentPositionRef.current;
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
      animationRef.current = null;
    }
    ballPosition.removeAllListeners();
    
    ballPosition.setValue(0);
    currentPositionRef.current = 0;
    
    setTimeout(() => {
      startBallAnimation();
    }, 50);
  };

  const handleFailure = (distance: number, currentPosition: number) => {
    console.log('Player failed - starting auto-restart timer');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    setGameState('failed');
    setGhostPosition(currentPosition);
    
    const timingErrorMs = (distance / SCREEN_WIDTH) * animationDurationRef.current;
    const timingErrorSeconds = (timingErrorMs / 1000).toFixed(3);
    const feedbackMessage = `${timingErrorSeconds}s too ${currentPosition < targetPosition ? 'early' : 'late'}!`;
    
    console.log('Timing calculation - distance:', distance, 'duration:', animationDurationRef.current, 'error:', timingErrorSeconds);
    
    setFeedbackText(feedbackMessage);
    setFeedbackColor(colors.primary);
    setShowFeedback(true);
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    ballPosition.removeAllListeners();
    
    setStats(prev => ({
      ...prev,
      currentStreak: 0,
      totalTaps: prev.totalTaps + 1,
    }));

    autoRestartTimerRef.current = setTimeout(() => {
      console.log('Auto-restarting game after failure');
      restartGame();
    }, AUTO_RESTART_DELAY);
  };

  const restartGame = () => {
    console.log('Restarting game - resetting all state and animation');
    
    if (autoRestartTimerRef.current) {
      clearTimeout(autoRestartTimerRef.current);
      autoRestartTimerRef.current = null;
    }
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    ballPosition.removeAllListeners();
    
    setShowFeedback(false);
    setGhostPosition(null);
    setSpeed(INITIAL_SPEED);
    setTargetWidth(INITIAL_TARGET_WIDTH);
    setBallSize(BALL_SIZE);
    setBackgroundDarkness(0);
    
    ballPosition.setValue(0);
    currentPositionRef.current = 0;
    
    setGameState('playing');
    
    setTimeout(() => {
      console.log('Starting animation after restart delay');
      startBallAnimation();
    }, 100);
  };

  const goHome = () => {
    console.log('User tapped HOME button');
    
    if (autoRestartTimerRef.current) {
      clearTimeout(autoRestartTimerRef.current);
      autoRestartTimerRef.current = null;
    }
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    ballPosition.removeAllListeners();
    
    setShowFeedback(false);
    setGhostPosition(null);
    setGameState('menu');
    setSpeed(INITIAL_SPEED);
    setTargetWidth(INITIAL_TARGET_WIDTH);
    setBallSize(BALL_SIZE);
    setBackgroundDarkness(0);
    ballPosition.setValue(0);
    currentPositionRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (autoRestartTimerRef.current) {
        clearTimeout(autoRestartTimerRef.current);
      }
      ballPosition.removeAllListeners();
    };
  }, []);

  const backgroundOpacity = `rgba(0, 0, 0, ${backgroundDarkness})`;
  const currentStreakText = `${stats.currentStreak}`;
  const bestStreakText = `${stats.bestStreak}`;
  const accuracyPercent = stats.totalTaps > 0 
    ? ((stats.perfectTaps / stats.totalTaps) * 100).toFixed(1) 
    : '0.0';
  const accuracyText = `${accuracyPercent}%`;
  const totalTapsText = `${stats.totalTaps}`;
  const perfectTapsText = `${stats.perfectTaps}`;

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.menuContainer}>
          <Text style={styles.titleMain}>EDGE OF</Text>
          <Text style={styles.titleInsanity}>INSANITY</Text>
          <Text style={styles.subtitle}>Ultimate Tap</Text>
          
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => {
              console.log('User tapped Personal Best button');
              setShowStatsModal(true);
            }}
          >
            <Text style={styles.statsButtonText}>📊 PERSONAL BEST</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>Tap when the ball enters the target zone</Text>
            <Text style={styles.instructionText}>Miss by a fraction = instant fail</Text>
            <Text style={styles.instructionText}>Build streaks for bronze, silver, gold</Text>
          </View>
        </View>

        <Modal
          visible={showStatsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStatsModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatsModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>PERSONAL BEST</Text>
              
              <View style={styles.modalStatsContainer}>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{bestStreakText}</Text>
                  <Text style={styles.modalStatLabel}>Best Streak</Text>
                </View>
                
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{accuracyText}</Text>
                  <Text style={styles.modalStatLabel}>Perfect Accuracy</Text>
                </View>
                
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{totalTapsText}</Text>
                  <Text style={styles.modalStatLabel}>Total Taps</Text>
                </View>
                
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{perfectTapsText}</Text>
                  <Text style={styles.modalStatLabel}>Perfect Taps</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowStatsModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  if (gameState === 'failed') {
    return (
      <View style={styles.container}>
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
              <Text style={styles.feedbackSubtext}>Restarting...</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.homeButtonPlaying}
            onPress={goHome}
          >
            <Text style={styles.homeButtonPlayingText}>HOME</Text>
          </TouchableOpacity>
        </View>
      </View>
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

        <TouchableOpacity 
          style={styles.homeButtonPlaying}
          onPress={goHome}
        >
          <Text style={styles.homeButtonPlayingText}>HOME</Text>
        </TouchableOpacity>
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
    marginBottom: 40,
  },
  statsButton: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  statsButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 2,
  },
  modalStatsContainer: {
    marginBottom: 24,
  },
  modalStatCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
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
    bottom: 200,
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
  homeButtonPlaying: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    zIndex: 20,
  },
  homeButtonPlayingText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1,
  },
});
