import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../theme/colors';

export function ScreenContainer({ children }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 16,
  },
});
