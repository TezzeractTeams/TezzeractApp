import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Lightbulb, Twitter, Linkedin, Instagram, Copy, Check, Sparkles, Target, Plus, X, Calendar, Trash2 } from 'lucide-react';
import { useSocialService } from '@/shared/services/socialService';
import type { ContentSuggestion, Objective } from '@/shared/services/socialService';

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

const OBJECTIVE_TYPES = [
  'Brand Awareness',
  'Lead Generation',
  'Engagement',
  'Sales',
  'Education',
  'Community Building',
  'Product Launch',
  'Event Promotion',
];

const STORAGE_KEY = 'tezzeract_content_suggestions';

export default function ContentSuggestionsPage() {
  // Load suggestions from localStorage on mount
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load suggestions from localStorage:', error);
      return [];
    }
  });
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContentSuggestion | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [objectiveForm, setObjectiveForm] = useState({
    objective_type: '',
    description: '',
    target_impressions: 0,
    target_reach: 0,
    start_date: '',
    end_date: '',
  });
  
  const { getContentSuggestions, getObjectives, createObjective, deleteObjective, schedulePost } = useSocialService();

  // Save suggestions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
    } catch (error) {
      console.error('Failed to save suggestions to localStorage:', error);
    }
  }, [suggestions]);

  // Load objectives on mount
  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setLoading(true);
        const objectivesData = await getObjectives();
        setObjectives(objectivesData.objectives);
      } catch (error) {
        console.error('Failed to fetch objectives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjectives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (suggestionId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(suggestionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!objectiveForm.objective_type || !objectiveForm.description || !objectiveForm.start_date || !objectiveForm.end_date) {
      toast.error('Please fill in all required fields (Objective Type, Description, Start Date, and End Date)');
      return;
    }
    
    try {
      const newObjective = await createObjective({
        objective_type: objectiveForm.objective_type,
        description: objectiveForm.description,
        target_impressions: objectiveForm.target_impressions,
        target_reach: objectiveForm.target_reach,
        start_date: objectiveForm.start_date,
        end_date: objectiveForm.end_date,
      });
      setObjectives([newObjective.objective, ...objectives]);
      setObjectiveForm({
        objective_type: '',
        description: '',
        target_impressions: 0,
        target_reach: 0,
        start_date: '',
        end_date: '',
      });
      setShowObjectiveForm(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; details?: string } }; message?: string };
      const serverError = err.response?.data?.error;
      const details = err.response?.data?.details;
      const message = serverError
        ? (details ? `${serverError}: ${details}` : serverError)
        : (err.message ?? 'Failed to create objective. Please try again.');
      console.error('Failed to create objective:', message, error);
      toast.error(message);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    try {
      await deleteObjective(id);
      setObjectives(objectives.filter(obj => obj.id !== id));
    } catch (error) {
      console.error('Failed to delete objective:', error);
      toast.error('Failed to delete objective. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (objectives.length === 0) {
      toast.error('Please add at least one objective before generating content suggestions.');
      return;
    }

    try {
      setGenerating(true);
      const data = await getContentSuggestions(true); // Pass regenerate=true
      // Save to localStorage (will be handled by useEffect)
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to generate content suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleClick = (suggestion: ContentSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Set default date/time: suggested date if available, otherwise tomorrow at 9 AM
    const defaultDate = suggestion.suggestedDate 
      ? new Date(suggestion.suggestedDate).toISOString().split('T')[0]
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultTime = suggestion.suggestedDate
      ? new Date(suggestion.suggestedDate).toTimeString().slice(0, 5)
      : '09:00';
    setScheduleDate(defaultDate);
    setScheduleTime(defaultTime);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async () => {
    if (!selectedSuggestion || !scheduleDate || !scheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      
      // Save to backend database
      await schedulePost(
        selectedSuggestion.platform,
        selectedSuggestion.content,
        scheduledDateTime,
        selectedSuggestion.type,
        selectedSuggestion.engagement_score
      );
      
      // Remove from localStorage suggestions (it's now in the calendar)
      setSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
      
      setShowScheduleModal(false);
      setSelectedSuggestion(null);
      toast.success('Post scheduled successfully! It will appear in your calendar.');
    } catch (error) {
      console.error('Failed to schedule post:', error);
      toast.error('Failed to schedule post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
            Define objectives and generate AI-powered content ideas tailored to your brand
          </p>
        </div>
      </div>

      {/* Objectives Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <CardTitle>Objectives</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowObjectiveForm(!showObjectiveForm)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Objective
            </Button>
          </div>
          <CardDescription>Define your business objectives with specific targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Objective Form */}
          {showObjectiveForm && (
            <Card className="bg-gray-50 border-2 border-blue-200">
              <CardContent className="pt-6">
                <form onSubmit={handleAddObjective} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objective Type *
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        value={objectiveForm.objective_type}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, objective_type: e.target.value })}
                        required
                      >
                        <option value="">Select objective type</option>
                        {OBJECTIVE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <Input
                        placeholder="Describe your objective..."
                        value={objectiveForm.description}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Impressions
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={objectiveForm.target_impressions}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, target_impressions: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Reach
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={objectiveForm.target_reach}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, target_reach: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={objectiveForm.start_date}
                          onChange={(e) => setObjectiveForm({ ...objectiveForm, start_date: e.target.value })}
                          required
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={objectiveForm.end_date}
                          onChange={(e) => setObjectiveForm({ ...objectiveForm, end_date: e.target.value })}
                          required
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowObjectiveForm(false);
                        setObjectiveForm({
                          objective_type: '',
                          description: '',
                          target_impressions: 0,
                          target_reach: 0,
                          start_date: '',
                          end_date: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="gradient">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Objective
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Objectives List */}
          {objectives.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No objectives yet. Add your first objective to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{objective.objective_type}</span>
                      <button
                        onClick={() => handleDeleteObjective(objective.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{objective.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {objective.target_impressions > 0 && (
                        <span>Target Impressions: {objective.target_impressions.toLocaleString()}</span>
                      )}
                      {objective.target_reach > 0 && (
                        <span>Target Reach: {objective.target_reach.toLocaleString()}</span>
                      )}
                      {objective.start_date && (
                        <span>Start: {new Date(objective.start_date).toLocaleDateString()}</span>
                      )}
                      {objective.end_date && (
                        <span>End: {new Date(objective.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Content Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Generate Content Suggestions</h3>
                <p className="text-sm text-gray-700">
                  Our AI will analyze your objectives and organization website to generate engaging content suggestions optimized for each platform.
                </p>
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={handleGenerate}
              disabled={generating || objectives.length === 0}
              className="ml-4"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generated Content Suggestions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Suggestions are saved locally. Schedule them to add to your calendar.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to clear all suggestions? They will be removed from local storage.')) {
                  setSuggestions([]);
                  localStorage.removeItem(STORAGE_KEY);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
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
                        onClick={() => handleScheduleClick(suggestion)}
                      >
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State for Suggestions */}
      {suggestions.length === 0 && !generating && (
        <Card>
          <CardContent className="py-16 text-center">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content suggestions yet</h3>
            <p className="text-gray-600 mb-6">
              {objectives.length === 0
                ? 'Add objectives and click "Generate" to get AI-powered content suggestions'
                : 'Click "Generate" to create AI-powered content suggestions based on your objectives'}
            </p>
            {objectives.length > 0 && (
              <Button variant="gradient" onClick={handleGenerate}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content Ideas
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Post Modal */}
      {showScheduleModal && selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Post</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                    {(() => {
                      const Icon = platformIcons[selectedSuggestion.platform] || Twitter;
                      const colors = platformColors[selectedSuggestion.platform] || { bg: 'bg-gray-600', text: 'text-white' };
                      return (
                        <>
                          <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <span className="font-medium capitalize">{selectedSuggestion.platform}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedSuggestion.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedSuggestion(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleScheduleSubmit}
                  disabled={!scheduleDate || !scheduleTime}
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
