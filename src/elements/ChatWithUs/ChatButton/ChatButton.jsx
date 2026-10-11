import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatButton.module.css';
import { FaComment, FaTimes } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';

const GREETING = 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?';
const FIVE_KS = 'The Five Ks are articles of faith: 1) Kesh (uncut hair), 2) Kara (steel bracelet), 3) Kanga (wooden comb), 4) Kachera (cotton undergarment), 5) Kirpan (ceremonial sword). They represent discipline and spirituality.';

// Answers for the built-in helper (no backend yet)
const RESPONSES = {
  // Greetings
  hi: GREETING,
  hello: GREETING,
  ssa: GREETING,
  'sat shri akaal': GREETING,
  'waheguru ji ka khalsa': GREETING,
  'waheguru ji ki fateh': GREETING,

  // Basics
  'what is sikhism': 'Sikhism is a monotheistic religion founded in the 15th century in Punjab by Guru Nanak Dev Ji. It emphasizes equality, service, and devotion to one God (Waheguru).',
  'who founded sikhism': 'Sikhism was founded by Guru Nanak Dev Ji (1469-1539) in the Punjab region of South Asia. He was followed by nine other human Gurus.',
  'how many gurus are there': 'There are 10 human Gurus in Sikhism, from Guru Nanak Dev Ji (1st Guru) to Guru Gobind Singh Ji (10th Guru), who then declared the Guru Granth Sahib as the eternal Guru.',

  // Beliefs
  'main beliefs': 'The core beliefs are: 1) Ik Onkar (One God), 2) Equality of all humans, 3) Honest living (Kirat Karni), 4) Sharing with others (Vand Chakna), and 5) Meditation on God\'s Name (Naam Japna).',
  'three pillars': 'The three pillars of Sikhism are: 1) Naam Japo (meditate on God), 2) Kirat Karo (earn an honest living), 3) Vand Chhako (share with others).',

  // Practices
  'five ks': FIVE_KS,
  'five kakaar': FIVE_KS,
  'why keep hair': 'Sikhs keep uncut hair (Kesh) as a sign of acceptance of God\'s will and respect for the natural form. It\'s one of the Five Ks and represents spirituality.',
  'what is langar': 'Langar is the free community kitchen in Gurdwaras where everyone sits together on the floor (regardless of background) to eat vegetarian meals, symbolizing equality and service.',

  // Scripture
  'holy book': 'The Guru Granth Sahib is Sikhism\'s holy scripture, considered the eternal Guru. It contains hymns by the Sikh Gurus and other saints, written in Gurmukhi script.',
  'what is guru granth sahib': 'The Guru Granth Sahib is the living Guru of Sikhs, containing 1,430 pages of spiritual hymns. It\'s treated with utmost respect and placed on a throne in Gurdwaras.',

  // Places
  'golden temple': 'The Golden Temple (Harmandir Sahib) in Amritsar is the holiest Sikh shrine. Its gold-plated exterior reflects in the Amrit Sarovar (pool of nectar), creating a divine sight.',
  'five takhts': 'The five Takhts (seats of authority) are: 1) Akal Takht (Amritsar), 2) Takht Sri Patna Sahib, 3) Takht Sri Kesgarh Sahib, 4) Takht Sri Hazur Sahib, 5) Takht Sri Damdama Sahib.',

  // History
  'guru gobind singh': 'Guru Gobind Singh Ji (1666-1708) was the 10th Guru who established the Khalsa in 1699, gave the Five Ks, and declared the Guru Granth Sahib as the eternal Guru.',
  'what is khalsa': 'The Khalsa is the collective body of initiated Sikhs, established by Guru Gobind Singh Ji in 1699. Khalsa means \'pure\' and members follow a strict code of conduct.',

  // Festivals
  'main festivals': 'Major Sikh festivals: 1) Guru Nanak\'s Birthday (Gurpurab), 2) Vaisakhi (Khalsa founding day), 3) Diwali (Bandi Chhor Divas), 4) Hola Mohalla.',
  'what is vaisakhi': 'Vaisakhi (April 13/14) celebrates both the harvest festival and the founding of the Khalsa in 1699 by Guru Gobind Singh Ji. It\'s marked by Nagar Kirtan processions.',

  // Daily life
  'morning prayer': 'The morning prayer is Japji Sahib, composed by Guru Nanak Dev Ji. It\'s the first composition in the Guru Granth Sahib and outlines Sikh philosophy.',
  'how to pray': 'Sikhs pray by meditating on Waheguru\'s name, reading Gurbani (scripture), and performing Nitnem (daily prayers including Japji Sahib, Jaap Sahib, and Rehras Sahib).',

  // Values
  'sikh values': 'Key Sikh values: Truthfulness, humility, compassion, justice, equality, faith, and remembrance of God. The concept of \'Sarbat da Bhala\' (welfare for all) is central.',
  'what is seva': 'Seva means selfless service, a cornerstone of Sikhism. It can be physical (like serving in Langar), mental (sharing knowledge), or material (donating resources).',

  // General
  'thank you': 'You\'re welcome! May Waheguru bless you with Chardi Kala (ever-rising spirits). Feel free to ask more about Sikhism.',
  goodbye: 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! May you walk in the light of the Guru\'s wisdom.',
};

