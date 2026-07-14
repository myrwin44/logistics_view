export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

export type DefaultDateRange = 'last7' | 'last30' | 'last90' | 'currentMonth';

export interface UserSettings {
  displayName: string;
  username: string; // read-only from API
  dateFormat: DateFormat;
  defaultDateRange: DefaultDateRange;
}
