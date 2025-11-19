"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  isCurrentUserAdmin, 
  getAllUsers, 
  getUserStats, 
  updateUserRole, 
  searchUsers,
  type AdminUser, 
  type UserStats,
  type UserRole 
} from "@/lib/adminUtils";
import {
  getAllUsersWithSubscriptions,
  getSubscriptionStats,
  updateUserSubscriptionPlan,
  searchUsersWithSubscriptions,
  type UserSubscription,
  type SubscriptionStats,
} from "@/lib/subscriptionUtils";
import { supabase } from "@/lib/supabaseClient";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  StarIcon,
  FireIcon,
  BookOpenIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  CreditCardIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReminderComposer, setShowReminderComposer] = useState(false);
  // Logo URL - use production URL for emails (emails need absolute URLs)
  const logoUrl = 'https://icflog.com/icfLOGO4.png';

  const [emailSubject, setEmailSubject] = useState('A gentle nudge to update your ICF Log');
  const [emailContent, setEmailContent] = useState(`<div style="text-align: left; margin-bottom: 20px;">
  <img src="${logoUrl}" alt="ICF Log Logo" width="120" />
</div>

<p>Hi {{userName}},</p>

<p>This is a friendly reminder to keep your ICF Log updated with your latest coaching sessions and CPD activities.</p>

<p>Regular logging helps you:</p>
<ul style="margin: 10px 0; padding-left: 20px;">
  <li style="margin: 5px 0;">Stay on track for ICF credential renewal</li>
  <li style="margin: 5px 0;">Maintain accurate records of your coaching practice</li>
  <li style="margin: 5px 0;">Generate professional reports when needed</li>
  <li style="margin: 5px 0;">Avoid last minute scrambling before renewal deadlines</li>
</ul>

<p><strong>Tip:</strong> Set aside 10-15 minutes each week to log your sessions and CPD activities.</p>

<p>Update your log now: <a href="https://icflog.com/dashboard" style="color: #3b82f6; text-decoration: underline;">https://icflog.com/dashboard</a></p>

<p>Best regards,<br>
The ICF Log Team</p>`);
  const [recipientType, setRecipientType] = useState<'all' | 'selected'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [loadingScheduledEmails, setLoadingScheduledEmails] = useState(false);
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'emails' | 'subscriptions'>('overview');
  const [subscriptionUsers, setSubscriptionUsers] = useState<UserSubscription[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState("");
  const [selectedSubscriptionUser, setSelectedSubscriptionUser] = useState<UserSubscription | null>(null);
  const [isUpdatePlanModalOpen, setIsUpdatePlanModalOpen] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [reminderLogFilter, setReminderLogFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);

  // Track online status for current user and all users
  useEffect(() => {
    const updateOnlineStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Update last_seen timestamp for current user
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
        
        // Check if current user is online (active in last 5 minutes)
        const checkCurrentUserOnline = async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('last_seen')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.last_seen) {
            const lastSeen = new Date(profile.last_seen);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
            setIsOnline(diffMinutes < 5);
          }
        };
        
        // Get all online users (active in last 5 minutes)
        const fetchOnlineUsers = async () => {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: onlineProfiles } = await supabase
            .from('profiles')
            .select('user_id, name, email, role, last_seen')
            .gte('last_seen', fiveMinutesAgo)
            .order('last_seen', { ascending: false });
          
          if (onlineProfiles) {
            setOnlineUsers(onlineProfiles);
            setOnlineCount(onlineProfiles.length);
          }
        };
        
        checkCurrentUserOnline();
        fetchOnlineUsers();
        
        const interval = setInterval(() => {
          updateOnlineStatus();
          checkCurrentUserOnline();
          fetchOnlineUsers();
        }, 30000); // Update every 30 seconds
        
        return () => clearInterval(interval);
      }
    };
    
    updateOnlineStatus();
  }, []);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      setLoading(true);
      
      // Check if user is admin
      const isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      try {
        // Fetch users and stats in parallel
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUserStats()
        ]);

        setUsers(usersData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
      
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [router]);

  const fetchScheduledEmails = async () => {
    setLoadingScheduledEmails(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('created_by', user.id)
        .order('scheduled_for', { ascending: false })
        .limit(100); // Increased limit to see more emails

      if (error) {
        console.error('Error fetching scheduled emails:', error);
        setErrorMessage(`Failed to fetch scheduled emails: ${error.message}`);
        setShowErrorModal(true);
      } else {
        console.log(`Fetched ${data?.length || 0} scheduled emails`);
        setScheduledEmails(data || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      setErrorMessage(`Failed to fetch scheduled emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowErrorModal(true);
    } finally {
      setLoadingScheduledEmails(false);
    }
  };

  // Fetch scheduled emails on mount
  useEffect(() => {
    fetchScheduledEmails();
  }, []);

  const handleDeleteScheduledEmail = (emailId: string) => {
    setEmailToDelete(emailId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteScheduledEmail = async () => {
    if (!emailToDelete) return;

    const emailIdToDelete = emailToDelete; // Store ID before clearing state
    setDeletingEmailId(emailIdToDelete);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Attempting to delete email:', emailIdToDelete);

      // Delete the email
      const { error, data } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', emailIdToDelete)
        .eq('created_by', user.id)
        .select();

      console.log('Delete result:', { error, data, deletedCount: data?.length });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No rows deleted. Email might not exist or RLS prevented deletion.');
        setErrorMessage('Failed to delete. The email may have already been deleted or you don\'t have permission.');
        setShowErrorModal(true);
        setShowDeleteConfirmModal(false);
        setEmailToDelete(null);
        setDeletingEmailId(null);
        // Still refresh to update the list
        await fetchScheduledEmails();
        return;
      }

      console.log('Successfully deleted email. Removing from state...');

      // Close modal first
      setShowDeleteConfirmModal(false);
      setEmailToDelete(null);
      
      // Immediately remove from local state
      setScheduledEmails(prev => {
        const filtered = prev.filter(e => e.id !== emailIdToDelete);
        console.log(`Removed from state. Previous count: ${prev.length}, New count: ${filtered.length}`);
        return filtered;
      });
      
      // Refresh from server to ensure consistency
      await fetchScheduledEmails();
      
    } catch (error) {
      console.error('Error deleting scheduled email:', error);
      setErrorMessage(`Failed to delete scheduled email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowErrorModal(true);
      setShowDeleteConfirmModal(false);
      setEmailToDelete(null);
    } finally {
      setDeletingEmailId(null);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const searchResults = await searchUsers(term);
      setUsers(searchResults);
    } else {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    }
  };

  // Fetch subscription data when subscriptions tab is active
  useEffect(() => {
    if (activeTab === 'subscriptions') {
      const fetchSubscriptionData = async () => {
        try {
          const [usersData, statsData] = await Promise.all([
            getAllUsersWithSubscriptions(),
            getSubscriptionStats(),
          ]);
          setSubscriptionUsers(usersData);
          setSubscriptionStats(statsData);
        } catch (error) {
          console.error('Error fetching subscription data:', error);
        }
      };
      fetchSubscriptionData();
    }
  }, [activeTab]);

  const handleSubscriptionSearch = async (term: string) => {
    setSubscriptionSearchTerm(term);
    try {
      const searchResults = await searchUsersWithSubscriptions(term);
      setSubscriptionUsers(searchResults);
    } catch (error) {
      console.error('Error searching subscription users:', error);
    }
  };

  const handleUpdatePlan = async (newPlan: string) => {
    if (!selectedSubscriptionUser) return;

    setUpdatingPlan(true);
    try {
      const result = await updateUserSubscriptionPlan(selectedSubscriptionUser.user_id, newPlan);
      
      if (result.success) {
        // Refresh data
        const updatedUsers = await getAllUsersWithSubscriptions();
        const updatedStats = await getSubscriptionStats();
        setSubscriptionUsers(updatedUsers);
        setSubscriptionStats(updatedStats);
        setIsUpdatePlanModalOpen(false);
        setSelectedSubscriptionUser(null);
        setSuccessMessage('Subscription plan updated successfully');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(`Error updating plan: ${result.error}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      setErrorMessage('Error updating subscription plan');
      setShowErrorModal(true);
    } finally {
      setUpdatingPlan(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trialing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      starter_monthly: 'bg-blue-100 text-blue-800',
      pro_monthly: 'bg-purple-100 text-purple-800',
      starter_yearly: 'bg-emerald-100 text-emerald-800',
      pro_yearly: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        planColors[plan] || 'bg-gray-100 text-gray-800'
      }`}>
        {plan.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const handleRoleUpdate = async (newRole: UserRole) => {
    if (!selectedUser) return;

    setUpdating(true);
    const success = await updateUserRole(selectedUser.user_id, newRole);
    
    if (success) {
      // Update local state
      setUsers(users.map(user => 
        user.user_id === selectedUser.user_id 
          ? { ...user, role: newRole }
          : user
      ));
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } else {
      alert('Failed to update user role. Please try again.');
    }
    
    setUpdating(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getICFLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'MCC': return 'bg-purple-100 text-purple-800';
      case 'PCC': return 'bg-blue-100 text-blue-800';
      case 'ACC': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelComposer = () => {
    setShowReminderComposer(false);
    setEmailSubject('A gentle nudge to update your ICF Log');
    setEmailContent(`<div style="text-align: left; margin-bottom: 20px;">
  <img src="${logoUrl}" alt="ICF Log Logo" width="120" />
</div>

<p>Hi {{userName}},</p>

<p>This is a friendly reminder to keep your ICF Log updated with your latest coaching sessions and CPD activities.</p>

<p>Regular logging helps you:</p>
<ul style="margin: 10px 0; padding-left: 20px;">
  <li style="margin: 5px 0;">Stay on track for ICF credential renewal</li>
  <li style="margin: 5px 0;">Maintain accurate records of your coaching practice</li>
  <li style="margin: 5px 0;">Generate professional reports when needed</li>
  <li style="margin: 5px 0;">Avoid last minute scrambling before renewal deadlines</li>
</ul>

<p><strong>Tip:</strong> Set aside 10-15 minutes each week to log your sessions and CPD activities.</p>

<p>Update your log now: <a href="https://icflog.com/dashboard" style="color: #3b82f6; text-decoration: underline;">https://icflog.com/dashboard</a></p>

<p>Best regards,<br>
The ICF Log Team</p>`);
    setRecipientType('all');
    setSelectedUserIds(new Set());
    setScheduleType('now');
    setScheduledDate('');
    setScheduledTime('');
    setHasUnsavedChanges(false);
    setShowCancelConfirmModal(false);
  };

  const handleSendReminders = async (sendToAll: boolean, userIds?: string[]) => {
    setSendingReminders(true);
    setReminderResult(null);
    setShowReminderModal(true);

    try {
      const response = await fetch('/api/admin/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sendToAll,
          userIds: userIds || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminders');
      }

      setReminderResult({
        sent: data.sent || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      setReminderResult({
        sent: 0,
        failed: 0,
        errors: [{ email: 'System', error: error instanceof Error ? error.message : 'Unknown error' }],
      });
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-7 w-7 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage users and view system statistics</p>
        </div>
        {/* Online Status Indicator */}
        <button
          onClick={() => setShowOnlineUsersModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          title="Click to see who is online"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {onlineCount} {onlineCount === 1 ? 'User' : 'Users'} Online
          </span>
        </button>
      </div>

      {/* Admin Menu Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Admin Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              User Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'emails'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5" />
              Email Reminders
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Subscriptions
            </div>
          </button>
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8 mb-12">
          {/* Core Metrics */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Users (30d)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_users_30d}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_sessions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-xl flex-shrink-0">
                    <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total CPD Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_cpd_entries}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth & Engagement */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth & Engagement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">New Users This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.new_users_this_month}</p>
                    <p className={`text-xs font-medium ${stats.growth_rate_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.growth_rate_percent >= 0 ? '+' : ''}{stats.growth_rate_percent}% vs last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Users (7d)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_users_7d}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Sessions/User</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avg_sessions_per_user || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avg_session_duration}m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ICF Credentials */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ICF Credential Distribution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                    <StarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">MCC Coaches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.mcc_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">PCC Coaches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pcc_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                    <AcademicCapIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">ACC Coaches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.acc_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-xl flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">No Credential Set</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.no_level_users}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Content */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance & Content</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-xl flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Coaching Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_coaching_hours}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
                    <BookOpenIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg CPD Hours/User</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avg_cpd_hours_per_user}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl flex-shrink-0">
                    <FireIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Most Active Day</p>
                    <p className="text-lg font-bold text-gray-900">{stats.most_active_day}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Distribution */}
          {stats.top_countries && stats.top_countries.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <GlobeAltIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
                    <p className="text-sm text-gray-600">Users by country</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.top_countries.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{country.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 rounded-full h-2 w-20">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(country.count / stats.total_users) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{country.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Management Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ICF Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPD Entries
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coaching Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getICFLevelBadgeColor(user.icf_level)}`}>
                      {user.icf_level === 'none' ? 'Not Set' : user.icf_level}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {user.total_sessions}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {user.total_cpd_entries}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(user.total_coaching_hours / 60)}h {user.total_coaching_hours % 60}m
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsRoleModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-150 px-3 py-1.5 rounded-md hover:bg-blue-50"
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No users in the system yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Email Reminders Tab Content */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Email Reminders</h2>
              </div>
              <p className="text-sm text-gray-600">
                Compose and send reminder emails to users, or schedule them for later.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchScheduledEmails}
                disabled={loadingScheduledEmails}
                className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                title="Refresh scheduled emails list"
              >
                {loadingScheduledEmails ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => {
                  // Initialize default email content
                  setEmailContent(`<div style="text-align: left; margin-bottom: 20px;">
  <img src="${logoUrl}" alt="ICF Log Logo" width="120" />
</div>

<p>Hi {{userName}},</p>

<p>This is a friendly reminder to keep your ICF Log updated with your latest coaching sessions and CPD activities.</p>

<p>Regular logging helps you:</p>
<ul style="margin: 10px 0; padding-left: 20px;">
  <li style="margin: 5px 0;">Stay on track for ICF credential renewal</li>
  <li style="margin: 5px 0;">Maintain accurate records of your coaching practice</li>
  <li style="margin: 5px 0;">Generate professional reports when needed</li>
  <li style="margin: 5px 0;">Avoid last minute scrambling before renewal deadlines</li>
</ul>

<p><strong>Tip:</strong> Set aside 10-15 minutes each week to log your sessions and CPD activities.</p>

<p>Update your log now: <a href="https://icflog.com/dashboard" style="color: #3b82f6; text-decoration: underline;">https://icflog.com/dashboard</a></p>

<p>Best regards,<br>
The ICF Log Team</p>`);
                  setHasUnsavedChanges(false);
                  setShowReminderComposer(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <EnvelopeIcon className="h-5 w-5" />
                Compose Email
              </button>
            </div>
          </div>
          
          {/* Scheduled Emails List */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Scheduled Emails (Pending) {scheduledEmails.filter(e => e.status === 'pending').length > 0 && `(${scheduledEmails.filter(e => e.status === 'pending').length})`}
              </h3>
              {scheduledEmails.filter(e => e.status === 'pending').length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value as 'all' | 'pending' | 'sent' | 'failed')}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Pending</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}
            </div>
            {loadingScheduledEmails ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
            ) : (() => {
              // Only show pending emails in Scheduled Emails list (sent/failed go to Reminder Log)
              const pendingEmails = scheduledEmails.filter(e => e.status === 'pending');
              const filteredEmails = emailFilter === 'all' 
                ? pendingEmails 
                : pendingEmails.filter(e => e.status === emailFilter);
              
              return filteredEmails.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            email.status === 'sent' ? 'bg-green-100 text-green-800' :
                            email.status === 'failed' ? 'bg-red-100 text-red-800' :
                            email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {email.status.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">{email.subject}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Scheduled: {new Date(email.scheduled_for).toLocaleString()}
                          {email.status === 'sent' && email.sent_count > 0 && (
                            <span className="ml-2 text-green-600">• Sent: {email.sent_count}</span>
                          )}
                          {email.status === 'failed' && email.failed_count > 0 && (
                            <span className="ml-2 text-red-600">• Failed: {email.failed_count}</span>
                          )}
                          {email.status === 'pending' && new Date(email.scheduled_for) < new Date() && (
                            <span className="ml-2 text-orange-600">• Overdue</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {(email.status === 'pending' || email.status === 'sent' || email.status === 'failed') && (
                          <button
                            onClick={() => handleDeleteScheduledEmail(email.id)}
                            disabled={deletingEmailId === email.id}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete scheduled email"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  {emailFilter === 'all' 
                    ? 'No scheduled emails. Schedule one using the "Compose Email" button above.'
                    : `No ${emailFilter} scheduled emails.`
                  }
                </div>
              );
            })()}
          </div>
        </div>

        {/* Reminder Log Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-blue-600" />
                Reminder Log
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View history of sent reminder emails
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={reminderLogFilter}
                onChange={(e) => setReminderLogFilter(e.target.value as 'all' | 'sent' | 'failed')}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sent</option>
                <option value="sent">Successfully Sent</option>
                <option value="failed">Failed</option>
              </select>
              <button
                onClick={fetchScheduledEmails}
                disabled={loadingScheduledEmails}
                className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                title="Refresh log"
              >
                {loadingScheduledEmails ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      setErrorMessage('Please log in again');
                      setShowErrorModal(true);
                      return;
                    }

                    const response = await fetch('/api/admin/process-scheduled-emails', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                    });

                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error || 'Failed to process scheduled emails');
                    }

                    setSuccessMessage(`Processed ${data.processed || 0} emails. Sent: ${data.sent || 0}, Failed: ${data.failed || 0}`);
                    setShowSuccessModal(true);
                    await fetchScheduledEmails();
                  } catch (error) {
                    setErrorMessage(error instanceof Error ? error.message : 'Failed to process scheduled emails');
                    setShowErrorModal(true);
                  }
                }}
                className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                title="Manually trigger scheduled email processing"
              >
                <ClockIcon className="h-4 w-4" />
                Process Now
              </button>
            </div>
          </div>

          {(() => {
            const logEmails = scheduledEmails.filter(e => 
              e.status === 'sent' || e.status === 'failed'
            );
            const filteredLogEmails = reminderLogFilter === 'all' 
              ? logEmails 
              : logEmails.filter(e => e.status === reminderLogFilter);
            
            return filteredLogEmails.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLogEmails
                  .sort((a, b) => new Date(b.updated_at || b.scheduled_for).getTime() - new Date(a.updated_at || a.scheduled_for).getTime())
                  .map((email) => (
                    <div key={email.id} className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                              email.status === 'sent' ? 'bg-green-100 text-green-800' :
                              email.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {email.status === 'sent' ? '✓ SENT' : '✗ FAILED'}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">{email.subject}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => handleDeleteScheduledEmail(email.id)}
                              disabled={deletingEmailId === email.id}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete reminder log entry"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-3 text-xs text-gray-600 mb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="font-medium text-gray-700">Sent:</span>{' '}
                                {email.updated_at 
                                  ? new Date(email.updated_at).toLocaleString()
                                  : new Date(email.scheduled_for).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Results:</span>{' '}
                                {email.status === 'sent' && (
                                  <span className="text-green-600">
                                    {email.sent_count || 0} sent
                                    {email.failed_count > 0 && (
                                      <span className="text-red-600 ml-1">({email.failed_count} failed)</span>
                                    )}
                                  </span>
                                )}
                                {email.status === 'failed' && (
                                  <span className="text-red-600">
                                    {email.failed_count || 0} failed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Recipients:</span>{' '}
                              {email.recipient_type === 'all' ? (
                                <span className="text-gray-600">All Users</span>
                              ) : (
                                <div className="mt-1">
                                  <span className="text-gray-600">{email.recipient_user_ids?.length || 0} selected</span>
                                  {email.recipient_user_ids && email.recipient_user_ids.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {email.recipient_user_ids.slice(0, 10).map((userId: string) => {
                                        const recipient = users.find(u => u.user_id === userId);
                                        return recipient ? (
                                          <span key={userId} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                            {recipient.name || recipient.email}
                                          </span>
                                        ) : null;
                                      })}
                                      {email.recipient_user_ids.length > 10 && (
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                          +{email.recipient_user_ids.length - 10} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {email.error_details && email.error_details.errors && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <p className="font-medium text-red-900 mb-1">Errors:</p>
                              <ul className="list-disc list-inside text-red-700 space-y-1">
                                {Array.isArray(email.error_details.errors) 
                                  ? email.error_details.errors.map((error: string, idx: number) => (
                                      <li key={idx}>{error}</li>
                                    ))
                                  : <li>{String(email.error_details.errors)}</li>
                                }
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No reminder logs yet</p>
                <p className="text-xs text-gray-500">
                  {reminderLogFilter === 'all' 
                    ? 'Sent reminders will appear here once emails are sent.'
                    : `No ${reminderLogFilter} reminders found.`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {/* Subscriptions Tab Content */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-8">
          {/* Statistics Cards */}
          {subscriptionStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionStats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionStats.active_subscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                    <CreditCardIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Paid Plans</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionStats.starter_users + subscriptionStats.pro_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Trial Users</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionStats.trial_users}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={subscriptionSearchTerm}
                onChange={(e) => handleSubscriptionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period End
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptionUsers.length > 0 ? (
                    subscriptionUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {getPlanBadge(user.subscription_plan)}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {getStatusBadge(user.subscription_status)}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                          {user.subscription_current_period_end 
                            ? new Date(user.subscription_current_period_end).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedSubscriptionUser(user);
                              setIsUpdatePlanModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 px-3 py-1.5 rounded-md hover:bg-indigo-50"
                          >
                            Update Plan
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No subscription data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Composer Modal - Outside tabs */}
      {showReminderComposer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Compose Reminder Email</h3>
                </div>
                <button
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowCancelConfirmModal(true);
                    } else {
                      handleCancelComposer();
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject"
                    required
                  />
                </div>

                {/* Email Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content *
                    <span className="text-xs text-gray-500 ml-2">(Use {'{{userName}}'} for personalization)</span>
                  </label>
                  <textarea
                    value={emailContent}
                    onChange={(e) => {
                      setEmailContent(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    rows={12}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter your email content here..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available placeholders: {'{{userName}}'}, {'{{sessionCount}}'}, {'{{cpdHours}}'}, {'{{lastActivityDate}}'}
                  </p>
                </div>

                {/* Recipient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Recipients *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipientType"
                        value="all"
                        checked={recipientType === 'all'}
                        onChange={(e) => {
                          setRecipientType('all');
                          setSelectedUserIds(new Set());
                          setHasUnsavedChanges(true);
                        }}
                        className="mr-2"
                      />
                      <span>All Users ({users.length} users)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipientType"
                        value="selected"
                        checked={recipientType === 'selected'}
                        onChange={(e) => {
                          setRecipientType('selected');
                          setHasUnsavedChanges(true);
                        }}
                        className="mr-2"
                      />
                      <span>Selected Users ({selectedUserIds.size} selected)</span>
                    </label>
                  </div>

                  {recipientType === 'selected' && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Select Users:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedUserIds.size === users.length) {
                              setSelectedUserIds(new Set());
                            } else {
                              setSelectedUserIds(new Set(users.map(u => u.user_id)));
                            }
                            setHasUnsavedChanges(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {selectedUserIds.size === users.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {users.map((user) => (
                          <label key={user.user_id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(user.user_id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedUserIds);
                                if (e.target.checked) {
                                  newSet.add(user.user_id);
                                } else {
                                  newSet.delete(user.user_id);
                                }
                                setSelectedUserIds(newSet);
                                setHasUnsavedChanges(true);
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">
                              {user.name} ({user.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Schedule *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="now"
                        checked={scheduleType === 'now'}
                        onChange={(e) => {
                          setScheduleType('now');
                          setHasUnsavedChanges(true);
                        }}
                        className="mr-2"
                      />
                      <span>Send Now</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="later"
                        checked={scheduleType === 'later'}
                        onChange={(e) => {
                          setScheduleType('later');
                          setHasUnsavedChanges(true);
                        }}
                        className="mr-2"
                      />
                      <span>Schedule for Later</span>
                    </label>
                  </div>

                  {scheduleType === 'later' && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => {
                            setScheduledDate(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={scheduleType === 'later'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time *
                        </label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => {
                            setScheduledTime(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={scheduleType === 'later'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={async () => {
                    if (!emailSubject || !emailContent) {
                      setErrorMessage('Please fill in subject and email content');
                      setShowErrorModal(true);
                      return;
                    }

                    if (recipientType === 'selected' && selectedUserIds.size === 0) {
                      setErrorMessage('Please select at least one user');
                      setShowErrorModal(true);
                      return;
                    }

                    if (scheduleType === 'later') {
                      if (!scheduledDate || !scheduledTime) {
                        setErrorMessage('Please select date and time for scheduling');
                        setShowErrorModal(true);
                        return;
                      }

                      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
                      if (scheduledDateTime <= new Date()) {
                        setErrorMessage('Scheduled time must be in the future');
                        setShowErrorModal(true);
                        return;
                      }

                      // Schedule email
                      try {
                        // Get session token from Supabase
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          setErrorMessage('Please log in again');
                          setShowErrorModal(true);
                          return;
                        }

                        const response = await fetch('/api/admin/schedule-email', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            subject: emailSubject,
                            emailContent: emailContent,
                            recipientType: recipientType,
                            recipientUserIds: recipientType === 'selected' ? Array.from(selectedUserIds) : [],
                            scheduledFor: scheduledDateTime.toISOString(),
                          }),
                        });

                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to schedule email');
                        }

                        setSuccessMessage(`Email scheduled successfully for ${scheduledDateTime.toLocaleString()}`);
                        setShowSuccessModal(true);
                        setShowReminderComposer(false);
                        setHasUnsavedChanges(false);
                        // Refresh scheduled emails list
                        await fetchScheduledEmails();
                        // Reset form
                        setEmailSubject('A gentle nudge to update your ICF Log');
                        setEmailContent(`<div style="text-align: left; margin-bottom: 20px;">
  <img src="${logoUrl}" alt="ICF Log Logo" width="120" />
</div>

<p>Hi {{userName}},</p>

<p>This is a friendly reminder to keep your ICF Log updated with your latest coaching sessions and CPD activities.</p>

<p>Regular logging helps you:</p>
<ul style="margin: 10px 0; padding-left: 20px;">
  <li style="margin: 5px 0;">Stay on track for ICF credential renewal</li>
  <li style="margin: 5px 0;">Maintain accurate records of your coaching practice</li>
  <li style="margin: 5px 0;">Generate professional reports when needed</li>
  <li style="margin: 5px 0;">Avoid last minute scrambling before renewal deadlines</li>
</ul>

<p><strong>Tip:</strong> Set aside 10-15 minutes each week to log your sessions and CPD activities.</p>

<p>Update your log now: <a href="https://icflog.com/dashboard" style="color: #3b82f6; text-decoration: underline;">https://icflog.com/dashboard</a></p>

<p>Best regards,<br>
The ICF Log Team</p>`);
                        setRecipientType('all');
                        setSelectedUserIds(new Set());
                        setScheduleType('now');
                        setScheduledDate('');
                        setScheduledTime('');
                      } catch (error) {
                        setErrorMessage(error instanceof Error ? error.message : 'Failed to schedule email');
                        setShowErrorModal(true);
                      }
                    } else {
                      // Send immediately
                      setSendingReminders(true);
                      setShowReminderModal(true);
                      setShowReminderComposer(false);

                      try {
                        // Get session token from Supabase
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          setErrorMessage('Please log in again');
                          setShowErrorModal(true);
                          return;
                        }

                        const response = await fetch('/api/admin/send-custom-reminders', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            subject: emailSubject,
                            emailContent: emailContent,
                            recipientType: recipientType,
                            recipientUserIds: recipientType === 'selected' ? Array.from(selectedUserIds) : [],
                          }),
                        });

                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to send emails');
                        }

                        setReminderResult({
                          sent: data.sent || 0,
                          failed: data.failed || 0,
                          errors: data.errors || [],
                        });
                        setHasUnsavedChanges(false);
                        // Refresh scheduled emails list to show the new log entry
                        await fetchScheduledEmails();
                      } catch (error) {
                        setReminderResult({
                          sent: 0,
                          failed: 0,
                          errors: [{ email: 'System', error: error instanceof Error ? error.message : 'Unknown error' }],
                        });
                      } finally {
                        setSendingReminders(false);
                      }
                    }
                  }}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {scheduleType === 'now' ? 'Send Now' : 'Schedule Email'}
                </button>
                <button
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowCancelConfirmModal(true);
                    } else {
                      handleCancelComposer();
                    }
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Results Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {sendingReminders ? 'Sending Reminders...' : 'Reminder Results'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {sendingReminders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Sending reminder emails...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while emails are being sent</p>
              </div>
            ) : reminderResult ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-200 rounded-lg">
                        <CheckCircleIcon className="h-6 w-6 text-green-700" />
                      </div>
                      <span className="font-semibold text-green-900">Successfully Sent</span>
                    </div>
                    <p className="text-4xl font-bold text-green-700">{reminderResult.sent}</p>
                    <p className="text-xs text-green-600 mt-1">emails delivered</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-200 rounded-lg">
                        <XCircleIcon className="h-6 w-6 text-red-700" />
                      </div>
                      <span className="font-semibold text-red-900">Failed</span>
                    </div>
                    <p className="text-4xl font-bold text-red-700">{reminderResult.failed}</p>
                    <p className="text-xs text-red-600 mt-1">emails failed</p>
                  </div>
                </div>

                {reminderResult.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                      Error Details
                    </h4>
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                      <ul className="space-y-3">
                        {reminderResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-800 bg-white p-3 rounded-lg border border-red-200">
                            <strong className="text-red-900">{error.email}:</strong> <span className="text-red-700">{error.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowReminderModal(false);
                      setReminderResult(null);
                    }}
                    className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                  >
                    Close
                  </button>
                  {reminderResult.sent > 0 && (
                    <button
                      onClick={() => {
                        setShowReminderModal(false);
                        setReminderResult(null);
                        fetchScheduledEmails();
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      View Scheduled Emails
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <XCircleIcon className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal - Outside tabs */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                <h3 className="text-lg font-medium text-gray-900">Change User Role</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Change role for <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </p>
              
              <div className="space-y-2 mb-6">
                {(['user', 'admin', 'super_admin'] as UserRole[]).map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={selectedUser.role === role}
                      className="mr-2"
                    />
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const selectedRole = document.querySelector('input[name="role"]:checked') as HTMLInputElement;
                    if (selectedRole) {
                      handleRoleUpdate(selectedRole.value as UserRole);
                    }
                  }}
                  disabled={updating}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Role'}
                </button>
                <button
                  onClick={() => {
                    setIsRoleModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discard Changes?</h3>
              <p className="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelConfirmModal(false);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    handleCancelComposer();
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Email Confirmation Modal */}
      {showDeleteConfirmModal && emailToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Scheduled Email?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this scheduled email? This action cannot be undone.
              </p>
              {(() => {
                const email = scheduledEmails.find(e => e.id === emailToDelete);
                return email && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm font-medium text-gray-900 mb-1">Subject:</p>
                    <p className="text-sm text-gray-700 mb-3">{email.subject}</p>
                    <p className="text-sm font-medium text-gray-900 mb-1">Scheduled for:</p>
                    <p className="text-sm text-gray-700 mb-3">{new Date(email.scheduled_for).toLocaleString()}</p>
                    {email.status && (
                      <>
                        <p className="text-sm font-medium text-gray-900 mb-1">Status:</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          email.status === 'sent' ? 'bg-green-100 text-green-800' :
                          email.status === 'failed' ? 'bg-red-100 text-red-800' :
                          email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {email.status.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setEmailToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteScheduledEmail}
                  disabled={deletingEmailId === emailToDelete}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingEmailId === emailToDelete ? 'Deleting...' : 'Delete Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Users Modal */}
      {showOnlineUsersModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Online Users ({onlineCount})
                  </h3>
                </div>
                <button
                  onClick={() => setShowOnlineUsersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              {onlineUsers.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {onlineUsers.map((user) => {
                    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
                    const minutesAgo = lastSeen 
                      ? Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60))
                      : 0;
                    
                    return (
                      <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name || user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email !== user.name ? user.email : ''}
                              {user.role && user.role !== 'user' && (
                                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  {user.role}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {minutesAgo === 0 ? 'Just now' : `${minutesAgo} min ago`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm font-medium text-gray-900 mb-1">No users online</p>
                  <p className="text-xs text-gray-500">Users will appear here when they're active</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Plan Modal */}
      {isUpdatePlanModalOpen && selectedSubscriptionUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-xl rounded-xl bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Subscription Plan
                </h3>
                <button
                  onClick={() => {
                    setIsUpdatePlanModalOpen(false);
                    setSelectedSubscriptionUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">User:</span> {selectedSubscriptionUser.name || 'No name'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Email:</span> {selectedSubscriptionUser.email}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Current Plan:</span> {selectedSubscriptionUser.subscription_plan === 'free' ? 'FREE' : selectedSubscriptionUser.subscription_plan.replace('_', ' ').toUpperCase()}
                </p>
                {selectedSubscriptionUser.subscription_plan === 'free' && (
                  <p className="text-sm text-gray-500">Basic features</p>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleUpdatePlan('free')}
                  disabled={updatingPlan}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150 ${
                    selectedSubscriptionUser.subscription_plan === 'free' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">FREE</div>
                  <div className="text-sm text-gray-500">Basic features</div>
                </button>
                <button
                  onClick={() => handleUpdatePlan('starter_monthly')}
                  disabled={updatingPlan}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150 ${
                    selectedSubscriptionUser.subscription_plan === 'starter_monthly' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">Starter Monthly</div>
                  <div className="text-sm text-gray-500">$6/month - Enhanced features</div>
                </button>
                <button
                  onClick={() => handleUpdatePlan('pro_monthly')}
                  disabled={updatingPlan}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150 ${
                    selectedSubscriptionUser.subscription_plan === 'pro_monthly' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">Pro Monthly</div>
                  <div className="text-sm text-gray-500">$9/month - All features</div>
                </button>
                <button
                  onClick={() => handleUpdatePlan('starter_yearly')}
                  disabled={updatingPlan}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150 ${
                    selectedSubscriptionUser.subscription_plan === 'starter_yearly' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">Starter Yearly</div>
                  <div className="text-sm text-gray-500">$60</div>
                </button>
                <button
                  onClick={() => handleUpdatePlan('pro_yearly')}
                  disabled={updatingPlan}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150 ${
                    selectedSubscriptionUser.subscription_plan === 'pro_yearly' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">Pro Yearly</div>
                  <div className="text-sm text-gray-500">$80</div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsUpdatePlanModalOpen(false);
                    setSelectedSubscriptionUser(null);
                  }}
                  disabled={updatingPlan}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-150 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 