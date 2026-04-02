import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zwiip_notif_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function isNotificationsEnabled() {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val !== 'false';
}

export async function setNotificationsEnabled(enabled) {
  await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

/**
 * Schedule rotating daily notifications:
 * - Morning (10:00): engagement or challenge
 * - Evening (18:00): freemium nudge or social
 */
export async function scheduleDailyReminders({ unsortedCount, t }) {
  const enabled = await isNotificationsEnabled();
  if (!enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Morning: unsorted count reminder
  if (unsortedCount > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zwiip \uD83D\uDCF8',
        body: t('notif_unsorted', { count: unsortedCount }),
      },
      trigger: { type: 'daily', hour: 10, minute: 0 },
    });
  }

  // Afternoon: challenge nudge
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Zwiip \u26A1',
      body: t('notif_challenge'),
    },
    trigger: { type: 'daily', hour: 14, minute: 0 },
  });

  // Evening: freemium daily reset
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Zwiip',
      body: t('notif_free_ready'),
    },
    trigger: { type: 'daily', hour: 18, minute: 0 },
  });

  // Night: social/viral
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Zwiip \uD83D\uDCAA',
      body: t('notif_social'),
    },
    trigger: { type: 'daily', hour: 20, minute: 0 },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
