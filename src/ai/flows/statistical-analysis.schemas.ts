import { z } from 'zod';

const GroupStatsSchema = z.object({
  name: z.string().describe('The name of the group.'),
  mean: z.number().describe('The mean of the group.'),
  sd: z.number().describe('The standard deviation of the group.'),
  samples: z.number().describe('The number of samples in the group.'),
});

export const StatisticalTestInputSchema = z.object({
  group1: GroupStatsSchema,
  group2: GroupStatsSchema,
  test: z.string().describe('The statistical test to perform (e.g., "t-test", "mann-whitney").'),
});
export type StatisticalTestInput = z.infer<typeof StatisticalTestInputSchema>;

export const StatisticalTestOutputSchema = z.object({
    pValue: z.number().describe('The calculated p-value from the statistical test.'),
});
export type StatisticalTestOutput = z.infer<typeof StatisticalTestOutputSchema>;
