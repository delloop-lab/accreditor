import { supabase } from './supabaseClient';

export interface UserSubscription {
  user_id: string;
  email: string;
  name: string;
  stripe_customer_id?: string;
  subscription_id?: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_current_period_start?: string;
  subscription_current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface SubscriptionStats {
  total_users: number;
  active_subscriptions: number;
  free_users: number;
  starter_users: number;
  pro_users: number;
  canceled_subscriptions: number;
  trial_users: number;
}

// Get all users with subscription data (admin only)
export const getAllUsersWithSubscriptions = async (): Promise<UserSubscription[]> => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        name,
        stripe_customer_id,
        subscription_id,
        subscription_status,
        subscription_plan,
        subscription_current_period_start,
        subscription_current_period_end,
        cancel_at_period_end
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users with subscriptions:', error);
      return [];
    }

    return users || [];
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return [];
  }
};

// Get subscription statistics (admin only)
export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
  try {
    const users = await getAllUsersWithSubscriptions();
    
    const stats: SubscriptionStats = {
      total_users: users.length,
      active_subscriptions: users.filter(u => u.subscription_status === 'active').length,
      free_users: users.filter(u => u.subscription_plan === 'free').length,
      starter_users: users.filter(u => u.subscription_plan?.includes('starter')).length,
      pro_users: users.filter(u => u.subscription_plan?.includes('pro')).length,
      canceled_subscriptions: users.filter(u => u.subscription_status === 'canceled').length,
      trial_users: users.filter(u => u.subscription_status === 'trialing').length,
    };

    return stats;
  } catch (error) {
    console.error('Error calculating subscription stats:', error);
    return {
      total_users: 0,
      active_subscriptions: 0,
      free_users: 0,
      starter_users: 0,
      pro_users: 0,
      canceled_subscriptions: 0,
      trial_users: 0,
    };
  }
};

// Manually update user subscription plan (admin only)
export const updateUserSubscriptionPlan = async (
  userId: string, 
  plan: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        subscription_status: plan === 'free' ? 'inactive' : 'active',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { success: false, error: 'Failed to update subscription plan' };
  }
};

// Get Stripe customer portal URL (calls API route)
export const getCustomerPortalUrl = async (customerId: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return null;
  }
};

// Search users by email or name
export const searchUsersWithSubscriptions = async (searchTerm: string): Promise<UserSubscription[]> => {
  try {
    if (!searchTerm.trim()) {
      return getAllUsersWithSubscriptions();
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        name,
        stripe_customer_id,
        subscription_id,
        subscription_status,
        subscription_plan,
        subscription_current_period_start,
        subscription_current_period_end,
        cancel_at_period_end
      `)
      .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return users || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}; 