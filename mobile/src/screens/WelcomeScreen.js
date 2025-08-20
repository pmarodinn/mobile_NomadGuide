import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function WelcomeScreen({ onNavigate }) {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>NomadGuide</Text>
        <Text style={styles.subtitle}>Seu guia inteligente de viagem</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('login')}>
            <Text style={styles.primaryText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate('register')}>
            <Text style={styles.secondaryText}>Criar Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: typography.title, fontWeight: typography.weightBold, color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.subtitle, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  actions: { width: '100%', maxWidth: 300 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center', marginBottom: spacing.md },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: typography.weightSemi },
  secondaryBtn: { borderWidth: 2, borderColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontSize: 16, fontWeight: typography.weightSemi },
});
