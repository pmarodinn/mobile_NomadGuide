import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { forgotPassword } from '../services/authService';

export function ForgotPasswordScreen({ onBack, onNavigate }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true); setError(null);
    const r = await forgotPassword(email.trim());
    if (r.ok) setSent(true); else setError(r.error);
    setSubmitting(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}><TouchableOpacity onPress={onBack}><Text style={styles.back}>Voltar</Text></TouchableOpacity></View>
      <Text style={styles.title}>Recuperar Senha</Text>
      <Text style={styles.help}>Informe seu email e enviaremos instruções.</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize='none' />
      <TouchableOpacity style={[styles.primaryBtn, (!email || submitting) && { opacity: .6 }]} disabled={!email || submitting} onPress={handleSend}>
        <Text style={styles.primaryText}>{sent ? 'Enviado' : (submitting ? 'Enviando...' : 'Enviar link')}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.err}>{error}</Text>}
      {sent && <Text style={styles.info}>Se o email existir, um link foi enviado.</Text>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header:{marginBottom:spacing.md},
  back:{color:colors.primary,fontSize:14},
  title:{fontSize:typography.subtitle,fontWeight:typography.weightBold,color:colors.textPrimary,marginBottom:spacing.sm},
  help:{color:colors.textSecondary,fontSize:14,marginBottom:spacing.md,lineHeight:18},
  input:{backgroundColor:'#fff',borderWidth:1,borderColor:colors.border,borderRadius:8,padding:spacing.sm,marginBottom:spacing.md},
  primaryBtn:{backgroundColor:colors.primary,padding:spacing.md,borderRadius:8,alignItems:'center',marginTop:spacing.sm},
  primaryText:{color:'#fff',fontWeight:typography.weightSemi},
  info:{marginTop:spacing.md,color:colors.success,fontSize:12},
  err:{color:colors.danger,fontSize:12,marginTop:spacing.sm}
});
