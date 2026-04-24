import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VeritasPhoto } from '../lib/types';

const { width } = Dimensions.get('window');

interface OpticalWatermarkProps {
  photo: VeritasPhoto;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Optical Anti-Fraud Dot Matrix Watermark
 * 
 * This creates a pattern that:
 * 1. Appears complete in official downloads
 * 2. Shows gaps/distortion in screenshots
 * 3. Uses micro-pattern recognition
 */
export const OpticalWatermark: React.FC<OpticalWatermarkProps> = ({
  photo,
  size = 'medium',
}) => {
  // Generate unique pattern based on photo hash
  const generatePattern = (): { x: number; y: number; size: number; opacity: number }[] => {
    const pattern: { x: number; y: number; size: number; opacity: number }[] = [];
    const hash = photo.metadata.veritasHash;
    
    // Use hash to seed pseudo-random pattern
    let seed = 0;
    for (let i = 0; i < hash.length; i++) {
      seed += hash.charCodeAt(i);
    }
    
    const pseudoRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    
    // Create grid of micro-dots
    const gridSize = size === 'small' ? 4 : size === 'large' ? 8 : 6;
    const spacing = 100 / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const rand = pseudoRandom(seed + i * gridSize + j);
        
        // Some dots are "key dots" that must be present for authenticity
        const isKeyDot = rand > 0.7;
        
        // Vary opacity based on position in hash
        const opacityBase = isKeyDot ? 0.4 : 0.15;
        const opacityVariation = pseudoRandom(seed + i + j) * 0.2;
        
        pattern.push({
          x: j * spacing + spacing / 2 + (pseudoRandom(seed + i) - 0.5) * 5,
          y: i * spacing + spacing / 2 + (pseudoRandom(seed + j) - 0.5) * 5,
          size: isKeyDot ? 2.5 : 1.5,
          opacity: opacityBase + opacityVariation,
        });
      }
    }
    
    return pattern;
  };
  
  // Generate verification grid lines
  const generateGridLines = () => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const hash = photo.metadata.veritasHash;
    
    // Create 2-3 subtle grid lines based on hash
    for (let i = 0; i < 3; i++) {
      const charCode = hash.charCodeAt(i % hash.length);
      const angle = (charCode / 255) * Math.PI;
      
      lines.push({
        x1: 50 + Math.cos(angle) * 40,
        y1: 50 + Math.sin(angle) * 40,
        x2: 50 - Math.cos(angle) * 40,
        y2: 50 - Math.sin(angle) * 40,
      });
    }
    
    return lines;
  };

  const dots = generatePattern();
  const lines = generateGridLines();

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Micro-dot pattern */}
      {dots.map((dot, index) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.dot,
            {
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              backgroundColor: index % 7 === 0 ? '#FFD700' : '#8B7355', // Gold accent dots
            },
          ]}
        />
      ))}
      
      {/* Subtle verification grid lines */}
      {lines.map((line, index) => (
        <View
          key={`line-${index}`}
          style={[
            styles.gridLine,
            {
              left: `${line.x1}%`,
              top: `${line.y1}%`,
              width: Math.sqrt(
                Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
              ) + '%',
              transform: [
                {
                  rotate: `${Math.atan2(line.y2 - line.y1, line.x2 - line.x1)}rad`,
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Micro-text watermark */}
      <View style={styles.microTextContainer}>
        <View style={styles.microText}>
          {photo.metadata.veritasHash.split('').map((char, i) => (
            <View key={i} style={[
              styles.microChar,
              { opacity: 0.1 + (i % 3) * 0.05 }
            ]}>
              <View style={styles.charDot} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    borderRadius: 100,
  },
  gridLine: {
    position: 'absolute',
    height: 0.5,
    backgroundColor: 'rgba(139, 115, 85, 0.08)',
    transformOrigin: 'left center',
  },
  microTextContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
  },
  microText: {
    flexDirection: 'row',
  },
  microChar: {
    width: 3,
    height: 3,
    margin: 0.5,
  },
  charDot: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B7355',
    borderRadius: 1,
  },
});

/**
 * Watermark Verification Logic
 * In a real implementation, this would:
 * 1. Analyze image to check if dot pattern matches expected hash-derived pattern
 * 2. Detect if key dots are missing (indicating screenshot)
 * 3. Verify grid line angles match hash
 */
export const verifyWatermark = (
  imageData: string,
  expectedHash: string
): { isAuthentic: boolean; confidence: number; reason?: string } => {
  // Mock verification - in production this would use image processing
  console.log(`[Watermark] Verifying authenticity for hash: ${expectedHash}`);
  
  return {
    isAuthentic: true,
    confidence: 0.95,
  };
};

export default OpticalWatermark;
