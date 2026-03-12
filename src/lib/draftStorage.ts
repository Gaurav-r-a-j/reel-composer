// IndexedDB power module for reel drafts: save, load by code, list, delete.

import { openDB, type IDBPDatabase } from 'idb';
import type { GeneratedContent } from '../../types';

const DB_NAME = 'reel-composer-drafts';
const DB_VERSION = 1;
const STORE_DRAFTS = 'drafts';
const STORE_META = 'meta';
const META_CURRENT_CODE = 'currentDraftCode';

// Shape of a draft as stored in IndexedDB (optional blobs for video/bg music).
export interface StoredDraft {
  code: string;
  generatedContent: GeneratedContent;
  srtTextRaw: string;
  topicContext: string;
  isAudioOnly: boolean;
  subtitleFontSize: number;
  subtitleFontFamily: string;
  subtitleColor: string;
  subtitleBgColor: string;
  subtitlePaddingX: number;
  subtitlePaddingY: number;
  savedAt: number;
  videoBlob?: Blob;
  audioBlob?: Blob;
}

// Draft list item (no blobs) for listing.
export interface DraftListItem {
  code: string;
  savedAt: number;
  topicContext: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: 'code' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}

// Generate a short URL-safe code for a draft.
export function generateDraftCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Save a draft. If code provided, update; else create with new code. Returns the code.
export async function saveDraft(
  draft: Omit<StoredDraft, 'code' | 'savedAt'>,
  options?: { code?: string; videoBlob?: Blob; audioBlob?: Blob }
): Promise<string> {
  const db = await getDB();
  const code = options?.code ?? generateDraftCode();
  const stored: StoredDraft = {
    ...draft,
    code,
    savedAt: Date.now(),
    videoBlob: options?.videoBlob,
    audioBlob: options?.audioBlob,
  };
  await db.put(STORE_DRAFTS, stored);
  await db.put(STORE_META, code, META_CURRENT_CODE);
  return code;
}

// Load a draft by code. Returns null if not found.
export async function getDraftByCode(code: string): Promise<StoredDraft | null> {
  const db = await getDB();
  const draft = await db.get(STORE_DRAFTS, code);
  return draft ?? null;
}

// Get the code of the "current" draft (last saved in this session).
export async function getCurrentDraftCode(): Promise<string | null> {
  const db = await getDB();
  const code = await db.get(STORE_META, META_CURRENT_CODE);
  return code ?? null;
}

// Set the current draft code in meta (e.g. when opening a draft from URL).
export async function setCurrentDraftCode(code: string | null): Promise<void> {
  const db = await getDB();
  if (code === null) {
    await db.delete(STORE_META, META_CURRENT_CODE);
  } else {
    await db.put(STORE_META, code, META_CURRENT_CODE);
  }
}

// List all drafts (code, savedAt, topicContext) for UI.
export async function listDrafts(): Promise<DraftListItem[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_DRAFTS);
  return all
    .map((d) => ({
      code: d.code,
      savedAt: d.savedAt,
      topicContext: d.topicContext || '(No topic)',
    }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

// Delete a draft by code.
export async function deleteDraft(code: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_DRAFTS, code);
  const current = await db.get(STORE_META, META_CURRENT_CODE);
  if (current === code) {
    await db.delete(STORE_META, META_CURRENT_CODE);
  }
}

// Clear all drafts and meta (e.g. New project or reset).
export async function clearAllDrafts(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_DRAFTS);
  await db.clear(STORE_META);
}
