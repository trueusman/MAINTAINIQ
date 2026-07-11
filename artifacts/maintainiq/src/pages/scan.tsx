import { useState } from 'react';
import { useGetPublicAsset, useTriageIssue, useCreatePublicIssue, AiTriageResult, PublicIssueInputPriority, AiTriageInputPriority } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Activity, Wrench, ChevronRight, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const reportSchema = z.object({
  reporterName: z.string().min(1, "Name is required"),
  reporterEmail: z.string().email("Valid email is required"),
  reporterPhone: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Please provide more details"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1, "Category is required"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ScanPage({ assetCode }: { assetCode: string }) {
  const [step, setStep] = useState<'form' | 'triage' | 'success'>('form');
  const [triageData, setTriageData] = useState<AiTriageResult | null>(null);
  const [receipt, setReceipt] = useState<{ issueNumber: string } | null>(null);

  const { data: asset, isLoading: assetLoading, error: assetError } = useGetPublicAsset(assetCode, {
    query: {
      queryKey: ['publicAsset', assetCode],
      retry: false
    }
  });

  const triageIssue = useTriageIssue();
  const createIssue = useCreatePublicIssue();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reporterName: '',
      reporterEmail: '',
      reporterPhone: '',
      title: '',
      description: '',
      priority: 'medium',
      category: 'mechanical',
    },
  });

  const onInitialSubmit = (data: ReportFormValues) => {
    triageIssue.mutate({
      data: {
        assetCode,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority as AiTriageInputPriority,
      }
    }, {
      onSuccess: (result) => {
        setTriageData(result);
        setStep('triage');
      }
    });
  };

  const onFinalSubmit = () => {
    const data = form.getValues();
    createIssue.mutate({
      data: {
        ...data,
        assetCode,
        priority: data.priority as PublicIssueInputPriority,
        aiTitle: triageData?.suggestedTitle,
        aiCategory: triageData?.suggestedCategory,
        aiPriority: triageData?.suggestedPriority as any,
        aiPossibleCauses: triageData?.possibleCauses,
        aiDiagnosticChecks: triageData?.diagnosticChecks,
        aiSafetyNotes: triageData?.safetyNotes || undefined,
        aiRecurringWarning: triageData?.recurringWarning || undefined,
      }
    }, {
      onSuccess: (res) => {
        setReceipt(res);
        setStep('success');
      }
    });
  };

  if (assetLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl mt-12 flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        <p className="mt-4 font-mono text-muted-foreground">FETCHING ASSET DATA...</p>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="container mx-auto p-4 max-w-2xl mt-12">
        <Card className="bg-destructive text-destructive-foreground border-none">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <AlertTriangle className="h-16 w-16 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
            <p className="opacity-80 font-mono">The QR code scanned does not match any active equipment in the database. Please verify the code and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return <Badge className="bg-success hover:bg-success text-success-foreground rounded-none uppercase font-mono">Operational</Badge>;
      case 'under_maintenance': return <Badge className="bg-warning hover:bg-warning text-warning-foreground rounded-none uppercase font-mono">Under Maintenance</Badge>;
      case 'out_of_service': return <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground rounded-none uppercase font-mono">Out of Service</Badge>;
      default: return <Badge className="rounded-none uppercase font-mono">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl my-8">
      {/* Asset Info Header */}
      <div className="mb-8">
        <div className="inline-block border border-primary/30 text-primary px-2 py-0.5 text-xs font-mono uppercase tracking-widest mb-3 bg-primary/5">
          ASSET SCANNED
        </div>
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          {getStatusBadge(asset.status)}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm font-mono border-t pt-4">
          <div>
            <span className="text-muted-foreground block mb-1">ID CODE</span>
            <span className="font-bold text-primary">{asset.assetCode}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">LOCATION</span>
            <span className="font-medium">{asset.location}</span>
          </div>
        </div>
      </div>

      {step === 'form' && (
        <Card className="border-border rounded-none shadow-md">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Report a Problem
            </CardTitle>
            <CardDescription className="font-mono uppercase text-xs">Submit an issue directly to the maintenance queue</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold font-mono text-sm uppercase text-muted-foreground border-b pb-2">Your Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="reporterName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Name *</FormLabel>
                        <FormControl><Input {...field} className="bg-muted/50 rounded-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="reporterEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Email *</FormLabel>
                        <FormControl><Input type="email" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="reporterPhone" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-mono text-xs uppercase">Phone Number (Optional)</FormLabel>
                        <FormControl><Input type="tel" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold font-mono text-sm uppercase text-muted-foreground border-b pb-2 mt-6">Issue Details</h3>
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase">Brief Title *</FormLabel>
                      <FormControl><Input placeholder="e.g. Strange noise from fan" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase">Detailed Description *</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Describe what you see, hear, or smell..." {...field} className="bg-muted/50 rounded-none resize-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-muted/50 rounded-none"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-none">
                            <SelectItem value="mechanical">Mechanical</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="software">Software / Control</SelectItem>
                            <SelectItem value="structural">Structural</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Perceived Severity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-muted/50 rounded-none"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-none">
                            <SelectItem value="low">Low - Cosmetic/Minor</SelectItem>
                            <SelectItem value="medium">Medium - Needs Attention</SelectItem>
                            <SelectItem value="high">High - Degrading Performance</SelectItem>
                            <SelectItem value="critical">Critical - Stopped Working / Safety</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold rounded-none" disabled={triageIssue.isPending}>
                  {triageIssue.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> ANALYZING...</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" /> CONTINUE TO REVIEW <ChevronRight className="ml-1 h-5 w-5" /></>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'triage' && triageData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/10 border-l-4 border-primary p-4 flex gap-4">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-primary">AI Triage Complete</h3>
              <p className="text-sm font-mono text-muted-foreground mt-1">Our system has analyzed your report to provide context for our technicians. Review the notes below before final submission.</p>
            </div>
          </div>

          <Card className="border-border rounded-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg">Safety & Diagnostic Brief</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {triageData.safetyNotes && (
                <div className="p-4 border-b border-warning/30 bg-warning/5">
                  <div className="flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm uppercase text-warning tracking-wider mb-1">Safety Warning</h4>
                      <p className="text-sm text-foreground/90">{triageData.safetyNotes}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {triageData.recurringWarning && (
                <div className="p-4 border-b">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm uppercase text-destructive tracking-wider mb-1">Recurring Issue Alert</h4>
                      <p className="text-sm text-foreground/90">{triageData.recurringWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border-b">
                <h4 className="font-bold font-mono text-xs uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Potential Causes
                </h4>
                <ul className="space-y-2">
                  {triageData.possibleCauses.map((cause, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary font-bold">›</span> {cause}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 rounded-none font-bold" onClick={() => setStep('form')} disabled={createIssue.isPending}>
              BACK TO EDIT
            </Button>
            <Button className="flex-1 rounded-none font-bold bg-primary hover:bg-primary/90" onClick={onFinalSubmit} disabled={createIssue.isPending}>
              {createIssue.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "SUBMIT REPORT"}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && receipt && (
        <Card className="border-border rounded-none shadow-md text-center">
          <CardContent className="pt-12 pb-12 px-6">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Report Submitted</h2>
            <p className="text-muted-foreground font-mono mb-8">The maintenance team has been notified.</p>
            
            <div className="bg-muted p-6 mb-8 max-w-sm mx-auto">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Reference Number</div>
              <div className="text-3xl font-bold text-primary tracking-wider">{receipt.issueNumber}</div>
            </div>
            
            <Button variant="outline" className="rounded-none font-bold" onClick={() => window.location.reload()}>
              REPORT ANOTHER ISSUE
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}