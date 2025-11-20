import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Twitter, Facebook, Instagram, Youtube, Linkedin, BarChart3, Check, X, User, Building2, Plug, Brain, Loader2 } from 'lucide-react';
import { VerticalTabs } from '../components/VerticalTabs';
import { useSocialService } from '@/shared/services/socialService';
import type { Platform, GoogleAnalyticsProperty } from '@/shared/services/socialService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { supabase } from '@/shared/lib/supabase';
import { getOrganization, createOrganization, updateOrganization } from '@/shared/services/organizationService';

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  google_analytics: BarChart3,
  meta: Facebook,
};

const platformColors: Record<string, { bg: string; text: string }> = {
  twitter: { bg: 'bg-black', text: 'text-white' },
  facebook: { bg: 'bg-blue-600', text: 'text-white' },
  instagram: { bg: 'bg-gradient-to-br from-purple-600 to-pink-600', text: 'text-white' },
  youtube: { bg: 'bg-red-600', text: 'text-white' },
  linkedin: { bg: 'bg-blue-700', text: 'text-white' },
  google_analytics: { bg: 'bg-blue-600', text: 'text-white' },
  meta: { bg: 'bg-blue-600', text: 'text-white' },
};

const settingsTabs = [
  { id: 'user', label: 'User', icon: <User className="w-5 h-5" /> },
  { id: 'organization', label: 'Organization', icon: <Building2 className="w-5 h-5" /> },
  { id: 'integration', label: 'Integration', icon: <Plug className="w-5 h-5" /> },
  { id: 'ai-settings', label: 'AI Settings', icon: <Brain className="w-5 h-5" /> },
];

// User Tab Content
function UserTabContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setPhone(user.user_metadata?.phone || '');
      setProfileLoading(false);
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Update user metadata in Supabase Auth
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });

      if (error) {
        console.error('Error updating user:', error);
        setProfileError(error.message);
        setLoading(false);
        return;
      }

      // Refresh the session to get updated user data
      const { error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.error('Error refreshing session:', sessionError);
        // Don't fail the update if session refresh fails, the data is still updated
      }

      // Update local state with the new user data
      if (updatedUser?.user) {
        const newFullName = updatedUser.user.user_metadata?.full_name || fullName;
        const newPhone = updatedUser.user.user_metadata?.phone || phone;
        setFullName(newFullName);
        setPhone(newPhone);
        
        console.log('Profile updated successfully:', {
          full_name: newFullName,
          phone: newPhone,
          user_id: updatedUser.user.id
        });
      }
      
      setProfileSuccess('Profile updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error: any) {
      console.error('Unexpected error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      // Verify current password by attempting to sign in
      if (user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verifyError) {
          setPasswordError('Current password is incorrect');
          setPasswordLoading(false);
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password updated successfully!');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{profileSuccess}</p>
              </div>
            )}
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password & Security</CardTitle>
          <CardDescription>
            Update your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{passwordSuccess}</p>
              </div>
            )}
            <Button type="submit" variant="gradient" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Organization Tab Content
