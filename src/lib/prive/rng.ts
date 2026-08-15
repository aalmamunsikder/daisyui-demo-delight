// Deterministic seeded RNG so synthetic data is identical on server and client.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
