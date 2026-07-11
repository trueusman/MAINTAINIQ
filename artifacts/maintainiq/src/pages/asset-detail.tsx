import { useGetAsset, useGetAssetHistory, AssetStatus, AssetCondition } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useParams } from 'wouter';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Box, Clock, Edit, FileText, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const assetId = parseInt(id, 10);
  const { user } = useAuth();

  const { data: asset, isLoading: assetLoading } = useGetAsset(assetId, {
    query: { queryKey: ['asset', assetId], enabled: !!assetId }
  });

  const { data: history, isLoading: historyLoading } = useGetAssetHistory(assetId, {
    query: { queryKey: ['assetHistory', assetId], enabled: !!assetId }
  });

  if (assetLoading) {
    return <div className="p-8 text-center text-muted-foreground font-mono">LOADING ASSET...</div>;
  }

  if (!asset) {
    return <div className="p-8 text-center text-destructive font-mono">ASSET NOT FOUND</div>;
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'operational': return 'bg-success hover:bg-success text-success-foreground border-success';
      case 'under_maintenance': return 'bg-warning hover:bg-warning text-warning-foreground border-warning';
      case 'out_of_service': return 'bg-destructive hover:bg-destructive text-destructive-foreground border-destructive';
      case 'retired': return 'bg-muted hover:bg-muted text-muted-foreground border-muted-foreground';
      default: return 'bg-primary hover:bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/assets" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm font-mono uppercase">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xl text-primary font-bold">{asset.assetCode}</span>
            <Badge variant="outline" className={`rounded-none font-mono text-[10px] uppercase ${getStatusBadge(asset.status)}`}>
              {asset.status.replace('_', ' ')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
        </div>

        {user?.role === 'admin' && (
          <Button variant="outline" className="rounded-none font-bold">
            <Edit className="h-4 w-4 mr-2" /> EDIT ASSET
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none border-border">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="h-5 w-5" /> Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-6 space-y-6">
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Category</span>
                    <div className="font-medium text-lg">{asset.category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Physical Location</span>
                    <div className="font-medium text-lg">{asset.location}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Current Condition</span>
                    <div className="font-medium text-lg capitalize">{asset.condition}</div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Manufacturer</span>
                    <div className="font-medium">{asset.manufacturer || '—'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Model / Serial</span>
                    <div className="font-medium">{asset.model || '—'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Warranty Expiry</span>
                    <div className="font-medium">{asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), 'MMM d, yyyy') : '—'}</div>
                  </div>
                </div>
              </div>
              
              {asset.internalNotes && (
                <div className="p-6 border-t border-border bg-muted/10">
                  <span className="text-muted-foreground text-xs font-mono uppercase block mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Internal Notes
                  </span>
                  <p className="text-sm whitespace-pre-wrap">{asset.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardHeader className="bg-muted/30 border-b py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timeline & History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {historyLoading ? (
                 <Skeleton className="h-32 w-full bg-muted/50 rounded-none" />
              ) : history?.items && history.items.length > 0 ? (
                <div className="space-y-6">
                  {history.items.map((entry) => (
                    <div key={entry.id} className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-border last:before:hidden">
                      <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-background border-2 border-primary rounded-full z-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm">
                            {entry.action === 'status_changed' ? (
                              <span>Status updated to {entry.status?.replace(/_/g, ' ').toUpperCase()}</span>
                            ) : entry.action === 'created' ? (
                              'Asset registered in system'
                            ) : entry.action === 'issue_reported' ? (
                              <span>Issue <Link href={`/issues/${entry.issueId}`} className="text-primary hover:underline">{entry.issueNumber}</Link> reported</span>
                            ) : (
                              entry.action.replace(/_/g, ' ')
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            by {entry.userName}
                          </div>
                          {entry.notes && <div className="text-sm italic mt-1 border-l-2 pl-2 text-muted-foreground">{entry.notes}</div>}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground whitespace-nowrap ml-4">
                          {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 font-mono text-muted-foreground text-sm">NO HISTORY FOUND</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-none border-border bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase text-center text-primary flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4" /> Public Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-3 border-2 border-primary/20 mb-4">
                <QRCodeSVG 
                  value={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/scan/${asset.assetCode}`} 
                  size={150}
                  level="Q"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mb-4 max-w-[200px]">
                Print and affix to physical asset. Anyone can scan to report an issue.
              </p>
              <Button className="w-full rounded-none font-bold text-xs h-8" variant="outline" onClick={() => window.print()}>
                PRINT TAG
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardHeader className="bg-muted/30 border-b py-3 px-4">
              <CardTitle className="text-xs font-mono uppercase">Service Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Last Serviced</span>
                <div className="font-medium text-sm">
                  {asset.lastServiceDate ? format(new Date(asset.lastServiceDate), 'MMMM d, yyyy') : 'No record'}
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground text-xs font-mono uppercase block mb-1">Next Scheduled</span>
                <div className="font-medium text-sm text-primary">
                  {asset.nextServiceDate ? format(new Date(asset.nextServiceDate), 'MMMM d, yyyy') : 'Unscheduled'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}