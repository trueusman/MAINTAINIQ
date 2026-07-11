import { useState } from 'react';
import { useListTechnicians, useCreateTechnician, useUpdateTechnician } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Loader2, UserX, UserCheck, Wrench, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const createTechSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

type CreateTechFormValues = z.infer<typeof createTechSchema>;

export default function TechniciansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: technicians, isLoading } = useListTechnicians({
    query: {
      queryKey: ['technicians'],
      enabled: user?.role === 'admin'
    }
  });

  const createTech = useCreateTechnician();
  const updateTech = useUpdateTechnician();

  const form = useForm<CreateTechFormValues>({
    resolver: zodResolver(createTechSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = (data: CreateTechFormValues) => {
    createTech.mutate({ data }, {
      onSuccess: () => {
        toast({ title: 'Technician profile created' });
        setIsCreateOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ['technicians'] });
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Failed to create technician', description: err.message });
      }
    });
  };

  const toggleActiveStatus = (id: number, currentStatus: boolean) => {
    updateTech.mutate(
      { id, data: { active: !currentStatus } },
      {
        onSuccess: () => {
          toast({ title: `Technician ${!currentStatus ? 'activated' : 'deactivated'}` });
          queryClient.invalidateQueries({ queryKey: ['technicians'] });
        }
      }
    );
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center font-mono text-destructive">UNAUTHORIZED ACCESS</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technician Roster</h1>
          <p className="text-muted-foreground font-mono mt-1">Manage maintenance personnel and workload.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold rounded-none"><Plus className="mr-2 h-4 w-4" /> ADD TECHNICIAN</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Technician Profile</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase">Full Name</FormLabel>
                    <FormControl><Input {...field} className="bg-muted/50 rounded-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase">Email Address</FormLabel>
                    <FormControl><Input type="email" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase">Initial Password</FormLabel>
                    <FormControl><Input type="password" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase">Phone Number (Optional)</FormLabel>
                    <FormControl><Input type="tel" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full font-bold rounded-none mt-2" disabled={createTech.isPending}>
                  {createTech.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "PROVISION PROFILE"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted/50 animate-pulse border border-border" />)
        ) : technicians?.items && technicians.items.length > 0 ? (
          technicians.items.map(tech => (
            <Card key={tech.id} className={`rounded-none border-border ${!tech.active ? 'opacity-60 grayscale' : ''}`}>
              <CardContent className="p-0">
                <div className="p-6 border-b flex justify-between items-start bg-muted/20">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{tech.name}</h3>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{tech.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-none font-mono text-[10px] uppercase ${tech.active ? 'bg-success text-success-foreground border-success' : 'bg-muted text-muted-foreground'}`}>
                    {tech.active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 border border-border">
                    <Wrench className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold font-mono">{tech.assignedIssuesCount}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase mt-1">Assigned</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 border border-border">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-success" />
                    <div className="text-2xl font-bold font-mono">{tech.resolvedIssuesCount}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase mt-1">Resolved</div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-none font-bold text-xs"
                    onClick={() => toggleActiveStatus(tech.id, tech.active)}
                    disabled={updateTech.isPending}
                  >
                    {tech.active ? (
                      <><UserX className="h-4 w-4 mr-2" /> DEACTIVATE</>
                    ) : (
                      <><UserCheck className="h-4 w-4 mr-2" /> ACTIVATE</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border bg-muted/10">
            <Users className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No technicians provisioned</h3>
            <p className="text-muted-foreground font-mono text-sm max-w-sm mx-auto">
              Add your maintenance personnel to start assigning work orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}