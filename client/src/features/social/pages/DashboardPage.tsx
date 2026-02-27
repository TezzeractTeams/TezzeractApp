import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, Eye, MousePointer, Target, Heart, Video, Calendar, Lightbulb, Settings, BarChart3 } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { PlatformCard } from '../components/PlatformCard';
import { AIInsights } from '../components/AIInsights';
import { PerformanceTrendChart } from '../components/PerformanceTrendChart';
import { BarChartComponent } from '../components/BarChartComponent';
import { Tabs } from '../components/Tabs';
import { useSocialService } from '@/shared/services/socialService';
import type { DashboardMetrics, PlatformMetrics, ChartDataPoint, AIInsights as AIInsightsType } from '@/shared/services/socialService';
import ContentCalendarPage from './ContentCalendarPage';
import ContentSuggestionsPage from './ContentSuggestionsPage';
import SettingsPage from './SettingsPage';

interface PlatformChartData {
  name: string;
  value: number;
}

const timeRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
  { id: 'suggestions', label: 'Content Suggestions', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

// Dashboard Tab Content Component
function DashboardTabContent({
  selectedTimeRange,
  setSelectedTimeRange,
  metrics,
  platformMetrics,
  chartData,
  platformChartData,
  aiInsights,
  loading,
}: {
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  metrics: DashboardMetrics;
  platformMetrics: PlatformMetrics[];
  chartData: ChartDataPoint[];
  platformChartData: PlatformChartData[];
  aiInsights: AIInsightsType | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={selectedTimeRange === range.value ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DashboardPage.tsx:timeRangeClick',message:'Time range button clicked',data:{range:range.value},hypothesisId:'H2',timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                setSelectedTimeRange(range.value);
              }}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          title="Total Impressions"
          value={metrics.impressions}
          change={12.5}
          trend="up"
          icon={Eye}
        />
        <MetricCard
          title="Reach"
          value={metrics.reach}
          change={8.2}
          trend="up"
          icon={Users}
        />
        <MetricCard
          title="Engagement"
          value={metrics.engagement}
          change={15.3}
          trend="up"
          icon={Heart}
        />
        <MetricCard
          title="Clicks"
          value={metrics.clicks}
          change={5.7}
          trend="up"
          icon={MousePointer}
        />
        <MetricCard
          title="Conversions"
          value={metrics.conversions}
          change={22.1}
          trend="up"
          icon={Target}
          format="number"
        />
        <MetricCard
          title="Total Followers"
          value={metrics.followers}
          change={3.4}
          trend="up"
          icon={Video}
          format="number"
        />
      </div>

      {/* Charts and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <PerformanceTrendChart 
            data={chartData} 
            timeRange={selectedTimeRange}
            loading={false}
          />

          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>
                Individual platform metrics and comparisons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformMetrics.map((platform) => (
                  <PlatformCard
                    key={platform.platform}
                    platform={platform.platform as any}
                    metrics={platform}
                    onViewDetails={() => console.log('View details for', platform.platform)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          {aiInsights ? (
            <AIInsights insights={aiInsights} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading AI insights...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Platform Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
          <CardDescription>
            Impressions breakdown by platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarChartComponent 
            data={platformChartData} 
            dataKey="value" 
            color="#3b82f6"
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    impressions: 0,
    reach: 0,
    engagement: 0,
    clicks: 0,
    conversions: 0,
    followers: 0,
  });
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [platformChartData, setPlatformChartData] = useState<PlatformChartData[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsightsType | null>(null);
  const [loading, setLoading] = useState(true);

  const { getDashboardAnalytics, getAIInsights } = useSocialService();

  useEffect(() => {
    // Only fetch dashboard data when dashboard tab is active
    if (activeTab !== 'dashboard') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setAiInsights(null);

      try {
        // Fetch dashboard analytics
        const analyticsData = await getDashboardAnalytics(selectedTimeRange);
        setMetrics(analyticsData.metrics);
        setPlatformMetrics(analyticsData.platformMetrics);
        setChartData(analyticsData.chartData);

        // Generate platform chart data
        const platformData: PlatformChartData[] = analyticsData.platformMetrics.map(p => ({
          name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
          value: p.metrics.impressions,
        }));
        setPlatformChartData(platformData);

        // Fetch AI insights
        const insights = await getAIInsights(selectedTimeRange);
        setAiInsights(insights);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange, activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTabContent
            selectedTimeRange={selectedTimeRange}
            setSelectedTimeRange={setSelectedTimeRange}
            metrics={metrics}
            platformMetrics={platformMetrics}
            chartData={chartData}
            platformChartData={platformChartData}
            aiInsights={aiInsights}
            loading={loading}
          />
        );
      case 'calendar':
        return <ContentCalendarPage />;
      case 'suggestions':
        return <ContentSuggestionsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Social Media Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your social media presence and analytics
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6 -mx-8">
        {renderTabContent()}
      </div>
    </div>
  );
}
