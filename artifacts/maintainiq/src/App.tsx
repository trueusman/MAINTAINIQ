import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// Layouts
import AuthLayout from './components/layouts/auth-layout';
import AppLayout from './components/layouts/app-layout';
import PublicLayout from './components/layouts/public-layout';

// Pages
import LandingPage from './pages/landing';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ScanPage from './pages/scan';
import DashboardPage from './pages/dashboard';
import AssetsPage from './pages/assets';
import AssetDetailPage from './pages/asset-detail';
import IssuesPage from './pages/issues';
import IssueDetailPage from './pages/issue-detail';
import TechniciansPage from './pages/technicians';
import HistoryPage from './pages/history';
import NotificationsPage from './pages/notifications';
import SettingsPage from './pages/settings';
import NotFound from '@/pages/not-found';

setAuthTokenGetter(() => {
  return localStorage.getItem('maintainiq_token');
});

const queryClient = new QueryClient();

// Placeholder components until built
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8"><h1 className="text-2xl font-bold">{name} coming soon...</h1></div>
);

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/">
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      </Route>
      <Route path="/scan/:assetCode">
        {(params) => (
          <PublicLayout>
            <ScanPage assetCode={params.assetCode} />
          </PublicLayout>
        )}
      </Route>

      {/* Auth Pages */}
      <Route path="/login">
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Route>
      <Route path="/register">
        <AuthLayout>
          <RegisterPage />
        </AuthLayout>
      </Route>

      {/* App Pages */}
      <Route path="/dashboard">
        <AppLayout><DashboardPage /></AppLayout>
      </Route>
      <Route path="/assets">
        <AppLayout><AssetsPage /></AppLayout>
      </Route>
      <Route path="/assets/:id">
        <AppLayout><AssetDetailPage /></AppLayout>
      </Route>
      <Route path="/issues">
        <AppLayout><IssuesPage /></AppLayout>
      </Route>
      <Route path="/issues/:id">
        <AppLayout><IssueDetailPage /></AppLayout>
      </Route>
      <Route path="/technicians">
        <AppLayout><TechniciansPage /></AppLayout>
      </Route>
      <Route path="/history">
        <AppLayout><HistoryPage /></AppLayout>
      </Route>
      <Route path="/notifications">
        <AppLayout><NotificationsPage /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><SettingsPage /></AppLayout>
      </Route>

      <Route>
        <PublicLayout>
          <NotFound />
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;