'use server';

/**
 * @fileOverview A flow that performs a statistical test between two groups.
 * 
 * - runStatisticalTest - A function that performs the statistical test.
 */

import { ai } from '@/ai/genkit';
import { runStatisticalTestFlow } from './statistical-analysis-flow';
import type { StatisticalTestInput, StatisticalTestOutput } from './statistical-analysis.schemas';


export async function runStatisticalTest(input: StatisticalTestInput): Promise<StatisticalTestOutput> {
    return runStatisticalTestFlow(input);
}
