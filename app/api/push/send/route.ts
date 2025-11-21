import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import webpush from "web-push";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[Push API] Auth error:", userError);
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

    // Check VAPID keys
    if (
      !process.env.VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY ||
      !process.env.VAPID_EMAIL
    ) {
      console.error("[Push API] Missing VAPID keys:", {
        hasPublic: !!process.env.VAPID_PUBLIC_KEY,
        hasPrivate: !!process.env.VAPID_PRIVATE_KEY,
        hasEmail: !!process.env.VAPID_EMAIL,
      });
      return NextResponse.json(
        { 
          error: "VAPID keys not configured. Please add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL to .env.local" 
        },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const {
      userId: requestedUserId,
      notificationType,
      title,
      body,
      url,
    } = await req.json();

    if (!notificationType) {
      return NextResponse.json(
        { error: "notificationType is required" },
        { status: 400 }
      );
    }

    if (requestedUserId && requestedUserId !== user.id) {
      console.warn("[Push API] User mismatch:", {
        requestedUserId,
        actualUserId: user.id,
      });
      return NextResponse.json(
        { error: "User mismatch. Please refresh and try again." },
        { status: 403 }
      );
    }

    const targetUserId = user.id;

    // Check if table exists and fetch subscriptions
    console.log("[Push API] Looking for userId:", targetUserId);
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription, notification_types, user_id")
      .eq("user_id", targetUserId);

    console.log("[Push API] Query result:", { 
      subscriptions: subscriptions?.length || 0, 
      error: error?.message,
      data: subscriptions 
    });

    if (error) {
      console.error("[Push API] Database error:", error);
      if (error.code === "42P01") {
        return NextResponse.json(
          { 
            error: "push_subscriptions table does not exist. Please run the SQL from PUSH_NOTIFICATIONS_SETUP.md in Supabase" 
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Try to see if there are ANY subscriptions in the table
      const { data: allSubs } = await supabase
        .from("push_subscriptions")
        .select("user_id, notification_types")
        .limit(5);
      console.log("[Push API] All subscriptions in table:", allSubs);
      
      return NextResponse.json(
        { 
          error: "No push subscriptions found for this user. Please enable notifications first.",
          subscriptions: [],
          debug: {
            requestedUserId: targetUserId,
            allSubscriptionsInTable: allSubs
          }
        },
        { status: 404 }
      );
    }

    // Handle notification_types - it might be a string (JSON) or already an array
    const filtered = subscriptions.filter((sub) => {
      if (!sub.notification_types) return false;
      
      // Parse if it's a string, otherwise use as-is
      const types = typeof sub.notification_types === 'string' 
        ? JSON.parse(sub.notification_types)
        : sub.notification_types;
      
      return Array.isArray(types) && types.includes(notificationType);
    });

    if (filtered.length === 0) {
      return NextResponse.json(
        { 
          error: `No subscriptions found for notification type "${notificationType}". User has not enabled this type.`,
          availableTypes: subscriptions.map(s => s.notification_types).flat()
        },
        { status: 404 }
      );
    }

    const results = await Promise.allSettled(
      filtered.map((sub) =>
        webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({ title, body, url })
        )
      )
    );

    const failed = results.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      console.error("[Push API] Some notifications failed:", failed);
    }

    return NextResponse.json({ 
      success: true,
      sent: filtered.length - failed.length,
      failed: failed.length
    });
  } catch (err: any) {
    console.error("[Push API] Error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

