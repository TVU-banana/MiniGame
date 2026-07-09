export function formatSeconds(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(whole / 60)
    .toString()
    .padStart(2, '0');
  const secs = (whole % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}`;
}
