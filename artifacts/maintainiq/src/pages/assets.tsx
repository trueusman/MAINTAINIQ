import { useState } from 'react';
import { useListAssets, useCreateAsset, AssetCondition, AssetStatus } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Filter, Plus, QrCode, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  assetCode: z.string().min(1, "Asset Code is required"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  condition: z.nativeEnum(AssetCondition).optional(),
});

type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

export default function AssetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<any>(null);

  const { data: assets, isLoading, refetch } = useListAssets({
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
  }, {
    query: {
      queryKey: ['assets', search, status],
    }
  });

  const createAsset = useCreateAsset();

  const form = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      name: '',
      assetCode: '',
      category: '',
      location: '',
      condition: 'good',
    },
  });

  const onSubmit = (data: CreateAssetFormValues) => {
    createAsset.mutate({ data: { ...data, status: 'operational' } }, {
      onSuccess: () => {
        toast({ title: 'Asset created successfully' });
        setIsCreateOpen(false);
        form.reset();
        refetch();
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Error creating asset', description: err.message });
      }
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'operational': return 'bg-success text-success-foreground border-success';
      case 'under_maintenance': return 'bg-warning text-warning-foreground border-warning';
      case 'out_of_service': return 'bg-destructive text-destructive-foreground border-destructive';
      case 'retired': return 'bg-muted text-muted-foreground border-muted-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Assets</h1>
          <p className="text-muted-foreground font-mono mt-1">Manage and track physical inventory.</p>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold"><Plus className="mr-2 h-4 w-4" /> NEW ASSET</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-none border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Register New Asset</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono text-xs uppercase">Asset Name</FormLabel>
                        <FormControl><Input {...field} className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="assetCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Unique Code</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. CH-001" className="bg-muted/50 uppercase" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Category</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. HVAC" className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono text-xs uppercase">Physical Location</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. Roof Deck B" className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="manufacturer" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Manufacturer</FormLabel>
                        <FormControl><Input {...field} className="bg-muted/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="condition" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase">Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(AssetCondition).map(c => (
                              <SelectItem key={c} value={c} className="uppercase">{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={createAsset.isPending}>
                    {createAsset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "REGISTER ASSET"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search assets by name, code, or location..." 
                className="pl-9 h-12 bg-muted/50 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 bg-muted/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL STATUSES</SelectItem>
                  {Object.values(AssetStatus).map(s => (
                    <SelectItem key={s} value={s} className="uppercase">{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[200px] bg-muted/50 animate-pulse border border-border" />)}
        </div>
      ) : assets?.items && assets.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.items.map((asset) => (
            <Card key={asset.id} className="bg-card hover:border-primary transition-colors overflow-hidden group flex flex-col">
              <CardHeader className="pb-2 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-primary font-bold mb-1">{asset.assetCode}</div>
                    <CardTitle className="text-lg leading-tight">{asset.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={`font-mono text-[10px] rounded-sm uppercase ${getStatusColor(asset.status)}`}>
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Location</div>
                    <div className="font-medium text-sm">{asset.location}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground uppercase">Category</div>
                      <div className="font-medium text-sm">{asset.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-muted-foreground uppercase">Condition</div>
                      <div className="font-medium text-sm capitalize">{asset.condition}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link href={`/assets/${asset.id}`} className="flex-1">
                    <Button variant="outline" className="w-full font-bold">VIEW DETAILS</Button>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-12 px-0" onClick={() => setSelectedAssetForQR(asset)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {selectedAssetForQR && selectedAssetForQR.id === asset.id && (
                      <DialogContent className="sm:max-w-md rounded-none border-border">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-center">Asset QR Code</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-8 space-y-6">
                          <div className="bg-white p-4 border-4 border-black">
                            <QRCodeSVG 
                              value={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/scan/${asset.assetCode}`} 
                              size={200}
                              level="H"
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-xl">{asset.name}</p>
                            <p className="font-mono text-primary text-lg">{asset.assetCode}</p>
                            <p className="text-muted-foreground text-sm mt-2 font-mono">Scan to report an issue</p>
                          </div>
                          <Button 
                            className="w-full font-bold" 
                            onClick={() => window.print()}
                          >
                            PRINT QR CODE
                          </Button>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No assets found</h3>
            <p className="text-muted-foreground font-mono max-w-md">
              {search || status !== 'all' 
                ? "Try adjusting your search or filters." 
                : "Register your first piece of equipment to get started."}
            </p>
            {!search && status === 'all' && user?.role === 'admin' && (
              <Button className="mt-6 font-bold" onClick={() => setIsCreateOpen(true)}>
                REGISTER FIRST ASSET
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}