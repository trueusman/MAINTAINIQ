import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateCurrentUser, useChangePassword } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const updateProfile = useUpdateCurrentUser();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({ data }, {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        toast({ title: 'Profile updated successfully' });
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Update failed', description: err.message });
      }
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate({ 
      data: { 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      } 
    }, {
      onSuccess: () => {
        toast({ title: 'Password changed successfully' });
        passwordForm.reset();
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Password change failed', description: err.message });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personnel Settings</h1>
        <p className="text-muted-foreground font-mono mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="w-full aspect-square bg-muted flex items-center justify-center border border-border relative group">
            <User className="h-24 w-24 text-muted-foreground opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/80 transition-opacity">
              <Button variant="outline" className="font-mono text-xs rounded-none border-dashed" disabled>
                AVATAR UPLOAD (SOON)
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-mono text-muted-foreground uppercase">Access Level</div>
            <Badge variant="outline" className="rounded-none uppercase font-mono border-primary text-primary">
              {user.role} Privilege
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-mono text-muted-foreground uppercase">Email Address</div>
            <div className="font-medium text-sm truncate">{user.email}</div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-none border-border">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField control={profileForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase">Full Name</FormLabel>
                      <FormControl><Input {...field} className="bg-muted/50 rounded-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={profileForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase">Phone Number</FormLabel>
                      <FormControl><Input type="tel" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="rounded-none font-bold" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "SAVE PROFILE"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" /> Security Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase">Current Password</FormLabel>
                      <FormControl><Input type="password" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">New Password</FormLabel>
                        <FormControl><Input type="password" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Confirm New</FormLabel>
                        <FormControl><Input type="password" {...field} className="bg-muted/50 rounded-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="rounded-none font-bold" disabled={changePassword.isPending}>
                      {changePassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "UPDATE PASSWORD"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}