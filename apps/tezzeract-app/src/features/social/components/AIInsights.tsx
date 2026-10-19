import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Brain, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface AIInsightsProps {
  insights: {
    summary: string;
    recommendations: string[];
    performance: {
      bestPerforming: string;
      needsImprovement: string;
    };
  };
}

export function AIInsights({ insights }: AIInsightsProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span>AI Insights</span>
        </CardTitle>
        <CardDescription>
          Intelligent analysis of your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">Performance Summary</h4>
          </div>
          <p className="text-sm text-gray-700">
            {insights.summary}
          </p>
        </div>

        {/* Performance Highlights */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Best Performing</span>
            </div>
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
              {insights.performance.bestPerforming}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Needs Improvement</span>
            </div>
            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
              {insights.performance.needsImprovement}
            </span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <Target className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

