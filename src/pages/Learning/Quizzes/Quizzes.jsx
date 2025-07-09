import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './Quizzes.module.css';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { FaLock, FaTimes } from 'react-icons/fa';

const FALLBACK_API_URL = 'http://virsaa-prod.eba-7cc3yk92.us-east-1.elasticbeanstalk.com';

// Utility function to handle public/static images
const getProductionImagePath = (imagePath) => {
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

const Quizzes = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const { isLoggedIn, isPremium, accessToken, API_STRING } = useAuth();
  const effectiveApiString = apiString || API_STRING || FALLBACK_API_URL;
  const getStaticImagePath = getProductionImagePath;
  const headerLight = getStaticImagePath('/images/header-image.png');
  const headerDark = getStaticImagePath('/images/header-image-dark.png');
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
  const [topScorers, setTopScorers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentScores, setTournamentScores] = useState([]);

  const quizDuration = 10 * 60; // Default 10 minutes

  useEffect(() => {
    console.log('useAuth output:', { isLoggedIn, isPremium, accessToken, API_STRING });
    console.log('Effective API_STRING:', effectiveApiString);

    const config = isLoggedIn && accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {};

    const fetchQuizData = async () => {
      try {
        const response = await axios.get(`${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/`, config);
        console.log('Fetched quiz:', response.data);
        setQuiz(response.data);
        setQuestions(response.data.questions || []);
        setTimeLeft(quizDuration);
      } catch (err) {
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.detail || 'Resource not found'}`
          : 'Network error or server unreachable';
        console.error('Error fetching quiz data:', errorMessage, err);
        setError(errorMessage);
      }
    };

    const fetchDiscussions = async () => {
      try {
        const response = await axios.get(`${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/discussions/`, config);
        console.log('Fetched discussions:', response.data);
        setDiscussionPosts(response.data.map(post => ({ ...post, replies: post.replies || [] })));
      } catch (err) {
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.detail || 'Discussions not found'}`
          : 'Network error or server unreachable';
        console.error('Error fetching discussions:', errorMessage, err);
        setError(errorMessage);
      }
    };

    const fetchTopScorers = async () => {
      try {
        const response = await axios.get(`${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/top_scorers/`, config);
        console.log('Fetched top scorers:', response.data);
        setTopScorers(response.data);
      } catch (err) {
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.detail || 'Top scorers not found'}`
          : 'Network error or server unreachable';
        console.error('Error fetching top scorers:', errorMessage, err);
        setError(errorMessage);
      }
    };

    const fetchTournaments = async () => {
      try {
        const response = await axios.get(`${effectiveApiString.replace(/\/$/, "")}/api/learning/tournaments/`, config);
        console.log('Fetched tournaments:', response.data);
        setTournaments(response.data);
      } catch (err) {
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.detail || 'Tournaments not found'}`
          : 'Network error or server unreachable';
        console.error('Error fetching tournaments:', errorMessage, err);
        setError(errorMessage);
      }
    };

    const fetchBadges = async () => {
      if (!isLoggedIn || !accessToken) return;
      try {
        const response = await axios.get(`${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/badges/`, config);
        console.log('Fetched badges:', response.data);
        setBadges(response.data);
      } catch (err) {
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.detail || 'Badges not found'}`
          : 'Network error or server unreachable';
        console.error('Error fetching badges:', errorMessage, err);
        setError(errorMessage);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchQuizData(), fetchDiscussions(), fetchTopScorers(), fetchTournaments(), fetchBadges()]);
      setIsLoading(false);
    };

    fetchData();
  }, [id, isLoggedIn, isPremium, quizDuration, accessToken, API_STRING, effectiveApiString]);

  useEffect(() => {
    console.log('showTournamentModal changed:', showTournamentModal);
  }, [showTournamentModal]);

  const startTimer = () => {
    setTimeLeft(quizDuration);
    setTimerStarted(true);
    setTimerPaused(false);
  };

  const togglePauseResume = () => {
    setTimerPaused(!timerPaused);
  };

  const handleStartQuiz = async (tournamentId = null) => {
    if (!quiz || (quiz.is_restricted && !isLoggedIn) || (quiz.is_premium && !isPremium)) {
      setError(quiz?.is_premium ? 'Premium subscription required' : 'Please log in to start the quiz');
      return;
    }
    if (timerStarted) {
      setShowWarning(true);
      return;
    }
    if (tournamentId) {
      if (!isLoggedIn || !accessToken) {
        setError('Please log in to join the tournament');
        return;
      }
      try {
        console.log('Attempting to join tournament with ID:', tournamentId);
        console.log('API Endpoint:', `${effectiveApiString.replace(/\/$/, "")}/api/learning/tournaments/${tournamentId}/join/`);
        console.log('Access Token:', accessToken);
        const response = await axios.post(
          `${effectiveApiString.replace(/\/$/, "")}/api/learning/tournaments/${tournamentId}/join/`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log('Joined tournament:', response.data);
        setTournamentScores(response.data.scores || []);
      } catch (err) {
        console.error('Error joining tournament:', err);
        const errorMessage = err.response
          ? `HTTP ${err.response.status}: ${err.response.data.error || 'Failed to join tournament'}`
          : 'Network error or server unreachable';
        console.error('Full error response:', err.response ? err.response.data : err);
        setError(errorMessage);
        return;
      }
    }
    resetQuiz(tournamentId);
    startTimer();
    setShowTournamentModal(false);
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
  }, [timerStarted, timerPaused, timeLeft]);

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
    if (!isLoggedIn || !accessToken) return;
    try {
      const endpoint = selectedTournament
        ? `${effectiveApiString.replace(/\/$/, "")}/api/learning/tournaments/${selectedTournament}/submit_score/`
        : `${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/submit_score/`;
      await axios.post(
        endpoint,
        { score },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('Score submitted successfully');
    } catch (err) {
      console.error('Error submitting score:', err);
      setError('Failed to submit score');
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
    resetQuiz(selectedTournament);
    startTimer();
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
  };

  const resetQuiz = (tournamentId = null) => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswers([]);
    setSelectedOption(null);
    setIsEvaluated(false);
    setTimeLeft(quizDuration);
    setTimerStarted(false);
    setTimerPaused(false);
    setSelectedTournament(tournamentId);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Please log in to post a discussion');
      return;
    }
    if (newPostContent.trim()) {
      try {
        const response = await axios.post(
          `${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/add_discussion/`,
          { content: newPostContent, quiz: id },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const newPost = { ...response.data, replies: response.data.replies || [] };
        console.log('New post:', newPost);
        setDiscussionPosts([...discussionPosts, newPost]);
        setNewPostContent('');
      } catch (err) {
        console.error('Error posting discussion:', err);
        setError('Failed to post discussion');
      }
    }
  };

  const handleReplySubmit = async (postId, e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Please log in to post a reply');
      return;
    }
    if (replyContent[postId]?.trim()) {
      try {
        const response = await axios.post(
          `${effectiveApiString.replace(/\/$/, "")}/api/learning/learning-material/${id}/add_reply/`,
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
        setError('Failed to post reply');
      }
    }
  };

  const toggleShowReplies = (postId) => {
    setShowAllReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleOpenTournamentModal = async (tournamentId) => {
    console.log('handleOpenTournamentModal called with tournamentId:', tournamentId);
    console.log('Auth status:', { isLoggedIn, accessToken });
    setSelectedTournament(tournamentId);
    // Mock scores for display in modal (replace with real API call if endpoint exists)
    setTournamentScores([
      { user: 'User1', score: 90 },
      { user: 'User2', score: 85 },
      { user: 'User3', score: 80 },
    ]);
    setShowTournamentModal(true);
  };

  const closeTournamentModal = () => {
    setShowTournamentModal(false);
    setSelectedTournament(null);
    setTournamentScores([]);
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
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!quiz) {
    return <div className={styles.error}>Quiz not found</div>;
  }

  return (
    <div className={`${styles.quizzContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <div
        className={styles.headerSection}
        style={{
          backgroundImage: `url(${isDarkMode ? headerDark : headerLight})`,
        }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headerTitle}>{quiz.title}</h1>
          <p className={styles.headerDescription}>{quiz.description}</p>
          <button className={styles.headerButton} onClick={() => handleStartQuiz()}>
            Start New Quiz
          </button>
          {(quiz.is_restricted || quiz.is_premium) && (
            <div className={styles.lockOverlay}>
              <FaLock />
              <p>{quiz.is_premium ? 'Premium Required' : 'Login Required'}</p>
            </div>
          )}
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
              onClick={timerStarted ? togglePauseResume : () => handleStartQuiz()}
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
              {topScorers.length > 0 ? (
                topScorers.map((scorer, index) => (
                  <div key={index} className={styles.scorerCard}>
                    <span className={styles.scorerName}>{scorer.user}</span>
                    <span className={styles.scorerScore}>{scorer.score} Points</span>
                  </div>
                ))
              ) : (
                <p>No top scorers available.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.tournamentsSection}>
            <h2 className={styles.sidebarTitle}>Live Tournaments</h2>
            {console.log('Tournaments:', tournaments)}
            <div className={styles.tournamentList}>
              {tournaments.filter(tournament => tournament.is_active).length > 0 ? (
                tournaments
                  .filter(tournament => tournament.is_active)
                  .slice(0, 3)
                  .map((tournament, index) => (
                    <div key={index} className={styles.tournamentCard}>
                      <h3 className={styles.tournamentTitle}>{tournament.title}</h3>
                      <p className={styles.tournamentTime}>Time Left: {tournament.time_left}</p>
                      <p className={styles.tournamentParticipants}>
                        {tournament.participant_count} Participants
                      </p>
                      <button
                        className={styles.joinButton}
                        onClick={() => handleOpenTournamentModal(tournament.id)}
                      >
                        Join Now
                      </button>
                    </div>
                  ))
              ) : (
                <p>No active tournaments available.</p>
              )}
            </div>
          </div>

          <div className={styles.badgesSection}>
            <h2 className={styles.sidebarTitle}>Your Badges</h2>
            <div className={styles.badgesGrid}>
              {badges.length > 0 ? (
                badges.map((badge, index) => (
                  <div key={index} className={styles.badgeCard}>
                    <div className={styles.badgeIcon}>
                      {badge.badge_type === 'quiz_master' ? '🏆' : '🎖️'}
                    </div>
                    <h3 className={styles.badgeTitle}>{badge.display_name}</h3>
                    <p className={styles.badgeDescription}>{badge.description}</p>
                  </div>
                ))
              ) : (
                <p>No badges earned yet.</p>
              )}
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
          {discussionPosts.length > 0 ? (
            discussionPosts.map((post) => (
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
                    .slice(0, showAllReplies[post.id] ? post.replies.length : 2)
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
                  {post.replies.length > 2 && (
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
            ))
          ) : (
            <p>No discussions available.</p>
          )}
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

      {showTournamentModal && (
        console.log('Rendering tournament modal with scores:', tournamentScores),
        <div key={selectedTournament} className={styles.tournamentModal}>
          <div className={styles.tournamentModalContent}>
            <button className={styles.tournamentModalCloseIcon} onClick={closeTournamentModal}>
              <FaTimes />
            </button>
            <p className={styles.tournamentModalSubheading}>I can beat that!</p>
            <h2 className={styles.tournamentModalTitle}>Join Tournament</h2>
            <div className={styles.tournamentScoresList}>
              {tournamentScores.length > 0 ? (
                tournamentScores.map((score, index) => (
                  <div key={index} className={styles.tournamentScoreCard}>
                    <span className={styles.tournamentScoreUser}>{score.user}</span>
                    <span className={styles.tournamentScoreValue}>{score.score} Points</span>
                  </div>
                ))
              ) : (
                <p>No scores available for this tournament.</p>
              )}
            </div>
            <button
              className={styles.tournamentStartButton}
              onClick={() => {
                handleStartQuiz(selectedTournament);
                // Do not close modal here; let handleStartQuiz handle it
              }}
            >
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;