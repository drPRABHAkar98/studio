
'use server';

import { z } from 'zod';
import { calculateLinearRegression, generateNormalDistribution, studentsTTest } from '@/lib/analysis';
import { formSchema } from './schemas';
import type { StatisticalTestInput } from './schemas';


export type AnalysisResult = {
  standardCurve: {
    m: number;
    c: number;
    rSquare: number;
  } | null;
  groupResults: {
    groupName: string;
    values: number[];
  }[];
};

export async function runAnalysis(
  values: z.infer<typeof formSchema>,
  useStandardCurve: boolean
): Promise<AnalysisResult> {
  try {
    const { groups, standardCurve } = values;

    let regression: { m: number; c: number; rSquare: number } | null = null;
    
    // 1. Standard Curve Calculation (if applicable)
    if (useStandardCurve) {
        if (!standardCurve || standardCurve.length < 2) {
            throw new Error("Standard curve requires at least 2 points.");
        }
        const points = standardCurve.map(p => ({ x: p.concentration, y: p.absorbance }));
        regression = calculateLinearRegression(points);

        if (isNaN(regression.m) || isNaN(regression.c)) {
            throw new Error("Could not calculate standard curve. Please check your data points.");
        }
    }


    const groupResults = [];

    // 2. Individual Sample Value Calculation for each group
    for (const group of groups) {
      // Generate a normal distribution of concentration values
      const concentrationValues = generateNormalDistribution(group.mean, group.sd, group.samples);

      let finalValues: number[];

      if (useStandardCurve && regression) {
        // Convert concentration to absorbance using the standard curve
        finalValues = concentrationValues.map(conc => (regression.m * conc) + regression.c);
      } else {
        // If not using standard curve, the values are the generated concentrations themselves
        finalValues = concentrationValues;
      }
      
      groupResults.push({
        groupName: group.name,
        values: finalValues,
      });
    }

    return {
      standardCurve: regression,
      groupResults,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error) {
        throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during analysis.');
  }
}

export type StatisticalTestResult = {
  pValue: number;
};

export async function performStatisticalTest(
  values: StatisticalTestInput
): Promise<StatisticalTestResult> {
    try {
        const { group1, group2, test } = values;
        
        let pValue: number;

        // Currently only supports t-test, but can be expanded.
        switch(test) {
            case 't-test':
                pValue = studentsTTest(
                    { mean: group1.mean, sd: group1.sd, n: group1.samples },
                    { mean: group2.mean, sd: group2.sd, n: group2.samples }
                );
                break;
            // Other tests like ANOVA, Mann-Whitney U could be implemented here
            default:
                // For now, we can use a simple t-test as a fallback or throw an error.
                // Using a t-test for non-supported tests for demonstration.
                console.warn(`Unsupported test "${test}". Falling back to t-test.`);
                pValue = studentsTTest(
                    { mean: group1.mean, sd: group1.sd, n: group1.samples },
                    { mean: group2.mean, sd: group2.sd, n: group2.samples }
                );
        }

        if (isNaN(pValue)) {
             throw new Error('Could not calculate p-value. Check input data.');
        }

        return {
            pValue: pValue,
        };
    } catch (error) {
        console.error("Statistical test failed:", error);
        if (error instanceof Error) {
            throw new Error(`Statistical test failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during the statistical test.');
    }
}
