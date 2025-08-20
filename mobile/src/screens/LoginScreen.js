import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { login, requestEmailVerification } from '../services/authService';

export function LoginScreen({ onBack, onSuccess, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true); setError(null); setNeedsVerify(false); setVerifyMsg(null);
    const result = await login(email, password);
    if (result.ok) {
      if (!result.user?.emailVerified) {
        setNeedsVerify(true);
      }
      onSuccess();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    setVerifyMsg(null);
    const r = await requestEmailVerification();
    setVerifyMsg(r.ok ? 'Email de verificação enviado (mock).' : r.error);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}> 
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
      </View>
      <Text style={styles.title}>Entrar</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize='none' />
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.primaryText}>{submitting ? 'Entrando...' : 'Continuar'}</Text>
      </TouchableOpacity>
      {error && <Text style={{ color: colors.danger, marginTop: spacing.sm, fontSize: 12 }}>{error}</Text>}
      {needsVerify && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.warning, fontSize:12 }}>Email não verificado.</Text>
          <TouchableOpacity onPress={handleResend}><Text style={{ color: colors.primary, fontSize:12, marginTop:4 }}>Reenviar verificação</Text></TouchableOpacity>
          {verifyMsg && <Text style={{ color: colors.success, fontSize:12, marginTop:4 }}>{verifyMsg}</Text>}
        </View>
      )}
      <TouchableOpacity onPress={() => onNavigate('register')}>
        <Text style={styles.link}>Criar conta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onNavigate('forgot')}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md },
  back: { color: colors.primary, fontSize: 14 },
  title: { fontSize: typography.subtitle, fontWeight: typography.weightBold, color: colors.textPrimary, marginBottom: spacing.lg },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center', marginTop: spacing.sm },
  primaryText: { color: '#fff', fontWeight: typography.weightSemi },
  link: { marginTop: spacing.md, color: colors.primary, textAlign: 'center' },
});
