import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { supabase } from '../lib/supabase';

/**
 * Initializes mobile native integrations (Capacitor runtime):
 * 1. Configures Android status bar color and style.
 * 2. Listens for deep links (e.g. Supabase magic link / OAuth callbacks).
 */
export function initializeMobileApp() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // 1. Android Status Bar styling (Solid White bar with dark icons, never overlaying web content)
  try {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
  } catch (err) {
    console.warn('StatusBar initialization error:', err);
  }

  // 2. Custom URL scheme & Deep Link handling
  // Handles: amrityoga://auth/callback#access_token=...&refresh_token=...
  CapApp.addListener('appUrlOpen', async (data) => {
    try {
      const incomingUrl = data.url;
      if (!incomingUrl) return;

      // Handle custom scheme or callback URLs
      if (incomingUrl.startsWith('amrityoga://') || incomingUrl.includes('/auth/callback')) {
        // Parse hash fragment for tokens
        const hashIndex = incomingUrl.indexOf('#');
        if (hashIndex !== -1) {
          const hashString = incomingUrl.substring(hashIndex + 1);
          const params = new URLSearchParams(hashString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken && supabase) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            window.location.hash = 'dashboard';
            return;
          }
        }

        // Parse query params for code
        const queryIndex = incomingUrl.indexOf('?');
        if (queryIndex !== -1) {
          const queryString = incomingUrl.substring(queryIndex + 1);
          const params = new URLSearchParams(queryString);
          const code = params.get('code');
          if (code && supabase) {
            await supabase.auth.exchangeCodeForSession(code);
            window.location.hash = 'dashboard';
          }
        }
      }
    } catch (err) {
      console.warn('Deep link handling error:', err);
    }
  });
}
