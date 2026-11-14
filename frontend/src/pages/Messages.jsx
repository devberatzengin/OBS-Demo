import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, Check, MessageSquare, Search, SendHorizontal } from 'lucide-react';
import ChatService from '../services/ChatService';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, Input, Spinner, cn, useToast } from '../components/ui';
import { formatTime, toDate } from '../lib/format';
import { apiError } from '../lib/errors';

const ROLE_LABEL = { STUDENT: 'Student', ACADEMICIAN: 'Academician', ADMINISTRATIVE: 'Staff', ADMIN: 'Admin' };
const idOf = (c) => c?.userId ?? c?.id;

function Avatar({ name = '?', size = 'md' }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent',
      size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
    )}>
      {initials}
    </div>
  );
}

const dayHeading = (d) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const diff = Math.round((today - x) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return x.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};

const shortStamp = (value) => {
  if (!value) return '';
  const d = toDate(value);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? formatTime(value) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const Messages = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const scrollRef = useRef(null);

  const fetchContacts = useCallback(() => ChatService.getConversations()
    .then((data) => {
      setContacts(data);
      // Select the first conversation only if nothing is open yet
      setSelected((cur) => cur ?? (window.innerWidth >= 768 ? data[0] ?? null : null));
    })
    .catch(() => { /* keep the last known list; polling will retry */ })
    .finally(() => setLoading(false)), []);

  useEffect(() => {
    fetchContacts();
    const t = setInterval(fetchContacts, 10000);
    return () => clearInterval(t);
  }, [fetchContacts]);

  const selectedId = idOf(selected);
  useEffect(() => {
    if (!selectedId) return undefined;
    let alive = true;
    const load = () => ChatService.getMessages(selectedId).then((d) => alive && setHistory(d)).catch(() => {});
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [selectedId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) { setResults([]); return; }
    try {
      const r = await ChatService.searchUsers(val.trim());
      setResults(r.filter((x) => x.id !== user.id));
    } catch { setResults([]); }
  };

  const openChat = (target) => {
    const existing = contacts.find((c) => idOf(c) === target.id);
    setSelected(existing ?? { userId: target.id, fullName: target.fullName, role: target.role, isNew: true });
    setQuery('');
    setResults([]);
  };

  const send = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !selectedId) return;
    setSending(true);
    try {
      await ChatService.sendMessage(selectedId, text);
      setMessage('');
      setHistory(await ChatService.getMessages(selectedId));
      fetchContacts();
    } catch (err) {
      toast.error('Message not sent', apiError(err));
    } finally {
      setSending(false);
    }
  };

  if (loading && contacts.length === 0) return <Spinner label="Loading conversations…" />;

  // Insert a day separator whenever the date changes
  const timeline = [];
  let lastDay = null;
  for (const m of history.filter((x) => x.senderId === selectedId || x.receiverId === selectedId)) {
    const d = toDate(m.timestamp);
    const key = d.toDateString();
    if (key !== lastDay) { timeline.push({ sep: dayHeading(d), key: `sep-${key}` }); lastDay = key; }
    timeline.push(m);
  }

  return (
    <Card className="flex h-[calc(100vh-4rem)] min-h-[520px] overflow-hidden lg:h-[calc(100vh-4rem)]">
      {/* Conversation list */}
      <aside className={cn('w-full flex-col border-r border-border md:flex md:w-80', selected ? 'hidden' : 'flex')}>
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold">Messages</h1>
          <div className="relative mt-3">
            <Input icon={Search} placeholder="Find people…" value={query} onChange={(e) => handleSearch(e.target.value)} />
            {results.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-pop">
                {results.map((r) => (
                  <button key={r.id} onClick={() => openChat(r)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-hover cursor-pointer">
                    <Avatar name={r.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.fullName}</p>
                      <p className="text-xs text-fg-subtle">{ROLE_LABEL[r.role] ?? r.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {contacts.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" description="Search for a person above to start one." />
          ) : contacts.map((c) => {
            const active = idOf(c) === selectedId;
            return (
              <button
                key={idOf(c)}
                onClick={() => setSelected(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors cursor-pointer',
                  active ? 'bg-accent-soft' : 'hover:bg-surface-hover',
                )}
              >
                <Avatar name={c.fullName || c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-sm', c.unreadCount > 0 ? 'font-semibold' : 'font-medium')}>{c.fullName || c.name}</p>
                    <span className="shrink-0 text-[11px] text-fg-subtle">{shortStamp(c.lastMessageTimestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', c.unreadCount > 0 ? 'text-fg' : 'text-fg-subtle')}>
                      {c.lastMessage || ROLE_LABEL[c.role] || c.role}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread */}
      <section className={cn('min-w-0 flex-1 flex-col', selected ? 'flex' : 'hidden md:flex')}>
        {!selected ? (
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose someone on the left, or search for a person." className="flex-1" />
        ) : (
          <>
            <header className="flex h-16 items-center gap-3 border-b border-border px-4">
              <button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-hover md:hidden" aria-label="Back">
                <ArrowLeft className="size-4" />
              </button>
              <Avatar name={selected.fullName || selected.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selected.fullName || selected.name}</p>
                <p className="text-xs text-fg-subtle">{ROLE_LABEL[selected.role] ?? selected.role}</p>
              </div>
              {selected.isNew && <Badge tone="accent" className="ml-auto">New conversation</Badge>}
            </header>

            <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto bg-surface-muted/50 px-4 py-5">
              {timeline.length === 0 ? (
                <p className="py-16 text-center text-sm text-fg-subtle">No messages yet. Say hello 👋</p>
              ) : timeline.map((m) => {
                if (m.sep) {
                  return (
                    <div key={m.key} className="flex items-center gap-3 py-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-medium text-fg-subtle">{m.sep}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  );
                }
                const mine = m.senderId === user.id;
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-card',
                      mine ? 'rounded-br-md bg-accent text-accent-fg' : 'rounded-bl-md border border-border bg-surface',
                    )}>
                      <p className="break-words whitespace-pre-wrap">{m.content}</p>
                      <p className={cn('mt-0.5 flex items-center justify-end gap-1 text-[10px]', mine ? 'text-accent-fg/70' : 'text-fg-subtle')}>
                        {formatTime(m.timestamp)}
                        {mine && (m.isRead ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
              <Input
                placeholder={`Message ${(selected.fullName || selected.name || '').split(' ')[0]}…`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-10"
              />
              <Button type="submit" size="icon" className="h-10 w-10" loading={sending} disabled={!message.trim()} aria-label="Send">
                {!sending && <SendHorizontal className="size-4" />}
              </Button>
            </form>
          </>
        )}
      </section>
    </Card>
  );
};

export default Messages;
