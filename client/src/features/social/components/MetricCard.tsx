import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: LucideIcon;
  format?: 'number' | 'percentage' | 'currency';
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  format = 'number' 
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${formatNumber(val)}`;
      default:
        return formatNumber(val);
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card className="card-hover animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{formatValue(value)}</div>
        <p className="text-xs text-gray-500 mt-2">
          <span className={getTrendColor()}>
            {getTrendIcon()} {Math.abs(change).toFixed(1)}%
          </span>{' '}
          from last period
        </p>
      </CardContent>
    </Card>
  );
}

