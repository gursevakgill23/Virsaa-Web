import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './Quizzes.module.css';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

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
  const { id } = useParams();
  const { isLoggedIn, accessToken } = useAuth();
  const getImagePath = useProductionImagePath();
  const headerLight = '/images/header-image.jpg';
  const headerDark = '/images/header-image-dark.png';
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const quizDuration = 10 * 60; // Default 10 minutes

  useEffect(() => {
    const fetchQuizData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/learning/learning-material/${id}/`, {
          headers: isLoggedIn ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        setQuiz(response.data);
        setQuestions(response.data.questions || []);
        setTimeLeft(quizDuration);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDiscussions = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/learning/learning-material/${id}/discussions/`, {
          headers: isLoggedIn ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        setDiscussionPosts(response.data);
      } catch (err) {
        console.error('Error fetching discussions:', err);
      }
    };

    fetchQuizData();
    fetchDiscussions();
  }, [id, isLoggedIn, accessToken, quizDuration]);

  const startTimer = () => {
    setTimeLeft(quizDuration);
    setTimerStarted(true);
    setTimerPaused(false);
  };

  const togglePauseResume = () => {
    setTimerPaused(!timerPaused);
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
    if (timerStarted && !timerPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowTimeUp(true);
            setTimerStarted(false);
            setTimerPaused(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerStarted, timerPaused, timeLeft, quizDuration]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async (isCorrect, optionId) => {
    if (isEvaluated || timeLeft <= 0 || timerPaused) return;

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
        submitScore();
        setShowSummary(true);
        setTimerStarted(false);
        setTimerPaused(false);
      }
    }, 1500);
  };

  const submitScore = async () => {
    if (!isLoggedIn) return;
    try {
      await axios.post(
        `http://localhost:8000/api/learning/items/${id}/submit_score/`,
        { score },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (err) {
      console.error('Error submitting score:', err);
    }
  };

  const handleSubmitQuiz = () => {
    if (timeLeft > 0) {
      submitScore();
      setShowSummary(true);
      setTimerStarted(false);
      setTimerPaused(false);
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
    setTimeLeft(quizDuration);
    setTimerStarted(false);
    setTimerPaused(false);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('Please log in to post a discussion');
      return;
    }
    if (newPostContent.trim()) {
      try {
        const response = await axios.post(
          `http://localhost:8000/api/learning/learning-material/${id}/add_discussion/`,
          { content: newPostContent, learning_item: id },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        // Ensure new post has replies initialized as an empty array
        const newPost = { ...response.data, replies: response.data.replies || [] };
        console.log('New post:', newPost); // Debug
        setDiscussionPosts([...discussionPosts, newPost]);
        setNewPostContent('');
      } catch (err) {
        console.error('Error posting discussion:', err);
      }
    }
  };

  const handleReplySubmit = async (postId, e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('Please log in to post a reply');
      return;
    }
    if (replyContent[postId]?.trim()) {
      try {
        const response = await axios.post(
          `http://localhost:8000/api/learning/learning-material/${id}/add_reply/`,
          { content: replyContent[postId], post_id: postId },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setDiscussionPosts(
          discussionPosts.map((post) =>
            post.id === postId
              ? { ...post, replies: [...(post.replies || []), response.data] }
              : post
          )
        );
        setReplyContent({ ...replyContent, [postId]: '' });
      } catch (err) {
        console.error('Error posting reply:', err);
      }
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
        backgroundColor: option.is_correct ? 'green' : 'red',
        color: 'white',
      };
    } else if (option.is_correct) {
      return {
        backgroundColor: 'green',
        color: 'white',
      };
    }
    return {};
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={`${styles.quizzContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <div
        className={styles.headerSection}
        style={{
          backgroundImage: `url(${isDarkMode ? getImagePath(headerDark) : getImagePath(headerLight)})`,
        }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headerTitle}>{quiz?.title || 'Test Your Knowledge'}</h1>
          <p className={styles.headerDescription}>
            {quiz?.description || 'Explore quizzes, join tournaments, and earn badges to showcase your expertise!'}
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
        <Link to={`/learning/quizzes/${id}`}>
          <span>Quizzes</span>
        </Link>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.quizSection}>
          <div className={styles.timerSection}>
            <span className={styles.timerText}>
              Time Left: {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
            </span>
            <button
              className={styles.startQuizButton}
              onClick={timerStarted ? togglePauseResume : handleStartQuiz}
            >
              {timerStarted ? (timerPaused ? 'Resume' : 'Pause') : 'Start Quiz'}
            </button>
          </div>
          {questions.length > 0 && (
            <div className={styles.questionSection}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
              <p className={styles.questionText}>{questions[currentQuestion].text}</p>
              <div className={styles.options}>
                {questions[currentQuestion].options.map((option) => (
                  <button
                    key={option.id}
                    className={styles.optionButton}
                    style={getOptionStyle(option)}
                    onClick={() => handleAnswer(option.is_correct, option.id)}
                    disabled={!timerStarted || isEvaluated || timeLeft <= 0 || timerPaused}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {questions.length > 0 && (
            <div className={styles.navigationButtons}>
              <button
                className={styles.prevButton}
                disabled={currentQuestion === 0 || timeLeft <= 0 || timerPaused}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Previous
              </button>
              {currentQuestion < questions.length - 1 ? (
                <button
                  className={styles.nextButton}
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!isEvaluated || timeLeft <= 0 || timerPaused}
                >
                  Next
                </button>
              ) : (
                <button
                  className={styles.submitButton}
                  onClick={handleSubmitQuiz}
                  disabled={timeLeft <= 0 || timerPaused}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          )}
          <div className={styles.topScorersSection}>
            <h2 className={styles.sectionTitle}>Today's Top Scorers</h2>
            <div className={styles.scorersList}>
              {[
                { name: 'John Doe', score: 95 },
                { name: 'Jane Smith', score: 90 },
                { name: 'Alice Johnson', score: 85 },
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
            disabled={!isLoggedIn}
          ></textarea>
          <button onClick={handlePostSubmit} className={styles.postButton} disabled={!isLoggedIn}>
            Post
          </button>
        </div>
        <div className={styles.postsList}>
          {discussionPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <span className={styles.postAuthor}>{post.author}</span>
                <span className={styles.postTimestamp}>
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.replies}>
                {(post.replies || [])
                  .slice(0, showAllReplies[post.id] ? (post.replies || []).length : 2)
                  .map((reply) => (
                    <div key={reply.id} className={styles.replyCard}>
                      <div className={styles.postHeader}>
                        <span className={styles.postAuthor}>{reply.author}</span>
                        <span className={styles.postTimestamp}>
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className={styles.postContent}>{reply.content}</p>
                    </div>
                  ))}
                {(post.replies || []).length > 2 && (
                  <button
                    className={styles.showMoreButton}
                    onClick={() => toggleShowReplies(post.id)}
                  >
                    {showAllReplies[post.id] ? 'Show Less' : 'Show More'}
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
                  disabled={!isLoggedIn}
                ></textarea>
                <button
                  onClick={(e) => handleReplySubmit(post.id, e)}
                  className={styles.replyButton}
                  disabled={!isLoggedIn}
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSummary && (
        <div className={styles.summaryPopup}>
          <div className={`${styles.summaryContent} ${styles.success}`}>
            <div className={styles.circularProgress}>
              <svg
                viewBox="0 0 36 36"
                className={styles.circularChart}
                style={{
                  width: `${100 + (score / questions.length) * 60}px`,
                  height: `${100 + (score / questions.length) * 60}px`,
                }}
              >
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