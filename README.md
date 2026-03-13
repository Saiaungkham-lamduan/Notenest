# NoteNest 🗓️

> A production-ready React Native (Expo) app that merges notes, tasks, and reminders into a single chronological timeline stream.

---

## 1. Project Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17

### Installation

```bash
# 1. Clone the project and install dependencies
cd notenest
npm install

# 2. Install Expo prebuild (if using native features in development)
npx expo prebuild

# 3. Start the development server
npx expo start

# Run on a specific platform
npx expo start --ios
npx expo start --android
```

### EAS Build (Production)

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

---

## 2. Folder Structure

```
notenest/
├── app/                         # Expo Router screens
│   ├── _layout.tsx              # Root layout — DB init, notification setup, bootstrap
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator configuration
│   │   ├── index.tsx            # Timeline screen (root tab)
│   │   ├── search.tsx           # Search screen
│   │   └── settings.tsx         # Settings screen
│   └── note/
│       ├── add.tsx              # Add / Edit note modal (reused via ?id= param)
│       └── [id].tsx             # Note detail screen
│
├── src/
│   ├── models/
│   │   └── note.ts              # Note interface, GroupedNotes, TimelineSection types
│   │
│   ├── core/
│   │   ├── theme.ts             # Design tokens: Colors, Typography, Spacing, Shadows
│   │   ├── constants.ts         # Route names, DB config, copy strings, notification config
│   │   └── utils.ts             # Date helpers, timeline grouping, filtering, ID generation
│   │
│   ├── services/
│   │   ├── database.ts          # SQLite CRUD — all DB logic lives here exclusively
│   │   └── notifications.ts     # expo-notifications — scheduling, canceling, listeners
│   │
│   └── features/
│       ├── notes/
│       │   └── store/
│       │       └── notesStore.ts  # Zustand global store
│       └── timeline/
│           ├── hooks/
│           │   └── useTimeline.ts   # Derived grouped/sorted timeline data
│           └── components/
│               ├── NoteCard.tsx     # Swipeable note card with gestures
│               ├── SectionHeader.tsx
│               ├── SkeletonList.tsx # Shimmer loading state
│               ├── EmptyState.tsx
│               └── FAB.tsx          # Floating Action Button
│
├── package.json
├── app.json                     # Expo configuration with plugin declarations
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

---

## 3. Theme System (`src/core/theme.ts`)

The entire visual language is defined as typed constants:

| Token | Purpose |
|-------|---------|
| `Colors` | Semantic color palette (primary, backgrounds, text, danger, etc.) |
| `Typography` | Font sizes (xs→3xl), weights, line heights |
| `Spacing` | 8pt grid (xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64) |
| `Radius` | Border radius scale (sm=6 → full=9999) |
| `Shadows` | Elevation presets (sm/md/lg) for both iOS and Android |
| `Animation` | Duration constants (fast=150ms, normal=200ms, slow=300ms) |

Dark mode tokens are prepared under `Colors.dark` — wire them to a context/theme provider to complete implementation.

---

## 4. Database Service (`src/services/database.ts`)

Built on `expo-sqlite` v14 with the async API.

**Design decisions:**
- `WAL` (Write-Ahead Logging) mode for improved concurrent read performance
- Single indexed table on `timestamp ASC` — the primary query pattern
- All data deserialized into typed `Note` objects — SQLite returns integers for booleans, this is handled in `deserializeNote()`
- `initDatabase()` is idempotent — safe to call on every app boot
- Database instance is lazily initialized and cached (`_db` singleton)

**API:**
```ts
initDatabase()              // Creates table + index if not exists
fetchAllNotes()             // Returns Note[] sorted by timestamp
insertNote(input)           // Creates and returns new Note with generated ID
updateNoteById(id, updates) // Merges updates, returns updated Note
deleteNoteById(id)          // Removes by ID
fetchNoteById(id)           // Single note lookup (for deep links)
```

---

## 5. Zustand Store (`src/features/notes/store/notesStore.ts`)

Global application state with no React Context boilerplate.

**State shape:**
```ts
notes: Note[]               // Always sorted ascending by timestamp
isLoading: boolean
isSyncing: boolean          // Reserved for future cloud sync
highlightedNoteId: string | null
```

**Action side effects:**
- `addNote` → inserts to DB, inserts into sorted in-memory array, schedules notification
- `updateNote` → updates DB, re-sorts array, reschedules notification if timestamp changed
- `deleteNote` → removes from DB, removes from array, cancels notification
- `toggleComplete` → updates DB + state, cancels/reschedules notification accordingly
- `highlightNote(id, duration)` → sets `highlightedNoteId`, auto-clears after `duration` ms

---

## 6. Timeline Screen (`app/(tabs)/index.tsx`)

- Uses `SectionList` for grouped rendering — automatically handles sticky headers and perf optimizations
- `useTimeline` hook memoizes `groupNotesBySection` — groups only recalculate when `notes` changes
- `AppState` listener re-fetches notes when app returns to foreground
- Shows `SkeletonList` during initial load (no blank screen flicker)
- `FAB` navigates to `/note/add`

**Section order:** Past → Today → Tomorrow → Upcoming

---

## 7. Add/Edit Note Modal (`app/note/add.tsx`)

A single reusable screen for both creating and editing:
- When navigated to as `/note/add` → create mode
- When navigated to as `/note/add?id=<noteId>` → edit mode, form is pre-filled

**Validation:** Save button disabled until `title.trim()` is non-empty.

Date/Time pickers use `@react-native-community/datetimepicker`, with platform-appropriate display modes (inline for iOS date, spinner for iOS time, default for Android).

---

## 8. Notification Service (`src/services/notifications.ts`)

| Function | Description |
|----------|-------------|
| `requestNotificationPermissions()` | Prompts once, returns granted boolean |
| `setupNotificationChannel()` | Android 8+ channel setup (HIGH importance) |
| `scheduleNoteNotification(note)` | Schedules at `note.timestamp`, returns identifier |
| `cancelNoteNotification(noteId)` | Finds and cancels by matching data.noteId |
| `cancelAllNotifications()` | Full reset |
| `addNotificationResponseListener` | Tap → navigate to note |
| `addNotificationReceivedListener` | Foreground receipt → highlight note |

Notifications are skipped for past timestamps.

---

## 9. Navigation Setup

Expo Router with file-based routing. Route constants in `src/core/constants.ts`:

```ts
ROUTES.TIMELINE    → '/'
ROUTES.SEARCH      → '/search'
ROUTES.SETTINGS    → '/settings'
ROUTES.NOTE_ADD    → '/note/add'
ROUTES.NOTE_DETAIL → '/note/:id'
```

The `app/_layout.tsx` root layout:
1. Initializes SQLite database
2. Sets up notification channel
3. Requests notification permissions
4. Loads all notes into Zustand store
5. Registers notification listeners for tap-to-open and foreground highlight

The add screen uses `presentation: 'modal'` for a native sheet behavior.

---

## 10. Architecture Decisions

### Why Zustand over Redux or Context?
Zustand requires zero boilerplate, integrates seamlessly with TypeScript, and performs well with selector-based subscriptions. Selectors like `useNotesStore(s => s.notes)` prevent unnecessary re-renders — only the subscribed slice triggers updates.

### Why expo-sqlite over WatermelonDB or Realm?
For this scale of data, SQLite through the expo-provided API is sufficient, ships with Expo, and requires no native module complexity. The WAL + index strategy ensures fast reads for the primary timeline query.

### Why feature-based folder structure?
Feature folders (`timeline/`, `notes/`) co-locate related components, hooks, and state — making it easy to reason about a feature in isolation. Shared infrastructure lives in `core/` and `services/`. Business logic never leaks into components.

### Why no external UI library?
Mandatory per spec. All primitives (swipe gestures, shimmer, FAB) are implemented with React Native's built-in `Animated` API and `PanResponder` — giving full control over behavior and zero style overrides.

### Add/Edit screen as a single unified screen
Rather than maintaining two screens with duplicated form logic, the same screen serves both modes via an optional `?id=` query param. This halves the surface area for form-related bugs.

### Notification lifecycle
Every note mutation that changes its timestamp or completion state cancels the existing scheduled notification and reschedules if needed. This prevents stale or duplicate notifications.

### Offline-first
The app loads entirely from SQLite on boot — there is no "loading from server" state. `isSyncing` in the store is reserved for a future cloud sync layer that can be added without changing any existing logic.

---

## Dependencies Summary

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-sqlite` | Local database |
| `expo-notifications` | Push & local notifications |
| `zustand` | Global state management |
| `react-native-safe-area-context` | Safe area insets |
| `@react-native-community/datetimepicker` | Native date/time input |
| `@react-native-async-storage/async-storage` | Persist user preferences (settings) |
| `react-native-gesture-handler` | Gesture foundation (required by expo-router) |
| `react-native-reanimated` | Animation performance (future use, already installed) |
