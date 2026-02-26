export function StatusBadge({ status, variant = 'default' }) {
  const getStatusStyles = (status) => {
    const normalized = status.toLowerCase();
    
    if (normalized === 'active' || normalized === 'operational' || normalized === 'healthy' || normalized === 'closed') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (normalized === 'trial' || normalized === 'pending' || normalized === 'open' || normalized === 'in progress') {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    if (normalized === 'suspended' || normalized === 'error' || normalized === 'critical' || normalized === 'high') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (normalized === 'medium') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (normalized === 'low') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const paddingClass = variant === 'compact' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${getStatusStyles(status)} ${paddingClass}`}>
      {status}
    </span>
  );
}
