"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  Loader2,
  Info,
  LineChart,
  ClipboardList,
  FlaskRound,
  Calculator,
  Sigma,
  Wand2,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "./actions";
import { runAnalysis } from "./actions";
import { Separator } from "@/components/ui/separator";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  mean: z.coerce.number({ invalid_type_error: "Must be a number." }).positive("Must be positive."),
  sd: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative("Cannot be negative."),
  samples: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .int()
    .min(1, "At least 1 sample."),
});

const standardPointSchema = z.object({
  concentration: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative(),
  absorbance: z.coerce.number({ invalid_type_error: "Must be a number." }).nonnegative(),
});

const formSchema = z.object({
  groups: z.array(groupSchema).min(1, "At least one group is required."),
  standardCurve: z
    .array(standardPointSchema)
    .min(2, "At least two points are needed for the curve."),
  absorbanceRange: z
    .object({
      min: z.coerce.number({ invalid_type_error: "Must be a number." }),
      max: z.coerce.number({ invalid_type_error: "Must be a number." }),
    })
    .refine((data) => data.min < data.max, {
      message: "Min must be less than Max",
      path: ["min"],
    }),
  statisticalTest: z.string(),
  pValue: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// Helper function to calculate standard deviation
const calculateSD = (data: number[]): number => {
    const n = data.length;
    if (n < 2) return 0;
    const mean = data.reduce((a, b) => a + b) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    return Math.sqrt(variance);
};


export default function Home() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [
        { name: "Normal", mean: 0, sd: 0, samples: 3 },
        { name: "Diseased", mean: 0, sd: 0, samples: 3 },
      ],
      standardCurve: [
        { concentration: 0, absorbance: 0 },
        { concentration: 10, absorbance: 0.2 },
        { concentration: 20, absorbance: 0.4 },
        { concentration: 30, absorbance: 0.6 },
      ],
      absorbanceRange: { min: 0, max: 2 },
      statisticalTest: "t-test",
      pValue: "0.05",
    },
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control: form.control,
    name: "groups",
  });

  const {
    fields: standardCurveFields,
    append: appendStandardPoint,
    remove: removeStandardPoint,
    update: updateStandardPoint,
  } = useFieldArray({
    control: form.control,
    name: "standardCurve",
  });

  function autoFillAbsorbance() {
    const points = form.getValues("standardCurve");
    if (points.length < 2) {
      toast({
        variant: "destructive",
        title: "Not enough data points",
        description: "You need at least two points to create a linear curve.",
      });
      return;
    }
    
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (firstPoint.concentration === lastPoint.concentration) {
        toast({
            variant: "destructive",
            title: "Invalid concentrations",
            description: "First and last concentration values cannot be the same.",
        });
        return;
    }
    
    const firstAbsorbance = typeof firstPoint.absorbance === 'string' ? parseFloat(firstPoint.absorbance) : firstPoint.absorbance;
    const lastAbsorbance = typeof lastPoint.absorbance === 'string' ? parseFloat(lastPoint.absorbance) : lastPoint.absorbance;

    if (isNaN(firstAbsorbance) || isNaN(lastAbsorbance)) {
       toast({
            variant: "destructive",
            title: "Invalid absorbance values",
            description: "First and last absorbance values must be numbers.",
        });
        return;
    }
    
    const slope = (lastAbsorbance - firstAbsorbance) / (firstPoint.concentration - lastPoint.concentration);

    for (let i = 1; i < points.length - 1; i++) {
        const point = points[i];
        const concentration = typeof point.concentration === 'string' ? parseFloat(point.concentration) : point.concentration;
        const firstConc = typeof firstPoint.concentration === 'string' ? parseFloat(firstPoint.concentration) : firstPoint.concentration;
        
        if(isNaN(concentration) || isNaN(firstConc)) continue;

        const absorbance = firstAbsorbance + slope * (concentration - firstConc);
        updateStandardPoint(i, { ...point, absorbance: parseFloat(absorbance.toFixed(4)) });
    }

    toast({
        title: "Auto-fill Complete",
        description: "Intermediate absorbance values have been calculated.",
    });
  }


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await runAnalysis(values);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "The reverse calculation was successful.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Derived state for forward test results
  const forwardTestResults = React.useMemo(() => {
    if (!analysisResult) return null;

    const { m, c } = analysisResult.standardCurve;

    return analysisResult.groupResults.map(group => {
      const absorbanceMean = group.absorbanceValues.reduce((a, b) => a + b, 0) / group.absorbanceValues.length;
      const absorbanceSD = calculateSD(group.absorbanceValues);

      const calculatedConcentrations = group.absorbanceValues.map(abs => (abs - c) / m);
      const concentrationMean = calculatedConcentrations.reduce((a, b) => a + b, 0) / calculatedConcentrations.length;
      const concentrationSD = calculateSD(calculatedConcentrations);

      return {
        groupName: group.groupName,
        absorbanceMean,
        absorbanceSD,
        sampleData: group.absorbanceValues.map((abs, i) => ({
            sample: i + 1,
            absorbance: abs,
            concentration: calculatedConcentrations[i],
        })),
        concentrationMean,
        concentrationSD,
      };
    });
  }, [analysisResult]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4 md:px-6">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-xl font-bold tracking-tight text-foreground md:text-2xl">
            TraceBack Analytics
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
              <div className="space-y-8">
                {/* Group Data */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl">
                          1. Group Data
                        </CardTitle>
                        <CardDescription>
                          Input mean concentration, SD, and sample size for each group.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[1fr_auto]"
                      >
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <FormField
                            control={form.control}
                            name={`groups.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Group Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Control" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`groups.${index}.mean`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mean Conc.</FormLabel>
                                <FormControl>
                                  <Input type="number" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`groups.${index}.sd`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SD</FormLabel>
                                <FormControl>
                                  <Input type="number" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`groups.${index}.samples`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Samples (n)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-end">
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGroup(index)}
                            disabled={groupFields.length <= 1}
                            aria-label="Remove group"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendGroup({ name: "", mean: 0, sd: 0, samples: 3 })
                      }
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Group
                    </Button>
                  </CardContent>
                </Card>

                {/* Statistical Analysis */}
                <Card>
                  <CardHeader>
                     <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sigma className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl">
                          3. Statistical Analysis
                        </CardTitle>
                        <CardDescription>
                          Select test parameters for significance analysis.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="statisticalTest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statistical Test</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a test" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="t-test">
                                T-test
                              </SelectItem>
                              <SelectItem value="anova">ANOVA</SelectItem>
                              <SelectItem value="mann-whitney">
                                Mann-Whitney U
                              </SelectItem>
                              <SelectItem value="kruskal-wallis">
                                Kruskal-Wallis
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Significance Level (p)</FormLabel>
                           <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a p-value" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0.05">&lt; 0.05</SelectItem>
                              <SelectItem value="0.01">&lt; 0.01</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                {/* Standard Curve Data */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LineChart className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl">
                          2. Standard Curve Data
                        </CardTitle>
                        <CardDescription>
                          Provide data points to generate the standard curve.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                      {standardCurveFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                        >
                          <FormField
                            control={form.control}
                            name={`standardCurve.${index}.concentration`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && <FormLabel>Std. Conc.</FormLabel>}
                                <FormControl>
                                  <Input type="number" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`standardCurve.${index}.absorbance`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && <FormLabel>Absorbance</FormLabel>}
                                <FormControl>
                                  <Input type="number" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStandardPoint(index)}
                            disabled={standardCurveFields.length <= 2}
                            aria-label="Remove point"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                     <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          appendStandardPoint({ concentration: 0, absorbance: 0 })
                        }
                        className="flex-1"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Point
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={autoFillAbsorbance}
                        className="flex-1"
                        disabled={standardCurveFields.length < 2}
                      >
                        <Wand2 className="mr-2 h-4 w-4" /> Auto-fill Absorbance
                      </Button>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                       <FormField
                      control={form.control}
                      name="absorbanceRange.min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Absorbance</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="absorbanceRange.max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Absorbance</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                    <Calculator className="mr-2 h-5 w-5" />
                    Run TraceBack Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {analysisResult && (
          <div className="mt-8 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FlaskRound className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-xl">
                      4. TraceBack Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Review the calculated standard curve and traced-back absorbance values.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-headline text-lg font-semibold">Standard Curve</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm font-medium">
                      Equation: <span className="font-mono text-primary">{`y = ${analysisResult.standardCurve.m.toFixed(4)}x + ${analysisResult.standardCurve.c.toFixed(4)}`}</span>
                    </p>
                    <p className="text-sm font-medium">
                      R² Value: <span className="font-mono text-primary">{analysisResult.standardCurve.rSquare.toFixed(4)}</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                   <h3 className="font-headline text-lg font-semibold">TraceBack Absorbance Values</h3>
                  {analysisResult.groupResults.map((group) => (
                    <div key={group.groupName}>
                       <h4 className="font-semibold text-foreground">{group.groupName}</h4>
                      <div className="mt-2 overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {group.absorbanceValues.map((_, index) => (
                                <TableHead key={index} className="text-center">Sample {index + 1}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              {group.absorbanceValues.map((value, index) => (
                                <TableCell key={index} className={cn("text-center font-mono", 
                                  (value < form.getValues("absorbanceRange.min") || value > form.getValues("absorbanceRange.max")) && 'text-destructive font-bold'
                                )}>
                                  {value.toFixed(4)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Values in <strong className="text-destructive">red</strong> are outside the specified acceptable absorbance range.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {forwardTestResults && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="font-headline text-xl">
                        5. Forward Test Results (Validation)
                      </CardTitle>
                      <CardDescription>
                        Concentrations recalculated from absorbance values to verify the model.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {forwardTestResults.map((group) => {
                      const originalGroup = form.getValues('groups').find(g => g.name === group.groupName);
                      return (
                        <div key={group.groupName} className="space-y-4">
                            <h3 className="font-headline text-lg font-semibold text-foreground">{group.groupName}</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <h4 className="text-sm font-medium text-muted-foreground">Original Input Data</h4>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {Number(originalGroup?.mean).toFixed(2)} <span className="text-lg font-medium text-muted-foreground">± {Number(originalGroup?.sd).toFixed(2)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">Mean Conc. ± SD</p>
                                </div>
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <h4 className="text-sm font-medium text-muted-foreground">Forward Test Result</h4>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {group.concentrationMean.toFixed(2)} <span className="text-lg font-medium text-muted-foreground">± {group.concentrationSD.toFixed(2)}</span>
                                    </p>
                                     <p className="text-xs text-muted-foreground">Recalculated Mean Conc. ± SD</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">Sample</TableHead>
                                            <TableHead className="text-center">TraceBack Absorbance</TableHead>
                                            <TableHead className="text-center">Recalculated Conc.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.sampleData.map(sample => (
                                            <TableRow key={sample.sample}>
                                                <TableCell className="text-center font-medium">{sample.sample}</TableCell>
                                                <TableCell className="text-center font-mono">{sample.absorbance.toFixed(4)}</TableCell>
                                                <TableCell className="text-center font-mono text-primary">{sample.concentration.toFixed(4)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                      )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
