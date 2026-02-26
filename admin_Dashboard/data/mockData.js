// Mock data for the SaaS dashboard

export const kpiData = {
  totalClients: { value: 1247, change: 12.5, trend: 'up' },
  activeTenants: { value: 1189, change: 8.3, trend: 'up' },
  totalUsers: { value: 24567, change: 15.2, trend: 'up' },
  monthlyRevenue: { value: 142850, change: 18.7, trend: 'up' },
  activeSubscriptions: { value: 1203, change: 5.4, trend: 'up' },
  openTickets: { value: 43, change: -12.3, trend: 'down' },
};

export const revenueData = [
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 98000 },
  { month: 'Apr', revenue: 105000 },
  { month: 'May', revenue: 118000 },
  { month: 'Jun', revenue: 125000 },
  { month: 'Jul', revenue: 130000 },
  { month: 'Aug', revenue: 128000 },
  { month: 'Sep', revenue: 135000 },
  { month: 'Oct', revenue: 138000 },
  { month: 'Nov', revenue: 140000 },
  { month: 'Dec', revenue: 142850 },
];

export const subscriptionData = [
  { name: 'Basic', value: 425, color: '#3b82f6' },
  { name: 'Pro', value: 578, color: '#8b5cf6' },
  { name: 'Enterprise', value: 200, color: '#06b6d4' },
];

export const recentClients = [
  {
    id: 1,
    name: 'Acme Corporation',
    plan: 'Enterprise',
    users: 245,
    status: 'Active',
    revenue: 2499,
    lastActivity: '2 hours ago',
    adminEmail: 'admin@acme.com',
    createdDate: '2024-01-15',
  },
  {
    id: 2,
    name: 'TechStart Inc',
    plan: 'Pro',
    users: 87,
    status: 'Active',
    revenue: 899,
    lastActivity: '5 hours ago',
    adminEmail: 'tech@techstart.io',
    createdDate: '2024-03-22',
  },
  {
    id: 3,
    name: 'Design Studios',
    plan: 'Pro',
    users: 52,
    status: 'Trial',
    revenue: 0,
    lastActivity: '1 day ago',
    adminEmail: 'hello@designstudios.com',
    createdDate: '2026-02-10',
  },
  {
    id: 4,
    name: 'Global Solutions Ltd',
    plan: 'Enterprise',
    users: 412,
    status: 'Active',
    revenue: 4999,
    lastActivity: '3 hours ago',
    adminEmail: 'it@globalsolutions.com',
    createdDate: '2023-11-08',
  },
  {
    id: 5,
    name: 'StartUp Hub',
    plan: 'Basic',
    users: 12,
    status: 'Active',
    revenue: 199,
    lastActivity: '2 days ago',
    adminEmail: 'contact@startuphub.co',
    createdDate: '2025-08-19',
  },
  {
    id: 6,
    name: 'Innovation Labs',
    plan: 'Pro',
    users: 98,
    status: 'Suspended',
    revenue: 0,
    lastActivity: '1 week ago',
    adminEmail: 'admin@innovationlabs.io',
    createdDate: '2024-05-14',
  },
];

export const systemHealth = {
  apiStatus: 'Operational',
  serverLoad: 42,
  databaseHealth: 'Healthy',
  errorRate: 0.12,
  uptime: 99.97,
};

export const issuesData = [
  {
    id: 'TKT-1891',
    clientName: 'Acme Corporation',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Sarah Chen',
    createdDate: '2026-02-15',
    title: 'API rate limit exceeded',
  },
  {
    id: 'TKT-1890',
    clientName: 'TechStart Inc',
    priority: 'Medium',
    status: 'Open',
    assignedTo: 'Mike Johnson',
    createdDate: '2026-02-15',
    title: 'Report export not working',
  },
  {
    id: 'TKT-1889',
    clientName: 'Design Studios',
    priority: 'Low',
    status: 'Open',
    assignedTo: 'Unassigned',
    createdDate: '2026-02-14',
    title: 'UI alignment issue on mobile',
  },
  {
    id: 'TKT-1888',
    clientName: 'Global Solutions Ltd',
    priority: 'Critical',
    status: 'In Progress',
    assignedTo: 'David Park',
    createdDate: '2026-02-14',
    title: 'Data sync failing for large datasets',
  },
  {
    id: 'TKT-1887',
    clientName: 'StartUp Hub',
    priority: 'Medium',
    status: 'Closed',
    assignedTo: 'Sarah Chen',
    createdDate: '2026-02-13',
    title: 'Password reset email not received',
  },
  {
    id: 'TKT-1886',
    clientName: 'Innovation Labs',
    priority: 'High',
    status: 'Closed',
    assignedTo: 'Mike Johnson',
    createdDate: '2026-02-12',
    title: 'Payment processing error',
  },
];

export const supportMetrics = {
  totalTickets: 287,
  pendingResponses: 43,
  averageResponseTime: '2.4 hours',
  satisfactionRate: 94.5,
  escalatedCases: 8,
  liveChatRequests: 12,
};

export const topPayingClients = [
  { name: 'Global Solutions Ltd', plan: 'Enterprise', revenue: 4999 },
  { name: 'Enterprise Corp', plan: 'Enterprise', revenue: 4999 },
  { name: 'Acme Corporation', plan: 'Enterprise', revenue: 2499 },
  { name: 'Tech Giants Inc', plan: 'Enterprise', revenue: 2499 },
  { name: 'Digital Dynamics', plan: 'Pro', revenue: 899 },
];

export const revenueMetrics = {
  monthly: 142850,
  quarterly: 412450,
  annual: 1645200,
  mrr: 142850,
  arr: 1714200,
};

export const activityData = [
  { date: '2026-02-16', users: 18234, sessions: 24567 },
  { date: '2026-02-15', users: 17891, sessions: 23890 },
  { date: '2026-02-14', users: 16234, sessions: 21456 },
  { date: '2026-02-13', users: 15678, sessions: 20123 },
  { date: '2026-02-12', users: 14567, sessions: 19234 },
  { date: '2026-02-11', users: 13234, sessions: 17890 },
  { date: '2026-02-10', users: 12890, sessions: 16234 },
];
