import { http } from './http';

// Busca snapshot de budget diário via /budgets/stats filtrando pelo dia atual
export async function fetchDailyBudget(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1); // exclusivo
  const startISO = start.toISOString().split('T')[0];
  const endISO = end.toISOString().split('T')[0];
  try {
    const res = await http.get(`/budgets/stats`, { params: { startDate: startISO, endDate: endISO } });
    const totalActual = res.data?.totalStatistics?.totalActual || 0;
    const totalPlanned = res.data?.totalStatistics?.totalPlanned || 0;
    return { dailyLimit: totalPlanned, spentToday: totalActual };
  } catch (e) {
    return { dailyLimit: 0, spentToday: 0, error: true };
  }
}

export function computeStatus(spent, limit) {
  if (!limit || limit <= 0) return { label: 'Indefinido', color: '#7f8c8d' };
  const ratio = spent / limit;
  if (ratio < 0.5) return { label: 'Saudável', color: '#2ecc71' };
  if (ratio < 0.85) return { label: 'Atenção', color: '#f1c40f' };
  return { label: 'Crítico', color: '#e74c3c' };
}
