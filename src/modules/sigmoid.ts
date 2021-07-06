export function sigmoid(n: number): number {
	return 1 / (1 + Math.pow(Math.E, n));
}