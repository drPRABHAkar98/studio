
// This file contains definitions for various statistical functions.

/**
 * Calculates the linear regression for a set of 2D points.
 * @param points An array of objects with x and y properties.
 * @returns An object containing the slope (m), y-intercept (c), and R-squared value.
 */
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


/**
 * Generates an array of normally distributed random numbers.
 * @param mean The desired mean of the distribution.
 * @param stdDev The desired standard deviation.
 * @param count The number of values to generate.
 * @returns An array of numbers.
 */
export function generateNormalDistribution(mean: number, stdDev: number, count: number): number[] {
    const values = [];
    for (let i = 0; i < count; i++) {
        // Using the Box-Muller transform to generate two standard normal variables
        let u1 = 0, u2 = 0;
        while(u1 === 0) u1 = Math.random(); //Converting [0,1) to (0,1)
        while(u2 === 0) u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // We only need one of the two generated values
        const value = z0 * stdDev + mean;
        values.push(value);
    }
    return values;
}

type GroupStats = { mean: number; sd: number; n: number };

/**
 * Performs an independent two-sample Student's t-test.
 * @param group1 Summary statistics for the first group.
 * @param group2 Summary statistics for the second group.
 * @returns The calculated p-value.
 */
export function studentsTTest(group1: GroupStats, group2: GroupStats): number {
    const { mean: mean1, sd: sd1, n: n1 } = group1;
    const { mean: mean2, sd: sd2, n: n2 } = group2;

    if (n1 <= 1 || n2 <= 1) {
        return NaN; // Not enough data
    }
    
    // Calculate the t-statistic
    const pooledStdDev = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));
    if (pooledStdDev === 0) {
      return mean1 === mean2 ? 1 : 0;
    }

    const tStatistic = (mean1 - mean2) / (pooledStdDev * Math.sqrt(1/n1 + 1/n2));

    const degreesFreedom = n1 + n2 - 2;

    const p = tDistr(degreesFreedom, Math.abs(tStatistic));

    return p;
}


// Helper function for Student's t-distribution's cumulative distribution function (CDF)
// This is a more robust approximation than the previous simplified version.
function tDistr(df: number, t: number): number {
    const term = t / Math.sqrt(df);
    const half_df = df / 2;

    if (df === 1) {
        return 1 - (2 / Math.PI) * Math.atan(t);
    }
    if (df === 2) {
        return 1 - t / Math.sqrt(2 + t * t);
    }
    if (df % 2 === 0) {
        // Even degrees of freedom
        let sum = term / Math.sqrt(1 + term * term);
        let currentTerm = sum;
        for (let j = 2; j < half_df; j++) {
            currentTerm *= (j - 1.5) / (j-1) / (1 + term * term);
            sum += currentTerm;
        }
        return 1 - sum;
    } else {
        // Odd degrees of freedom
        let sum = Math.atan(term);
        let currentTerm = term;
        for (let j = 1; j < half_df; j++) {
            currentTerm *= (j - 1) / (j - 0.5) / (1 + term * term);
            sum += currentTerm;
        }
        return 1 - (2 / Math.PI) * sum;
    }
}
