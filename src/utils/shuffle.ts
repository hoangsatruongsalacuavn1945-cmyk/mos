/**
 * Fisher-Yates (Knuth) Uniform Array Shuffle
 * Provides uniform O(n) distribution without bias.
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    let j: number;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      j = Math.floor((buffer[0] / (0xffffffff + 1)) * (i + 1));
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
