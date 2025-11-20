import { supabase } from './supabaseClient';

export interface UsageData {
  totalCPD: number;
  totalSessions: number;
  totalUsage: number;
  remainingFree: number;
  hasReachedLimit: boolean;
  isSubscribed: boolean;
  subscriptionPlan: string;
}

const FREE_LIMIT = 10; // Total combined limit for free users

// Get user's current usage statistics
export const getUserUsage = async (userId?: string): Promise<UsageData> => {
  try {
    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalCPD: 0,
          totalSessions: 0,
          totalUsage: 0,
          remainingFree: FREE_LIMIT,
          hasReachedLimit: false,
          isSubscribed: false,
          subscriptionPlan: 'free',
        };
      }
      currentUserId = user.id;
    }

    // Get user's subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status')
      .eq('user_id', currentUserId)
      .single();

    const isSubscribed = profile?.subscription_status === 'active' || 
                        profile?.subscription_plan !== 'free';

    // Get CPD count
    const { count: cpdCount } = await supabase
      .from('cpd')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    // Get Sessions count
    const { count: sessionsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    const totalCPD = cpdCount || 0;
    const totalSessions = sessionsCount || 0;
    const totalUsage = totalCPD + totalSessions;
    const remainingFree = Math.max(0, FREE_LIMIT - totalUsage);
    const hasReachedLimit = !isSubscribed && totalUsage >= FREE_LIMIT;

    return {
      totalCPD,
      totalSessions,
      totalUsage,
      remainingFree,
      hasReachedLimit,
      isSubscribed,
      subscriptionPlan: profile?.subscription_plan || 'free',
    };
  } catch (error) {
    return {
      totalCPD: 0,
      totalSessions: 0,
      totalUsage: 0,
      remainingFree: FREE_LIMIT,
      hasReachedLimit: false,
      isSubscribed: false,
      subscriptionPlan: 'free',
    };
  }
};

// Check if user can add new entry (CPD or Session)
export const canAddNewEntry = async (userId?: string): Promise<{
  canAdd: boolean;
  reason?: string;
  usage: UsageData;
}> => {
  const usage = await getUserUsage(userId);

  if (usage.isSubscribed) {
    return {
      canAdd: true,
      usage,
    };
  }

  if (usage.hasReachedLimit) {
    return {
      canAdd: false,
      reason: `You've reached your free limit of ${FREE_LIMIT} entries. Please upgrade to continue.`,
      usage,
    };
  }

  return {
    canAdd: true,
    usage,
  };
};

// Get usage progress for display
export const getUsageProgress = (usage: UsageData) => {
  if (usage.isSubscribed) {
    return {
      percentage: 0,
      color: 'green',
      message: 'Unlimited entries with your subscription',
      showProgress: false,
    };
  }

  const percentage = (usage.totalUsage / FREE_LIMIT) * 100;
  let color = 'green';
  let message = `${usage.totalUsage} of ${FREE_LIMIT} free entries used`;

  if (percentage >= 80) {
    color = 'red';
    message = `${usage.remainingFree} free entries remaining`;
  } else if (percentage >= 60) {
    color = 'yellow';
    message = `${usage.remainingFree} free entries remaining`;
  }

  return {
    percentage: Math.min(100, percentage),
    color,
    message,
    showProgress: true,
  };
};

// Premium features that require subscription
export const isPremiumFeature = (feature: string, usage: UsageData): boolean => {
  if (usage.isSubscribed) return false;

  const premiumFeatures = [
    'unlimited_entries',
    'advanced_reports',
    'export_data',
    'custom_fields',
  ];

  return premiumFeatures.includes(feature);
}; 
