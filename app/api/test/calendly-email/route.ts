import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { sendReminderEmail } from "@/lib/emailUtils";

/**
 * Test endpoint to simulate a Calendly event and send an email notification
 * This allows testing Calendly email notifications without needing a real Calendly webhook
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's profile and email preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, email_notification_types")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: "No email address found for your account" },
        { status: 400 }
      );
    }

    // Check if user has enabled email notifications for Calendly events
    let emailTypes: string[] = [];
    if (profile.email_notification_types) {
      if (typeof profile.email_notification_types === "string") {
        try {
          emailTypes = JSON.parse(profile.email_notification_types);
        } catch {
          emailTypes = [];
        }
      } else {
        emailTypes = profile.email_notification_types;
      }
    }

    if (!emailTypes.includes("Calendly events")) {
      return NextResponse.json(
        {
          error: "Calendly event email notifications are not enabled. Please:\n1. Check 'Calendly events' in the Email Reminders section\n2. Click 'Save Email Preferences'\n3. Then try the test again.",
          enabledTypes: emailTypes,
        },
        { status: 400 }
      );
    }

    // Get test data from request body or use defaults
    const body = await req.json().catch(() => ({}));
    const testData = {
      clientName: body.clientName || "Test Client",
      eventDate: body.eventDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: body.duration || 60, // 60 minutes
    };

    // Send test email
    const result = await sendReminderEmail({
      to: profile.email,
      userName: profile.name || "Valued Coach",
      customSubject: "Test: New Calendly Booking - ICF Log",
      customContent: `
        <p>Hi ${profile.name || "there"},</p>
        <p><strong>This is a test email</strong> to verify your Calendly event email notifications are working.</p>
        <p>You have a new appointment scheduled via Calendly:</p>
        <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Client:</strong> ${testData.clientName}</p>
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(testData.eventDate).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${testData.duration} minutes</p>
        </div>
        <p>In a real Calendly booking, this session would be automatically added to your ICF Log.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://icflog.com"}/dashboard/calendar" style="color: #3b82f6; text-decoration: underline;">View your calendar</a></p>
        <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          This is a test email. If you received this, your Calendly event email notifications are working correctly!
        </p>
      `,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test Calendly event email sent successfully!",
      sentTo: profile.email,
    });
  } catch (err: any) {
    console.error("[Test Calendly Email] Error:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

