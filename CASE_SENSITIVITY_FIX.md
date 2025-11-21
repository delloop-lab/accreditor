# Windows Case Sensitivity Fix

## Problem
On Windows, Next.js was experiencing case sensitivity issues where:
- React Server Components bundler created module identifiers with uppercase paths (`C:\projects\accreditor`)
- Webpack created modules with lowercase paths (`c:\projects\accreditor`)
- This caused "Could not find the module" errors and "invariant expected layout router to be mounted" errors

## Solution
Created `fix-case-sensitivity.js` that normalizes all Windows paths to lowercase **before** Next.js starts.

## How It Works
1. The script patches Node.js path methods (`path.resolve`, `path.join`, `process.cwd`, etc.)
2. All paths are normalized to lowercase at the Node.js level
3. This ensures React Server Components bundler and webpack both use consistent casing
4. Loaded automatically via `NODE_OPTIONS="--require ./fix-case-sensitivity.js"` in package.json scripts

## Files Modified
- `fix-case-sensitivity.js` - Path normalization script (NEW)
- `package.json` - Updated dev/build scripts to load the fix
- `next.config.ts` - Webpack configuration improvements
- `lib/stripe.ts` - Updated Stripe API version

## Version
Updated to v0.9901

## Important Notes
- This fix is **required** for Windows development
- The fix is automatically loaded when running `npm run dev` or `npm run build`
- Do not remove `fix-case-sensitivity.js` or the NODE_OPTIONS from package.json scripts
- This fix only affects Windows (case-insensitive filesystem) and is safe to use

