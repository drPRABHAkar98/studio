export function calculateLinearRegression(points: { x: number; y: number }[]): {
  m: number;
  c: number;
  rSquare: number;
  equation: string;
} {
  const n = points.length;
  if (n < 2) {
    return { m: 0, c: 0, rSquare: 0, equation: "y = 0x + 0" };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const point of points) {
    const x = point.x;
    const y = point.y;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    // This case happens if all x values are the same.
    // The line is vertical, so we can't represent it as y=mx+c.
    // We'll return a horizontal line as a fallback.
    const avgY = sumY / n;
    return { m: 0, c: avgY, rSquare: 0, equation: `y = 0x + ${avgY.toFixed(4)}` };
  }
  
  const m = (n * sumXY - sumX * sumY) / denominator;
  const c = (sumY - m * sumX) / n;

  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );
  
  if (rDenominator === 0) {
    return { m, c, rSquare: 1, equation: `y = ${m.toFixed(4)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}` };
  }

  const r = rNumerator / rDenominator;
  const rSquare = r * r;

  return { m, c, rSquare, equation: `y = ${m.toFixed(4)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}` };
}
