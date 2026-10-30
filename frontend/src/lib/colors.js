// Soft course colours that work on both themes (bg uses low alpha).
const PALETTE = [
  ['border-l-[#3b5bdb]', 'bg-[#3b5bdb]/10', 'text-[#3b5bdb] dark:text-[#91a7ff]'],
  ['border-l-[#0c8599]', 'bg-[#0c8599]/10', 'text-[#0c8599] dark:text-[#66d9e8]'],
  ['border-l-[#2b8a3e]', 'bg-[#2b8a3e]/10', 'text-[#2b8a3e] dark:text-[#8ce99a]'],
  ['border-l-[#e67700]', 'bg-[#e67700]/10', 'text-[#c25e00] dark:text-[#ffc078]'],
  ['border-l-[#ae3ec9]', 'bg-[#ae3ec9]/10', 'text-[#9c36b5] dark:text-[#e599f7]'],
  ['border-l-[#c92a2a]', 'bg-[#c92a2a]/10', 'text-[#c92a2a] dark:text-[#ffa8a8]'],
  ['border-l-[#5f3dc4]', 'bg-[#5f3dc4]/10', 'text-[#5f3dc4] dark:text-[#b197fc]'],
];

export const colorFor = (key = '') => {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

// Assigns distinct palette entries to codes in a stable (sorted) order, so courses on one
// timetable never share a colour unless there are more courses than colours.
export const paletteFor = (codes) => {
  const unique = [...new Set(codes)].sort();
  return (code) => PALETTE[unique.indexOf(code) % PALETTE.length] ?? colorFor(code);
};
