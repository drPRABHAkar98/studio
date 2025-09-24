'use server';

import { z } from 'zod';
import { absorbanceValueTraceback, AbsorbanceValueTracebackInput } from '@/ai/flows/absorbance-value-traceback';
import { calculateLinearRegression } from '@/lib/analysis';

const groupSchema = z.object({
  name: z.string(),
  mean: z.number(),
  sd: z.number(),
  samples: z.number().int(),
});

const standardPointSchema = z.object({
  concentration: z.number(),
  absorbance: z.number(),
});

const formSchema = z.object({
  groups: z.array(groupSchema),
  standardCurve: z.array(standardPointSchema),
  absorbanceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  statisticalTest: z.string(),
  pValue: z.string(),
});

export type AnalysisResult = {
  standardCurve: {
    equation: string;
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

    // 2. Individual Sample Absorbance Calculation for each group
    for (const group of groups) {
      const aiInput: AbsorbanceValueTracebackInput = {
        meanConcentration: group.mean,
        standardDeviation: group.sd,
        samplesPerGroup: group.samples,
        standardCurveEquation: regression.equation,
      };

      const result = await absorbanceValueTraceback(aiInput);
      groupResults.push({
        groupName: group.name,
        absorbanceValues: result.absorbanceValues,
      });
    }

    return {
      standardCurve: {
        equation: regression.equation,
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
