'use server';

import { z } from 'zod';
import { absorbanceValueTraceback } from '@/ai/flows/absorbance-value-traceback';
import { runStatisticalTest } from '@/ai/flows/statistical-analysis';
import type { StatisticalTestInput } from '@/ai/flows/statistical-analysis.schemas';
import { calculateLinearRegression } from '@/lib/analysis';
import { formSchema } from './schemas';
import type { AbsorbanceValueTracebackInput } from '@/ai/flows/absorbance-value-traceback.schemas';


export type AnalysisResult = {
  standardCurve: {
    m: number;
    c: number;
    rSquare: number;
  };
  groupResults: {
    groupName: string;
    absorbanceValues: number[];
  }[];
};

export async function runAnalysis(
  values: z.infer<typeof formSchema>
): Promise<AnalysisResult> {
  try {
    const { groups, standardCurve } = values;

    // 1. Standard Curve Calculation
    const points = standardCurve.map(p => ({ x: p.concentration, y: p.absorbance }));
    const regression = calculateLinearRegression(points);

    if (isNaN(regression.m) || isNaN(regression.c)) {
        throw new Error("Could not calculate standard curve. Please check your data points.");
    }

    const groupResults = [];
    const standardCurveEquation = `y = ${regression.m.toFixed(4)}x + ${regression.c.toFixed(4)}`;

    // 2. Individual Sample Absorbance Calculation for each group
    for (const group of groups) {
      const aiInput: AbsorbanceValueTracebackInput = {
        meanConcentration: group.mean,
        standardDeviation: group.sd,
        samplesPerGroup: group.samples,
        standardCurveEquation: standardCurveEquation,
      };

      const result = await absorbanceValueTraceback(aiInput);
      groupResults.push({
        groupName: group.name,
        absorbanceValues: result.absorbanceValues,
      });
    }

    return {
      standardCurve: {
        m: regression.m,
        c: regression.c,
        rSquare: regression.rSquare,
      },
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
        const result = await runStatisticalTest(values);
        return {
            pValue: result.pValue,
        };
    } catch (error) {
        console.error("Statistical test failed:", error);
        if (error instanceof Error) {
            throw new Error(`Statistical test failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during the statistical test.');
    }
}
