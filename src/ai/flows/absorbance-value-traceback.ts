// use server'

/**
 * @fileOverview A flow that generates a range of potential concentration values based on the group's mean and standard deviation, 
 * and then uses the standard curve to trace these values back to corresponding absorbance values.
 *
 * - absorbanceValueTraceback - A function that handles the plant diagnosis process.
 * - AbsorbanceValueTracebackInput - The input type for the diagnosePlant function.
 * - AbsorbanceValueTracebackOutput - The return type for the diagnosePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AbsorbanceValueTracebackInputSchema = z.object({
    meanConcentration: z.number().describe('The mean concentration of the group.'),
    standardDeviation: z.number().describe('The standard deviation of the group concentration.'),
    samplesPerGroup: z.number().describe('The number of samples in the group.'),
    standardCurveEquation: z.string().describe('The equation of the standard curve (y = mx + c).'),
});

export type AbsorbanceValueTracebackInput = z.infer<typeof AbsorbanceValueTracebackInputSchema>;

const AbsorbanceValueTracebackOutputSchema = z.object({
    absorbanceValues: z.array(z.number()).describe('An array of calculated absorbance values for each sample.'),
});

export type AbsorbanceValueTracebackOutput = z.infer<typeof AbsorbanceValueTracebackOutputSchema>;

export async function absorbanceValueTraceback(input: AbsorbanceValueTracebackInput): Promise<AbsorbanceValueTracebackOutput> {
    return absorbanceValueTracebackFlow(input);
}


const absorbanceValueTracebackPrompt = ai.definePrompt({
    name: 'absorbanceValueTracebackPrompt',
    input: { schema: AbsorbanceValueTracebackInputSchema },
    output: { schema: AbsorbanceValueTracebackOutputSchema },
    prompt: `You are an expert data analyst.

You will generate a list of absorbance values based on the provided concentration statistics and standard curve.

Instructions:
1.  Generate a list of concentration values, using the mean, standard deviation, and samples per group provided.
2.  Convert each concentration value to an absorbance value using the equation: {{{standardCurveEquation}}}.
3.  Return these absorbance values.

Mean Concentration: {{{meanConcentration}}}
Standard Deviation: {{{standardDeviation}}}
Samples per Group: {{{samplesPerGroup}}}
Standard Curve Equation: {{{standardCurveEquation}}}

Output the absorbance values in JSON format.
`
});

const absorbanceValueTracebackFlow = ai.defineFlow(
    {
        name: 'absorbanceValueTracebackFlow',
        inputSchema: AbsorbanceValueTracebackInputSchema,
        outputSchema: AbsorbanceValueTracebackOutputSchema,
    },
    async input => {
        const { output } = await absorbanceValueTracebackPrompt(input);
        return output!;
    }
);
