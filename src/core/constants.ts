export const ROUTES = {
  TIMELINE: '/',
  SEARCH: '/search',
  SETTINGS: '/settings',
  NOTE_ADD: '/note/add',
  NOTE_DETAIL: (id: string) => `/note/${id}` as const,
} as const;

export const DB = {
  NAME: 'notenest.db',
  VERSION: 1,
  NOTES_TABLE: 'notes',
} as const;

export const STRINGS = {
  APP_NAME: 'NoteNest',
  EMPTY_TIMELINE_TITLE: 'Nothing scheduled',
  EMPTY_TIMELINE_SUBTITLE: 'Add your first note.',
  EMPTY_SEARCH_TITLE: 'No results',
  EMPTY_SEARCH_SUBTITLE: 'Try a different search term.',
  OFFLINE_BANNER: 'Working offline',
  DELETE_CONFIRM_TITLE: 'Delete Note',
  DELETE_CONFIRM_MESSAGE: 'This action cannot be undone.',
  DELETE_CONFIRM_OK: 'Delete',
  DELETE_CONFIRM_CANCEL: 'Cancel',
  SECTION_TODAY: 'Today',
  SECTION_TOMORROW: 'Tomorrow',
  SECTION_UPCOMING: 'Upcoming',
  SECTION_PAST: 'Past',
  NOTIFICATION_TITLE_SUFFIX: '— NoteNest',
  NOTIFICATION_DEFAULT_BODY: 'Your note is ready.',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  EDIT: 'Edit',
  DELETE: 'Delete',
  DONE: 'Done',
  ADD_NOTE: 'Add Note',
  EDIT_NOTE: 'Edit Note',
  TITLE_PLACEHOLDER: 'Note title...',
  CONTENT_PLACEHOLDER: 'What do you want to remember?',
  SETTINGS_NOTIFICATIONS: 'Notifications',
  SETTINGS_DARK_MODE: 'Dark Mode',
  SETTINGS_CLOUD_SYNC: 'Cloud Sync',
  SETTINGS_CLOUD_SYNC_SUBTITLE: 'Coming soon',
  SEARCH_PLACEHOLDER: 'Search notes...',
} as const;

export const NOTIFICATION = {
  CHANNEL_ID: 'notenest-default',
  CHANNEL_NAME: 'NoteNest Reminders',
  CHANNEL_DESCRIPTION: 'Scheduled note reminders',
} as const;

export const TIMELINE = {
  HIGHLIGHT_DURATION_MS: 5000,
  SKELETON_COUNT: 5,
} as const;
