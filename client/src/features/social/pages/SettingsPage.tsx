import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Twitter, Facebook, Instagram, Youtube, Linkedin, BarChart3, Check, X } from 'lucide-react';
import { useSocialService } from '@/shared/services/socialService';
import type { Platform } from '@/shared/services/socialService';

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  google_analytics: BarChart3,
};

const platformColors: Record<string, { bg: string; text: string }> = {
  twitter: { bg: 'bg-black', text: 'text-white' },
  facebook: { bg: 'bg-blue-600', text: 'text-white' },
  instagram: { bg: 'bg-gradient-to-br from-purple-600 to-pink-600', text: 'text-white' },
  youtube: { bg: 'bg-red-600', text: 'text-white' },
  linkedin: { bg: 'bg-blue-700', text: 'text-white' },
  google_analytics: { bg: 'bg-orange-600', text: 'text-white' },
};

export default function SettingsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const { getConnectedPlatforms, connectPlatform, disconnectPlatform } = useSocialService();

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await getConnectedPlatforms();
        setPlatforms(data.platforms);
      } catch (error) {
        console.error('Failed to fetch platforms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (platformId: string) => {
    try {
      const response = await connectPlatform(platformId);
      console.log('Platform connection initiated:', response);
      // TODO: Open OAuth window with response.authUrl
      alert('OAuth integration coming soon! This will open the platform\'s authorization page.');
    } catch (error) {
      console.error('Failed to connect platform:', error);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await disconnectPlatform(platformId);
      // Refresh platforms list
      const data = await getConnectedPlatforms();
      setPlatforms(data.platforms);
    } catch (error) {
      console.error('Failed to disconnect platform:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your social media integrations and preferences
        </p>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts to track performance and manage content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platformIcons[platform.id] || BarChart3;
              const colors = platformColors[platform.id] || { bg: 'bg-gray-600', text: 'text-white' };
              
              return (
                <div
                  key={platform.id}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-all card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} mb-3`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    {platform.connected ? (
                      <span className="flex items-center text-green-600 text-sm font-medium">
                        <Check className="w-4 h-4 mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-400 text-sm font-medium">
                        <X className="w-4 h-4 mr-1" />
                        Not Connected
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {platform.name}
                  </h3>
                  
                  {platform.lastSync && (
                    <p className="text-xs text-gray-500 mb-4">
                      Last synced: {new Date(platform.lastSync).toLocaleDateString()}
                    </p>
                  )}

                  {platform.connected ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Disconnect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-600"
                        onClick={() => console.log('Sync', platform.id)}
                      >
                        Sync Now
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="gradient"
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnect(platform.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure API keys for social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> OAuth integrations will be configured through platform-specific authorization flows. No manual API key entry required for most platforms.
              </p>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-600">OAuth integration setup coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                You'll be able to securely connect your accounts through official OAuth flows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

