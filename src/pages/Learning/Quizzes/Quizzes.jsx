import React, { useState } from 'react';
import styles from './Quizzes.module.css';
import headerLight from '../../../images/Quizzes/header-image.jpg'; // Light mode header image
import headerDark from '../../../images/Quizzes/header-image-dark.png'; // Dark mode header image
import games from '../../../images/Quizzes/games.jpg';
import { Link } from 'react-router-dom';

const Quizzes = ({ isDarkMode }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null); // Track selected option
  const [isEvaluated, setIsEvaluated] = useState(false); // Track if the answer is evaluated

  const questions = [
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
      question: 'Which Punjabi folk instrument is widely used in Bhangra music?',
      options: [
        { id: 1, text: 'Tabla', isCorrect: false },
        { id: 2, text: 'Dhol', isCorrect: true },
        { id: 3, text: 'Sitar', isCorrect: false },
        { id: 4, text: 'Flute', isCorrect: false },
      ],
    },
  ];

  const handleAnswer = (isCorrect, optionId) => {
    if (isEvaluated) return; // Prevent multiple clicks

    setSelectedOption(optionId); // Set the selected option
    setIsEvaluated(true); // Mark the answer as evaluated

    setSelectedAnswers([...selectedAnswers, { questionId: currentQuestion, optionId }]);

    if (isCorrect) {
      setScore(score + 1);
    }

    // Move to the next question after a delay
    setTimeout(() => {
      setSelectedOption(null); // Reset selected option
      setIsEvaluated(false); // Reset evaluation state
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowSummary(true);
      }
    }, 1500); // 1.5 seconds delay
  };

  const handleSubmitQuiz = () => {
    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
  };

  // Function to determine the button style based on the selected option
  const getOptionStyle = (option) => {
    if (!isEvaluated) return {}; // No style if not evaluated

    if (option.id === selectedOption) {
      // Selected option: red if wrong, green if correct
      return {
        backgroundColor: option.isCorrect ? 'green' : 'red',
        color: 'white',
      };
    } else if (option.isCorrect) {
      // Correct option: green
      return {
        backgroundColor: 'green',
        color: 'white',
      };
    }
    return {}; // Default style
  };

  return (
    <div className={`${styles.quizzContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      {/* Header Section with Image and Text Overlay */}
      <div
        className={styles.headerSection}
        style={{ backgroundImage: `url(${isDarkMode ? headerDark : headerLight})` }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headerTitle}>Test Your Knowledge</h1>
          <p className={styles.headerDescription}>
            Explore quizzes, join tournaments, and earn badges to showcase your expertise!
          </p>
          <button className={styles.headerButton}>Start New Quiz</button>
        </div>
      </div>
      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/learning'}><span> Learning</span></Link> /
        <Link to={'/learning'}><span> Quizzes</span></Link>

      </div>

      {/* Quiz Dropdown */}
      <div className={styles.quizDropdownContainer}>
        <select className={styles.quizDropdown}>
          <option value="quiz1">Punjabi Culture Quiz</option>
          <option value="quiz2">Sikh History Quiz</option>
          <option value="quiz3">Punjabi Language Quiz</option>
        </select>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Side: Quiz Section */}
        <div className={styles.quizSection}>
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
                  disabled={isEvaluated} // Disable buttons after selection
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.navigationButtons}>
            <button
              className={styles.prevButton}
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              Previous
            </button>
            {currentQuestion < questions.length - 1 ? (
              <button
                className={styles.nextButton}
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!isEvaluated} // Disable next button until answer is evaluated
              >
                Next
              </button>
            ) : (
              <button className={styles.submitButton} onClick={handleSubmitQuiz}>
                Submit Quiz
              </button>
            )}
          </div>
          {/* Today's Top Scorers Section */}
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

        {/* Right Side: Sidebar */}
        <div className={styles.sidebar}>
          {/* Tournaments Section */}
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

          {/* Badges Section */}
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

      {/* Participate in These Games Section */}
      <div className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Participate in These Games</h2>
        <div className={styles.gamesGrid}>
          {[
            { title: 'Punjabi Trivia', description: 'Test your knowledge of Punjabi culture.', image: games },
            { title: 'Sikh History Quiz', description: 'Explore the rich history of Sikhism.', image: games },
            { title: 'Punjabi Trivia', description: 'Test your knowledge of Punjabi culture.', image: games },
            { title: 'Sikh History Quiz', description: 'Explore the rich history of Sikhism.', image: games },
          ].map((game, index) => (
            <div key={index} className={styles.gameCard}>
              <div className={styles.gameFront}>
                <img src={game.image} alt={game.title} className={styles.gameImage} />
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

      {/* Summary Popup */}
      {showSummary && (
        <div className={styles.summaryPopup}>
          <div className={styles.summaryContent}>
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
            <button className={styles.closeButton} onClick={closeSummary}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;