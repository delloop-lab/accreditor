-- Add subscription-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- Add constraints
ALTER TABLE profiles 
ADD CONSTRAINT valid_subscription_status CHECK (
  subscription_status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired', 'paused', 'inactive')
);

ALTER TABLE profiles 
ADD CONSTRAINT valid_subscription_plan CHECK (
  subscription_plan IN ('free', 'starter', 'pro', 'starter_monthly', 'pro_monthly', 'starter_yearly', 'pro_yearly')
);

-- Create a function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid 
    AND subscription_status IN ('active', 'trialing')
    AND (subscription_current_period_end IS NULL OR subscription_current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user subscription info
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  plan VARCHAR(50),
  status VARCHAR(50),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.subscription_plan,
    p.subscription_status,
    p.subscription_current_period_end,
    p.cancel_at_period_end
  FROM profiles p
  WHERE p.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have 'free' plan by default
UPDATE profiles 
SET subscription_plan = 'free', subscription_status = 'inactive' 
WHERE subscription_plan IS NULL OR subscription_status IS NULL;

-- Add RLS policies for subscription data
-- Admins can see all subscription data
CREATE POLICY "Admins can view all subscription data" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.user_id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscription data" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can update subscription data (via webhook)
CREATE POLICY "System can update subscription data" ON profiles
  FOR UPDATE USING (true);

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN profiles.subscription_plan IS 'Current subscription plan';
COMMENT ON COLUMN profiles.subscription_current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN profiles.subscription_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN profiles.trial_end IS 'End of trial period if applicable';
COMMENT ON COLUMN profiles.cancel_at_period_end IS 'Whether subscription cancels at period end'; 