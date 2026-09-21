import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiClient } from '@bastiat/contracts/client';
import type { Content, Home, Catalog } from '@bastiat/contracts';
import { storage } from './storage';

const configured = process.env.EXPO_PUBLIC_API_URL;
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const localHost = Platform.OS === 'android' ? '10.0.2.2' : (metroHost ?? 'localhost');
export const apiURL =
  configured && !configured.includes('localhost') ? configured : `http://${localHost}:3000`;
let token: string | null = null;
export const setToken = (value: string | null) => {
  token = value;
};
export const api = new ApiClient(apiURL, () => token);

function localURLs<T>(value: T): T {
  // Local development APIs may serialize localhost; real devices need the configured LAN host.
  return JSON.parse(
    JSON.stringify(value).replace(/http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):3000/g, apiURL),
  ) as T;
}
export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const result = localURLs(await fetcher());
    storage.set('public', 'cache', key, result);
    return result;
  } catch (error) {
    const saved = storage.get<T>('public', 'cache', key);
    if (saved) return localURLs(saved);
    throw error;
  }
}
export const getHome = () => cached<Home>('home', () => api.home());
export const getCatalog = (query = '', kind = 'all', page = 1) =>
  cached<Catalog>(`catalog:${query}:${kind}:${page}`, () => api.catalog(query, kind, page));
export const getContent = (kind: string, slug: string) =>
  cached<Content>(`${kind}:${slug}`, () => api.content(kind, slug));
export function cacheContent(item: Content) {
  storage.set('public', 'cache', `${item.kind}:${item.slug}`, item);
  if (item.kind === 'course') item.lessons.forEach(cacheContent);
}
