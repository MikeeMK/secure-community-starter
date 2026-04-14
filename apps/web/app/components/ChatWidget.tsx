'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Avatar } from './Avatar';

type OtherUser = { id: string; displayName: string };
type LastMsg = { content: string; createdAt: string; senderId: string; read: boolean } | null;
type Conversation = { id: string; announcementId: string | null; other: OtherUser; lastMsg: LastMsg; unread: number };
type ChatMsg = { id: string; content: string; createdAt: string; read: boolean; sender: { id: string; displayName: string } };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function ChatWidget() {
  const { utilisateur, estAuthentifie } = useAuth();
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const prevUnreadRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for open-chat events from announcement page
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as { conversationId: string };
      setOpen(true);
      setActiveConvId(detail.conversationId);
    }
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  // Poll unread count + play sound when it increases
  useEffect(() => {
    if (!estAuthentifie) return;
    function fetchUnread() {
      apiFetch<{ count: number }>('/chat/unread')
        .then((r) => {
          const count = r.count;
          if (count > prevUnreadRef.current) {
            playNotifSound();
          }
          prevUnreadRef.current = count;
          setUnreadTotal(count);
        })
        .catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [estAuthentifie]);

  const fetchConvs = useCallback(() => {
    apiFetch<Conversation[]>('/chat/conversations')
      .then((list) => {
        setConvs(list);
        const total = list.reduce((sum, c) => sum + c.unread, 0);
        setUnreadTotal(total);
      })
      .catch(() => {});
  }, []);

  // Fetch conversations when open
  useEffect(() => {
    if (!open || !estAuthentifie) return;
    fetchConvs();
  }, [open, estAuthentifie, fetchConvs]);

  const fetchMessages = useCallback(() => {
    if (!activeConvId) return;
    apiFetch<ChatMsg[]>(`/chat/${activeConvId}/messages`)
      .then((msgs) => {
        setMessages((prev) => {
          const hasNew = msgs.length > prev.length;
          const lastIsOther = msgs.length > 0 && msgs[msgs.length - 1].sender.id !== utilisateur?.id;
          if (hasNew && lastIsOther) playNotifSound();
          return msgs;
        });
        fetchConvs();
      })
      .catch(() => {});
  }, [activeConvId, utilisateur?.id, fetchConvs]);

  // Fetch + poll messages when activeConvId set
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeConvId || !estAuthentifie) return;

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConvId, estAuthentifie, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeConvId) return;
    setSending(true);
    const content = input;
    setInput('');
    try {
      const msg = await apiFetch<ChatMsg>(`/chat/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setInput(content);
      window.alert(e instanceof Error ? e.message : 'Envoi impossible pour le moment.');
    } finally {
      setSending(false);
    }
  }

  if (!estAuthentifie) return null;

  const activeConv = convs.find((c) => c.id === activeConvId);

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {/* Chat panel */}
      {open && (
        <div style={{
          width: 340,
          height: 480,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            flexShrink: 0,
          }}>
            {activeConvId && (
              <button
                onClick={() => setActiveConvId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 0, lineHeight: 1 }}
              >
                ←
              </button>
            )}
            <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>
              {activeConv ? activeConv.other.displayName : 'Messages'}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Conversation list */}
          {!activeConvId && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {convs.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  Aucune conversation
                </div>
              )}
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border)', padding: '12px 16px',
                    cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <Avatar name={c.other.displayName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: c.unread > 0 ? 700 : 500, fontSize: 13 }}>{c.other.displayName}</span>
                      {c.lastMsg && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{timeAgo(c.lastMsg.createdAt)}</span>}
                    </div>
                    {c.lastMsg && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {c.lastMsg.senderId === utilisateur?.id ? 'Vous : ' : ''}{c.lastMsg.content}
                      </div>
                    )}
                  </div>
                  {c.unread > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700,
                      borderRadius: 99, minWidth: 16, height: 16, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Message thread */}
          {activeConvId && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map((m) => {
                  const isMe = m.sender.id === utilisateur?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                      {!isMe && <Avatar name={m.sender.displayName} size="sm" />}
                      <div style={{
                        maxWidth: '72%',
                        padding: '8px 12px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'var(--primary)' : 'var(--surface-3)',
                        color: isMe ? '#fff' : 'var(--text)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} style={{
                display: 'flex', gap: 8, padding: '10px 12px',
                borderTop: '1px solid var(--border)', background: 'var(--surface-2)',
                flexShrink: 0,
              }}>
                <input
                  className="form-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Votre message…"
                  style={{ flex: 1, padding: '7px 12px', fontSize: 13 }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={sending || !input.trim()}
                  style={{ flexShrink: 0 }}
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
        title="Messages"
      >
        💬
        {unreadTotal > 0 && !open && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--danger)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>
    </div>
  );
}
