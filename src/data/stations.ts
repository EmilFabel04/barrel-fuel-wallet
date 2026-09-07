import { Station } from './types';

export const STATIONS: Station[] = [
  { id: 'engen-william-nicol', name: 'Engen William Nicol', brand: 'Engen', suburb: 'Bryanston',    hours: '24h',          km: 1.2, zone: 'inland' },
  { id: 'sasol-rivonia',       name: 'Sasol Rivonia',       brand: 'Sasol', suburb: 'Rivonia',      hours: '05:00–23:00',  km: 2.8, zone: 'inland' },
  { id: 'shell-grayston',      name: 'Shell Grayston',      brand: 'Shell', suburb: 'Sandton',      hours: '24h',          km: 4.1, zone: 'inland' },
  { id: 'astron-fourways',     name: 'Astron Energy Fourways', brand: 'Astron Energy', suburb: 'Fourways', hours: '24h',   km: 5.6, zone: 'inland' },
  { id: 'total-sunninghill',   name: 'Total Sunninghill',   brand: 'Total', suburb: 'Sunninghill',  hours: '06:00–22:00',  km: 6.3, zone: 'inland' },
];
