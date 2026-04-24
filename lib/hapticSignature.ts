// Haptic Signature System for Anti-Spoofing
import * as Haptics from 'expo-haptics';
import { Gyroscope, Accelerometer } from 'expo-sensors';

// Random haptic patterns for verification
export const HAPTIC_PATTERNS = {
  PATTERN_A: [50, 100, 50], // Short, medium gap, short
  PATTERN_B: [100, 50, 100], // Medium, short gap, medium
  PATTERN_C: [30, 30, 30, 100], // Triple short, then medium
  PATTERN_D: [80, 80, 80], // Three equal
  PATTERN_E: [150, 50, 50, 50], // Long followed by triple short
};

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

// Store the expected pattern for verification
let currentPattern: HapticPattern | null = null;
let sensorReadings: { x: number; y: number; z: number; timestamp: number }[] = [];
let isRecording = false;

// Generate random pattern
export const generateRandomPattern = (): HapticPattern => {
  const patterns = Object.keys(HAPTIC_PATTERNS) as HapticPattern[];
  const randomIndex = Math.floor(Math.random() * patterns.length);
  return patterns[randomIndex];
};

// Start recording sensor data before haptic feedback
export const startSensorRecording = async () => {
  sensorReadings = [];
  isRecording = true;
  
  // Set up accelerometer for more sensitive movement detection
  Accelerometer.setUpdateInterval(10); // 100Hz sampling
  
  const subscription = Accelerometer.addListener(data => {
    if (isRecording) {
      sensorReadings.push({
        x: data.x,
        y: data.y,
        z: data.z,
        timestamp: Date.now(),
      });
    }
  });
  
  return subscription;
};

// Execute haptic pattern
export const executeHapticPattern = async (pattern: HapticPattern): Promise<void> => {
  const timings = HAPTIC_PATTERNS[pattern];
  
  for (let i = 0; i < timings.length; i++) {
    const duration = timings[i];
    
    // Different intensity based on position in pattern
    if (duration >= 100) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (duration >= 50) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Wait between vibrations
    if (i < timings.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
};

// Verify haptic signature was detected
export const verifyHapticSignature = (
  pattern: HapticPattern,
  readings: typeof sensorReadings
): { success: boolean; confidence: number; details: string } => {
  if (readings.length < 10) {
    return {
      success: false,
      confidence: 0,
      details: 'Insufficient sensor data'
    };
  }
  
  // Calculate total acceleration magnitude for each reading
  const magnitudes = readings.map(r => 
    Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
  );
  
  // Find peaks in the data (vibration events)
  const threshold = 0.3; // m/s^2 threshold for detection
  const peaks: { index: number; magnitude: number }[] = [];
  
  for (let i = 1; i < magnitudes.length - 1; i++) {
    if (magnitudes[i] > threshold && 
        magnitudes[i] > magnitudes[i - 1] && 
        magnitudes[i] > magnitudes[i + 1]) {
      peaks.push({ index: i, magnitude: magnitudes[i] });
    }
  }
  
  // Expected number of vibrations based on pattern
  const expectedVibrations = HAPTIC_PATTERNS[pattern].length;
  
  // Check if we detected the expected number of vibration events
  const vibrationCount = peaks.length;
  const countMatch = Math.abs(vibrationCount - expectedVibrations) <= 1;
  
  // Calculate average magnitude
  const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const hasSignificantMovement = avgMagnitude > 0.15;
  
  // Calculate confidence score
  let confidence = 0;
  if (countMatch) confidence += 40;
  if (hasSignificantMovement) confidence += 30;
  if (vibrationCount >= expectedVibrations - 1) confidence += 30;
  
  const success = confidence >= 60;
  
  return {
    success,
    confidence,
    details: `Detected ${vibrationCount}/${expectedVibrations} vibrations, avg magnitude: ${avgMagnitude.toFixed(3)}`
  };
};

// Full haptic challenge flow
export const performHapticChallenge = async (): Promise<{
  pattern: HapticPattern;
  verification: { success: boolean; confidence: number; details: string };
  sensorData: typeof sensorReadings;
}> => {
  // Generate random pattern
  const pattern = generateRandomPattern();
  currentPattern = pattern;
  
  // Start recording sensors
  const subscription = await startSensorRecording();
  
  // Small delay to let sensors stabilize
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Execute the pattern
  await executeHapticPattern(pattern);
  
  // Continue recording briefly after
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Stop recording
  isRecording = false;
  subscription.remove();
  
  // Verify the signature
  const verification = verifyHapticSignature(pattern, sensorReadings);
  
  return {
    pattern,
    verification,
    sensorData: sensorReadings,
  };
};

// Get human-readable pattern name
export const getPatternName = (pattern: HapticPattern): string => {
  const names: Record<HapticPattern, string> = {
    PATTERN_A: 'Heartbeat',
    PATTERN_B: 'Double Tap',
    PATTERN_C: 'Morse Code',
    PATTERN_D: 'Triple Beat',
    PATTERN_E: 'Long-Short',
  };
  return names[pattern];
};
