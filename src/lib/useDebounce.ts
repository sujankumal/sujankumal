import { useDebounce as useDebouncedValue } from 'use-debounce';

/**
 * Thin wrapper around the installed debounce package to keep the app's existing hook API stable.
 *
 * @param value The value to debounce.
 * @param delay Delay in milliseconds (default: 500ms).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue] = useDebouncedValue(value,  delay );
  return debouncedValue;
}
