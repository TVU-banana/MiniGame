import type { RunRecord, SettingsState } from '../app/types';

const SETTINGS_KEY = 'king-of-swords:settings';
const RECORDS_KEY = 'king-of-swords:records';

const DEFAULT_SETTINGS: SettingsState = {
  bgmVolume: 0.45,
  sfxVolume: 0.75
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): SettingsState {
  return {
    ...DEFAULT_SETTINGS,
    ...safeParse<Partial<SettingsState>>(localStorage.getItem(SETTINGS_KEY), {})
  };
}

export function saveSettings(settings: SettingsState): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadRecords(): RunRecord[] {
  return safeParse<RunRecord[]>(localStorage.getItem(RECORDS_KEY), []);
}

export function saveRecord(record: RunRecord): { records: RunRecord[]; bestRecord: boolean } {
  const records = [record, ...loadRecords()]
    .sort((a, b) => +new Date(b.finishedAt) - +new Date(a.finishedAt))
    .slice(0, 10);

  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));

  const sortedByBest = [...records].sort((a, b) => {
    if (b.survivalSeconds !== a.survivalSeconds) {
      return b.survivalSeconds - a.survivalSeconds;
    }
    if (b.kills !== a.kills) {
      return b.kills - a.kills;
    }
    return b.maxKnifeCount - a.maxKnifeCount;
  });

  return {
    records,
    bestRecord: sortedByBest[0]?.id === record.id
  };
}
