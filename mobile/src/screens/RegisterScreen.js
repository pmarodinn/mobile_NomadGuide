import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { registerUser } from '../services/authService';

export function RegisterScreen({ onBack, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [info, setInfo] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const passwordRules = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
  const ruleChecks = [
    { key: 'len', label: 'Mín 8 caracteres', test: (p) => p.length >= 8 },
    { key: 'upper', label: '1 letra maiúscula', test: (p) => /[A-Z]/.test(p) },
    { key: 'symbol', label: '1 símbolo', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validate = () => {
    let ok = true;
    setEmailError(null); setPasswordError(null); setConfirmError(null);
    if (!email.includes('@')) { setEmailError('Email inválido'); ok=false; }
    if (!passwordRules.test(password)) { setPasswordError('Senha fraca (mín 8, 1 maiúscula, 1 símbolo)'); ok=false; }
    if (password !== confirm) { setConfirmError('Senhas não conferem'); ok=false; }
    return ok;
  };

  const handleRegister = async () => {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true); setError(null); setInfo(null);
    const result = await registerUser({ email, password, firstName: name || 'User', lastName: '' });
    if (result.ok) {
      setInfo('Conta criada. Verifique seu email para confirmar.');
      // aguarda 1.5s antes de ir para login
      setTimeout(()=> onNavigate('login'), 1500);
    } else {
      console.log('RegisterScreen erro:', result.error);
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}> 
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
      </View>
      <Text style={styles.title}>Criar Conta</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={(t)=>{ setEmail(t); }} autoCapitalize='none' />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={(t)=>{ setPassword(t); if(!showRules) setShowRules(true); }}
        secureTextEntry
        onFocus={()=> setShowRules(true)}
        onBlur={()=> { if(passwordRules.test(password)) setShowRules(false); }}
      />
      <TextInput style={styles.input} placeholder="Confirmar Senha" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {showRules && (
        <View style={styles.rulesBox}>
          {ruleChecks.map(r => {
            const ok = r.test(password);
            return (
              <Text key={r.key} style={[styles.ruleItem, ok ? styles.ruleOk : styles.ruleFail]}>• {r.label}</Text>
            );
          })}
        </View>
      )}
      {passwordError && <Text style={styles.err}>{passwordError}</Text>}
      {confirmError && <Text style={styles.err}>{confirmError}</Text>}
      {emailError && <Text style={styles.err}>{emailError}</Text>}
      <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity:0.6 }]} onPress={handleRegister} disabled={submitting}>
        <Text style={styles.primaryText}>{submitting ? 'Enviando...' : 'Registrar'}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.err}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}
      <TouchableOpacity onPress={() => onNavigate('login')}>
        <Text style={styles.link}>Já possui conta? Entrar</Text>
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
  err: { color: colors.danger, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.xs },
  info: { color: colors.success, fontSize: 12, marginTop: spacing.sm },
  rulesBox: { backgroundColor: '#fff', borderWidth:1, borderColor: colors.border, borderRadius:8, padding: spacing.sm, marginTop: -spacing.xs, marginBottom: spacing.sm },
  ruleItem: { fontSize:12, marginBottom:2 },
  ruleOk: { color: colors.success },
  ruleFail: { color: colors.textSecondary },
});
