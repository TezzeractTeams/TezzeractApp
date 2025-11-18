import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Twitter, Facebook, Instagram, Youtube, BarChart3 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

type PlatformType = 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'google_analytics';

interface PlatformMetrics {
  platform: PlatformType;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    followers: number;
  };
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface PlatformCardProps {
  platform: PlatformType;
  metrics: PlatformMetrics;
  onViewDetails: () => void;
}

const platformConfig: Record<PlatformType, { name: string; icon: LucideIcon; color: string; bgColor: string }> = {
  twitter: { 
    name: 'Twitter/X', 
    icon: Twitter, 
    color: 'text-black',
    bgColor: 'bg-black'
  },
  facebook: { 
    name: 'Facebook', 
    icon: Facebook, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-600'
  },
  instagram: { 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-600'
  },
  youtube: { 
    name: 'YouTube', 
    icon: Youtube, 
    color: 'text-red-600',
    bgColor: 'bg-red-600'
  },
  google_analytics: { 
    name: 'Google Analytics', 
    icon: BarChart3, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-600'
  },
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export function PlatformCard({ platform, metrics, onViewDetails }: PlatformCardProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;
  
  const hasData = metrics.metrics.impressions > 0 || metrics.metrics.reach > 0 || metrics.metrics.engagement > 0;

  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{config.name}</h3>
              <p className={`text-xs ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
                {hasData ? 'Connected' : 'No data'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Impressions</span>
            <span className="font-semibold text-gray-900">{formatNumber(metrics.metrics.impressions)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Engagement</span>
            <span className="font-semibold text-gray-900">{formatNumber(metrics.metrics.engagement)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Followers</span>
            <span className="font-semibold text-gray-900">{formatNumber(metrics.metrics.followers)}</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

