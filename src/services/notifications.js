import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zwiip_notif_enabled';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('expo-notifications not available (Expo Go?)');
}

export async function requestNotificationPermission() {
  if (!Notifications) return false;
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
  if (!enabled && Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export async function scheduleDailyReminders({ unsortedCount, t }) {
  if (!Notifications) return;
  const enabled = await isNotificationsEnabled();
  if (!enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (unsortedCount > 0) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Zwiip \uD83D\uDCF8', body: t('notif_unsorted', { count: unsortedCount }) },
      trigger: { type: 'daily', hour: 10, minute: 0 },
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Zwiip \u26A1', body: t('notif_challenge') },
    trigger: { type: 'daily', hour: 14, minute: 0 },
  });

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Zwiip', body: t('notif_free_ready') },
    trigger: { type: 'daily', hour: 18, minute: 0 },
  });

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Zwiip \uD83D\uDCAA', body: t('notif_social') },
    trigger: { type: 'daily', hour: 20, minute: 0 },
  });
}

export async function cancelAllNotifications() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
