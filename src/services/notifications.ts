import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Note } from '../models/note';
import { NOTIFICATION, STRINGS } from '../core/constants';

const isWeb = Platform.OS === 'web';

function createNoopSubscription(): Notifications.EventSubscription {
  return {
    remove: () => {},
  } as Notifications.EventSubscription;
}

// Configure how notifications appear when app is foregrounded
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isWeb) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android' || isWeb) return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION.CHANNEL_ID, {
    name: NOTIFICATION.CHANNEL_NAME,
    description: NOTIFICATION.CHANNEL_DESCRIPTION,
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });
}

export async function scheduleNoteNotification(note: Note): Promise<string | null> {
  if (isWeb) return null;

  const scheduledDate = new Date(note.timestamp);

  // Don't schedule notifications in the past
  if (scheduledDate <= new Date()) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title,
        body: note.content
          ? note.content.slice(0, 100)
          : STRINGS.NOTIFICATION_DEFAULT_BODY,
        data: { noteId: note.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });
    return identifier;
  } catch (error) {
    console.error('[Notifications] Failed to schedule:', error);
    return null;
  }
}

export async function cancelNoteNotification(noteId: string): Promise<void> {
  if (isWeb) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => (n.content.data as { noteId?: string })?.noteId === noteId
  );
  await Promise.all(
    toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function cancelAllNotifications(): Promise<void> {
  if (isWeb) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addNotificationResponseListener(
  handler: (noteId: string) => void
): Notifications.EventSubscription {
  if (isWeb) return createNoopSubscription();

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const noteId = (response.notification.request.content.data as { noteId?: string })
      ?.noteId;
    if (noteId) handler(noteId);
  });
}

export function addNotificationReceivedListener(
  handler: (noteId: string) => void
): Notifications.EventSubscription {
  if (isWeb) return createNoopSubscription();

  return Notifications.addNotificationReceivedListener((notification) => {
    const noteId = (notification.request.content.data as { noteId?: string })?.noteId;
    if (noteId) handler(noteId);
  });
}
