import React, { useState, useEffect } from 'react';
import styles from './Quizzes.module.css';
import { Link } from 'react-router-dom';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const Quizzes = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const headerLight = '/images/Quizzes/header-image.jpg';
  const headerDark = '/images/Quizzes/header-image-dark.png';
  const games = '/images/Quizzes/games.jpg';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState('quiz1');
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const quizDurations = {
    quiz1: 10 * 60,
    quiz2: 15 * 60,
    quiz3: 15 * 60,
  };

  const [discussionPosts, setDiscussionPosts] = useState([
    {
      id: 1,
      content: 'What are some must-visit cultural festivals in Punjab? I’m planning a trip and want to experience the local traditions!',
      author: 'Amandeep Singh',
      timestamp: '2025-04-26 10:30 AM',
      replies: [
        {
          id: 101,
          content: 'You should definitely attend Lohri! It’s vibrant with bonfires, music, and dancing.',
          author: 'Simran Kaur',
          timestamp: '2025-04-26 11:15 AM',
        },
        {
          id: 102,
          content: 'Don’t miss the Teeyan festival if you’re there in the monsoon season. It’s a women’s folk dance festival with lots of Giddha!',
          author: 'Gurpreet Dhillon',
          timestamp: '2025-04-26 12:00 PM',
        },
        {
          id: 103,
          content: 'Vaisakhi is a must! It’s both a cultural and religious celebration with parades and community gatherings.',
          author: 'Navjot Sandhu',
          timestamp: '2025-04-26 1:30 PM',
        },
        {
          id: 104,
          content: 'Also consider the Hola Mohalla festival. It features martial arts and mock battles, very unique!',
          author: 'Karan Gill',
          timestamp: '2025-04-26 2:45 PM',
        },
      ],
    },
    {
      id: 2,
      content: 'I’m struggling with some Punjabi vocabulary in the Language Quiz. Any tips for learning Gurmukhi script faster?',
      author: 'Ravinder Sharma',
      timestamp: '2025-04-25 3:45 PM',
      replies: [
        {
          id: 201,
          content: 'Practice writing the Gurmukhi alphabet daily. Use flashcards for common words and try reading simple Punjabi children’s books.',
          author: 'Jasleen Brar',
          timestamp: '2025-04-25 4:20 PM',
        },
        {
          id: 202,
          content: 'Watching Punjabi movies with subtitles can help with vocabulary retention!',
          author: 'Amarjeet Toor',
          timestamp: '2025-04-25 5:00 PM',
        },
      ],
    },
    {
      id: 3,
      content: 'The Sikh History Quiz was fascinating! What are some good books to learn more about the Sikh Gurus?',
      author: 'Harjot Bains',
      timestamp: '2025-04-24 9:00 AM',
      replies: [
        {
          id: 301,
          content: 'I recommend "The Sikh Gurus" by Dr. Harish Dhillon. It’s a great overview of their lives and teachings.',
          author: 'Manpreet Sodhi',
          timestamp: '2025-04-24 10:30 AM',
        },
        {
          id: 302,
          content: 'Check out "History of the Sikhs" by Khushwant Singh for a detailed account of Sikh history.',
          author: 'Baljit Mann',
          timestamp: '2025-04-24 11:45 AM',
        },
        {
          id: 303,
          content: 'Another good one is "The Sikhs" by Patwant Singh. It covers both history and culture.',
          author: 'Sukhwinder Chahal',
          timestamp: '2025-04-24 12:15 PM',
        },
      ],
    },
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});

  const quizQuestions = {
    quiz1: [
      {
        question: 'What is the traditional dance of Punjab?',
        options: [
          { id: 1, text: 'Bhangra', isCorrect: true },
          { id: 2, text: 'Kathak', isCorrect: false },
          { id: 3, text: 'Bharatanatyam', isCorrect: false },
          { id: 4, text: 'Garba', isCorrect: false },
        ],
      },
      {
        question: 'Which city is known as the "City of Gardens" in Punjab?',
        options: [
          { id: 1, text: 'Amritsar', isCorrect: false },
          { id: 2, text: 'Ludhiana', isCorrect: false },
          { id: 3, text: 'Chandigarh', isCorrect: true },
          { id: 4, text: 'Jalandhar', isCorrect: false },
        ],
      },
      {
        question: 'What is the main language spoken in Punjab?',
        options: [
          { id: 1, text: 'Hindi', isCorrect: false },
          { id: 2, text: 'Punjabi', isCorrect: true },
          { id: 3, text: 'Urdu', isCorrect: false },
          { id: 4, text: 'English', isCorrect: false },
        ],
      },
      {
        question: 'Which river flows through Punjab?',
        options: [
          { id: 1, text: 'Ganges', isCorrect: false },
          { id: 2, text: 'Yamuna', isCorrect: false },
          { id: 3, text: 'Sutlej', isCorrect: true },
          { id: 4, text: 'Brahmaputra', isCorrect: false },
        ],
      },
      {
        question: 'What is the traditional attire for men in Punjab?',
        options: [
          { id: 1, text: 'Dhoti', isCorrect: false },
          { id: 2, text: 'Kurta-Pajama', isCorrect: false },
          { id: 3, text: 'Sherwani', isCorrect: false },
          { id: 4, text: 'Patiala Suit', isCorrect: true },
        ],
      },
      {
        question: 'Which festival is widely celebrated in Punjab?',
        options: [
          { id: 1, text: 'Diwali', isCorrect: false },
          { id: 2, text: 'Lohri', isCorrect: true },
          { id: 3, text: 'Holi', isCorrect: false },
          { id: 4, text: 'Eid', isCorrect: false },
        ],
      },
      {
        question: 'What is the staple food of Punjab?',
        options: [
          { id: 1, text: 'Rice', isCorrect: false },
          { id: 2, text: 'Wheat', isCorrect: true },
          { id: 3, text: 'Maize', isCorrect: false },
          { id: 4, text: 'Millet', isCorrect: false },
        ],
      },
      {
        question: 'Which Punjabi folk instrument is widely used in Bhangra music?',
        options: [
          { id: 1, text: 'Tabla', isCorrect: false },
          { id: 2, text: 'Dhol', isCorrect: true },
          { id: 3, text: 'Sitar', isCorrect: false },
          { id: 4, text: 'Flute', isCorrect: false },
        ],
      },
      {
        question: 'What is a popular Punjabi dish made with cornmeal?',
        options: [
          { id: 1, text: 'Makki di Roti', isCorrect: true },
          { id: 2, text: 'Paratha', isCorrect: false },
          { id: 3, text: 'Naan', isCorrect: false },
          { id: 4, text: 'Puri', isCorrect: false },
        ],
      },
      {
        question: 'Which traditional headgear is worn by Punjabi men?',
        options: [
          { id: 1, text: 'Topi', isCorrect: false },
          { id: 2, text: 'Pagri', isCorrect: true },
          { id: 3, text: 'Cap', isCorrect: false },
          { id: 4, text: 'Hat', isCorrect: false },
        ],
      },
      {
        question: 'What is the name of the traditional Punjabi embroidery?',
        options: [
          { id: 1, text: 'Phulkari', isCorrect: true },
          { id: 2, text: 'Chikankari', isCorrect: false },
          { id: 3, text: 'Kantha', isCorrect: false },
          { id: 4, text: 'Zari', isCorrect: false },
        ],
      },
      {
        question: 'Which Punjabi folk dance is performed by women during harvest?',
        options: [
          { id: 1, text: 'Giddha', isCorrect: true },
          { id: 2, text: 'Lavani', isCorrect: false },
          { id: 3, text: 'Bihu', isCorrect: false },
          { id: 4, text: 'Garba', isCorrect: false },
        ],
      },
      {
        question: 'What is the traditional Punjabi sweet made from milk solids?',
        options: [
          { id: 1, text: 'Jalebi', isCorrect: false },
          { id: 2, text: 'Pinni', isCorrect: true },
          { id: 3, text: 'Ladoo', isCorrect: false },
          { id: 4, text: 'Barfi', isCorrect: false },
        ],
      },
      {
        question: 'Which Punjabi martial art is practiced with weapons?',
        options: [
          { id: 1, text: 'Gatka', isCorrect: true },
          { id: 2, text: 'Kalaripayattu', isCorrect: false },
          { id: 3, text: 'Silambam', isCorrect: false },
          { id: 4, text: 'Thang-ta', isCorrect: false },
        ],
      },
      {
        question: 'What is the name of the traditional Punjabi footwear?',
        options: [
          { id: 1, text: 'Mojari', isCorrect: true },
          { id: 2, text: 'Kolhapuri', isCorrect: false },
          { id: 3, text: 'Jutti', isCorrect: false },
          { id: 4, text: ' sandal', isCorrect: false },
        ],
      },
    ],
    quiz2: [
      {
        question: 'Which Sikh Guru founded the city of Amritsar?',
        options: [
          { id: 1, text: 'Guru Nanak', isCorrect: false },
          { id: 2, text: 'Guru Arjan Dev', isCorrect: true },
          { id: 3, text: 'Guru Gobind Singh', isCorrect: false },
          { id: 4, text: 'Guru Tegh Bahadur', isCorrect: false },
        ],
      },
      {
        question: 'What is the name of the famous Golden Temple located in Amritsar?',
        options: [
          { id: 1, text: 'Harmandir Sahib', isCorrect: true },
          { id: 2, text: 'Akal Takht', isCorrect: false },
          { id: 3, text: 'Gurdwara Bangla Sahib', isCorrect: false },
          { id: 4, text: 'Gurdwara Sis Ganj Sahib', isCorrect: false },
        ],
      },
      {
        question: 'Who was the first Sikh Guru?',
        options: [
          { id: 1, text: 'Guru Nanak Dev', isCorrect: true },
          { id: 2, text: 'Guru Angad Dev', isCorrect: false },
          { id: 3, text: 'Guru Amar Das', isCorrect: false },
          { id: 4, text: 'Guru Ram Das', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru established the Khalsa Panth?',
        options: [
          { id: 1, text: 'Guru Gobind Singh', isCorrect: true },
          { id: 2, text: 'Guru Har Rai', isCorrect: false },
          { id: 3, text: 'Guru Arjan Dev', isCorrect: false },
          { id: 4, text: 'Guru Tegh Bahadur', isCorrect: false },
        ],
      },
      {
        question: 'What is the holy scripture of Sikhism called?',
        options: [
          { id: 1, text: 'Guru Granth Sahib', isCorrect: true },
          { id: 2, text: 'Adi Granth', isCorrect: false },
          { id: 3, text: 'Dasam Granth', isCorrect: false },
          { id: 4, text: 'Sarbloh Granth', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru compiled the Adi Granth?',
        options: [
          { id: 1, text: 'Guru Arjan Dev', isCorrect: true },
          { id: 2, text: 'Guru Nanak Dev', isCorrect: false },
          { id: 3, text: 'Guru Gobind Singh', isCorrect: false },
          { id: 4, text: 'Guru Amar Das', isCorrect: false },
        ],
      },
      {
        question: 'What year was the Khalsa Panth established?',
        options: [
          { id: 1, text: '1699', isCorrect: true },
          { id: 2, text: '1606', isCorrect: false },
          { id: 3, text: '1526', isCorrect: false },
          { id: 4, text: '1757', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru introduced the concept of "Miri-Piri"?',
        options: [
          { id: 1, text: 'Guru Hargobind', isCorrect: true },
          { id: 2, text: 'Guru Har Rai', isCorrect: false },
          { id: 3, text: 'Guru Angad Dev', isCorrect: false },
          { id: 4, text: 'Guru Ram Das', isCorrect: false },
        ],
      },
      {
        question: 'What is the Sikh symbol called?',
        options: [
          { id: 1, text: 'Khanda', isCorrect: true },
          { id: 2, text: 'Ik Onkar', isCorrect: false },
          { id: 3, text: 'Nishan Sahib', isCorrect: false },
          { id: 4, text: 'Chakra', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru was martyred in Delhi?',
        options: [
          { id: 1, text: 'Guru Tegh Bahadur', isCorrect: true },
          { id: 2, text: 'Guru Arjan Dev', isCorrect: false },
          { id: 3, text: 'Guru Gobind Singh', isCorrect: false },
          { id: 4, text: 'Guru Har Krishan', isCorrect: false },
        ],
      },
      {
        question: 'What is the name of the Sikh flag?',
        options: [
          { id: 1, text: 'Nishan Sahib', isCorrect: true },
          { id: 2, text: 'Khanda', isCorrect: false },
          { id: 3, text: 'Ik Onkar', isCorrect: false },
          { id: 4, text: 'Saffron Flag', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru founded the city of Anandpur Sahib?',
        options: [
          { id: 1, text: 'Guru Gobind Singh', isCorrect: true },
          { id: 2, text: 'Guru Ram Das', isCorrect: false },
          { id: 3, text: 'Guru Arjan Dev', isCorrect: false },
          { id: 4, text: 'Guru Hargobind', isCorrect: false },
        ],
      },
      {
        question: 'What is the Sikh code of conduct called?',
        options: [
          { id: 1, text: 'Rehat Maryada', isCorrect: true },
          { id: 2, text: 'Hukamnama', isCorrect: false },
          { id: 3, text: 'Ardas', isCorrect: false },
          { id: 4, text: 'Nitnem', isCorrect: false },
        ],
      },
      {
        question: 'Which Guru introduced the five Ks?',
        options: [
          { id: 1, text: 'Guru Gobind Singh', isCorrect: true },
          { id: 2, text: 'Guru Nanak Dev', isCorrect: false },
          { id: 3, text: 'Guru Arjan Dev', isCorrect: false },
          { id: 4, text: 'Guru Tegh Bahadur', isCorrect: false },
        ],
      },
      {
        question: 'What is the name of the daily Sikh prayer book?',
        options: [
          { id: 1, text: 'Nitnem', isCorrect: true },
          { id: 2, text: 'Sukhmani Sahib', isCorrect: false },
          { id: 3, text: 'Japji Sahib', isCorrect: false },
          { id: 4, text: 'Anand Sahib', isCorrect: false },
        ],
      },
    ],
    quiz3: [
      {
        question: 'What is the script used to write the Punjabi language?',
        options: [
          { id: 1, text: 'Gurmukhi', isCorrect: true },
          { id: 2, text: 'Devanagari', isCorrect: false },
          { id: 3, text: 'Shahmukhi', isCorrect: false },
          { id: 4, text: 'Brahmi', isCorrect: false },
        ],
      },
      {
        question: 'Which Sikh Guru standardized the Gurmukhi script?',
        options: [
          { id: 1, text: 'Guru Angad Dev', isCorrect: true },
          { id: 2, text: 'Guru Nanak Dev', isCorrect: false },
          { id: 3, text: 'Guru Arjan Dev', isCorrect: false },
          { id: 4, text: 'Guru Gobind Singh', isCorrect: false },
        ],
      },
      {
        question: 'What does the Punjabi word "Pind" mean?',
        options: [
          { id: 1, text: 'Village', isCorrect: true },
          { id: 2, text: 'City', isCorrect: false },
          { id: 3, text: 'River', isCorrect: false },
          { id: 4, text: 'Mountain', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi term for "Hello"?',
        options: [
          { id: 1, text: 'Sat Sri Akaal', isCorrect: true },
          { id: 2, text: 'Namaste', isCorrect: false },
          { id: 3, text: 'Salaam', isCorrect: false },
          { id: 4, text: 'Pranam', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi word for "Water"?',
        options: [
          { id: 1, text: 'Pani', isCorrect: true },
          { id: 2, text: 'Jal', isCorrect: false },
          { id: 3, text: 'Neer', isCorrect: false },
          { id: 4, text: 'Amrit', isCorrect: false },
        ],
      },
      {
        question: 'Which Punjabi word means "Love"?',
        options: [
          { id: 1, text: 'Pyar', isCorrect: true },
          { id: 2, text: 'Ishq', isCorrect: false },
          { id: 3, text: 'Mohabbat', isCorrect: false },
          { id: 4, text: 'Prem', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi term for "Family"?',
        options: [
          { id: 1, text: 'Parivar', isCorrect: true },
          { id: 2, text: 'Kutumb', isCorrect: false },
          { id: 3, text: 'Ghar', isCorrect: false },
          { id: 4, text: 'Sansaar', isCorrect: false },
        ],
      },
      {
        question: 'What does "Roti" mean in Punjabi?',
        options: [
          { id: 1, text: 'Bread', isCorrect: true },
          { id: 2, text: 'Rice', isCorrect: false },
          { id: 3, text: 'Curry', isCorrect: false },
          { id: 4, text: 'Sweet', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi word for "Friend"?',
        options: [
          { id: 1, text: 'Yaar', isCorrect: true },
          { id: 2, text: 'Dost', isCorrect: false },
          { id: 3, text: 'Mitra', isCorrect: false },
          { id: 4, text: 'Saathi', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi term for "Book"?',
        options: [
          { id: 1, text: 'Kitab', isCorrect: true },
          { id: 2, text: 'Pustak', isCorrect: false },
          { id: 3, text: 'Granth', isCorrect: false },
          { id: 4, text: 'Lekh', isCorrect: false },
        ],
      },
      {
        question: 'What does "Ghar" mean in Punjabi?',
        options: [
          { id: 1, text: 'House', isCorrect: true },
          { id: 2, text: 'Village', isCorrect: false },
          { id: 3, text: 'Temple', isCorrect: false },
          { id: 4, text: 'Market', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi word for "Sun"?',
        options: [
          { id: 1, text: 'Suraj', isCorrect: true },
          { id: 2, text: 'Chann', isCorrect: false },
          { id: 3, text: 'Tara', isCorrect: false },
          { id: 4, text: 'Dhoop', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi term for "Mother"?',
        options: [
          { id: 1, text: 'Maa', isCorrect: true },
          { id: 2, text: 'Bebe', isCorrect: false },
          { id: 3, text: 'Mata', isCorrect: false },
          { id: 4, text: 'Amma', isCorrect: false },
        ],
      },
      {
        question: 'What does "Chann" mean in Punjabi?',
        options: [
          { id: 1, text: 'Moon', isCorrect: true },
          { id: 2, text: 'Star', isCorrect: false },
          { id: 3, text: 'Sun', isCorrect: false },
          { id: 4, text: 'Cloud', isCorrect: false },
        ],
      },
      {
        question: 'What is the Punjabi word for "School"?',
        options: [
          { id: 1, text: 'School', isCorrect: true },
          { id: 2, text: 'Vidyalaya', isCorrect: false },
          { id: 3, text: 'Pathshala', isCorrect: false },
          { id: 4, text: 'Gurukul', isCorrect: false },
        ],
      },
    ],
  };

  const questions = quizQuestions[selectedQuiz];

  const startTimer = () => {
    setTimeLeft(quizDurations[selectedQuiz]);
    setTimerStarted(true);
  };

  const handleStartQuiz = () => {
    if (timerStarted) {
      setShowWarning(true);
    } else {
      resetQuiz();
      startTimer();
    }
  };

  useEffect(() => {
    if (timerStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowTimeUp(true);
            setTimerStarted(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerStarted, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (isCorrect, optionId) => {
    if (isEvaluated || timeLeft <= 0) return;

    setSelectedOption(optionId);
    setIsEvaluated(true);

    setSelectedAnswers([...selectedAnswers, { questionId: currentQuestion, optionId }]);

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      setSelectedOption(null);
      setIsEvaluated(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowSummary(true);
        setTimerStarted(false);
      }
    }, 1500);
  };

  const handleSubmitQuiz = () => {
    if (timeLeft > 0) {
      setShowSummary(true);
      setTimerStarted(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    resetQuiz();
  };

  const closeTimeUp = () => {
    setShowTimeUp(false);
    resetQuiz();
  };

  const handleWarningContinue = () => {
    setShowWarning(false);
    resetQuiz();
    startTimer();
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswers([]);
    setSelectedOption(null);
    setIsEvaluated(false);
    setTimeLeft(quizDurations[selectedQuiz]);
    setTimerStarted(false);
  };

  const handleQuizChange = (e) => {
    setSelectedQuiz(e.target.value);
    resetQuiz();
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (newPostContent.trim()) {
      setDiscussionPosts([
        ...discussionPosts,
        {
          id: Date.now(),
          content: newPostContent,
          author: 'User',
          timestamp: new Date().toLocaleString(),
          replies: [],
        },
      ]);
      setNewPostContent('');
    }
  };

  const handleReplySubmit = (postId, e) => {
    e.preventDefault();
    if (replyContent[postId]?.trim()) {
      setDiscussionPosts(
        discussionPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                replies: [
                  ...post.replies,
                  {
                    id: Date.now(),
                    content: replyContent[postId],
                    author: 'User',
                    timestamp: new Date().toLocaleString(),
                  },
                ],
              }
            : post
        )
      );
      setReplyContent({ ...replyContent, [postId]: '' });
    }
  };

  const toggleShowReplies = (postId) => {
    setShowAllReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const getOptionStyle = (option) => {
    if (!isEvaluated) return {};

    if (option.id === selectedOption) {
      return {
        backgroundColor: option.isCorrect ? 'green' : 'red',
        color: 'white',
      };
    } else if (option.isCorrect) {
      return {
        backgroundColor: 'green',
        color: 'white',
      };
    }
    return {};
  };

  return (
    <div className={`${styles.quizzContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <div
        className={styles.headerSection}
        style={{
          backgroundImage: `url(${isDarkMode ? getImagePath(headerDark) : getImagePath(headerLight)})`,
        }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headerTitle}>Test Your Knowledge</h1>
          <p className={styles.headerDescription}>
            Explore quizzes, join tournaments, and earn badges to showcase your expertise!
          </p>
          <button className={styles.headerButton} onClick={handleStartQuiz}>
            Start New Quiz
          </button>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to={'/'}>
          <span>Home</span>
        </Link>{' '}
        /{' '}
        <Link to={'/learning'}>
          <span>Learning</span>
        </Link>{' '}
        /{' '}
        <Link to={'/learning/quizzes/quizz/1'}>
          <span>Quizzes</span>
        </Link>
      </div>

      <div className={styles.quizDropdownContainer}>
        <select className={styles.quizDropdown} value={selectedQuiz} onChange={handleQuizChange}>
          <option value="quiz1">Punjabi Culture Quiz</option>
          <option value="quiz2">Sikh History Quiz</option>
          <option value="quiz3">Punjabi Language Quiz</option>
        </select>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.quizSection}>
          <div className={styles.timerSection}>
            <span className={styles.timerText}>
              Time Left: {timeLeft !== null ? formatTime(timeLeft) : 'Not Started'}
            </span>
            <button className={styles.startQuizButton} onClick={handleStartQuiz}>
              Start Quiz
            </button>
          </div>
          <div className={styles.questionSection}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <p className={styles.questionText}>{questions[currentQuestion].question}</p>
            <div className={styles.options}>
              {questions[currentQuestion].options.map((option) => (
                <button
                  key={option.id}
                  className={styles.optionButton}
                  style={getOptionStyle(option)}
                  onClick={() => handleAnswer(option.isCorrect, option.id)}
                  disabled={isEvaluated || timeLeft <= 0}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.navigationButtons}>
            <button
              className={styles.prevButton}
              disabled={currentQuestion === 0 || timeLeft <= 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              Previous
            </button>
            {currentQuestion < questions.length - 1 ? (
              <button
                className={styles.nextButton}
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!isEvaluated || timeLeft <= 0}
              >
                Next
              </button>
            ) : (
              <button
                className={styles.submitButton}
                onClick={handleSubmitQuiz}
                disabled={timeLeft <= 0}
              >
                Submit Quiz
              </button>
            )}
          </div>
          <div className={styles.topScorersSection}>
            <h2 className={styles.sectionTitle}>Today's Top Scorers</h2>
            <div className={styles.scorersList}>
              {[
                { name: 'John Doe', score: 95 },
                { name: 'Jane Smith', score: 90 },
                { name: 'Alice Johnson', score: 85 },
                { name: 'John Doe', score: 95 },
                { name: 'Jane Smith', score: 90 },
              ].map((scorer, index) => (
                <div key={index} className={styles.scorerCard}>
                  <span className={styles.scorerName}>{scorer.name}</span>
                  <span className={styles.scorerScore}>{scorer.score} Points</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.tournamentsSection}>
            <h2 className={styles.sidebarTitle}>Live Tournaments</h2>
            <div className={styles.tournamentList}>
              {[
                { title: 'Punjabi Culture Challenge', timeLeft: '2h 30m', participants: 150 },
                { title: 'Sikh History Trivia', timeLeft: '1h 45m', participants: 90 },
              ].map((tournament, index) => (
                <div key={index} className={styles.tournamentCard}>
                  <h3 className={styles.tournamentTitle}>{tournament.title}</h3>
                  <p className={styles.tournamentTime}>Time Left: {tournament.timeLeft}</p>
                  <p className={styles.tournamentParticipants}>
                    {tournament.participants} Participants
                  </p>
                  <button className={styles.joinButton}>Join Now</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.badgesSection}>
            <h2 className={styles.sidebarTitle}>Your Badges</h2>
            <div className={styles.badgesGrid}>
              {[
                { icon: '🏆', title: 'Quiz Master', description: 'Complete 50 quizzes.' },
                { icon: '🎖️', title: 'Tournament Champion', description: 'Win 3 tournaments.' },
              ].map((badge, index) => (
                <div key={index} className={styles.badgeCard}>
                  <div className={styles.badgeIcon}>{badge.icon}</div>
                  <h3 className={styles.badgeTitle}>{badge.title}</h3>
                  <p className={styles.badgeDescription}>{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.discussionSection}>
        <h2 className={styles.discussionTitle}>Discussion Forum</h2>
        <div className={styles.newPostForm}>
          <textarea
            className={styles.newPostTextarea}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Start a new discussion..."
          ></textarea>
          <button onClick={handlePostSubmit} className={styles.postButton}>
            Post
          </button>
        </div>
        <div className={styles.postsList}>
          {discussionPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <span className={styles.postAuthor}>{post.author}</span>
                <span className={styles.postTimestamp}>{post.timestamp}</span>
              </div>
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.replies}>
                {post.replies
                  .slice(0, showAllReplies[post.id] ? post.replies.length : 2)
                  .map((reply) => (
                    <div key={reply.id} className={styles.replyCard}>
                      <div className={styles.postHeader}>
                        <span className={styles.postAuthor}>{reply.author}</span>
                        <span className={styles.postTimestamp}>{reply.timestamp}</span>
                      </div>
                      <p className={styles.postContent}>{reply.content}</p>
                    </div>
                  ))}
                {post.replies.length > 2 && (
                  <button
                    className={styles.showMoreButton}
                    onClick={() => toggleShowReplies(post.id)}
                  >
                    <span>  </span> {showAllReplies[post.id] ? 'Show Less' : 'Show More'} <span> </span>
                  </button>
                )}
              </div>
              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyTextarea}
                  value={replyContent[post.id] || ''}
                  onChange={(e) =>
                    setReplyContent({ ...replyContent, [post.id]: e.target.value })
                  }
                  placeholder="Write a reply..."
                ></textarea>
                <button onClick={(e) => handleReplySubmit(post.id, e)} className={styles.replyButton}>
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Participate in These Games</h2>
        <div className={styles.gamesGrid}>
          {[
            { title: 'Punjabi Trivia', description: 'Test your knowledge of Punjabi culture.', image: games },
            { title: 'Sikh History Quiz', description: 'Explore the rich history of Sikhism.', image: games },
            { title: 'Cultural Fest Quiz', description: 'Learn about Punjab’s vibrant festivals.', image: games },
            { title: 'Punjabi Music Trivia', description: 'Test your knowledge of Punjabi folk music.', image: games },
            { title: 'Sikh Gurus Quiz', description: 'Dive into the teachings of the Sikh Gurus.', image: games },
            { title: 'Punjabi Cuisine Quiz', description: 'Explore the flavors of Punjabi food.', image: games },
            { title: 'Traditional Arts Quiz', description: 'Discover Punjab’s art and crafts.', image: games },
          ].map((game, index) => (
            <div key={index} className={styles.gameCard}>
              <div className={styles.gameFront}>
                <img src={getImagePath(game.image)} alt={game.title} className={styles.gameImage} />
                <h3 className={styles.gameTitle}>{game.title}</h3>
              </div>
              <div className={styles.gameBack}>
                <p className={styles.gameDescription}>{game.description}</p>
                <button className={styles.joinButton}>Join Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showSummary && (
        <div className={styles.summaryPopup}>
          <div className={`${styles.summaryContent} ${styles.success}`}>
            <div className={styles.circularProgress}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path
                  className={styles.circleBg}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={styles.circle}
                  strokeDasharray={`${(score / questions.length) * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            <h2 className={styles.summaryTitle}>Quiz Completed!</h2>
            <p className={styles.summaryScore}>Your Score: {score}/{questions.length}</p>
            <p className={styles.summaryBadge}>Badge Earned: 🏆 Quiz Master</p>
            <p className={styles.summaryAchievement}>Achievement Unlocked: Time Master!</p>
            <button className={styles.closeButton} onClick={closeSummary}>
              Close
            </button>
          </div>
        </div>
      )}

      {showTimeUp && (
        <div className={styles.summaryPopup}>
          <div className={`${styles.summaryContent} ${styles.failure}`}>
            <h2 className={styles.summaryTitle}>Time's Up!</h2>
            <p className={styles.summaryMessage}>Better luck next time! Try again to complete the quiz within the time limit.</p>
            <button className={styles.closeButton} onClick={closeTimeUp}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {showWarning && (
        <div className={styles.warningPopup}>
          <div className={styles.warningContent}>
            <h2 className={styles.warningTitle}>Warning</h2>
            <p className={styles.warningMessage}>
              This action will leave your current quiz. Are you sure you want to continue?
            </p>
            <div className={styles.warningButtons}>
              <button className={styles.cancelButton} onClick={handleWarningCancel}>
                Cancel
              </button>
              <button className={styles.continueButton} onClick={handleWarningContinue}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;