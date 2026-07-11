import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { setSession } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (session) => {
          setSession(session);
          toast({
            title: "Authentication successful",
            description: `Welcome back, ${session.user.name}.`,
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: error.message || "Invalid credentials. Please try again.",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Access</h1>
        <p className="text-muted-foreground font-mono mt-2">Enter credentials to authenticate.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <Button 
            type="submit" 
            className="w-full h-12 text-md font-bold mt-2" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> AUTHENTICATING...</>
            ) : (
              "AUTHENTICATE"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm font-mono text-muted-foreground pt-4 border-t">
        NO ACCOUNT? <Link href="/register" className="text-primary hover:underline font-bold">REGISTER PERSONNEL</Link>
      </div>
    </div>
  );
}