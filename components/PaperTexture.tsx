import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface PaperTextureProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const COLORS = {
  paper: '#F8F6F1',
  line: '#E8E4DC',
  margin: '#F0E8DC',
};

export const PaperTexture: React.FC<PaperTextureProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Lined paper effect */}
      <View style={styles.linesContainer}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
      
      {/* Red margin line */}
      <View style={styles.marginLine} />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Paper texture overlay */}
      <View style={styles.textureOverlay} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
    position: 'relative',
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 40,
  },
  line: {
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 0,
  },
  marginLine: {
    position: 'absolute',
    left: 48,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFD6D6',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingTop: 36,
    paddingLeft: 56,
    paddingRight: 16,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 115, 85, 0.02)',
  },
});

export default PaperTexture;
