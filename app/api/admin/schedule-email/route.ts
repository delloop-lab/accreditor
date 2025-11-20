import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    // Get server-side Supabase client with request context
    const supabase = createServerSupabaseClient(request);
    
    // Check if user is authenticated and is admin
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, emailContent, recipientType, recipientUserIds, scheduledFor } = body;

    if (!subject || !emailContent || !scheduledFor) {
      return NextResponse.json(
        { error: 'Subject, email content, and scheduled time are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Insert scheduled email
    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        created_by: user.id,
        subject,
        email_content: emailContent,
        recipient_type: recipientType || 'all',
        recipient_user_ids: recipientType === 'selected' ? (recipientUserIds || []) : [],
        scheduled_for: scheduledFor,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to schedule email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledEmail: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule email' },
      { status: 500 }
    );
  }
}

