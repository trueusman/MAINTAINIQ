import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister, RegisterInputRole } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(['admin', 'technician'] as const),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { setSession } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'technician',
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (session) => {
          setSession(session);
          toast({
            title: "Registration successful",
            description: `Account created for ${session.user.name}.`,
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: error.message || "Could not create account. Please try again.",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register Personnel</h1>
        <p className="text-muted-foreground font-mono mt-2">Create a new system access profile.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} className="h-12 bg-muted/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase">Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tech@maintainiq.com" {...field} className="h-12 bg-muted/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase">Access Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-muted/50">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-md font-bold mt-4" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> PROVISIONING...</>
            ) : (
              "PROVISION ACCOUNT"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm font-mono text-muted-foreground pt-4 border-t">
        ALREADY REGISTERED? <Link href="/login" className="text-primary hover:underline font-bold">AUTHENTICATE</Link>
      </div>
    </div>
  );
}