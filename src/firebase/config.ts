import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

export function getActiveFirebaseConfig() {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('sr_custom_firebase_config');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return defaultFirebaseConfig;
}

const activeConfig = getActiveFirebaseConfig();

const app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, activeConfig.firestoreDatabaseId || '(default)');

export function updateCustomFirebaseConfig(configObj: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sr_custom_firebase_config', JSON.stringify(configObj));
    window.location.reload();
  }
}

export function resetToDefaultFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sr_custom_firebase_config');
    window.location.reload();
  }
}

export default app;
