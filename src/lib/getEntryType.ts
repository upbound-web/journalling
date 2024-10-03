import { JournalEntry } from "./dataLayer";

export type JournalType = 'past' | 'present' | 'future' | 'stoic';

export function getEntryType(entry: JournalEntry): JournalType {
  if (typeof entry.type === 'function') {
    return entry.type();
  } else if (entry.type && typeof entry.type.get === 'function') {
    return entry.type.get();
  } else {
    return entry.type;
  }
}