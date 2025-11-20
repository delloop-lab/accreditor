import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendBulkReminders, ReminderEmailData } from '@/lib/emailUtils';
import { isCurrentUserAdmin } from '@/lib/adminUtils';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds, sendToAll } = body;

    // Get all users or specific users
    let usersToRemind: any[] = [];

    if (sendToAll) {
      // Get all users from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .not('email', 'is', null);

      if (profilesError) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      usersToRemind = profiles || [];
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Get specific users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .in('user_id', userIds)
        .not('email', 'is', null);

      if (profilesError) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      usersToRemind = profiles || [];
    } else {
      return NextResponse.json(
        { error: 'No users specified' },
        { status: 400 }
      );
    }

    // Fetch activity data for each user
    const reminderData: ReminderEmailData[] = await Promise.all(
      usersToRemind.map(async (profile) => {
        const userId = profile.user_id;
        
        // Get last session date
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Get session count
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Get CPD hours (excluding non-ICF CCE hours)
        const { data: cpdData } = await supabase
          .from('cpd')
          .select('hours, icf_cce_hours')
          .eq('user_id', userId);

        const cpdHours = cpdData?.reduce((sum, entry) => {
          const isIcfCceHours = entry.icf_cce_hours !== false;
          return sum + (isIcfCceHours ? (entry.hours || 0) : 0);
        }, 0) || 0;

        return {
          to: profile.email,
          userName: profile.name || 'Valued Coach',
          lastActivityDate: lastSession?.date || undefined,
          sessionCount: sessions?.length || 0,
          cpdHours: Math.round(cpdHours * 10) / 10, // Round to 1 decimal
        };
      })
    );

    // Filter out users without email addresses
    const validReminders = reminderData.filter(data => data.to && data.to.includes('@'));

    if (validReminders.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found' },
        { status: 400 }
      );
    }

    // Send reminders
    const result = await sendBulkReminders(validReminders);

    return NextResponse.json({
      success: true,
      total: validReminders.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reminders' },
      { status: 500 }
    );
  }
}


