// How long the papel picado stays up: through this day, wherever the visitor is. Pages are built
// ahead of time and hold both looks, so the choice is made in the browser, before the first paint,
// by the script this exports (app/layout.tsx), and global.css hides whichever is out of season.
const lastDay = [2026, 10, 4] as const; // November 4: months count from 0.

// The sheets over each product's headline (MARKS in lib/papel-designs.ts). They are the largest
// thing on those pages, so in season the script asks for them at once.
const sheets = { '/': 'thaw-sheet', '/floe': 'floe-sheet' };

// The tab icons are files, and React owns their links. So in season there is one more of our own,
// last in the head, which is the one a browser uses. It follows the page across moves between them.
const icons = `var o=document.createElement('link');o.rel='icon';var f=function(){var a=document.querySelectorAll('link[rel=icon]'),h='';for(var i=0;i<a.length;i++)if(a[i]!==o)h=a[i].getAttribute('href');if(!h)return;var w='/icons/'+(h.indexOf('/icons/floe')==0?'floe':'thaw')+'-papel-96.png';if(o.getAttribute('href')!==w)o.setAttribute('href',w);if(document.head.lastChild!==o)document.head.append(o)};f();new MutationObserver(f).observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});`;

export const seasonScript = `if(Date.now()<new Date(${lastDay[0]},${lastDay[1]},${lastDay[2] + 1}).getTime()){document.documentElement.dataset.papel='';var s=${JSON.stringify(sheets)}[location.pathname];if(s){var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/papel-picado/'+s+'.svg';l.fetchPriority='high';document.head.append(l)}${icons}}`;

export const inSeason = () => document.documentElement.dataset.papel !== undefined;
