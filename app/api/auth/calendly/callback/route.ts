import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get the authorization code from Calendly
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/calendar?error=calendly_auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/calendar?error=no_code', request.url));
    }

    // Get OAuth credentials from environment
    const clientId = process.env.CALENDLY_CLIENT_ID;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
    const redirectUri = process.env.CALENDLY_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/calendly/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/dashboard/calendar?error=oauth_not_configured', request.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.redirect(new URL('/dashboard/calendar?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    // Store tokens in user's profile (you may want to encrypt these)
    const supabase = createServerSupabaseClient(request);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        calendly_access_token: access_token,
        calendly_refresh_token: refresh_token,
      })
      .eq('user_id', user.id);

    if (updateError) {
      // Continue anyway - tokens were received
    }

    return NextResponse.redirect(new URL('/dashboard/calendar?calendly_connected=true', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/dashboard/calendar?error=callback_error', request.url));
  }
}

