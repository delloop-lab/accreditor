"use client";

import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "@/lib/supabaseClient";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

const notificationOptions = [
  "Calendly events",
  "Session logging reminders (7 days)",
  "Post-session reflection reminders",
  "CPD activity reminders (14 days)",
  "CPD deadline reminders (renewal date)"
];

export default function NotificationSettings() {
  const [selected, setSelected] = useState<string[]>([]);
  const [emailSelected, setEmailSelected] = useState<string[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasSavedSubscription, setHasSavedSubscription] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    // Check if notifications are already enabled
    checkIfEnabled();
    checkEmailPreferences();
  }, []);

  const checkEmailPreferences = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_notification_types")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.email_notification_types) {
        let emailTypes = profile.email_notification_types;
        if (typeof emailTypes === "string") {
          try {
            emailTypes = JSON.parse(emailTypes);
          } catch {
            emailTypes = [];
          }
        }
        
        if (Array.isArray(emailTypes)) {
          // Filter out old notification types that no longer exist in notificationOptions
          const validTypes = emailTypes.filter(type => notificationOptions.includes(type));
          setEmailSelected(validTypes);
          setEmailEnabled(validTypes.length > 0);
          
          // If we filtered out some types, update the database to clean it up
          if (validTypes.length !== emailTypes.length) {
            await supabase
              .from("profiles")
              .update({ email_notification_types: validTypes })
              .eq("user_id", user.id);
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
  };

  const checkIfEnabled = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id, notification_types")
        .eq("user_id", user.id);
      
      if (data && data.length > 0) {
        let savedTypes = data[0].notification_types;
        if (typeof savedTypes === "string") {
          try {
            savedTypes = JSON.parse(savedTypes);
          } catch {
            savedTypes = [];
          }
        }

        if (Array.isArray(savedTypes)) {
          setSelected(savedTypes);
          setHasSavedSubscription(savedTypes.length > 0);
          setIsEnabled(savedTypes.length > 0);
        } else {
          setHasSavedSubscription(false);
          setIsEnabled(false);
        }
      } else {
        setHasSavedSubscription(false);
        setIsEnabled(false);
      }
    } catch (e) {
      // Ignore errors
      setHasSavedSubscription(false);
      setIsEnabled(false);
    }
  };

  useEffect(() => {
    if (selected.length === 0) {
      setIsEnabled(false);
    }
  }, [selected]);

  const toggleNotification = (type: string) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleEmailNotification = (type: string) => {
    setEmailSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const saveEmailPreferences = async () => {
    try {
      setError(null);
      setSuccess(null);

      const { user } = await getCurrentUser();
      if (!user) throw new Error("User not logged in");

      // Filter to only include valid notification types
      const validEmailTypes = emailSelected.filter(type => notificationOptions.includes(type));

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          email_notification_types: validEmailTypes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(`Failed to save email preferences: ${updateError.message}`);
      }

      // Update state with filtered types
      setEmailSelected(validEmailTypes);
      setEmailEnabled(validEmailTypes.length > 0);
      setSuccess(`✅ Email reminder preferences saved! You'll receive emails for: ${validEmailTypes.join(", ")}`);
    } catch (err: any) {
      console.error("[NotificationSettings] Email preferences error:", err);
      setError(err.message || "Failed to save email preferences");
    }
  };

  const sendTestEmail = async () => {
    try {
      setError(null);
      setSuccess(null);

      const { user } = await getCurrentUser();
      if (!user) throw new Error("User not logged in");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Please log out and back in, then retry.");
      }

      const response = await fetch("/api/notifications/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          notificationType: emailSelected[0] || "Session reminders",
          title: "ICF Log - Test Email",
          body: "This is a test email reminder from ICF Log. If you received this, your email notifications are working!",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setSuccess("✅ Test email sent! Check your inbox (and spam folder).");
    } catch (err: any) {
      console.error("[NotificationSettings] Test email error:", err);
      setError(err.message || "Failed to send test email");
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    if (typeof window === "undefined") {
      throw new Error("Cannot convert VAPID key: window is not available");
    }
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  };

  // Clear all subscriptions - more aggressive approach
  const clearAllSubscriptions = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        throw new Error("Service worker not supported");
      }

      let cleared = 0;
      let dbCleared = false;

      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        try {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            try {
              const unsubscribed = await subscription.unsubscribe();
              if (unsubscribed) {
                cleared++;
              }
            } catch (unsubError: any) {
              // If unsubscribe fails, try to unregister the service worker
              console.log("[NotificationSettings] Unsubscribe failed, trying to unregister SW");
              try {
                await registration.unregister();
                cleared++;
              } catch (e) {
                // Continue
              }
            }
          }
        } catch (e) {
          // Continue with other registrations
        }
      }

      // Also delete from database
      try {
        const { user } = await getCurrentUser();
        if (user) {
          const { error: dbError } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id);
          
          if (!dbError) {
            dbCleared = true;
          }
        }
      } catch (dbErr) {
        console.error("[NotificationSettings] Database clear error:", dbErr);
      }

      if (cleared > 0 || dbCleared) {
        setSuccess(
          `✅ Cleared ${cleared} subscription(s)${dbCleared ? " and database entries" : ""}. ` +
          `You can now enable notifications again.`
        );
      } else {
        setSuccess("✅ No active subscriptions found. You can enable notifications now.");
      }
    } catch (err: any) {
      console.error("[NotificationSettings] Clear error:", err);
      setError(err.message || "Failed to clear subscriptions");
    }
  };

  const enableNotifications = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (selected.length === 0) {
        throw new Error("Please select at least one notification type before enabling notifications.");
      }

      if (typeof window === "undefined" || !("Notification" in window))
        throw new Error("Browser does not support notifications");

      if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
        throw new Error("Service worker not supported");

      // Check VAPID key is configured
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("VAPID public key not configured. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local");
      }

      // Check current permission status
      const currentPerm = Notification.permission;
      setPermission(currentPerm);

      let perm = currentPerm;
      
      // Only request permission if not already granted or denied
      if (currentPerm === "default") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      } else if (currentPerm === "denied") {
        throw new Error("Notifications are blocked. Please enable them in your browser settings.");
      }

      if (perm !== "granted")
        throw new Error("Notifications permission denied");

      const registration = await navigator.serviceWorker.ready;
      
      // STEP 1: Try to unsubscribe existing subscriptions
      // This handles the case where VAPID key changed
      try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          try {
            const unsubscribed = await existingSubscription.unsubscribe();
            if (unsubscribed) {
              console.log("[NotificationSettings] Unsubscribed from old subscription");
            }
          } catch (unsubError: any) {
            // If unsubscribe fails (different key), we need to unregister the service worker
            console.log("[NotificationSettings] Cannot unsubscribe (different key), unregistering SW...");
            await registration.unregister();
            // Reload to get fresh service worker
            window.location.reload();
            return;
          }
        }
      } catch (getSubError: any) {
        // If getSubscription fails, try to get all registrations
        console.log("[NotificationSettings] getSubscription failed, trying all registrations...");
        try {
          const allRegistrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of allRegistrations) {
            try {
              const sub = await reg.pushManager.getSubscription();
              if (sub) {
                await sub.unsubscribe();
              }
            } catch (e) {
              // Try unregistering if unsubscribe fails
              try {
                await reg.unregister();
              } catch (e2) {
                // Continue
              }
            }
          }
        } catch (e) {
          console.log("[NotificationSettings] Could not clear existing subscriptions");
        }
      }

      // STEP 2: Create new subscription
      let subscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      } catch (subscribeError: any) {
        // If subscription fails due to different key, clear and reload
        if (
          subscribeError.message?.includes("different applicationServerKey") || 
          subscribeError.message?.includes("gcm_sender_id") ||
          subscribeError.message?.includes("already exists")
        ) {
          setError(
            "⚠️ A subscription with a different key exists. " +
            "Please clear your browser's service worker cache and try again."
          );
          return;
        }
        throw subscribeError;
      }

      // STEP 3: Save to database
      const { user, error: userError } = await getCurrentUser();
      if (!user) throw new Error("User not logged in");

      // Delete existing subscriptions for this user (to avoid duplicates)
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      // Insert new subscription
      const { data: insertData, error: dbError } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          notification_types: selected,
          updated_at: new Date().toISOString(),
        })
        .select("id, notification_types");

      if (dbError) {
        if ((dbError as any).code === "42P01") {
          throw new Error("Database table 'push_subscriptions' does not exist. Please run the SQL from PUSH_NOTIFICATIONS_SETUP.md in Supabase.");
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Verify it was saved
      const { data: verifyData, error: verifyError } = await supabase
        .from("push_subscriptions")
        .select("id, notification_types")
        .eq("user_id", user.id);

      if (verifyError) {
        console.error("[NotificationSettings] Verification error:", verifyError);
        throw new Error(`Failed to verify subscription was saved: ${verifyError.message}`);
      }

      if (
        !verifyData ||
        verifyData.length === 0 ||
        !verifyData[0].notification_types ||
        (Array.isArray(verifyData[0].notification_types) &&
          verifyData[0].notification_types.length === 0)
      ) {
        throw new Error("Subscription was not saved to database. Please try again.");
      }

      setIsEnabled(selected.length > 0);
      setHasSavedSubscription(selected.length > 0);
      setSuccess(`✅ Notifications enabled successfully! (Saved ${verifyData.length} subscription)`);
    } catch (err: any) {
      console.error("[NotificationSettings] Enable error:", err);
      setError(err.message || "Failed to enable notifications");
    }
  };

  // Test browser notification directly (without push API)
  const testBrowserNotification = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (Notification.permission !== "granted") {
        throw new Error("Notification permission not granted. Please enable notifications first.");
      }

      // Show notification directly from browser
      const notification = new Notification("ICF Log - Direct Test", {
        body: "This is a direct browser notification test. If you see this, your browser notifications are working!",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "direct-test",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setSuccess(
        "✅ Direct browser notification sent!\n\n" +
        "You should see a notification popup now.\n\n" +
        "If you see it: Browser notifications work! The issue is with push notifications.\n" +
        "If you don't see it: Check Windows notification settings for your browser."
      );
    } catch (err: any) {
      console.error("[NotificationSettings] Direct test error:", err);
      setError(err.message || "Failed to show direct notification");
    }
  };

  const sendTestNotification = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (selected.length === 0) {
        throw new Error("Please select at least one notification type first");
      }

      const { user } = await getCurrentUser();
      if (!user) throw new Error("User not logged in");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Unable to verify authentication. Please log in again.");
      }

      if (!session?.access_token) {
        throw new Error("Missing session token. Please log out and back in, then retry.");
      }

      // Check if notifications are enabled (subscription exists in database)
      const { data: existingSubs } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id);

      if (!existingSubs || existingSubs.length === 0) {
        throw new Error(
          "⚠️ Notifications not enabled yet!\n\n" +
          "Please click 'Enable Notifications' first, then try sending a test."
        );
      }

      // Check service worker status
      let swStatus = "Unknown";
      let subscriptionStatus = "Unknown";
      try {
        const registration = await navigator.serviceWorker.ready;
        swStatus = "Active";
        const subscription = await registration.pushManager.getSubscription();
        subscriptionStatus = subscription ? "Active" : "Not found";
      } catch (e) {
        swStatus = "Error: " + (e as Error).message;
      }

      // Use the first selected notification type for testing
      const testNotificationType = selected[0];

      console.log("[NotificationSettings] Sending push notification test...", {
        userId: user.id,
        notificationType: testNotificationType,
        swStatus,
        subscriptionStatus,
      });

      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          notificationType: testNotificationType,
          title: "ICF Log Test",
          body: "This is a test notification from the push API",
          url: "/",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      console.log("[NotificationSettings] Push API response:", data);
      
      let debugInfo = `\n\n🔍 Debug Info:\n` +
        `   • Service Worker: ${swStatus}\n` +
        `   • Push Subscription: ${subscriptionStatus}\n` +
        `   • Notification Permission: ${Notification.permission}\n` +
        `   • API Response: ${JSON.stringify(data)}\n` +
        `   • Check browser console (F12) for service worker logs\n`;
      
      setSuccess(
        "✅ Push notification sent to server!\n\n" +
        "📱 Where to check:\n" +
        "   • Windows: Action Center (bottom-right) - Click notification icon\n" +
        "   • Minimize browser or switch apps (notifications may not show if tab is focused)\n\n" +
        "🔧 Troubleshooting:\n" +
        "   • Open browser DevTools (F12) → Console tab\n" +
        "   • Look for '[Service Worker] Push notification received' message\n" +
        "   • If you see that message, the service worker received the push\n" +
        "   • If no message, the push didn't reach the service worker\n" +
        "   • Try the 'Test Browser Notification' button below to verify permissions\n" +
        debugInfo
      );
    } catch (err: any) {
      console.error("[NotificationSettings] Test error:", err);
      setError(err.message || "Failed to send test notification");
    }
  };

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg border">
        <h3 className="font-bold text-lg mb-3">Notification Settings</h3>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-600 text-sm whitespace-pre-line leading-relaxed">{success}</p>
        </div>
      )}

      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
        Push Notifications
      </h3>

      {/* Simplified status indicator */}
      {permission === "denied" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {!isEnabled && permission !== "denied" && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Select notification types below and click "Enable Notifications" to activate.
          </p>
        </div>
      )}

      <p className="text-sm font-medium text-gray-700 mb-3">Select notification types:</p>
      <div className="mb-4">
        {notificationOptions.map((type) => (
          <label key={type} className="flex items-start py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 mr-3 w-4 h-4 flex-shrink-0"
              checked={selected.includes(type)}
              onChange={() => toggleNotification(type)}
            />
            <span className="text-sm text-gray-700 leading-relaxed">{type}</span>
          </label>
        ))}
      </div>

      <button
        onClick={enableNotifications}
        disabled={permission === "denied"}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {permission === "granted" ? "Update Notifications" : "Enable Notifications"}
      </button>


      {/* Email Reminders Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-bold text-lg mb-4">📧 Email Reminders</h3>
        
        <p className="text-sm font-medium text-gray-700 mb-3">Select notification types:</p>
        
        <div className="mb-4">
          {notificationOptions.map((type) => (
            <label key={`email-${type}`} className="flex items-start py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 mr-3 w-4 h-4 flex-shrink-0"
                checked={emailSelected.includes(type)}
                onChange={() => toggleEmailNotification(type)}
              />
              <span className="text-sm text-gray-700 leading-relaxed">{type}</span>
            </label>
          ))}
        </div>

        <button
          onClick={saveEmailPreferences}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 font-medium"
        >
          Save Email Preferences
        </button>


        <p className="text-xs text-gray-500 mt-2">
          Email reminders will be sent to your registered email address
        </p>
      </div>

    </div>
  );
}

