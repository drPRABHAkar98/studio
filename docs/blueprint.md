# **App Name**: TraceBack Analytics

## Core Features:

- Group Data Input: Collects group name, mean concentration, standard deviation, and samples per group.
- Standard Curve Data Input: Captures standard concentration and absorbance values for curve generation.
- Statistical Test Selection: Allows users to select statistical tests like t-test or ANOVA via a dropdown menu.
- Significance Level Input: Enables users to define the p-value threshold for significance.
- Standard Curve Calculation: Calculates the standard curve equation using linear regression and provides R^2 value.
- Absorbance Value Traceback: Generates individual concentration values based on mean and SD, then converts these back to absorbance values using the standard curve. Can be implemented as a tool which can intelligently use various means and standard deviations when doing its data simulation.
- Data Storage and Access: Data will be stored and made persistent with the Firestore database.

## Style Guidelines:

- Primary color: Soft teal (#64B5CD), reminiscent of scientific settings and data analysis.
- Background color: Light gray (#F0F4F7), a neutral backdrop that ensures readability.
- Accent color: Muted blue (#546E7A) for secondary actions and subtle emphasis.
- Body font: 'Inter', sans-serif for a modern, neutral and objective appearance.
- Headline font: 'Space Grotesk', sans-serif for short, techy headlines. It pairs well with 'Inter'.
- Use minimalistic icons to represent statistical functions and data types.
- Use clear and well-spaced layouts to represent different tables and statistical analyses.