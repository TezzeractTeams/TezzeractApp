import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

export default function SocialPage() {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your social media performance across platforms</p>
        </div>
        <Button variant="gradient">
          <BarChart3 className="w-4 h-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Reach</CardTitle>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">2.4M</p>
            <p className="text-sm text-green-600 mt-1">+18% this month</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Engagement</CardTitle>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">8.7%</p>
            <p className="text-sm text-green-600 mt-1">+2.3% vs last week</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Followers</CardTitle>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">45.2K</p>
            <p className="text-sm text-green-600 mt-1">+1.2K this week</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Posts</CardTitle>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">127</p>
            <p className="text-sm text-blue-600 mt-1">23 this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>Manage your social media integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Twitter/X', status: 'Connected', color: 'bg-black' },
              { name: 'Facebook', status: 'Connected', color: 'bg-blue-600' },
              { name: 'Instagram', status: 'Connected', color: 'bg-pink-600' },
              { name: 'LinkedIn', status: 'Not Connected', color: 'bg-blue-700' },
            ].map((platform, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold mb-3`}>
                  {platform.name[0]}
                </div>
                <p className="font-semibold text-gray-900">{platform.name}</p>
                <p className={`text-sm mt-1 ${platform.status === 'Connected' ? 'text-green-600' : 'text-gray-500'}`}>
                  {platform.status}
                </p>
                <Button 
                  variant={platform.status === 'Connected' ? 'outline' : 'gradient'} 
                  size="sm" 
                  className="w-full mt-3"
                >
                  {platform.status === 'Connected' ? 'Manage' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest social media posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { platform: 'Twitter', content: 'Just launched our new feature! 🚀', engagement: '1.2K likes, 234 retweets' },
              { platform: 'Facebook', content: 'Check out our latest blog post about AI trends', engagement: '890 likes, 45 shares' },
              { platform: 'Instagram', content: 'Behind the scenes at TezzeractApp 📸', engagement: '2.3K likes, 156 comments' },
            ].map((post, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-600">{post.platform}</p>
                    <p className="text-gray-900 mt-1">{post.content}</p>
                    <p className="text-sm text-gray-500 mt-2">{post.engagement}</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

