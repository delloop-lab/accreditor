import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReminderEmailData {
  to: string;
  userName: string;
  lastActivityDate?: string;
  sessionCount?: number;
  cpdHours?: number;
  customSubject?: string;
  customContent?: string;
}

/**
 * Send a reminder email to a user
 */
export async function sendReminderEmail(data: ReminderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY is not configured' };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ICF Log <noreply@icflog.com>';
    
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: 'Reminder: Keep Your ICF Log Updated',
      html: generateReminderEmailTemplate(data),
    });

    if (error) {
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Send reminder emails to multiple users
 */
export async function sendBulkReminders(
  users: ReminderEmailData[]
): Promise<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const user of users) {
    const result = await sendReminderEmail(user);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({ email: user.to, error: result.error || 'Unknown error' });
    }
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, errors };
}

/**
 * Generate HTML email template for reminders
 */
function generateReminderEmailTemplate(data: ReminderEmailData): string {
  const lastActivity = data.lastActivityDate 
    ? new Date(data.lastActivityDate).toLocaleDateString()
    : 'No recent activity';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ICF Log Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">ICF Log</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Professional Coaching Log & CPD Tracker</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.userName},</h2>
    
    <p style="font-size: 16px;">This is a friendly reminder to keep your ICF Log updated with your latest coaching sessions and CPD activities.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #1f2937;">Your Current Status:</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${data.lastActivityDate ? `<li><strong>Last Activity:</strong> ${lastActivity}</li>` : ''}
        ${data.sessionCount !== undefined ? `<li><strong>Total Sessions:</strong> ${data.sessionCount}</li>` : ''}
        ${data.cpdHours !== undefined ? `<li><strong>CPD Hours:</strong> ${data.cpdHours}h</li>` : ''}
      </ul>
    </div>
    
    <p style="font-size: 16px;">Regular logging helps you:</p>
    <ul style="font-size: 16px; line-height: 1.8;">
      <li>Stay on track for ICF credential renewal</li>
      <li>Maintain accurate records of your coaching practice</li>
      <li>Generate professional reports when needed</li>
      <li>Avoid last-minute scrambling before renewal deadlines</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://icflog.com'}/dashboard" 
         style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold; 
                display: inline-block;
                font-size: 16px;">
        Update Your Log Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <strong>Tip:</strong> Set aside 10-15 minutes each week to log your sessions and CPD activities. This small habit will save you hours of work later!
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If you have any questions or need assistance, feel free to reach out to our support team at 
      <a href="mailto:hello@icflog.com" style="color: #3b82f6;">hello@icflog.com</a>.
    </p>
    
    <p style="font-size: 14px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Best regards,<br>
      The ICF Log Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>You're receiving this email because you have an account with ICF Log.</p>
    <p>Â© ${new Date().getFullYear()} ICF Log. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

