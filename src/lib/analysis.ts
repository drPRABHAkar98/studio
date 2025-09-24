export function calculateLinearRegression(points: { x: number; y: number }[]): {
  m: number;
  c: number;
  rSquare: number;
} {
  const n = points.length;
  if (n < 2) {
    return { m: NaN, c: NaN, rSquare: 0 };
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
    return { m: NaN, c: NaN, rSquare: 0 };
  }
  
  const m = (n * sumXY - sumX * sumY) / denominator;
  const c = (sumY - m * sumX) / n;

  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );
  
  if (rDenominator === 0) {
    return { m, c, rSquare: 1 };
  }

  const r = rNumerator / rDenominator;
  const rSquare = r * r;

  return { m, c, rSquare };
}
