export function debounce<TArgs extends unknown[]>(callback: (...args: TArgs) => void, delayMs: number) {
  let timeout: number | undefined;
  return (...args: TArgs) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delayMs);
  };
}
