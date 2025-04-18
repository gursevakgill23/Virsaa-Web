import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatButton.module.css';
import { FaComment, FaTimes } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';

const ChatButton = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Sample responses for the chatbot
  const sikhismResponses = {
    // Greetings (all should trigger the same response)
    "hi": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    "hello": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    "ssa": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    "sat shri akaal": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    "waheguru ji ka khalsa": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    "waheguru ji ki fateh": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! How can I help you today?",
    
    // Basic Sikhism questions
    "what is sikhism": "Sikhism is a monotheistic religion founded in the 15th century in Punjab by Guru Nanak Dev Ji. It emphasizes equality, service, and devotion to one God (Waheguru).",
    "who founded sikhism": "Sikhism was founded by Guru Nanak Dev Ji (1469-1539) in the Punjab region of South Asia. He was followed by nine other human Gurus.",
    "how many gurus are there": "There are 10 human Gurus in Sikhism, from Guru Nanak Dev Ji (1st Guru) to Guru Gobind Singh Ji (10th Guru), who then declared the Guru Granth Sahib as the eternal Guru.",
    
    // Core beliefs
    "main beliefs": "The core beliefs are: 1) Ik Onkar (One God), 2) Equality of all humans, 3) Honest living (Kirat Karni), 4) Sharing with others (Vand Chakna), and 5) Meditation on God's Name (Naam Japna).",
    "three pillars": "The three pillars of Sikhism are: 1) Naam Japo (meditate on God), 2) Kirat Karo (earn an honest living), 3) Vand Chhako (share with others).",
    
    // Practices
    "five ks": "The Five Ks are articles of faith: 1) Kesh (uncut hair), 2) Kara (steel bracelet), 3) Kanga (wooden comb), 4) Kachera (cotton undergarment), 5) Kirpan (ceremonial sword). They represent discipline and spirituality.",
    "five kakaar": "The Five Ks are articles of faith: 1) Kesh (uncut hair), 2) Kara (steel bracelet), 3) Kanga (wooden comb), 4) Kachera (cotton undergarment), 5) Kirpan (ceremonial sword). They represent discipline and spirituality.",

    "why keep hair": "Sikhs keep uncut hair (Kesh) as a sign of acceptance of God's will and respect for the natural form. It's one of the Five Ks and represents spirituality.",
    "what is langar": "Langar is the free community kitchen in Gurdwaras where everyone sits together on the floor (regardless of background) to eat vegetarian meals, symbolizing equality and service.",
    
    // Holy Scriptures
    "holy book": "The Guru Granth Sahib is Sikhism's holy scripture, considered the eternal Guru. It contains hymns by the Sikh Gurus and other saints, written in Gurmukhi script.",
    "what is guru granth sahib": "The Guru Granth Sahib is the living Guru of Sikhs, containing 1,430 pages of spiritual hymns. It's treated with utmost respect and placed on a throne in Gurdwaras.",
    
    // Places
    "golden temple": "The Golden Temple (Harmandir Sahib) in Amritsar is the holiest Sikh shrine. Its gold-plated exterior reflects in the Amrit Sarovar (pool of nectar), creating a divine sight.",
    "five takhts": "The five Takhts (seats of authority) are: 1) Akal Takht (Amritsar), 2) Takht Sri Patna Sahib, 3) Takht Sri Kesgarh Sahib, 4) Takht Sri Hazur Sahib, 5) Takht Sri Damdama Sahib.",
    
    // History
    "guru gobind singh": "Guru Gobind Singh Ji (1666-1708) was the 10th Guru who established the Khalsa in 1699, gave the Five Ks, and declared the Guru Granth Sahib as the eternal Guru.",
    "what is khalsa": "The Khalsa is the collective body of initiated Sikhs, established by Guru Gobind Singh Ji in 1699. Khalsa means 'pure' and members follow a strict code of conduct.",
    
    // Festivals
    "main festivals": "Major Sikh festivals: 1) Guru Nanak's Birthday (Gurpurab), 2) Vaisakhi (Khalsa founding day), 3) Diwali (Bandi Chhor Divas), 4) Hola Mohalla.",
    "what is vaisakhi": "Vaisakhi (April 13/14) celebrates both the harvest festival and the founding of the Khalsa in 1699 by Guru Gobind Singh Ji. It's marked by Nagar Kirtan processions.",
    
    // Daily Life
    "morning prayer": "The morning prayer is Japji Sahib, composed by Guru Nanak Dev Ji. It's the first composition in the Guru Granth Sahib and outlines Sikh philosophy.",
    "how to pray": "Sikhs pray by meditating on Waheguru's name, reading Gurbani (scripture), and performing Nitnem (daily prayers including Japji Sahib, Jaap Sahib, and Rehras Sahib).",
    
    // Values
    "sikh values": "Key Sikh values: Truthfulness, humility, compassion, justice, equality, faith, and remembrance of God. The concept of 'Sarbat da Bhala' (welfare for all) is central.",
    "what is seva": "Seva means selfless service, a cornerstone of Sikhism. It can be physical (like serving in Langar), mental (sharing knowledge), or material (donating resources).",
    
    // General
    "thank you": "You're welcome! May Waheguru bless you with Chardi Kala (ever-rising spirits). Feel free to ask more about Sikhism.",
    "goodbye": "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! May you walk in the light of the Guru's wisdom.",
    
    // Default fallback
    "default": "I'm happy to help you learn about Sikhism. Could you ask about:\n1) Sikh beliefs\n2) History\n3) Practices\n4) Scriptures\n5) Festivals\nor another specific topic?"
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response after delay
    setTimeout(() => {
      const query = inputValue.toLowerCase();
      let responseText = sikhismResponses.default;
      
      Object.keys(sikhismResponses).forEach(key => {
        if (query.includes(key)) {
          responseText = sikhismResponses[key];
        }
      });

      const botMessage = { text: responseText, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`${styles.chatWidget} ${isDarkMode ? styles.dark : ''}`}>
      {/* Chat button - only visible when chat is closed */}
      {!isOpen && (
        <button 
          className={styles.chatButton}
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <FaComment className={styles.icon} />
        </button>
      )}

      {/* Chat window */}
      <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
        <div className={styles.chatHeader}>
          <h3>Ask anything about Sikhism</h3>
          <button 
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.chatBody}>
          <div className={styles.welcomeMessage}>
            <p>Welcome! How can I help you learn about Sikhism today?</p>
          </div>
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              {message.text}
            </div>
          ))}
          
          {isTyping && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className={styles.chatFooter}>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            className={styles.chatInput}
          />
          <button 
            className={styles.sendButton}
            onClick={handleSendMessage}
            disabled={inputValue.trim() === ''}
          >
            <IoIosSend/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatButton;