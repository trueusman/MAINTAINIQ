import { useGetDashboardOverview, useGetDashboardCharts, useGetRecentActivities } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle, Box, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from 'recharts';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: overview, isLoading: loadingOverview } = useGetDashboardOverview({
    query: {
      queryKey: ['dashboardOverview'],
    }
  });

  const { data: charts, isLoading: loadingCharts } = useGetDashboardCharts({
    query: {
      queryKey: ['dashboardCharts'],
    }
  });

  const { data: activities, isLoading: loadingActivities } = useGetRecentActivities(
    { limit: 10 },
    {
      query: {
        queryKey: ['recentActivities', 10],
      }
    }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground font-mono mt-1">
          {user?.role === 'admin' ? 'Global operations & analytics.' : 'Your assigned tasks and recent activity.'}
        </p>
      </div>

      {loadingOverview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-muted/50" />)}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Total Assets</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalAssets}</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                <span className="text-success">{overview.operationalAssets} OPERATIONAL</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Active Issues</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalIssues}</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {overview.pendingIssues} PENDING
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive text-destructive-foreground border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono opacity-80 uppercase">Critical Priority</CardTitle>
              <AlertCircle className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.criticalIssues}</div>
              <div className="text-xs opacity-80 mt-1 font-mono">
                REQUIRES IMMEDIATE ATTENTION
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.resolvedIssues}</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                TOTAL ISSUES CLOSED
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase">Monthly Repairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {loadingCharts ? (
                  <Skeleton className="w-full h-full bg-muted/50" />
                ) : charts?.monthlyRepairs && charts.monthlyRepairs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.monthlyRepairs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: 'var(--color-muted)'}}
                        contentStyle={{backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 0}} 
                      />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">NO DATA AVAILABLE</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-card">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase">Issue Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {loadingCharts ? (
                    <Skeleton className="w-full h-full bg-muted/50" />
                  ) : charts?.issueCategories && charts.issueCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.issueCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="category"
                        >
                          {charts.issueCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 0}} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">NO DATA AVAILABLE</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase">Asset Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingCharts ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full bg-muted/50" />)
                  ) : charts?.assetStatus ? (
                    charts.assetStatus.map(status => (
                      <div key={status.status} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <span className="font-mono text-sm uppercase">{status.status.replace('_', ' ')}</span>
                        <span className="font-bold">{status.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground font-mono text-sm">NO DATA AVAILABLE</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase flex items-center gap-2">
                <Activity className="h-4 w-4" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loadingActivities ? (
                  [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full bg-muted/50" />)
                ) : activities?.items && activities.items.length > 0 ? (
                  activities.items.map(activity => (
                    <div key={activity.id} className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-border last:before:hidden">
                      <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-background border-2 border-primary rounded-full z-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                      <div className="mb-1 text-sm font-bold">
                        {activity.userName} <span className="font-normal text-muted-foreground">{activity.action.toLowerCase()}</span>
                      </div>
                      <div className="text-sm">
                        {activity.issueNumber ? (
                          <span className="text-primary font-mono">{activity.issueNumber}</span>
                        ) : (
                          <span className="font-medium">{activity.assetName}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground font-mono text-sm">NO ACTIVITY RECORDED</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}