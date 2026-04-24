import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const RANDOM_QUESTIONS = [
  { question: 'How do you feel right now?', type: 'emotion' },
  { question: 'What color is closest to you?', type: 'observation' },
  { question: 'Describe the weather in one word', type: 'weather' },
  { question: 'What sound can you hear?', type: 'sensory' },
  { question: 'Name something you see', type: 'observation' },
  { question: 'Rate your energy: Low/Med/High', type: 'self' },
  { question: 'Indoor or outdoor?', type: 'location' },
  { question: 'Morning, afternoon, or night?', type: 'time' },
];

export interface HumanityCheckResult {
  question: string;
  doodle: { x: number; y: number; timestamp: number }[];
  timestamp: number;
  responseTime: number;
}

interface HumanityCheckProps {
  visible: boolean;
  onComplete: (result: HumanityCheckResult) => void;
  onSkip: () => void;
}

export const HumanityCheck: React.FC<HumanityCheckProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(RANDOM_QUESTIONS[0]);
  const [doodlePath, setDoodlePath] = useState<{ x: number; y: number; timestamp: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Pick random question
      const randomIndex = Math.floor(Math.random() * RANDOM_QUESTIONS.length);
      setCurrentQuestion(RANDOM_QUESTIONS[randomIndex]);
      setDoodlePath([]);
      setStartTime(Date.now());
      
      // Animate in
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDrawing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        // Convert to canvas coordinates
        const point = {
          x: gestureState.moveX - 40,
          y: gestureState.moveY - height * 0.35,
          timestamp: Date.now(),
        };
        
        setDoodlePath(prev => [...prev, point]);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
      },
    })
  ).current;

  const handleSubmit = () => {
    if (doodlePath.length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const responseTime = Date.now() - startTime;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onComplete({
      question: currentQuestion.question,
      doodle: doodlePath,
      timestamp: Date.now(),
      responseTime,
    });
  };

  const clearDoodle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDoodlePath([]);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onSkip}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: animatedValue }
        ]}
      >
        <View style={styles.container}>
          {/* Timer Bar */}
          <View style={styles.timerBar}>
            <Animated.View 
              style={[
                styles.timerProgress,
                { width: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['100%', '0%']
                })}
              ]}
            />
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>HUMANITY CHECK</Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <Text style={styles.questionHint}>Draw your response below ↓</Text>
          </View>

          {/* Drawing Canvas */}
          <View style={styles.canvasContainer}>
            <View 
              style={styles.canvas}
              {...panResponder.panHandlers}
              pointerEvents="auto"
            >
              {/* Render doodle path */}
              {doodlePath.length > 1 && (
                <View style={StyleSheet.absoluteFill}>
                  {doodlePath.map((point, index) => {
                    if (index === 0) return null;
                    const prev = doodlePath[index - 1];
                    return (
                      <View
                        key={index}
                        style={[
                          styles.doodleSegment,
                          {
                            left: prev.x,
                            top: prev.y,
                            width: Math.sqrt(
                              Math.pow(point.x - prev.x, 2) + 
                              Math.pow(point.y - prev.y, 2)
                            ),
                            transform: [{
                              rotate: `${Math.atan2(
                                point.y - prev.y,
                                point.x - prev.x
                              )}rad`
                            }],
                          }
                        ]}
                      />
                    );
                  })}
                </View>
              )}
              
              {/* Dots for each point */}
              {doodlePath.map((point, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.doodleDot,
                    {
                      left: point.x - 2,
                      top: point.y - 2,
                    }
                  ]}
                />
              ))}
            </View>

            {/* Canvas decoration - lined paper effect */}
            <View style={styles.canvasLines} pointerEvents="none">
              {[...Array(8)].map((_, i) => (
                <View key={i} style={styles.canvasLine} />
              ))}
            </View>
          </View>

          {/* Stroke counter */}
          <Text style={styles.strokeCount}>
            Strokes: {doodlePath.length}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearDoodle}>
              <Ionicons name="refresh" size={20} color={COLORS.ink} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                doodlePath.length < 10 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={doodlePath.length < 10}
            >
              <Text style={styles.submitText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 40,
    backgroundColor: COLORS.paper,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  timerBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 2,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  questionHint: {
    fontSize: 13,
    color: COLORS.pencil,
    marginTop: 8,
  },
  canvasContainer: {
    height: 200,
    backgroundColor: '#FFFEF5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvasLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
  },
  canvasLine: {
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DC',
  },
  doodleSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: COLORS.ink,
    borderRadius: 1.5,
  },
  doodleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
  },
  strokeCount: {
    fontSize: 12,
    color: COLORS.pencil,
    textAlign: 'center',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.ink,
    marginLeft: 6,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.pencil,
  },
  submitText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.pencil,
    fontWeight: '600',
  },
});

export default HumanityCheck;
