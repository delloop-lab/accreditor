# How to Clear Service Worker Cache and See Email Reminders

The service worker is caching the old version of the page. Follow these steps:

## Option 1: Clear via Browser DevTools (Recommended)

1. Open your browser DevTools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, find **Service Workers**
4. Click on your service worker (should show `http://localhost:3000`)
5. Click **Unregister** button
6. Go to **Cache Storage** in the left sidebar
7. Right-click on each cache entry and select **Delete**
8. Close DevTools
9. **Hard refresh** the page (Ctrl+Shift+R or Ctrl+F5)

## Option 2: Clear All Site Data

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Check all boxes
5. Click **Clear site data**
6. Refresh the page

## Option 3: Disable Service Worker Temporarily

1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Check **Bypass for network** checkbox
4. This will bypass the service worker and load fresh content
5. Refresh the page

After clearing the cache, you should see the **📧 Email Reminders** section with a light blue/indigo background below the push notifications section.

