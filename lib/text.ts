export function cleanSingleLine(value: string, max: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function safeMailSubject(value: string, max = 120) {
  return cleanSingleLine(value, max).replace(/[<>]/g, '');
}
