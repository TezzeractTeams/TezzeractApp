import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Lightbulb, Twitter, Linkedin, Instagram, Copy, Check, Sparkles } from 'lucide-react';
import { useSocialService } from '@/shared/services/socialService';
import type { ContentSuggestion } from '@/shared/services/socialService';

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
};

const platformColors: Record<string, { bg: string; text: string }> = {
  twitter: { bg: 'bg-black', text: 'text-white' },
  linkedin: { bg: 'bg-blue-700', text: 'text-white' },
  instagram: { bg: 'bg-gradient-to-br from-purple-600 to-pink-600', text: 'text-white' },
};

export default function ContentSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { getContentSuggestions } = useSocialService();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await getContentSuggestions();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (suggestionId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(suggestionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate generating new suggestions
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating content suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Content Suggestions</h1>
          <p className="text-gray-600 mt-1">
            AI-powered content ideas tailored to your brand
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={handleGenerate}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate New Ideas
        </Button>
      </div>

      {/* AI Info Banner */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Content Generation</h3>
              <p className="text-sm text-gray-700">
                Our AI analyzes your brand, audience, and trending topics to generate engaging content suggestions optimized for each platform. Simply copy, customize, and post!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => {
          const Icon = platformIcons[suggestion.platform] || Twitter;
          const colors = platformColors[suggestion.platform] || { bg: 'bg-gray-600', text: 'text-white' };

          return (
            <Card key={suggestion.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <CardTitle className="text-sm capitalize">{suggestion.platform}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-medium text-gray-600">
                      {suggestion.engagement_score.toFixed(1)}/10
                    </span>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {suggestion.type.replace('_', ' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {suggestion.content}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy(suggestion.id, suggestion.content)}
                  >
                    {copiedId === suggestion.id ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    className="flex-1"
                    onClick={() => console.log('Schedule post:', suggestion)}
                  >
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {suggestions.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suggestions yet</h3>
            <p className="text-gray-600 mb-6">
              Click "Generate New Ideas" to get AI-powered content suggestions
            </p>
            <Button variant="gradient" onClick={handleGenerate}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content Ideas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Content Performance Tips</CardTitle>
          <CardDescription>Maximize engagement with these best practices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Twitter/X</h4>
              <p className="text-sm text-gray-700">
                Post 3-5 times daily, use hashtags sparingly, include visuals for 2x engagement
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">💼 LinkedIn</h4>
              <p className="text-sm text-gray-700">
                Post during work hours, share insights, use professional tone for B2B engagement
              </p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">📸 Instagram</h4>
              <p className="text-sm text-gray-700">
                High-quality visuals required, use 10-15 hashtags, post Stories daily
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

