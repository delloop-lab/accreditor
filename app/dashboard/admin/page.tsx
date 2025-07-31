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
  BookOpenIcon
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
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-7 w-7 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage users and view system statistics</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
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

      {/* Search and Users Table */}
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

      {/* Role Change Modal */}
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
    </div>
  );
} 