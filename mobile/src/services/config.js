// Configuração central de API
// Usa variável pública do Expo (definir em .env como EXPO_PUBLIC_API_URL) ou fallback local
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
