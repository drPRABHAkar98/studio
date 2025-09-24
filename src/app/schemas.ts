import * as z from "zod";

export const groupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  mean: z.coerce.number({ invalid_type_error: "Must be a number." }).positive("Must be positive."),
  sd: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative("Cannot be negative."),
  samples: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .int()
    .min(1, "At least 1 sample."),
});

export const standardPointSchema = z.object({
  concentration: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative(),
  absorbance: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative(),
});

export const formSchema = z.object({
  analysisName: z.string().optional(),
  units: z.string().optional(),
  date: z.string().optional(),
  experimentName: z.string().optional(),
  groups: z.array(groupSchema).min(1, "At least one group is required."),
  standardCurve: z
    .array(standardPointSchema)
    .min(2, "At least two points are needed for the curve."),
  statisticalTest: z.string().min(1, "Please select a test."),
  significanceLevel: z.string().min(1, "Please select a level."),
  group1: z.string().optional(),
  group2: z.string().optional(),
});