function OrganizationTabContent() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
  });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrgLoading(false);
      return;
    }

    const fetchOrganization = async () => {
      try {
        setOrgLoading(true);
        const response = await getOrganization();
        setOrganization(response.organization);
        if (response.organization) {
          setOrgFormData({
            name: response.organization.name || "",
            industry: response.organization.industry || "",
            website: response.organization.website || "",
            description: response.organization.description || "",
          });
        }
      } catch (error: any) {
        console.error("Error fetching organization:", error);
        // Don't show error for missing table
        if (!error.response?.data?.error?.includes("does not exist") &&
            !error.response?.data?.error?.includes("user_id")) {
          setOrgError("Failed to load organization");
        }
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    setOrgError(null);
    setOrgSuccess(null);

    try {
      if (organization) {
        // Update existing organization
        const response = await updateOrganization(orgFormData);
        setOrganization(response.organization);
        setOrgSuccess("Organization updated successfully!");
      } else {
        // Create new organization
        const response = await createOrganization(orgFormData);
        setOrganization(response.organization);
        setOrgSuccess("Organization created successfully!");
        setShowOrgForm(false);
      }
      setTimeout(() => setOrgSuccess(null), 3000);
    } catch (error: any) {
      setOrgError(error.message || "Failed to save organization");
    } finally {
      setOrgSaving(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization && !showOrgForm) {
    // No organization - show create button
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Create your organization to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Organization Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create an organization to manage your team, projects, and settings in one place.
              </p>
              <Button variant="gradient" onClick={() => setShowOrgForm(true)}>
                Create Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            {organization ? 'Manage your organization information' : 'Create your organization'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <Input
                placeholder="Enter organization name"
                value={orgFormData.name}
                onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <Input
                placeholder="Enter industry"
                value={orgFormData.industry}
                onChange={(e) => setOrgFormData({ ...orgFormData, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={orgFormData.website}
                onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                rows={4}
                placeholder="Enter organization description"
                value={orgFormData.description}
                onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
              />
            </div>

            {orgError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{orgError}</p>
              </div>
            )}
            {orgSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{orgSuccess}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="gradient"
                disabled={orgSaving || !orgFormData.name.trim()}
              >
                {orgSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  organization ? 'Update Organization' : 'Create Organization'
                )}
              </Button>
              {!organization && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrgForm(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {organization && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage team members and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600">Team management coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Invite team members and manage their access levels
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Integration Tab Content (Platform Connections)
function IntegrationTabContent({
  platforms,
  loading,
  onConnect,
  onDisconnect,
}: {
  platforms: Platform[];
  loading: boolean;
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
}) {
  // Platform descriptions matching the image
  const platformDescriptions: Record<string, string> = {
    google_analytics: 'Track website traffic and user behavior',
    youtube: 'Track your YouTube channel performance',
    meta: 'Manage Facebook and Instagram content',
    twitter: 'Track Twitter engagement and metrics',
  };

  // Default platforms if API fails or returns empty
  const defaultPlatforms: Platform[] = [
    { id: 'google_analytics', name: 'Google Analytics', connected: false, lastSync: null },
    { id: 'youtube', name: 'YouTube Analytics', connected: false, lastSync: null },
    { id: 'meta', name: 'Meta (Facebook & Instagram)', connected: false, lastSync: null },
    { id: 'twitter', name: 'Twitter/X', connected: false, lastSync: null },
  ];

  const displayPlatforms = platforms.length > 0 ? platforms : defaultPlatforms;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Platforms</h2>
          <p className="text-gray-600">
            Connect your social media and analytics platforms to start tracking performance.
          </p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading platforms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Platforms</h2>
        <p className="text-gray-600">
          Connect your social media and analytics platforms to start tracking performance.
        </p>
      </div>

      {displayPlatforms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No platforms available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPlatforms.map((platform) => {
          const Icon = platformIcons[platform.id] || BarChart3;
          const colors = platformColors[platform.id] || { bg: 'bg-gray-600', text: 'text-white' };
          const description = platformDescriptions[platform.id] || platform.name;
          
          return (
            <Card
              key={platform.id}
              className="hover:shadow-md transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  {platform.connected ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center">
                      <X className="w-3 h-3 mr-1" />
                      Not Connected
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {platform.name}
                </h3>
                
                {platform.propertyName && (
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Property: {platform.propertyName}
                  </p>
                )}
                
                <p className="text-sm text-gray-600 mb-4">
                  {description}
                </p>

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
                      onClick={() => onDisconnect(platform.id)}
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
                    className="w-full flex items-center justify-center"
                    onClick={() => onConnect(platform.id)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}

// AI Settings Tab Content
function AISettingsTabContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Configure your AI provider settings for content generation and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <Input type="password" placeholder="Enter your API key" />
            <p className="text-xs text-gray-500 mt-1">
              Your API key is encrypted and stored securely
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Preference
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
              <option value="gpt-4">GPT-4 (Recommended)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
          <Button variant="gradient">Save AI Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Generation Preferences</CardTitle>
          <CardDescription>
            Customize how AI generates content for your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Tone
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Voice
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              rows={3}
              placeholder="Describe your brand voice and style..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="include-hashtags" className="rounded" />
            <label htmlFor="include-hashtags" className="text-sm text-gray-700">
              Automatically include relevant hashtags
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="include-cta" className="rounded" />
            <label htmlFor="include-cta" className="text-sm text-gray-700">
              Include call-to-action in suggestions
            </label>
          </div>
          <Button variant="gradient">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [gaProperties, setGaProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [selectingProperty, setSelectingProperty] = useState(false);
  const { getConnectedPlatforms, connectPlatform, disconnectPlatform, getGoogleAnalyticsProperties, selectGoogleAnalyticsProperty } = useSocialService();

  useEffect(() => {
    // Only fetch platforms when integration tab is active
    if (activeTab !== 'integration') return;

    const fetchPlatforms = async () => {
      setLoading(true);
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
  }, [activeTab]);

  // Clear OAuth error messages after 5 seconds (success messages are cleared after platform refresh)
  useEffect(() => {
    if (oauthMessage && oauthMessage.type === 'error') {
      const timer = setTimeout(() => {
        setOauthMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [oauthMessage]);

  const handleConnect = async (platformId: string) => {
    try {
      const response = await connectPlatform(platformId);
      console.log('Platform connection initiated:', response);
      
      if (response.authUrl) {
        // Open OAuth window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          response.authUrl,
          'OAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Store platformId for use in callback
        const currentPlatformId = platformId;

        // Listen for message from OAuth callback popup
        const handleMessage = async (event: MessageEvent) => {
          // Verify message origin for security
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'oauth-success') {
            // Remove listener
            window.removeEventListener('message', handleMessage);
            
            // Close popup if still open
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }

            // Check if this is Google Analytics and needs property selection
            const platform = event.data.platform || currentPlatformId;
            
            if (platform === 'google_analytics') {
              // Fetch properties and show modal
              try {
                const propertiesData = await getGoogleAnalyticsProperties();
                setGaProperties(propertiesData.properties);
                setShowPropertyModal(true);
              } catch (error) {
                console.error('Failed to fetch properties:', error);
                setOauthMessage({ type: 'error', text: 'Failed to fetch Google Analytics properties' });
              }
            } else {
              // Show success message for other platforms
              setOauthMessage({ type: 'success', text: 'Platform connected successfully!' });
              
              // Refresh platforms list
              try {
                const data = await getConnectedPlatforms();
                setPlatforms(data.platforms);
                // Clear success message after 2 seconds
                setTimeout(() => {
                  setOauthMessage(null);
                }, 2000);
              } catch (error) {
                console.error('Failed to refresh platforms:', error);
                setOauthMessage({ type: 'error', text: 'Failed to refresh platform status' });
              }
            }
          } else if (event.data.type === 'oauth-error') {
            // Remove listener
            window.removeEventListener('message', handleMessage);
            
            // Close popup if still open
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }

            // Show error message
            setOauthMessage({ type: 'error', text: `Connection failed: ${event.data.error}` });
          }
        };

        // Add message listener
        window.addEventListener('message', handleMessage);

        // Fallback: Check if popup is closed (in case message doesn't fire)
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            // Refresh platforms list as fallback
            const fetchPlatforms = async () => {
              try {
                const data = await getConnectedPlatforms();
                setPlatforms(data.platforms);
              } catch (error) {
                console.error('Failed to refresh platforms:', error);
              }
            };
            fetchPlatforms();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to connect platform:', error);
      alert('Failed to initiate platform connection. Please try again.');
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

  const handleSelectProperty = async (propertyId: string, propertyName: string) => {
    setSelectingProperty(true);
    try {
      await selectGoogleAnalyticsProperty(propertyId, propertyName);
      setShowPropertyModal(false);
      setOauthMessage({ type: 'success', text: 'Google Analytics property selected successfully!' });
      
      // Refresh platforms list
      const data = await getConnectedPlatforms();
      setPlatforms(data.platforms);
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        setOauthMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to select property:', error);
      setOauthMessage({ type: 'error', text: 'Failed to select property' });
    } finally {
      setSelectingProperty(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user':
        return <UserTabContent />;
      case 'organization':
        return <OrganizationTabContent />;
      case 'integration':
        return (
          <IntegrationTabContent
            platforms={platforms}
            loading={loading}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        );
      case 'ai-settings':
        return <AISettingsTabContent />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, organization, and integrations
        </p>
      </div>

      {/* OAuth Message */}
      {oauthMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          oauthMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{oauthMessage.text}</p>
            <button
              onClick={() => setOauthMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Google Analytics Property Selection Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Google Analytics Property</CardTitle>
                <button
                  onClick={() => setShowPropertyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription>
                Select which Google Analytics property you want to connect
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gaProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading properties...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gaProperties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handleSelectProperty(property.id, property.name)}
                      disabled={selectingProperty}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">{property.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Property ID: {property.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vertical Tabs Layout */}
      <div className="flex gap-8">
        {/* Vertical Tabs */}
        <VerticalTabs
          tabs={settingsTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
