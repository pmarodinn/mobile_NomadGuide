import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { fetchDailyBudget, computeStatus } from '../services/budgetService';

export function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await fetchDailyBudget();
        if (mounted) setData(result);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const dailyLimit = data?.dailyLimit || 0;
  const spentToday = data?.spentToday || 0;
  const status = computeStatus(spentToday, dailyLimit);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Resumo do Dia</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={[styles.card, { borderLeftColor: status.color }]}> 
          <Text style={styles.cardTitle}>Budget de Hoje</Text>
          <Text style={styles.cardValue}>R$ {spentToday} / {dailyLimit}</Text>
          <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          {data?.error && <Text style={styles.error}>Não foi possível carregar (ver backend)</Text>}
        </View>
      )}
      <View style={styles.section}> 
        <Text style={styles.sectionTitle}>Atalhos</Text>
        <Text style={styles.placeholder}>• Destinos (em breve){"\n"}• Gastos (em breve){"\n"}• Configurações (em breve)</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.subtitle, fontWeight: typography.weightBold, color: colors.textPrimary, marginBottom: spacing.lg },
  card: { backgroundColor: '#fff', padding: spacing.lg, borderRadius: 12, marginBottom: spacing.lg, borderLeftWidth: 6 },
  cardTitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  cardValue: { fontSize: 20, fontWeight: typography.weightBold, color: colors.textPrimary },
  status: { marginTop: spacing.sm, fontWeight: typography.weightSemi },
  error: { marginTop: spacing.sm, color: colors.danger, fontSize: 12 },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: typography.weightSemi, marginBottom: spacing.sm, color: colors.textPrimary },
  placeholder: { color: colors.textSecondary, lineHeight: 20 },
});
