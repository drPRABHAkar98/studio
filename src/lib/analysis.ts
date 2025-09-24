
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
    const tStatistic = (mean1 - mean2) / (pooledStdDev * Math.sqrt(1/n1 + 1/n2));

    const degreesFreedom = n1 + n2 - 2;

    // This is a simplified p-value calculation.
    // For a production app, a more robust library for special functions (like the incomplete beta function)
    // would be necessary for perfect accuracy. This approximation is generally good.
    const p = tDistr(degreesFreedom, Math.abs(tStatistic));

    return p;
}


// Helper function for Student's t-distribution's cumulative distribution function (CDF)
// This is a simplified approximation.
function tDistr(df: number, t: number): number {
    const a = df / 2;
    const x = df / (df + t * t);

    const betacf = (x: number, a: number, b: number) => {
        const MAXIT = 100;
        const EPS = 3.0e-7;
        const FPMIN = 1.0e-30;

        let qab = a + b;
        let qap = a + 1.0;
        let qam = a - 1.0;
        let c = 1.0;
        let d = 1.0 - qab * x / qap;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        d = 1.0 / d;
        let h = d;

        for (let m = 1; m <= MAXIT; m++) {
            let m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1.0 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1.0 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1.0 / d;
            h *= (d * c);
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1.0 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1.0 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1.0 / d;
            let del = d * c;
            h *= del;
            if (Math.abs(del - 1.0) < EPS) break;
        }
        return h;
    }

    const betai = (x: number, a: number, b: number) => {
        let bt;
        if (x < 0.0 || x > 1.0) return 0.0;
        if (x === 0.0 || x === 1.0) {
            bt = 0.0;
        } else {
            bt = Math.exp(a * Math.log(x) + b * Math.log(1.0 - x));
        }

        if (x < (a + 1.0) / (a + b + 2.0)) {
            return bt * betacf(x, a, b) / a;
        } else {
            return 1.0 - bt * betacf(1.0 - x, b, a) / b;
        }
    }

    return 1.0 - betai(x, a, 0.5);
}