const FALLBACK = 'I\'m happy to help you learn about Sikhism. You could ask about:\n1) Sikh beliefs\n2) History\n3) Practices\n4) Scriptures\n5) Festivals\nor another specific topic.';

// Shown as tap-to-ask chips before the first message
const SUGGESTIONS = ['What is Sikhism', 'Five Ks', 'What is langar', 'Golden Temple', 'Main festivals'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pick the longest phrase that appears as whole words, so "this" no longer matches "hi"
const findAnswer = (text) => {
  const query = text.toLowerCase();
  let best = null;
  Object.keys(RESPONSES).forEach((key) => {
    if (new RegExp(`\\b${escapeRegex(key)}\\b`).test(query) && (!best || key.length > best.length)) best = key;
  });
  return best ? RESPONSES[best] : FALLBACK;
};

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus the input when the chat opens; close with Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = (text) => {
    const question = text.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { text: question, sender: 'user' }]);
    setInputValue('');
    setIsTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { text: findAnswer(question), sender: 'bot' }]);
      setIsTyping(false);
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(inputValue);
  };

  return (
    <div className={`${styles.chatWidget} ${isOpen ? styles.isOpen : ''}`}>
      <button
        type="button"
        className={styles.chatButton}
        onClick={() => setIsOpen(true)}
        aria-label="Ask about Sikhism"
        aria-expanded={isOpen}
        tabIndex={isOpen ? -1 : 0}
      >
        <FaComment className={styles.icon} aria-hidden="true" />
      </button>

      <section
        className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}
        aria-label="Ask about Sikhism"
        aria-hidden={!isOpen}
      >
        <header className={styles.chatHeader}>
          <div>
            <h3>Ask about Sikhism</h3>
            <p>Quick answers on beliefs, history and practice</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close chat" tabIndex={isOpen ? 0 : -1}>
            <FaTimes />
          </button>
        </header>

        <div className={styles.chatBody} ref={bodyRef} aria-live="polite">
          <div className={`${styles.message} ${styles.botMessage}`}>
            Sat Sri Akal! What would you like to learn about Sikhism today?
          </div>

          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className={styles.suggestion} onClick={() => send(s)} tabIndex={isOpen ? 0 : -1}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              {message.text}
            </div>
          ))}

          {isTyping && (
            <div className={styles.typingIndicator} aria-label="Typing">
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          )}
        </div>

        <form className={styles.chatFooter} onSubmit={handleSubmit}>
          <label htmlFor="chat-input" className={styles.srOnly}>Your question</label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question…"
            className={styles.chatInput}
            autoComplete="off"
            tabIndex={isOpen ? 0 : -1}
          />
          <button type="submit" className={styles.sendButton} disabled={inputValue.trim() === ''} aria-label="Send" tabIndex={isOpen ? 0 : -1}>
            <IoIosSend />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChatButton;
