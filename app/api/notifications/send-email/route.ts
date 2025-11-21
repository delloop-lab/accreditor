import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { sendReminderEmail } from "@/lib/emailUtils";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[Email API] Auth error:", userError);
      return NextResponse.json(
        { error: "Authentication failed. Please refresh and try again." },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { notificationType, title, body } = await req.json();

    if (!notificationType) {
      return NextResponse.json(
        { error: "notificationType is required" },
        { status: 400 }
      );
    }

    // Get user's profile to check email preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, email_notification_types")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: "No email address found for your account" },
        { status: 400 }
      );
    }

    // Check if user has enabled email notifications for this type
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

    // For test emails, allow sending even if preferences aren't set
    // For real notifications, check preferences
    const isTestEmail = title?.includes("Test") || body?.includes("test");
    
    if (!isTestEmail && !emailTypes.includes(notificationType)) {
      return NextResponse.json(
        { 
          error: `Email notifications not enabled for "${notificationType}". Please enable it in your notification settings.`,
          enabledTypes: emailTypes
        },
        { status: 400 }
      );
    }

    // Get user activity data for personalized email
    const { data: lastSession } = await supabase
      .from("sessions")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data: cpdData } = await supabase
      .from("cpd")
      .select("hours, icf_cce_hours")
      .eq("user_id", user.id);

    const cpdHours = cpdData?.reduce((sum, entry) => {
      const isIcfCceHours = entry.icf_cce_hours !== false;
      return sum + (isIcfCceHours ? (entry.hours || 0) : 0);
    }, 0) || 0;

    // Send email
    const result = await sendReminderEmail({
      to: profile.email,
      userName: profile.name || "Valued Coach",
      lastActivityDate: lastSession?.date,
      sessionCount: sessions?.length || 0,
      cpdHours: Math.round(cpdHours * 10) / 10,
      customSubject: title || "ICF Log Reminder",
      customContent: body || "This is a reminder from ICF Log.",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err: any) {
    console.error("[Email API] Error:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

