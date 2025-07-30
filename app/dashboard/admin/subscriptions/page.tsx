"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAllUsersWithSubscriptions,
  getSubscriptionStats,
  updateUserSubscriptionPlan,
  searchUsersWithSubscriptions,
  type UserSubscription,
  type SubscriptionStats,
} from "@/lib/subscriptionUtils";
import { isCurrentUserAdmin } from "@/lib/adminUtils";
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  UserGroupIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

export default function SubscriptionsAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        const isAdmin = await isCurrentUserAdmin();
        if (!isAdmin) {
          router.push('/dashboard');
          return;
        }

        const [usersData, statsData] = await Promise.all([
          getAllUsersWithSubscriptions(),
          getSubscriptionStats(),
        ]);

        setUsers(usersData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [router]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    try {
      const searchResults = await searchUsersWithSubscriptions(term);
      setUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUpdatePlan = async (newPlan: string) => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const result = await updateUserSubscriptionPlan(selectedUser.user_id, newPlan);
      
      if (result.success) {
        // Refresh data
        const updatedUsers = await getAllUsersWithSubscriptions();
        const updatedStats = await getSubscriptionStats();
        setUsers(updatedUsers);
        setStats(updatedStats);
        setIsUpdateModalOpen(false);
        setSelectedUser(null);
      } else {
        alert(`Error updating plan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error updating subscription plan');
    } finally {
      setUpdating(false);
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
    const planColors = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      starter_monthly: 'bg-blue-100 text-blue-800',
      pro_monthly: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        planColors[plan as keyof typeof planColors] || 'bg-gray-100 text-gray-800'
      }`}>
        {plan.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Manage user subscriptions and billing</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_subscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.starter_users + stats.pro_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trial Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trial_users}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlanBadge(user.subscription_plan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.subscription_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.subscription_current_period_end 
                      ? new Date(user.subscription_current_period_end).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUpdateModalOpen(true);
                      }}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      Update Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Plan Modal */}
      {isUpdateModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Subscription Plan
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                User: {selectedUser.name} ({selectedUser.email})
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Plan: {selectedUser.subscription_plan}
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleUpdatePlan('free')}
                  disabled={updating}
                  className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Free Plan
                </button>
                <button
                  onClick={() => handleUpdatePlan('starter_monthly')}
                  disabled={updating}
                  className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Starter Monthly ($20/month)
                </button>
                <button
                  onClick={() => handleUpdatePlan('pro_monthly')}
                  disabled={updating}
                  className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Pro Monthly ($50/month)
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedUser(null);
                  }}
                  disabled={updating}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
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