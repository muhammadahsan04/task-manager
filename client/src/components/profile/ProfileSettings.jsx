import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import api from '../../config/api';
import { User, Mail, Lock, Calendar, Save, Eye, EyeOff, CheckCircle, AlertCircle, Send } from 'lucide-react';

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    created_at: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [emailPrefs, setEmailPrefs] = useState({
    instant_task_assigned: true,
    instant_comment: true,
    instant_team_invite: true,
    deadline_reminders: true,
    digest_frequency: 'weekly'
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchEmailPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setProfileData({
        name: response.data.user.name || '',
        email: response.data.user.email || '',
        created_at: response.data.user.created_at || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailPreferences = async () => {
    try {
      setPrefsLoading(true);
      const res = await api.get('/email/preferences');
      setEmailPrefs(res.data.preferences);
    } catch (e) {
      console.error('Error fetching email preferences:', e);
    } finally {
      setPrefsLoading(false);
    }
  };

  const saveEmailPreferences = async (e) => {
    e.preventDefault();
    try {
      setPrefsSaving(true);
      await api.put('/email/preferences', emailPrefs);
      setMessage({ type: 'success', text: 'Email preferences updated' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      console.error('Error saving preferences:', e);
      setMessage({ type: 'error', text: 'Failed to save email preferences' });
    } finally {
      setPrefsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setTestEmailSending(true);
      await api.post('/email/test');
      setMessage({ type: 'success', text: 'Test email sent. Inbox check karein.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      console.error('Test email error:', e);
      setMessage({ type: 'error', text: 'Test email bhejna fail hua' });
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    if (profileData.name.trim().length < 2) {
      setMessage({ type: 'error', text: 'Name must be at least 2 characters' });
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/users/profile', {
        name: profileData.name.trim()
      });
      
      // Update redux auth user name
      dispatch(updateUser({ ...user, name: response.data.user.name }));
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Current password is required' });
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password is required' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setChangingPassword(true);
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Profile Settings</h1>
        <p className="text-theme-secondary">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information Card */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary overflow-hidden">
        <div className="border-b border-theme-primary bg-theme-secondary px-6 py-4">
          <h2 className="text-lg font-semibold text-theme-primary flex items-center">
            <User className="h-5 w-5 mr-2 text-accent-primary" />
            Profile Information
          </h2>
        </div>
        
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-theme-primary mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                className="input-field pl-10"
                placeholder="Enter your full name"
                disabled={saving}
              />
            </div>
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-theme-primary mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                className="input-field pl-10 bg-theme-secondary cursor-not-allowed"
                disabled
              />
            </div>
            <p className="mt-1 text-xs text-theme-tertiary">Email address cannot be changed</p>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Member Since
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type="text"
                value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : ''}
                className="input-field pl-10 bg-theme-secondary cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary overflow-hidden">
        <div className="border-b border-theme-primary bg-theme-secondary px-6 py-4">
          <h2 className="text-lg font-semibold text-theme-primary flex items-center">
            <Lock className="h-5 w-5 mr-2 text-accent-primary" />
            Change Password
          </h2>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-theme-primary mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input-field pl-10 pr-10"
                placeholder="Enter current password"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-tertiary hover:text-theme-secondary"
              >
                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-theme-primary mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input-field pl-10 pr-10"
                placeholder="Enter new password"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-tertiary hover:text-theme-secondary"
              >
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-theme-tertiary">Must be at least 6 characters long</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-primary mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field pl-10 pr-10"
                placeholder="Confirm new password"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-tertiary hover:text-theme-secondary"
              >
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Password Message */}
          {passwordMessage.text && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              passwordMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {passwordMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{passwordMessage.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn-primary flex items-center"
            >
              {changingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Email Preferences */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary overflow-hidden">
        <div className="border-b border-theme-primary bg-theme-secondary px-6 py-4">
          <h2 className="text-lg font-semibold text-theme-primary">Email Preferences</h2>
        </div>
        <form onSubmit={saveEmailPreferences} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={emailPrefs.instant_task_assigned} onChange={(e)=>setEmailPrefs(p=>({...p, instant_task_assigned: e.target.checked}))} />
              <span className="text-theme-primary">Instant: Task Assigned</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={emailPrefs.instant_comment} onChange={(e)=>setEmailPrefs(p=>({...p, instant_comment: e.target.checked}))} />
              <span className="text-theme-primary">Instant: New Comment</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={emailPrefs.instant_team_invite} onChange={(e)=>setEmailPrefs(p=>({...p, instant_team_invite: e.target.checked}))} />
              <span className="text-theme-primary">Instant: Team Invitation</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={emailPrefs.deadline_reminders} onChange={(e)=>setEmailPrefs(p=>({...p, deadline_reminders: e.target.checked}))} />
              <span className="text-theme-primary">Deadline Reminders</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">Digest Frequency</label>
              <select className="input-field" value={emailPrefs.digest_frequency} onChange={(e)=>setEmailPrefs(p=>({...p, digest_frequency: e.target.value}))}>
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={sendTestEmail} disabled={testEmailSending} className="btn-secondary flex items-center">
              {testEmailSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </button>
            <button type="submit" disabled={prefsSaving || prefsLoading} className="btn-primary flex items-center">
              {prefsSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
