/**
 * elements/ChatWithUs/ChatButton/ChatButton.jsx
 * -----------------------------------------------------------------------------
 * "Ask about Sikhism": the floating chat button on the home page and its chat
 * window. Questions are answered by the Virsaa helper on the server
 * (/collections/chat/, see api/chatApi.js and collections_api/chatbot.py):
 *   - the first time the chat opens, the helper greets you (by first name when
 *     signed in) and offers a few questions to start with
 *   - each answer arrives as a few short messages, with a typing pause before
 *     each one, the way a person writes
 *   - under the answer: "Tell me more" when there's a longer answer, follow-up
 *     questions, and sometimes a link to the page about it on Virsaa
 *     (following the link closes the chat)
 *   - the conversation is kept for this browser tab (sessionStorage), so it's
 *     still there after visiting a linked page; "Start over" clears it
 * When something goes wrong (offline, too many messages, a server problem) the
 * helper says so in the chat and offers "Try again".
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaComment, FaTimes, FaRedo, FaArrowRight } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';
import { useAuth } from '../../../context/AuthContext';
import chatApi, { CHAT_MAX_CHARS } from '../../../api/chatApi';
import { describeApiError } from '../../../utils/apiError';
import { safeInternalPath } from '../../../utils/safeUrl';
import styles from './ChatButton.module.css';

// ---------------------------------------------------------------- settings and helpers
const STORAGE_KEY = 'virsaa.chat.v1';
const KEEP_MESSAGES = 60; // only the newest messages are kept
const MORE_QUESTION = 'Tell me more';

// Typing pause before each reply: longer for longer messages, like someone writing.
// Kept short for people who ask for reduced motion.
const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
const typingTime = (text, quick) => (quick ? 150 : Math.min(1800, 450 + text.length * 12));

let lastId = 0;
const newId = () => `${Date.now().toString(36)}-${(lastId += 1)}`;

// Server data is checked before use: suggestion buttons need a slug and a
// question, and a link must stay on this website
const cleanSuggestions = (list) => (Array.isArray(list) ? list : [])
  .filter((s) => s && typeof s.slug === 'string' && typeof s.question === 'string')
  .map(({ slug, question }) => ({ slug, question }))
  .slice(0, 6);
const cleanLink = (link) => {
  const path = safeInternalPath(link?.path);
  return path ? { label: String(link.label || 'Open the page'), path } : null;
};

const EMPTY_CHAT = { messages: [], suggestions: [], link: null, more: false, lastTopic: '' };

// The conversation kept for this tab, or a new one. A question still waiting
// for its answer when the page was left is dropped (it can simply be asked again).
const loadSavedChat = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !Array.isArray(saved.messages)) return EMPTY_CHAT;
    const messages = saved.messages
      .filter((m) => m && typeof m.id === 'string' && typeof m.text === 'string' && (m.from === 'bot' || m.from === 'user'))
      .slice(-KEEP_MESSAGES);
    while (messages.length && messages[messages.length - 1].from === 'user') messages.pop();
    return {
      messages,
      suggestions: cleanSuggestions(saved.suggestions),
      link: cleanLink(saved.link),
      more: saved.more === true,
      lastTopic: typeof saved.lastTopic === 'string' ? saved.lastTopic : '',
    };
  } catch {
    return EMPTY_CHAT; // storage blocked or unreadable: start a new conversation
  }
};

// What the helper says when a request fails
const problemText = (error) => {
  if (error?.response?.status === 429) {
    return error.response.data?.detail || 'You’re sending messages very quickly. Wait a minute, then try again.';
  }
  return describeApiError(error, 'Something went wrong. Try again in a moment.');
};

// Props: apiString (API base URL)
const ChatButton = ({ apiString }) => {
  const { isLoggedIn, accessToken } = useAuth();
  const token = isLoggedIn ? accessToken : null;

  // The conversation (restored for this tab) and what's shown under the last answer
  const savedRef = useRef(null);
  if (savedRef.current === null) savedRef.current = loadSavedChat();
  const [messages, setMessages] = useState(savedRef.current.messages);
  const [suggestions, setSuggestions] = useState(savedRef.current.suggestions);
  const [link, setLink] = useState(savedRef.current.link);
  const [more, setMore] = useState(savedRef.current.more); // a longer answer is available
  const [lastTopic, setLastTopic] = useState(savedRef.current.lastTopic); // for "tell me more"

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false); // the helper's typing dots
  const [busy, setBusy] = useState(false); // waiting for, or "typing", an answer
  const [retry, setRetry] = useState(null); // what "Try again" repeats: { kind: 'start' } | { kind: 'ask', body }

  const launcherRef = useRef(null);
  const windowRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const timersRef = useRef(new Set()); // pending typing pauses
  const turnRef = useRef(0); // bumped by "Start over" (and on leaving) so old replies are dropped
  const startedRef = useRef(false); // the greeting has been asked for
  const wasOpenRef = useRef(false);
  const quickRef = useRef(prefersReducedMotion());

  const addMessage = useCallback((from, text, tone) => {
    setMessages((prev) => [...prev, { id: newId(), from, text, ...(tone ? { tone } : {}) }].slice(-KEEP_MESSAGES));
  }, []);

  // A pause that "Start over" can cancel (a cancelled pause never finishes)
  const wait = useCallback((ms) => new Promise((resolve) => {
    const timer = setTimeout(() => { timersRef.current.delete(timer); resolve(); }, ms);
    timersRef.current.add(timer);
  }), []);

  /*
   * Show the helper's messages one at a time, each after a typing pause.
   * `alreadyWaited` (time spent waiting for the server) is taken off the first
   * pause. Resolves to false if the conversation was restarted meanwhile.
   */
  const say = useCallback(async (texts, alreadyWaited = 0) => {
    const turn = turnRef.current;
    const lines = (Array.isArray(texts) ? texts : []).filter((t) => typeof t === 'string' && t.trim());
    for (let i = 0; i < lines.length; i += 1) {
      setTyping(true);
      const pause = typingTime(lines[i], quickRef.current) - (i === 0 ? alreadyWaited : 0);
      if (pause > 0) await wait(pause);
      if (turn !== turnRef.current) return false;
      addMessage('bot', lines[i]);
    }
    setTyping(false);
    return true;
  }, [wait, addMessage]);

  // ---------------------------------------------------------------- talking to the helper
  // The greeting and the first questions to try
  const start = useCallback(async () => {
    const turn = turnRef.current;
    startedRef.current = true;
    setBusy(true);
    setRetry(null);
    setTyping(true);
    const began = Date.now();
    try {
      const data = await chatApi.start(apiString, token);
      if (turn !== turnRef.current) return;
      if (!(await say(data?.greeting, Date.now() - began))) return;
      setSuggestions(cleanSuggestions(data?.suggestions));
    } catch (error) {
      if (turn !== turnRef.current) return;
      setTyping(false);
      addMessage('bot', `Sat Sri Akal! ${problemText(error)}`, 'error');
      setRetry({ kind: 'start' });
    } finally {
      if (turn === turnRef.current) setBusy(false);
    }
  }, [apiString, token, say, addMessage]);

  /*
   * Send one question. `body` is what the server gets ({ message, last_topic }
   * or { topic }); `shown` is the text for your own bubble (none on "Try again").
   */
  const ask = useCallback(async (body, shown) => {
    const turn = turnRef.current;
    if (shown) addMessage('user', shown);
    setSuggestions([]);
    setLink(null);
    setMore(false);
    setRetry(null);
    setBusy(true);
    setTyping(true);
    const began = Date.now();
    try {
      const data = await chatApi.ask(apiString, token, body);
      if (turn !== turnRef.current) return;
      if (!(await say(data?.replies, Date.now() - began))) return;
      setLastTopic(typeof data?.topic === 'string' ? data.topic : '');
      setMore(data?.more === true);
      setSuggestions(cleanSuggestions(data?.suggestions));
      setLink(cleanLink(data?.link));
    } catch (error) {
      if (turn !== turnRef.current) return;
      setTyping(false);
      addMessage('bot', problemText(error), 'error');
      setRetry({ kind: 'ask', body });
    } finally {
      if (turn === turnRef.current) setBusy(false);
    }
  }, [apiString, token, say, addMessage]);

  // Greet the first time the chat opens (unless a conversation was restored)
  useEffect(() => {
    if (isOpen && !startedRef.current && messages.length === 0) start();
  }, [isOpen, messages.length, start]);

  // ---------------------------------------------------------------- actions
  const handleSubmit = (e) => {
    e.preventDefault();
    const question = input.trim().slice(0, CHAT_MAX_CHARS);
    if (!question || busy) return;
    setInput('');
    ask({ message: question, last_topic: lastTopic }, question);
  };

  const chooseSuggestion = (s) => { if (!busy) ask({ topic: s.slug }, s.question); };
  const tellMeMore = () => { if (!busy) ask({ message: 'tell me more', last_topic: lastTopic }, MORE_QUESTION); };
  const tryAgain = () => {
    if (busy || !retry) return;
    if (retry.kind === 'start') start();
    else ask(retry.body, null);
  };

  // Clear the conversation and greet again
  const startOver = () => {
    turnRef.current += 1;
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    setMessages([]);
    setSuggestions([]);
    setLink(null);
    setMore(false);
    setLastTopic('');
    setRetry(null);
    setTyping(false);
    setBusy(false);
    start();
    inputRef.current?.focus();
  };

  const close = () => setIsOpen(false);

  // ---------------------------------------------------------------- effects
  // Keep the conversation for this tab
  useEffect(() => {
    try {
      if (messages.length === 0) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, suggestions, link, more, lastTopic }));
    } catch {
      // storage full or blocked: the chat still works, it just isn't kept
    }
  }, [messages, suggestions, link, more, lastTopic]);

  // While closed the window can't be reached with Tab or a screen reader (inert);
  // when open, the question box gets focus and Escape closes. Closing returns
  // focus to the chat button.
  useEffect(() => {
    if (windowRef.current) windowRef.current.inert = !isOpen;
    if (!isOpen) {
      if (wasOpenRef.current) launcherRef.current?.focus();
      wasOpenRef.current = false;
      return undefined;
    }
    wasOpenRef.current = true;
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Keep the newest message in view
  useEffect(() => {
    const el = bodyRef.current;
    if (el && isOpen) el.scrollTo({ top: el.scrollHeight, behavior: quickRef.current ? 'auto' : 'smooth' });
  }, [messages, typing, suggestions, link, isOpen]);

  // Leaving the page: stop any typing pause and ignore replies still on the way
  useEffect(() => {
    const timers = timersRef.current;
    const turns = turnRef;
    return () => {
      turns.current += 1;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  // ---------------------------------------------------------------- render
  const showOptions = !busy && (retry || more || link || suggestions.length > 0);

  return (
    <div className={`${styles.chatWidget} ${isOpen ? styles.isOpen : ''}`}>
      <button
        ref={launcherRef}
        type="button"
        className={styles.chatButton}
        onClick={() => setIsOpen(true)}
        aria-label="Ask about Sikhism"
        aria-expanded={isOpen}
        aria-controls="virsaa-chat"
        tabIndex={isOpen ? -1 : 0}
      >
        <FaComment className={styles.icon} aria-hidden="true" />
      </button>

      {/* The chat window */}
      <section
        id="virsaa-chat"
        ref={windowRef}
        className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}
        aria-labelledby="virsaa-chat-title"
        aria-hidden={!isOpen}
      >
        <header className={styles.chatHeader}>
          <span className={styles.headerAvatar} aria-hidden="true">ੴ</span>
          <div className={styles.headerText}>
            <h3 id="virsaa-chat-title">Virsaa helper</h3>
            <p><span className={styles.onlineDot} aria-hidden="true" /> Online · answers in seconds</p>
          </div>
          <button
            type="button"
            className={styles.headerButton}
            onClick={startOver}
            disabled={messages.length === 0}
            aria-label="Start over"
            title="Start over"
          >
            <FaRedo />
          </button>
          <button type="button" className={styles.headerButton} onClick={close} aria-label="Close chat" title="Close">
            <FaTimes />
          </button>
        </header>

        <div className={styles.chatBody} ref={bodyRef} role="log" aria-label="Conversation" aria-busy={busy}>
          {messages.map((m, i) => {
            const isBot = m.from === 'bot';
            const firstOfGroup = isBot && messages[i - 1]?.from !== 'bot';
            return (
              <div key={m.id} className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser}`}>
                {isBot && <span className={`${styles.avatar} ${firstOfGroup ? '' : styles.avatarSpacer}`} aria-hidden="true">ੴ</span>}
                <p className={`${styles.message} ${isBot ? styles.botMessage : styles.userMessage} ${m.tone === 'error' ? styles.errorMessage : ''}`}>
                  {firstOfGroup && <span className={styles.srOnly}>Virsaa helper: </span>}
                  {!isBot && <span className={styles.srOnly}>You: </span>}
                  {m.text}
                </p>
              </div>
            );
          })}

          {typing && (
            <div className={`${styles.row} ${styles.rowBot}`}>
              <span className={`${styles.avatar} ${messages[messages.length - 1]?.from === 'bot' ? styles.avatarSpacer : ''}`} aria-hidden="true">ੴ</span>
              <div className={styles.typingIndicator} role="status" aria-label="The helper is typing">
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          )}

          {/* Under the last answer: try again, tell me more, a page link, follow-up questions */}
          {showOptions && (
            <div className={styles.options}>
              {link && (
                <Link to={link.path} className={styles.pageLink} onClick={close}>
                  <span>{link.label}</span>
                  <FaArrowRight aria-hidden="true" />
                </Link>
              )}
              <div className={styles.suggestions} role="group" aria-label="Suggested questions">
                {retry && (
                  <button type="button" className={`${styles.suggestion} ${styles.suggestionStrong}`} onClick={tryAgain}>
                    <FaRedo aria-hidden="true" /> Try again
                  </button>
                )}
                {more && (
                  <button type="button" className={`${styles.suggestion} ${styles.suggestionStrong}`} onClick={tellMeMore}>
                    {MORE_QUESTION}
                  </button>
                )}
                {suggestions.map((s) => (
                  <button key={s.slug} type="button" className={styles.suggestion} onClick={() => chooseSuggestion(s)}>
                    {s.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question box (empty questions can't be sent; one answer at a time) */}
        <form className={styles.chatFooter} onSubmit={handleSubmit}>
          <label htmlFor="chat-input" className={styles.srOnly}>Your question</label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className={styles.chatInput}
            autoComplete="off"
            maxLength={CHAT_MAX_CHARS}
            enterKeyHint="send"
          />
          <button type="submit" className={styles.sendButton} disabled={busy || input.trim() === ''} aria-label="Send">
            <IoIosSend />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatButton;
