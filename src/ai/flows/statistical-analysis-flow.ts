import { ai } from '@/ai/genkit';
import { StatisticalTestInputSchema, StatisticalTestOutputSchema } from './statistical-analysis.schemas';

const statisticalTestPrompt = ai.definePrompt({
    name: 'statisticalTestPrompt',
    input: { schema: StatisticalTestInputSchema },
    output: { schema: StatisticalTestOutputSchema },
    prompt: `You are an expert statistician.

You will perform a statistical test to compare two groups based on their summary statistics (mean, standard deviation, and sample size).

Instructions:
1.  Identify the appropriate statistical method based on the test name provided (e.g., Student's t-test, Mann-Whitney U test).
2.  Calculate the p-value based on the provided data for Group 1 and Group 2.
3.  Return the calculated p-value.

Group 1 Name: {{{group1.name}}}
Group 1 Mean: {{{group1.mean}}}
Group 1 SD: {{{group1.sd}}}
Group 1 Samples: {{{group1.samples}}}

Group 2 Name: {{{group2.name}}}
Group 2 Mean: {{{group2.mean}}}
Group 2 SD: {{{group2.sd}}}
Group 2 Samples: {{{group2.samples}}}

Statistical Test: {{{test}}}

Output the p-value in JSON format.
`,
});

export const runStatisticalTestFlow = ai.defineFlow(
    {
        name: 'runStatisticalTestFlow',
        inputSchema: StatisticalTestInputSchema,
        outputSchema: StatisticalTestOutputSchema,
    },
    async input => {
        const { output } = await statisticalTestPrompt(input);
        return output!;
    }
);
