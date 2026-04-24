import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'dark';
  size?: 'small' | 'medium' | 'large';
}

const COLORS = {
  background: '#F5F5F5',
  shadowLight: '#FFFFFF',
  shadowDark: '#D1D1D1',
};

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  intensity = 'medium',
  size = 'medium',
}) => {
  const getShadowIntensity = () => {
    switch (intensity) {
      case 'light':
        return { offset: 4, opacity: 0.15 };
      case 'dark':
        return { offset: 12, opacity: 0.3 };
      default:
        return { offset: 8, opacity: 0.2 };
    }
  };

  const getBorderRadius = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const shadow = getShadowIntensity();
  const borderRadius = getBorderRadius();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: COLORS.background,
          shadowColor: COLORS.shadowDark,
          shadowOffset: { width: shadow.offset, height: shadow.offset },
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.offset,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            borderRadius: borderRadius - 2,
            shadowColor: COLORS.shadowLight,
            shadowOffset: { width: -shadow.offset / 2, height: -shadow.offset / 2 },
            shadowOpacity: shadow.opacity * 1.5,
            shadowRadius: shadow.offset / 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 8,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default NeumorphicCard;
