'use client';

import { DashboardLayout } from '../../../components/DashboardLayout';
import { RoleBasedGuard } from '../../../components/RoleBasedGuard';
import { useParams } from 'next/navigation';
import { Analytics } from '../../../components/pages/Analytics';
import { Clients } from '../../../components/pages/Clients';
import { CustomerSupport } from '../../../components/pages/CustomerSupport';
import { Invoices } from '../../../components/pages/Invoices';
import { IssuesLog } from '../../../components/pages/IssuesLog';
import { NotFound } from '../../../components/pages/NotFound';
import { Overview } from '../../../components/pages/Overview';
import { Revenue } from '../../../components/pages/Revenue';
import { Settings } from '../../../components/pages/Settings';
import { Subscriptions } from '../../../components/pages/Subscriptions';
import { SystemHealth } from '../../../components/pages/SystemHealth';
import { Users } from '../../../components/pages/Users';

const ownerRouteMap = {
  '': Overview,
  clients: Clients,
  users: Users,
  revenue: Revenue,
  subscriptions: Subscriptions,
  issues: IssuesLog,
  invoices: Invoices,
  analytics: Analytics,
  'system-health': SystemHealth,
  support: CustomerSupport,
  settings: Settings,
};

export default function DashboardCatchAllPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam : slugParam ? [slugParam] : [];
  const routeKey = slug.join('/');

  const OwnerComponent = ownerRouteMap[routeKey] || NotFound;

  return (
    <RoleBasedGuard allowedRoles={['owner']}>
      <DashboardLayout>
        <OwnerComponent />
      </DashboardLayout>
    </RoleBasedGuard>
  );
}
