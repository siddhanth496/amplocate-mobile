import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'amplocate.show_onboarding';

export async function setShowOnboarding(): Promise<void> {
  try { await AsyncStorage.setItem(KEY, '1'); } catch { /* ignore */ }
}

export async function shouldShowOnboarding(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}

export async function markOnboarded(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
}
