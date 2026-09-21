import * as SecureStore from 'expo-secure-store';
import { userSchema, type User } from '@bastiat/contracts';
import { useSyncExternalStore } from 'react';
import { api, setToken } from './api';
import { library } from './library';

let current: User | null = null;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getUser = () => current;
export function useSession() {
  useSyncExternalStore(subscribe, () => version);
  return current;
}
export async function restoreSession() {
  try {
    const token = await SecureStore.getItemAsync('session-token');
    const cachedUser = await SecureStore.getItemAsync('session-user');
    if (token && cachedUser) {
      const parsed = userSchema.safeParse(JSON.parse(cachedUser));
      if (parsed.success) {
        current = parsed.data;
        setToken(token);
        library.setUser(current.id);
        emit();
      }
    }
  } catch {
    current = null;
    setToken(null);
    library.setUser(null);
    emit();
  }
}
export async function signIn(email: string, password: string) {
  const result = await api.login(email.trim(), password);
  await SecureStore.setItemAsync('session-token', result.token);
  await SecureStore.setItemAsync('session-user', JSON.stringify(result.user));
  current = result.user;
  setToken(result.token);
  library.setUser(current.id);
  emit();
  await library.sync();
}
export async function signOut() {
  // Revoke the server session before clearing the local credentials. Offline sign-out reports an error.
  await api.logout();
  if (current) library.clearUser(current.id);
  await SecureStore.deleteItemAsync('session-token');
  await SecureStore.deleteItemAsync('session-user');
  current = null;
  setToken(null);
  library.setUser(null);
  emit();
}
