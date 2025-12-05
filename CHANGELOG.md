# Changelog

All notable changes to the ICF Log application will be documented in this file.

## [V0.9920] - November 2024

### Changed
- Reduced main logo size by 50% across all pages
- Added 10px padding below all logos for better spacing

## [V0.9910] - November 2024

### Fixed
- Fixed `useSearchParams()` Suspense boundary error in add client page (Vercel build fix)
- Fixed garbled Unicode characters in dashboard and session log pages
- Fixed session date not populating in session edit form
- Fixed session type not being carried into session edit form
- Fixed session type not showing for Calendly sessions in Session Log
- Fixed duplicate "CPD deadlines" entry in notification settings checklist
- Fixed email reminder count showing incorrect numbers
- Fixed canceled Calendly bookings still appearing in calendar
- Fixed duplicate bookings appearing in calendar view
- Fixed `+` symbols appearing between first and last names in Calendly widget
- Fixed menu navigation issues and app responsiveness
- Fixed landing page 500 Internal Server Error
- Fixed "invariant expected layout router to be mounted" error
- Fixed 404 errors for static chunks and favicon.ico module errors

### Added
- **Automated Reminder System**: Four types of automated reminders with individual toggles
  - Session Logging Reminders
  - Post-Session Reflection Reminders
  - CPD Activity Reminders
  - CPD Deadline Reminders
- **Calendly Integration Enhancements**:
  - Session type detection from Calendly event types (individual, team, mentor)
  - Event duration extraction from Calendly event types
  - Event type name storage in database
  - Improved cancellation handling with `[CANCELED via Calendly]` markers
  - Deduplication logic to prevent duplicate bookings
  - Pre-fill add client form when clicking on non-client booking names
- **Dashboard Improvements**:
  - Client statistics: New clients in last 30 days / Total clients (x/y format)
  - Responsive grid layout: 3 cards per line on large screens, 4 on 1920px+ screens
- **Session Management**:
  - Session Type display in Session Log (clickable to edit)
  - Duration display with "Duration:" label
  - Clickable client names to navigate to client details
  - Session date display in expanded session details
- **Notification Settings UI**:
  - Individual toggle controls for each reminder type
  - Mobile icon in front of "Push Notifications" title
  - Improved spacing and layout
  - Removed unnecessary permission status indicators
  - Consistent button styling

### Changed
- Updated version from BETA V0.9901 to V0.9910 (removed "BETA" prefix)
- Improved notification settings section width to match profile information section
- Enhanced Calendly webhook handling to extract and store event type information
- Improved client name sanitization to remove `+` symbols from Calendly bookings
- Updated URL encoding in Calendly widget to prevent `+` symbols in names

### Removed
- Test buttons from notification settings
- "Clear All Subscriptions" button
- "Email reminders enabled for X type(s)" status message
- Extra spacing between notification types
- Verbose permission status boxes

---

## [V0.9800] - November 2024

### Added
- Email reminders and automated notification system
- PWA support with next-pwa
- PWA screenshots for desktop and mobile install UI
- Cache-busting for PWA icons

### Fixed
- Landing page duplicate welcome message
- Password visibility toggle
- Service worker registration in App Router
- Excluded app-build-manifest.json from PWA precaching

---

## [V0.9750] - November 2024

### Fixed
- Landing page duplicate welcome message
- Added password visibility toggle

---

## [V0.9730] - November 2024

### Changed
- Version bump

---

## [V0.9720] - November 2024

### Changed
- Version bump

---

## [V0.9710] - November 2024

### Added
- Console error logging for calendar fetch

---

## [V0.9700] - November 2024

### Fixed
- Null profile handling for Calendly
- Guard Resend client initialization when API key is missing
- Build errors after removing console statements

### Changed
- Allow Calendly API without stored URL
- Removed console logging and documented production Calendly setup

---

## Major Features (Last 3 Months)

### Calendly Integration
- Full integration with Calendly API for booking management
- Webhook support for real-time booking updates
- Automatic session creation from Calendly bookings
- Calendar view showing upcoming bookings
- Session type and duration detection from Calendly event types

### Automated Notifications
- Push notification support
- Email notification system
- Four types of automated reminders:
  - Session Logging Reminders
  - Post-Session Reflection Reminders
  - CPD Activity Reminders
  - CPD Deadline Reminders
- Individual user preferences for each notification type

### Progressive Web App (PWA)
- Full PWA support with offline capabilities
- Install prompts for desktop and mobile
- Service worker for caching and offline functionality

### Client Management
- Enhanced client creation with document uploads
- Pre-filled forms from Calendly bookings
- Client statistics dashboard
- Improved client detail views

### Session Management
- Enhanced session logging with type and duration tracking
- Session edit forms with proper date and type population
- Session Log with improved filtering and display
- Integration with Calendly for automatic session creation

### UI/UX Improvements
- Responsive grid layouts
- Improved spacing and typography
- Better error handling and user feedback
- Consistent button styling
- Mobile-friendly interfaces

---

## Technical Improvements

- Migrated to Next.js 15 App Router
- Improved error handling and type safety
- Enhanced database schema with new columns for Calendly integration
- Better code organization and component structure
- Improved build process and deployment configuration


