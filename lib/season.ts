// How long the papel picado stays up: through this day, wherever the visitor is. Pages are built
// ahead of time and hold both looks, so the choice is made in the browser, before the first paint,
// by the script this exports (app/layout.tsx), and global.css hides whichever is out of season.
const lastDay = [2026, 10, 4] as const; // November 4: months count from 0.

// The sheets over each product's headline (MARKS in lib/papel-designs.ts). They are the largest
// thing on those pages, so in season the script asks for them at once.
const sheets = { '/': 'thaw-sheet', '/floe': 'floe-sheet' };

export const seasonScript = `if(Date.now()<new Date(${lastDay[0]},${lastDay[1]},${lastDay[2] + 1}).getTime()){document.documentElement.dataset.papel='';var s=${JSON.stringify(sheets)}[location.pathname];if(s){var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/papel-picado/'+s+'.svg';l.fetchPriority='high';document.head.append(l)}}`;

export const inSeason = () => document.documentElement.dataset.papel !== undefined;
