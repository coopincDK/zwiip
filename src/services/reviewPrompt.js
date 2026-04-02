import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = '@zwiip_review_prompted';
const MILESTONES = [20, 100, 500];

/**
 * Check if we should prompt for review based on milestones.
 * Call after each swipe action with current total sorted count.
 * Only prompts once per milestone, and only if StoreReview is available.
 */
export async function maybeRequestReview(totalSorted) {
  try {
    if (!MILESTONES.includes(totalSorted)) return;

    const stored = await AsyncStorage.getItem(REVIEW_KEY);
    const prompted = stored ? JSON.parse(stored) : [];

    if (prompted.includes(totalSorted)) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Small delay so user sees their achievement first
    setTimeout(async () => {
      await StoreReview.requestReview();
      prompted.push(totalSorted);
      await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(prompted));
    }, 1500);
  } catch (e) {
    // Silent fail — review prompt is not critical
  }
}

/**
 * Call after completing a challenge.
 * Only prompts once.
 */
export async function maybeRequestReviewAfterChallenge() {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_KEY);
    const prompted = stored ? JSON.parse(stored) : [];

    if (prompted.includes('challenge')) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    setTimeout(async () => {
      await StoreReview.requestReview();
      prompted.push('challenge');
      await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(prompted));
    }, 2000);
  } catch (e) {
    // Silent fail
  }
}
