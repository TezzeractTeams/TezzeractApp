import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Calendar, Plus, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { useSocialService } from '@/shared/services/socialService';
import type { ScheduledPost } from '@/shared/services/socialService';

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

const platformColors: Record<string, string> = {
  twitter: 'bg-black',
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  youtube: 'bg-red-600',
};

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: 'twitter',
    content: '',
    scheduledFor: '',
  });

  const { getContentCalendar, schedulePost } = useSocialService();

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const data = await getContentCalendar();
        setPosts(data.posts);
      } catch (error) {
        console.error('Failed to fetch calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSchedulePost = async () => {
    try {
      const result = await schedulePost(
        newPost.platform,
        newPost.content,
        new Date(newPost.scheduledFor)
      );
      setPosts([...posts, result.post]);
      setShowScheduleModal(false);
      setNewPost({ platform: 'twitter', content: '', scheduledFor: '' });
    } catch (error) {
      console.error('Failed to schedule post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Content Calendar</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage your social media posts
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => setShowScheduleModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Scheduled Posts
          </CardTitle>
          <CardDescription>
            {posts.length} posts scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No posts scheduled yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Start scheduling content to see it here
              </p>
              <Button
                variant="gradient"
                onClick={() => setShowScheduleModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const Icon = platformIcons[post.platform] || Twitter;
                const colorClass = platformColors[post.platform] || 'bg-gray-600';

                return (
                  <div
                    key={post.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 capitalize">
                              {post.platform}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              post.status === 'published' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{post.content}</p>
                          <p className="text-sm text-gray-500">
                            Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule New Post</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={newPost.platform}
                    onChange={(e) => setNewPost({ ...newPost, platform: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="twitter">Twitter/X</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="What would you like to post?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule For
                  </label>
                  <Input
                    type="datetime-local"
                    value={newPost.scheduledFor}
                    onChange={(e) => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSchedulePost}
                  disabled={!newPost.content || !newPost.scheduledFor}
                >
                  Schedule Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

