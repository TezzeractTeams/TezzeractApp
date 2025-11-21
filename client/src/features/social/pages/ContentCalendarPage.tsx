import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Calendar, Plus, Twitter, Facebook, Instagram, Youtube, Linkedin, LayoutGrid, List, X } from 'lucide-react';
import { useSocialService } from '@/shared/services/socialService';
import type { ScheduledPost } from '@/shared/services/socialService';

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
};

const platformColors: Record<string, string> = {
  twitter: 'bg-black',
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
};

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [newPost, setNewPost] = useState({
    platform: 'twitter',
    content: '',
    scheduledFor: '',
  });
  const [editPost, setEditPost] = useState({
    platform: 'twitter',
    content: '',
    scheduledFor: '',
    scheduledTime: '',
  });

  const { getContentCalendar, schedulePost, updateScheduledPost, deleteScheduledPost, postNow } = useSocialService();
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const data = await getContentCalendar(currentMonth + 1, currentYear);
        setPosts(data.posts);
      } catch (error) {
        console.error('Failed to fetch calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear]);

  // Helper function to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {};
    posts.forEach((post) => {
      const date = typeof post.scheduledFor === 'string' 
        ? new Date(post.scheduledFor) 
        : post.scheduledFor;
      const dateKey = getLocalDateString(date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    });
    return grouped;
  }, [posts]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; posts: ScheduledPost[] }> = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateKey = getLocalDateString(currentDate);
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        posts: postsByDate[dateKey] || [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, currentYear, postsByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };


  const formatScheduledDate = (scheduledFor: Date | string): Date => {
    return typeof scheduledFor === 'string' ? new Date(scheduledFor) : scheduledFor;
  };

  const handleSchedulePost = async () => {
    try {
      const result = await schedulePost(
        newPost.platform,
        newPost.content,
        new Date(newPost.scheduledFor)
      );
      setShowScheduleModal(false);
      setNewPost({ platform: 'twitter', content: '', scheduledFor: '' });
      // Refresh calendar
      const data = await getContentCalendar(currentMonth + 1, currentYear);
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Failed to schedule post. Please try again.');
    }
  };

  const handlePostClick = (post: ScheduledPost, e?: React.MouseEvent) => {
    // Prevent event bubbling if clicked from calendar grid
    if (e) {
      e.stopPropagation();
    }
    // Open edit modal directly
    setEditingPost(post);
    const scheduledDate = formatScheduledDate(post.scheduledFor);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeStr = scheduledDate.toTimeString().slice(0, 5);
    setEditPost({
      platform: post.platform,
      content: post.content,
      scheduledFor: dateStr,
      scheduledTime: timeStr,
    });
    setShowEditModal(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editPost.content || !editPost.scheduledFor || !editPost.scheduledTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const scheduledDateTime = new Date(`${editPost.scheduledFor}T${editPost.scheduledTime}`);
      await updateScheduledPost(
        editingPost.id,
        editPost.platform,
        editPost.content,
        scheduledDateTime,
        editingPost.contentType,
        editingPost.engagementScore
      );
      setShowEditModal(false);
      setEditingPost(null);
      // Refresh calendar
      const data = await getContentCalendar(currentMonth + 1, currentYear);
      setPosts(data.posts);
      alert('Post updated successfully!');
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleEditClick = (post: ScheduledPost) => {
    handlePostClick(post);
  };

  const handlePostNow = async () => {
    if (!editingPost) return;

    if (!confirm(`Are you sure you want to post this to ${editingPost.platform} now?\n\nContent: ${editingPost.content.substring(0, 100)}${editingPost.content.length > 100 ? '...' : ''}`)) {
      return;
    }

    setPosting(true);
    try {
      await postNow(editingPost.id);
      // Refresh calendar
      const data = await getContentCalendar(currentMonth + 1, currentYear);
      setPosts(data.posts);
      alert('Post published successfully!');
      setShowEditModal(false);
      setEditingPost(null);
    } catch (error: any) {
      console.error('Failed to post:', error);
      alert(`Failed to post: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteClick = async (post: ScheduledPost) => {
    if (!confirm(`Are you sure you want to delete this scheduled post?\n\nPlatform: ${post.platform}\nContent: ${post.content.substring(0, 50)}...`)) {
      return;
    }

    try {
      await deleteScheduledPost(post.id);
      setShowEditModal(false); // Close edit modal
      setEditingPost(null);
      // Refresh calendar
      const data = await getContentCalendar(currentMonth + 1, currentYear);
      setPosts(data.posts);
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
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
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="px-3"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          <Button
            variant="gradient"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Calendar View
                </CardTitle>
                <CardDescription>
                  {posts.length} posts scheduled
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  title="Previous month"
                >
                  ←
                </Button>
                <span className="font-semibold text-gray-900 min-w-[150px] text-center">
                  {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  title="Next month"
                >
                  →
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToToday}
                  title="Go to today"
                  className="ml-2"
                >
                  Today
                </Button>
              </div>
            </div>
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
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => {
                    const dateKey = getLocalDateString(day.date);
                    const todayKey = getLocalDateString(new Date());
                    const isToday = dateKey === todayKey;
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] p-1 border border-gray-200 rounded-lg transition-all
                          ${!day.isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
                          ${isToday ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        <div className={`text-sm font-medium mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {day.posts.slice(0, 2).map((post) => {
                            const Icon = platformIcons[post.platform] || Twitter;
                            const colorClass = platformColors[post.platform] || 'bg-gray-600';
                            return (
                              <div
                                key={post.id}
                                onClick={(e) => handlePostClick(post, e)}
                                className={`text-xs p-1 rounded ${colorClass} text-white truncate flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity`}
                                title={post.content}
                              >
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{formatScheduledDate(post.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              </div>
                            );
                          })}
                          {day.posts.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{day.posts.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <List className="w-5 h-5 mr-2" />
              List View
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
                              Scheduled for: {formatScheduledDate(post.scheduledFor).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(post)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(post)}
                          >
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
      )}

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
                    <option value="linkedin">LinkedIn</option>
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

      {/* Edit Post Modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditModal(false);
              setEditingPost(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Scheduled Post</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={editPost.platform}
                    onChange={(e) => setEditPost({ ...editPost, platform: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="twitter">Twitter/X</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editPost.content}
                    onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="What would you like to post?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={editPost.scheduledFor}
                      onChange={(e) => setEditPost({ ...editPost, scheduledFor: e.target.value })}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={editPost.scheduledTime}
                      onChange={(e) => setEditPost({ ...editPost, scheduledTime: e.target.value })}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="gradient"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => editingPost && handleDeleteClick(editingPost)}
                >
                  Delete
                </Button>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPost(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handlePostNow}
                    disabled={posting || !editingPost || editingPost.status === 'published'}
                  >
                    {posting ? 'Posting...' : 'Post Now'}
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleUpdatePost}
                    disabled={!editPost.content || !editPost.scheduledFor || !editPost.scheduledTime}
                  >
                    Update Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

