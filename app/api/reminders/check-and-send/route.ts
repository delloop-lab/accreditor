import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServer";
import { sendReminderEmail } from "@/lib/emailUtils";
import webpush from "web-push";

/**
 * Automated reminder system that checks for:
 * 1. Session logging reminders (no session in 7 days)
 * 2. Post-session reflection reminders (session logged but no notes)
 * 3. CPD activity reminders (no CPD entry in 14 days)
 * 4. CPD deadline reminders (based on renewal date: 90, 75, 50, 25 days before)
 * 
 * This endpoint should be called daily via cron job or scheduled task
 */
export async function POST(req: NextRequest) {
  try {
    // Verify this is called from an authorized source (e.g., cron job with secret)
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.REMINDER_CRON_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleSupabaseClient();
    const results = {
      sessionReminders: { sent: 0, failed: 0 },
      reflectionReminders: { sent: 0, failed: 0 },
      cpdActivityReminders: { sent: 0, failed: 0 },
      cpdDeadlineReminders: { sent: 0, failed: 0 },
      errors: [] as string[],
    };

    // Get all users with notification preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email, name, cpd_renewal_date");

    if (profilesError || !profiles) {
      return NextResponse.json(
        { error: "Failed to fetch users", details: profilesError },
        { status: 500 }
      );
    }

    // Set up webpush for push notifications
    if (
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_EMAIL
    ) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    for (const profile of profiles) {
      try {
        // Get user's notification preferences
        const { data: pushSubs } = await supabase
          .from("push_subscriptions")
          .select("subscription, notification_types")
          .eq("user_id", profile.user_id);
        
        const pushSubscriptions = pushSubs || [];

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("email_notification_types")
          .eq("user_id", profile.user_id)
          .single();

        // Parse notification preferences
        let pushTypes: string[] = [];
        let emailTypes: string[] = [];

        if (pushSubscriptions && pushSubscriptions.length > 0) {
          const types = pushSubscriptions[0].notification_types;
          if (typeof types === "string") {
            try {
              pushTypes = JSON.parse(types);
            } catch {
              pushTypes = [];
            }
          } else {
            pushTypes = types || [];
          }
        }

        if (userProfile?.email_notification_types) {
          if (typeof userProfile.email_notification_types === "string") {
            try {
              emailTypes = JSON.parse(userProfile.email_notification_types);
            } catch {
              emailTypes = [];
            }
          } else {
            emailTypes = userProfile.email_notification_types || [];
          }
        }

        // 1. Session Logging Reminder (no session in 7 days)
        const sessionLoggingEnabled = 
          pushTypes.includes("Session logging reminders (7 days)") || 
          emailTypes.includes("Session logging reminders (7 days)") ||
          pushTypes.includes("Session reminders") || 
          emailTypes.includes("Session reminders"); // Backward compatibility
        
        if (sessionLoggingEnabled) {
          const { data: lastSession } = await supabase
            .from("sessions")
            .select("date")
            .eq("user_id", profile.user_id)
            .order("date", { ascending: false })
            .limit(1)
            .single();

          if (!lastSession || new Date(lastSession.date) < sevenDaysAgo) {
            await sendReminder(
              profile,
              pushTypes.includes("Session logging reminders (7 days)") || pushTypes.includes("Session reminders")
                ? "Session logging reminders (7 days)"
                : "Session reminders",
              emailTypes.includes("Session logging reminders (7 days)") || emailTypes.includes("Session reminders")
                ? "Session logging reminders (7 days)"
                : "Session reminders",
              "Session Logging Reminder",
              "You haven't logged a coaching session in 7 days. Don't forget to log your recent sessions!",
              "/dashboard/sessions/log",
              pushTypes,
              emailTypes,
              pushSubscriptions,
              results.sessionReminders
            );
          }
        }

        // 2. Post-Session Reflection Reminder (session logged but no notes)
        const reflectionEnabled = 
          pushTypes.includes("Post-session reflection reminders") || 
          emailTypes.includes("Post-session reflection reminders") ||
          pushTypes.includes("Session reminders") || 
          emailTypes.includes("Session reminders"); // Backward compatibility
        
        if (reflectionEnabled) {
          const { data: recentSessions } = await supabase
            .from("sessions")
            .select("id, date, notes, created_at")
            .eq("user_id", profile.user_id)
            .gte("created_at", twoHoursAgo.toISOString())
            .order("created_at", { ascending: false })
            .limit(5);

          if (recentSessions && recentSessions.length > 0) {
            for (const session of recentSessions) {
              if (!session.notes || session.notes.trim() === "") {
                await sendReminder(
                  profile,
                  pushTypes.includes("Post-session reflection reminders") || pushTypes.includes("Session reminders")
                    ? "Post-session reflection reminders"
                    : "Session reminders",
                  emailTypes.includes("Post-session reflection reminders") || emailTypes.includes("Session reminders")
                    ? "Post-session reflection reminders"
                    : "Session reminders",
                  "Add Session Notes",
                  "You logged a session but didn't add notes. Consider adding reflection notes while it's fresh in your mind!",
                  `/dashboard/sessions/edit/${session.id}`,
                  pushTypes,
                  emailTypes,
                  pushSubscriptions,
                  results.reflectionReminders
                );
                break; // Only send one reminder per check
              }
            }
          }
        }

        // 3. CPD Activity Reminder (no CPD entry in 14 days)
        const cpdActivityEnabled = 
          pushTypes.includes("CPD activity reminders (14 days)") || 
          emailTypes.includes("CPD activity reminders (14 days)") ||
          pushTypes.includes("CPD deadlines") || 
          emailTypes.includes("CPD deadlines"); // Backward compatibility
        
        if (cpdActivityEnabled) {
          const { data: lastCPD } = await supabase
            .from("cpd")
            .select("date, activity_date")
            .eq("user_id", profile.user_id)
            .order("date", { ascending: false })
            .limit(1)
            .single();

          const lastCPDDate = lastCPD?.activity_date || lastCPD?.date;
          if (!lastCPDDate || new Date(lastCPDDate) < fourteenDaysAgo) {
            await sendReminder(
              profile,
              pushTypes.includes("CPD activity reminders (14 days)") || pushTypes.includes("CPD deadlines")
                ? "CPD activity reminders (14 days)"
                : "CPD deadlines",
              emailTypes.includes("CPD activity reminders (14 days)") || emailTypes.includes("CPD deadlines")
                ? "CPD activity reminders (14 days)"
                : "CPD deadlines",
              "CPD Activity Reminder",
              "You haven't logged any CPD activities in 14 days. Keep your professional development on track!",
              "/dashboard/cpd/log",
              pushTypes,
              emailTypes,
              pushSubscriptions,
              results.cpdActivityReminders
            );
          }
        }

        // 4. CPD Deadline Reminder (based on renewal date)
        const cpdDeadlineEnabled = 
          pushTypes.includes("CPD deadline reminders (renewal date)") || 
          emailTypes.includes("CPD deadline reminders (renewal date)") ||
          pushTypes.includes("CPD deadlines") || 
          emailTypes.includes("CPD deadlines"); // Backward compatibility
        
        if (profile.cpd_renewal_date && cpdDeadlineEnabled) {
          const renewalDate = new Date(profile.cpd_renewal_date);
          const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Send reminders at 90, 75, 50, 25 days before deadline
          const reminderDays = [90, 75, 50, 25];
          const shouldRemind = reminderDays.some(
            (days) => daysUntilRenewal >= days - 1 && daysUntilRenewal <= days + 1
          );

          if (shouldRemind) {
            const percentage = Math.round((1 - daysUntilRenewal / 365) * 100);
            await sendReminder(
              profile,
              pushTypes.includes("CPD deadline reminders (renewal date)") || pushTypes.includes("CPD deadlines")
                ? "CPD deadline reminders (renewal date)"
                : "CPD deadlines",
              emailTypes.includes("CPD deadline reminders (renewal date)") || emailTypes.includes("CPD deadlines")
                ? "CPD deadline reminders (renewal date)"
                : "CPD deadlines",
              "CPD Deadline Reminder",
              `Your CPD renewal deadline is in ${daysUntilRenewal} days (${percentage}% of the way through your renewal period). Make sure you've logged all your required hours!`,
              "/dashboard/cpd",
              pushTypes,
              emailTypes,
              pushSubscriptions,
              results.cpdDeadlineReminders
            );
          }
        }
      } catch (error: any) {
        results.errors.push(`User ${profile.user_id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error("[Reminders] Error:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

async function sendReminder(
  profile: any,
  pushNotificationType: string,
  emailNotificationType: string,
  title: string,
  body: string,
  url: string,
  pushTypes: string[],
  emailTypes: string[],
  pushSubs: any[],
  results: { sent: number; failed: number }
) {
  // Send push notification
  if (pushTypes.includes(pushNotificationType) && pushSubs && pushSubs.length > 0) {
    const filtered = pushSubs.filter((sub) => {
      const types = typeof sub.notification_types === "string"
        ? JSON.parse(sub.notification_types)
        : sub.notification_types;
      return Array.isArray(types) && types.includes(pushNotificationType);
    });

    for (const sub of filtered) {
      try {
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({ title, body, url })
        );
        results.sent++;
      } catch (error) {
        results.failed++;
      }
    }
  }

  // Send email notification
  if (emailTypes.includes(emailNotificationType) && profile.email) {
    try {
      const result = await sendReminderEmail({
        to: profile.email,
        userName: profile.name || "Valued Coach",
        customSubject: title,
        customContent: `<p>${body}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://icflog.com"}${url}">View in ICF Log</a></p>`,
      });
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
    }
  }
}

