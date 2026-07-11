import { useState } from 'react';
import { useGetIssue, useGetIssueHistory, useUpdateIssueStatus, useAssignIssue, useListTechnicians, IssueStatus, IssuePriority, useListMaintenance, useCreateMaintenance } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useParams } from 'wouter';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, Activity, User, Wrench, ArrowRight, Loader2, ArrowLeft, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const maintenanceSchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  timeSpentMinutes: z.coerce.number().min(1).optional(),
  cost: z.coerce.number().min(0).optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const issueId = parseInt(id, 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);

  const { data: issue, isLoading: issueLoading } = useGetIssue(issueId, {
    query: { queryKey: ['issue', issueId], enabled: !!issueId }
  });

  const { data: history } = useGetIssueHistory(issueId, {
    query: { queryKey: ['issueHistory', issueId], enabled: !!issueId }
  });

  const { data: technicians } = useListTechnicians({
    query: { queryKey: ['technicians'], enabled: user?.role === 'admin' }
  });

  const { data: maintenance } = useListMaintenance({ issueId }, {
    query: { queryKey: ['maintenance', issueId], enabled: !!issueId }
  });

  const updateStatus = useUpdateIssueStatus();
  const assignIssue = useAssignIssue();
  const createMaintenance = useCreateMaintenance();

  const maintenanceForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { notes: '', timeSpentMinutes: undefined, cost: undefined },
  });

  if (issueLoading) {
    return <div className="p-8 text-center text-muted-foreground font-mono">LOADING ISSUE...</div>;
  }

  if (!issue) {
    return <div className="p-8 text-center text-destructive font-mono">ISSUE NOT FOUND</div>;
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id: issueId, data: { status: newStatus as IssueStatus } },
      {
        onSuccess: () => {
          toast({ title: 'Status updated' });
          queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
          queryClient.invalidateQueries({ queryKey: ['issueHistory', issueId] });
        }
      }
    );
  };

  const handleAssign = (techIdStr: string) => {
    assignIssue.mutate(
      { id: issueId, data: { technicianId: parseInt(techIdStr, 10) } },
      {
        onSuccess: () => {
          toast({ title: 'Technician assigned' });
          queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
          queryClient.invalidateQueries({ queryKey: ['issueHistory', issueId] });
        }
      }
    );
  };

  const onMaintenanceSubmit = (data: MaintenanceFormValues) => {
    createMaintenance.mutate(
      { id: issueId, data },
      {
        onSuccess: () => {
          toast({ title: 'Work logged successfully' });
          setIsLogWorkOpen(false);
          maintenanceForm.reset();
          queryClient.invalidateQueries({ queryKey: ['maintenance', issueId] });
        }
      }
    );
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical': return <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground rounded-none uppercase font-mono">Critical</Badge>;
      case 'high': return <Badge className="bg-warning hover:bg-warning text-warning-foreground rounded-none uppercase font-mono">High</Badge>;
      case 'medium': return <Badge className="bg-primary hover:bg-primary text-primary-foreground rounded-none uppercase font-mono">Medium</Badge>;
      default: return <Badge className="bg-muted hover:bg-muted text-muted-foreground rounded-none uppercase font-mono border-none">Low</Badge>;
    }
  };

  const availableTransitions: Record<string, string[]> = {
    'reported': ['assigned', 'closed'],
    'assigned': ['inspection_started', 'reopened'],
    'inspection_started': ['maintenance_in_progress', 'waiting_for_parts', 'resolved'],
    'maintenance_in_progress': ['waiting_for_parts', 'resolved'],
    'waiting_for_parts': ['maintenance_in_progress'],
    'resolved': ['closed', 'reopened'],
    'closed': ['reopened'],
    'reopened': ['assigned', 'inspection_started'],
  };

  const possibleNextStates = availableTransitions[issue.status] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/issues" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm font-mono uppercase">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Issues
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xl text-primary font-bold">{issue.issueNumber}</span>
            {getPriorityBadge(issue.priority)}
            <Badge variant="outline" className="rounded-none uppercase font-mono">{issue.status.replace(/_/g, ' ')}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{issue.title}</h1>
        </div>

        <div className="flex items-center gap-2 bg-muted p-2 w-full md:w-auto">
          <Select 
            value={issue.status} 
            onValueChange={handleStatusChange}
            disabled={updateStatus.isPending || (user?.role !== 'admin' && issue.assignedTechnicianId !== user?.id)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-10 bg-background rounded-none font-mono uppercase text-xs font-bold border-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value={issue.status} disabled className="uppercase text-xs font-bold">
                {issue.status.replace(/_/g, ' ')} (CURRENT)
              </SelectItem>
              {possibleNextStates.map(s => (
                <SelectItem key={s} value={s} className="uppercase text-xs">
                  → TRANSITION TO {s.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card rounded-none">
            <CardContent className="p-6">
              <div className="prose max-w-none text-sm">
                <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2">Description</h3>
                <p className="whitespace-pre-wrap">{issue.description}</p>
              </div>

              {issue.aiPossibleCauses && issue.aiPossibleCauses.length > 0 && (
                <div className="mt-8 bg-muted/50 border-l-4 border-primary p-4">
                  <div className="flex items-center gap-2 font-bold text-primary mb-3 text-sm">
                    <Activity className="h-4 w-4" /> AI DIAGNOSTIC REPORT
                  </div>
                  <div className="space-y-4 text-sm">
                    {issue.aiSafetyNotes && (
                      <div className="text-destructive flex gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{issue.aiSafetyNotes}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-mono text-xs uppercase text-muted-foreground mb-1 block">Possible Causes</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {issue.aiPossibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Logs */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-xl font-bold">Maintenance Log</h3>
              {(user?.role === 'admin' || user?.id === issue.assignedTechnicianId) && (
                <Dialog open={isLogWorkOpen} onOpenChange={setIsLogWorkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-none font-bold uppercase text-xs h-8">
                      <Wrench className="h-3 w-3 mr-2" /> Log Work
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none border-border">
                    <DialogHeader>
                      <DialogTitle>Log Maintenance Work</DialogTitle>
                    </DialogHeader>
                    <Form {...maintenanceForm}>
                      <form onSubmit={maintenanceForm.handleSubmit(onMaintenanceSubmit)} className="space-y-4 pt-4">
                        <FormField control={maintenanceForm.control} name="notes" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-mono text-xs uppercase">Work Notes</FormLabel>
                            <FormControl><Textarea rows={4} {...field} className="bg-muted/50 rounded-none resize-none" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={maintenanceForm.control} name="timeSpentMinutes" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-mono text-xs uppercase">Time Spent (min)</FormLabel>
                              <FormControl><Input type="number" {...field} value={field.value || ''} className="bg-muted/50 rounded-none" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={maintenanceForm.control} name="cost" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-mono text-xs uppercase">Cost ($)</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} className="bg-muted/50 rounded-none" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <Button type="submit" className="w-full rounded-none font-bold mt-2" disabled={createMaintenance.isPending}>
                          {createMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE RECORD"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {maintenance?.items && maintenance.items.length > 0 ? (
              <div className="space-y-4">
                {maintenance.items.map(log => (
                  <Card key={log.id} className="bg-muted/30 rounded-none border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" /> {log.technicianName}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mb-3">{log.notes}</p>
                      <div className="flex gap-4 text-xs font-mono text-muted-foreground border-t pt-2">
                        {log.timeSpentMinutes != null && <span>TIME: {log.timeSpentMinutes}m</span>}
                        {log.cost != null && <span>COST: ${log.cost.toFixed(2)}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-border text-center text-sm font-mono text-muted-foreground">
                NO MAINTENANCE LOGS RECORDED YET
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-none">
            <CardHeader className="bg-muted/50 py-3 px-4 border-b">
              <CardTitle className="text-xs font-mono uppercase">Asset Context</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs font-mono uppercase block">Target Asset</span>
                <Link href={`/assets/${issue.assetId}`} className="font-bold text-primary hover:underline">
                  {issue.assetName} ({issue.assetCode})
                </Link>
              </div>
              
              <Separator />
              
              <div>
                <span className="text-muted-foreground text-xs font-mono uppercase block mb-2">Assignment</span>
                {user?.role === 'admin' ? (
                  <Select 
                    value={issue.assignedTechnicianId?.toString() || 'unassigned'} 
                    onValueChange={handleAssign}
                    disabled={assignIssue.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/50 rounded-none">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="unassigned">UNASSIGNED</SelectItem>
                      {technicians?.items.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> {issue.assignedTechnicianName || 'Unassigned'}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Reporter</span>
                <div className="font-medium">{issue.reporterName}</div>
                <div className="text-muted-foreground">{issue.reporterEmail}</div>
                {issue.reporterPhone && <div className="text-muted-foreground">{issue.reporterPhone}</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="bg-muted/50 py-3 px-4 border-b">
              <CardTitle className="text-xs font-mono uppercase flex items-center gap-2">
                <History className="h-4 w-4" /> History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {history?.items.map(entry => (
                  <div key={entry.id} className="text-sm">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                      <span>{format(new Date(entry.createdAt), 'MMM d, HH:mm')}</span>
                      <span>{entry.userName}</span>
                    </div>
                    <div>
                      {entry.action === 'status_changed' ? (
                        <span>Status → <span className="font-bold">{entry.status?.replace(/_/g, ' ').toUpperCase()}</span></span>
                      ) : entry.action === 'technician_assigned' ? (
                        <span>Assigned to <span className="font-bold">{entry.notes?.split('to ')[1] || 'technician'}</span></span>
                      ) : (
                        <span>{entry.action.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}