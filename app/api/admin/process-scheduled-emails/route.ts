import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabaseServer';
import { Resend } from 'resend';

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
        Â© ${new Date().getFullYear()} ICF Log. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Otherwise, convert plain text to HTML
  // Convert URLs to links BEFORE converting line breaks
  // Match URLs that are not already inside <a> tags
  html = html.replace(/(?<!href=["'])(https?:\/\/[^\s\n<>]+)/gi, '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>');
  
  // Fallback for environments that don't support lookbehind
  const originalAfterPlaceholders = text.replace(/\{\{userName\}\}/g, userName).replace(/\{\{sessionCount\}\}/g, sessionCount?.toString() || '0').replace(/\{\{cpdHours\}\}/g, cpdHours?.toFixed(1) || '0').replace(/\{\{lastActivityDate\}\}/g, lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : 'No recent activity');
  if (html === originalAfterPlaceholders) {
    // Lookbehind not supported, use simpler approach
    html = html.replace(/(https?:\/\/[^\s\n<>]+)/gi, '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>');
  }

  // Convert bullet points (â€¢) to HTML list items
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line starts with bullet point
    if (line.startsWith('â€¢') || line.startsWith('-') || line.match(/^\d+\./)) {
      if (!inList) {
        processedLines.push('<ul style="margin: 10px 0; padding-left: 20px;">');
        inList = true;
      }
      // Remove bullet and wrap in <li>
      const listItem = line.replace(/^[â€¢\-\d+\.]\s*/, '').trim();
      processedLines.push(`<li style="margin: 5px 0;">${listItem}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (line) {
        processedLines.push(line);
      } else {
        processedLines.push('<br>');
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');
  html = html.replace(/\n/g, '<br>');

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
    <div style="font-size: 16px; white-space: pre-wrap;">${html}</div>
    
    <p style="font-size: 14px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Â© ${new Date().getFullYear()} ICF Log. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Process scheduled emails that are due to be sent
 * This endpoint should be called periodically (e.g., via cron job)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication - allow cron secret OR admin user
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET_KEY;
    
    let authorized = false;
    let supabase;
    
    if (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Cron job authentication - use service role client to bypass RLS
      authorized = true;
      try {
        supabase = createServiceRoleSupabaseClient();
      } catch (error) {
        // Fallback to regular client if service role key not available
        supabase = createServerSupabaseClient(request);
      }
    } else {
      // User authentication - check if admin
      const tempSupabase = createServerSupabaseClient(request);
      const { data: { user } } = await tempSupabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await tempSupabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
        authorized = isAdmin;
        
        // If admin, use service role client to bypass RLS for updates
        if (isAdmin) {
          try {
            supabase = createServiceRoleSupabaseClient();
          } catch (error) {
            supabase = tempSupabase; // Fallback to regular client
          }
        } else {
          supabase = tempSupabase;
        }
      } else {
        supabase = tempSupabase;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access or valid cron secret required.' },
        { status: 403 }
      );
    }

    // Find all pending scheduled emails that are due
    const now = new Date().toISOString();
    
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch scheduled emails', details: fetchError.message },
        { status: 500 }
      );
    }


    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No scheduled emails to process',
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ICF Log <noreply@icflog.com>';

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // Process each scheduled email
    for (const scheduledEmail of scheduledEmails) {
      try {
        // Get recipients
        let recipients: any[] = [];

        if (scheduledEmail.recipient_type === 'all') {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, email, name')
            .not('email', 'is', null);

          recipients = profiles || [];
        } else if (scheduledEmail.recipient_user_ids && scheduledEmail.recipient_user_ids.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, email, name')
            .in('user_id', scheduledEmail.recipient_user_ids)
            .not('email', 'is', null);

          recipients = profiles || [];
        }

        // Send emails to recipients
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const recipient of recipients) {
          try {
            // Fetch user stats
            const { data: lastSession } = await supabase
              .from('sessions')
              .select('date')
              .eq('user_id', recipient.user_id)
              .order('date', { ascending: false })
              .limit(1)
              .single();

            const { data: sessions } = await supabase
              .from('sessions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', recipient.user_id);

            const { data: cpdData } = await supabase
              .from('cpd')
              .select('hours, icf_cce_hours')
              .eq('user_id', recipient.user_id);

            const cpdHours = cpdData?.reduce((sum, entry) => {
              const isIcfCceHours = entry.icf_cce_hours !== false;
              return sum + (isIcfCceHours ? (entry.hours || 0) : 0);
            }, 0) || 0;

            // Generate HTML content
            const htmlContent = convertTextToHtml(
              scheduledEmail.email_content,
              recipient.name || 'Valued Coach',
              sessions?.length || 0,
              Math.round(cpdHours * 10) / 10,
              lastSession?.date || undefined
            );

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

            // Send email
            const { error: emailError } = await resend.emails.send({
              from: fromEmail,
              to: recipient.email,
              subject: scheduledEmail.subject,
              html: htmlContent,
              text: plainText, // Plain text version for better deliverability
              headers: {
                'X-Entity-Ref-ID': `scheduled-${scheduledEmail.id}-${Date.now()}`,
              },
            });

            if (emailError) {
              failed++;
              errors.push(`${recipient.email}: ${emailError.message}`);
            } else {
              sent++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            failed++;
            errors.push(`${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Update scheduled email status
        const updateStatus = failed === 0 ? 'sent' : 'failed';
        
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({
            status: updateStatus,
            sent_count: sent,
            failed_count: failed,
            error_details: errors.length > 0 ? { errors } : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scheduledEmail.id);

        if (updateError) {
          throw new Error(`Failed to update email status: ${updateError.message}`);
        }

        totalProcessed++;
        totalSent += sent;
        totalFailed += failed;
      } catch (error) {
        // Mark as failed
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_details: { error: error instanceof Error ? error.message : 'Unknown error' },
            updated_at: new Date().toISOString(),
          })
          .eq('id', scheduledEmail.id);
        
        if (updateError) {
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      sent: totalSent,
      failed: totalFailed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process scheduled emails' },
      { status: 500 }
    );
  }
}

// Also allow GET for easy cron job setup
export async function GET(request: NextRequest) {
  return POST(request);
}

