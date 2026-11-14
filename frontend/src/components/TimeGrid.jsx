import { DAYS, dayLabel, formatTime, todayKey } from '../lib/format';
import { cn } from './ui';
import { paletteFor } from '../lib/colors';

const toMinutes = (t) => {
  const [h, m] = formatTime(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

const HOUR_PX = 64;

/**
 * Week timetable. items: [{ id, day: 'MONDAY', start: '09:00', end: '10:50', code, title, lines: [] }]
 */
export default function TimeGrid({ items, startHour = 8, endHour = 18, onSelect }) {
  const minStart = Math.min(startHour * 60, ...items.map((i) => toMinutes(i.start)));
  const maxEnd = Math.max(endHour * 60, ...items.map((i) => toMinutes(i.end)));
  const first = Math.floor(minStart / 60);
  const last = Math.ceil(maxEnd / 60);
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const today = todayKey();
  const colorOf = paletteFor(items.map((i) => i.code));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-[56px_repeat(5,1fr)]">
        {/* header */}
        <div className="sticky top-0 border-b border-border" />
        {DAYS.map((d) => (
          <div key={d} className="border-b border-l border-border px-3 py-2.5 text-center">
            <span className={cn('text-sm font-medium', d === today ? 'text-accent' : 'text-fg-muted')}>{dayLabel(d)}</span>
            {d === today && <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">Today</span>}
          </div>
        ))}

        {/* hour labels */}
        <div className="relative">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_PX }} className="relative">
              <span className="absolute -top-2 right-2 text-[11px] text-fg-subtle tabular-nums">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* columns */}
        {DAYS.map((d) => (
          <div key={d} className={cn('relative border-l border-border', d === today && 'bg-accent-soft/30')}>
            {hours.map((h) => <div key={h} style={{ height: HOUR_PX }} className="border-b border-dashed border-border/70" />)}
            {items.filter((i) => i.day === d).map((i) => {
              const top = ((toMinutes(i.start) - first * 60) / 60) * HOUR_PX;
              const height = Math.max(((toMinutes(i.end) - toMinutes(i.start)) / 60) * HOUR_PX - 4, 28);
              const [border, bg, text] = colorOf(i.code);
              return (
                <div
                  key={i.id}
                  style={{ top: top + 2, height }}
                  className={cn('absolute inset-x-1.5 overflow-hidden rounded-md border-l-[3px] px-2 py-1.5', border, bg,
                    onSelect && 'cursor-pointer transition-[filter] hover:brightness-95 dark:hover:brightness-125')}
                  title={`${i.code} ${i.title}`}
                  onClick={onSelect ? () => onSelect(i) : undefined}
                  role={onSelect ? 'button' : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect(i) : undefined}
                >
                  <p className={cn('text-xs font-semibold', text)}>{i.code}</p>
                  <p className="truncate text-xs font-medium text-fg">{i.title}</p>
                  {height > 56 && i.lines?.map((l, k) => <p key={k} className="truncate text-[11px] text-fg-muted">{l}</p>)}
                  {height > 44 && <p className="truncate text-[11px] text-fg-subtle tabular-nums">{formatTime(i.start)}–{formatTime(i.end)}</p>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
