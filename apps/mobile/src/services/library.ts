import { LibraryController } from '@bastiat/contracts/library';
import { randomUUID } from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import { storage } from './storage';
import { api } from './api';
export const library = new LibraryController(storage, api, randomUUID);
export function useLibrary() {
  useSyncExternalStore(library.subscribe, library.snapshot);
  return library;
}
