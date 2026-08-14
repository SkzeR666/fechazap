export function relativeTime(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export function daysUntil(iso: string, now = Date.now()) {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}
