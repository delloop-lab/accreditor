import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';
import { sendBulkReminders, ReminderEmailData } from '@/lib/emailUtils';

/**
 * Convert email content to HTML format
 * If content already contains HTML tags, just replace placeholders and wrap in template
 * Otherwise, convert plain text to HTML
 */
function convertTextToHtml(text: string, userName: string, sessionCount?: number, cpdHours?: number, lastActivityDate?: string): string {
  // Check if content already contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);
  
  // Replace placeholders first
  let html = text
    .replace(/\{\{userName\}\}/g, userName)
    .replace(/\{\{sessionCount\}\}/g, sessionCount?.toString() || '0')
    .replace(/\{\{cpdHours\}\}/g, cpdHours?.toFixed(1) || '0')
    .replace(/\{\{lastActivityDate\}\}/g, lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : 'No recent activity');

  // If content already has HTML, just wrap it in the email template
  if (hasHtmlTags) {
    // Extract plain text for better deliverability
    const plainText = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    ${html}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 10px 0;">
        <a href="https://icflog.com/dashboard" style="color: #6b7280; text-decoration: underline;">Manage your email preferences</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
        © ${new Date().getFullYear()} ICF Log. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Otherwise, convert plain text to HTML
  // Convert URLs to links BEFORE converting line breaks
  // Match URLs that are not already inside <a> tags (simple check: not preceded by href=)
  html = html.replace(/(?<!href=["'])(https?:\/\/[^\s\n<>]+)/gi, '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>');
  
  // Fallback for environments that don't support lookbehind: simple URL conversion
  if (html === text.replace(/\{\{userName\}\}/g, userName).replace(/\{\{sessionCount\}\}/g, sessionCount?.toString() || '0').replace(/\{\{cpdHours\}\}/g, cpdHours?.toFixed(1) || '0').replace(/\{\{lastActivityDate\}\}/g, lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : 'No recent activity')) {
    // Lookbehind not supported, use simpler approach
    html = html.replace(/(https?:\/\/[^\s\n<>]+)/gi, '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>');
  }

  // Convert bullet points (•) to HTML list items
  // Split by lines and process each line
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line starts with bullet point
    if (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)) {
      if (!inList) {
        processedLines.push('<ul style="margin: 10px 0; padding-left: 20px;">');
        inList = true;
      }
      // Remove bullet and wrap in <li>
      const listItem = line.replace(/^[•\-\d+\.]\s*/, '').trim();
      processedLines.push(`<li style="margin: 5px 0;">${listItem}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (line) {
        // Convert remaining line breaks to <br> for non-list content
        processedLines.push(line);
      } else {
        // Empty line becomes paragraph break
        processedLines.push('<br>');
      }
    }
  }
  
  // Close list if still open
  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Convert remaining line breaks to <br> (for lines that weren't processed as lists)
  html = html.replace(/\n/g, '<br>');

  // Wrap in HTML template
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">ICF Log</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Professional Coaching Log & CPD Tracker</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="font-size: 16px; line-height: 1.8;">${html}</div>
    
    <p style="font-size: 14px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      © ${new Date().getFullYear()} ICF Log. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

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
    const { subject, emailContent, recipientType, recipientUserIds } = body;

    if (!subject || !emailContent) {
      return NextResponse.json(
        { error: 'Subject and email content are required' },
        { status: 400 }
      );
    }

    // Get users to send to
    let usersToRemind: any[] = [];

    if (recipientType === 'all') {
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
    } else if (recipientUserIds && Array.isArray(recipientUserIds) && recipientUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .in('user_id', recipientUserIds)
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

    // Fetch activity data and prepare email data
    const reminderData: ReminderEmailData[] = await Promise.all(
      usersToRemind.map(async (profile) => {
        const userId = profile.user_id;
        
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        const { data: sessions } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

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
          cpdHours: Math.round(cpdHours * 10) / 10,
          customSubject: subject,
          customContent: emailContent,
        };
      })
    );

    // Send emails using custom content
    const validReminders = reminderData.filter(data => data.to && data.to.includes('@'));

    if (validReminders.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found' },
        { status: 400 }
      );
    }

    // Send custom emails
    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const reminder of validReminders) {
      try {
        const htmlContent = convertTextToHtml(
          reminder.customContent || '',
          reminder.userName,
          reminder.sessionCount,
          reminder.cpdHours,
          reminder.lastActivityDate
        );

        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'ICF Log <noreply@icflog.com>';

        // Extract plain text version for better deliverability
        const plainText = htmlContent
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: reminder.to,
          subject: reminder.customSubject || subject,
          html: htmlContent,
          text: plainText, // Plain text version for better deliverability
          headers: {
            'X-Entity-Ref-ID': `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        });

        if (error) {
          failed++;
          errors.push({ email: reminder.to, error: error.message || 'Failed to send email' });
        } else {
          sent++;
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
        errors.push({
          email: reminder.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create a log entry in scheduled_emails table for tracking
    try {
      await supabase
        .from('scheduled_emails')
        .insert({
          created_by: user.id,
          subject: subject,
          email_content: emailContent,
          recipient_type: recipientType,
          recipient_user_ids: recipientType === 'selected' ? recipientUserIds : [],
          scheduled_for: new Date().toISOString(), // Immediate send, so use current time
          status: failed === 0 ? 'sent' : 'failed',
          sent_count: sent,
          failed_count: failed,
          error_details: errors.length > 0 ? { errors } : null,
        });
    } catch (logError) {
      // Don't fail the request if logging fails, but log the error
      console.error('Error logging reminder send:', logError);
    }

    return NextResponse.json({
      success: true,
      total: validReminders.length,
      sent,
      failed,
      errors,
    });
  } catch (error) {
    console.error('Error sending custom reminders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

