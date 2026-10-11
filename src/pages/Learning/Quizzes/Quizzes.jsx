import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaLock, FaTimes, FaPlay, FaPause, FaRedo, FaTrophy, FaMedal, FaUsers, FaClock,
  FaCheck, FaChevronLeft, FaChevronRight, FaCrown,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import styles from './Quizzes.module.css';
import { useAuth } from '../../../context/AuthContext';
import learningApi from '../../../api/learningApi';
import useHistoryRecorder from '../../../hooks/useHistoryRecorder';
import BadgeIcon from '../../../components/BadgeIcon/BadgeIcon';

// Utility function to handle public/static images
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

const QUIZ_DURATION = 10 * 60; // used when the quiz has no time limit set in the admin
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const RING = 2 * Math.PI * 52;

const formatTime = (seconds) => {
  const s = Math.max(0, seconds || 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// "2d 4h left" from the tournament's end_time
const tournamentTimeLeft = (end) => {
  const ms = new Date(end) - Date.now();
  if (!end || Number.isNaN(ms)) return '';
  if (ms <= 0) return 'Ended';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
};

// "4 minutes", "1 min 30 s"
const describeDuration = (seconds) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s} seconds`;
  if (!s) return `${m} minute${m === 1 ? '' : 's'}`;
  return `${m} min ${s} s`;
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '');

/* Small accessible dialog: closes on Escape and on backdrop click */
const Dialog = ({ labelledBy, onClose, children, className = '' }) => {
  const panelRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        className={`${styles.dialog} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

const Quizzes = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const { isLoggedIn, isPremium, accessToken, API_STRING } = useAuth();
  const apiUrl = (apiString || API_STRING || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const recordHistory = useHistoryRecorder(apiUrl);
  const headerImage = getProductionImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const consoleRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
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
  const [error, setError] = useState(null);     // only for "quiz could not load"
  const [notice, setNotice] = useState(null);   // everything else, shown inline
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentScores, setTournamentScores] = useState([]);
  const [answers, setAnswers] = useState({});               // { questionId: optionId } for server marking
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  const [result, setResult] = useState(null);               // what the server sent back after submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtRef = useRef(null);
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef(null);

  useEffect(() => {
    const config = isLoggedIn && accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
    const base = `${apiUrl}/api/learning`;

    // Only the quiz itself is required. The other sections fail quietly and
    // just show their empty state, instead of blanking the whole page.
    const fetchQuizData = async () => {
      try {
        const response = await axios.get(`${base}/learning-material/${id}/`, config);
        setQuiz(response.data);
        setQuestions(response.data.questions || []);
        setTimeLeft(response.data.time_limit_seconds || QUIZ_DURATION);
      } catch (err) {
        console.error('Error fetching quiz:', err.response?.status || err.message);
        setError(err.response?.status === 404 ? 'This quiz doesn’t exist.' : 'This quiz couldn’t be loaded.');
      }
    };

    const quiet = (label, request, setter, map = (d) => d) => request
      .then((res) => setter(map(res.data || [])))
      .catch((err) => console.error(`Error fetching ${label}:`, err.response?.status || err.message));

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchQuizData(),
        quiet('discussions', axios.get(`${base}/learning-material/${id}/discussions/`, config), setDiscussionPosts,
          (d) => d.map((post) => ({ ...post, replies: post.replies || [] }))),
        quiet('top scorers', axios.get(`${base}/items/${id}/leaderboard/`, config), setTopScorers),
        quiet('tournaments', axios.get(`${base}/tournaments/`, config), setTournaments),
        isLoggedIn && accessToken
          ? quiet('badges', axios.get(`${base}/learning-material/${id}/badges/`, config), setBadges)
          : Promise.resolve(),
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, [id, isLoggedIn, isPremium, accessToken, apiUrl]);

  // Opening a quiz adds it to History
  useEffect(() => {
    if (!quiz || String(quiz.id) !== String(id)) return;
    recordHistory({
      type: 'quiz',
      item_id: quiz.id,
      title: quiz.title,
      path: `/learning/quizzes/${quiz.id}`,
      image: quiz.image_url || quiz.image || '',
    });
  }, [quiz, id, recordHistory]);

  // Countdown
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
    return undefined;
  }, [timerStarted, timerPaused, timeLeft]);

  const isBlocked = quiz && ((quiz.is_restricted && !isLoggedIn) || (quiz.is_premium && !isPremium));
  const quizDuration = quiz?.time_limit_seconds || QUIZ_DURATION;
  const perQuestionLimit = (q) => q?.time_limit_seconds || quiz?.time_per_question_seconds || null;

  // Per-question timer (only when the quiz or question has one set in the admin)
  useEffect(() => {
    if (!timerStarted || timerPaused || isEvaluated || questionTimeLeft === null) return undefined;
    if (questionTimeLeft <= 0) {
      // Out of time for this question: count it as wrong and move on
      handleAnswer(false, null);
      return undefined;
    }
    const t = setTimeout(() => setQuestionTimeLeft((v) => (v === null ? v : v - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStarted, timerPaused, isEvaluated, questionTimeLeft]);

  // Reset the per-question timer when the question changes
  useEffect(() => {
    if (timerStarted) setQuestionTimeLeft(perQuestionLimit(questions[currentQuestion]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, timerStarted]);

  const startTimer = () => {
    setTimeLeft(quizDuration);
    setTimerStarted(true);
    setTimerPaused(false);
    startedAtRef.current = Date.now();
    pausedMsRef.current = 0;
    pauseStartRef.current = null;
    setQuestionTimeLeft(perQuestionLimit(questions[0]));
  };

  const togglePauseResume = () => {
    // Paused time doesn't count towards "time taken"
    if (!timerPaused) {
      pauseStartRef.current = Date.now();
    } else if (pauseStartRef.current) {
      pausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setTimerPaused(!timerPaused);
  };

  const secondsTaken = () => {
    if (!startedAtRef.current) return null;
    return Math.max(1, Math.round((Date.now() - startedAtRef.current - pausedMsRef.current) / 1000));
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
    setAnswers({});
    setQuestionTimeLeft(null);
    setResult(null);
  };

  const handleStartQuiz = async (tournamentId = null) => {
    setNotice(null);
    if (!quiz || isBlocked) {
      setNotice(quiz?.is_premium ? 'This quiz is for Premium members.' : 'Sign in to start this quiz.');
      return;
    }
    if (timerStarted) {
      setShowWarning(true);
      return;
    }
    if (tournamentId) {
      if (!isLoggedIn || !accessToken) {
        setNotice('Sign in to join the tournament.');
        return;
      }
      try {
        const data = await learningApi.joinTournament(apiUrl, accessToken, tournamentId);
        setTournamentScores(data.scores || []);
      } catch (err) {
        console.error('Error joining tournament:', err.response?.status || err.message);
        setNotice(err.response?.data?.error || 'You couldn’t join the tournament. Try again.');
        return;
      }
    }
    resetQuiz(tournamentId);
    startTimer();
    setShowTournamentModal(false);
    consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The server marks the answers and returns score, XP, coins and any new badges
  const submitScore = async (finalScore, finalAnswers, completed = true) => {
    if (!isLoggedIn || !accessToken) return;
    const payload = {
      score: finalScore,
      correct_count: finalScore,
      total_questions: questions.length,
      answers: finalAnswers,
      time_taken_seconds: secondsTaken(),
      completed,
    };
    setIsSubmitting(true);
    try {
      const data = selectedTournament
        ? await learningApi.submitTournament(apiUrl, accessToken, selectedTournament, payload)
        : await learningApi.submitQuiz(apiUrl, accessToken, id, payload);
      setResult(data);
      if (data.new_badges?.length) {
        setBadges((prev) => [
          ...data.new_badges.map((b) => ({ badge_type: b.key, display_name: b.name, description: b.description, badge: b })),
          ...prev,
        ]);
      }
      // Refresh the leaderboard with the new score
      learningApi.itemLeaderboard(apiUrl, id).then(setTopScorers).catch(() => {});
    } catch (err) {
      console.error('Error submitting score:', err.response?.status || err.message);
      setNotice(err.response?.data?.error || 'Your score couldn’t be saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishQuiz = (finalScore, finalAnswers = answers) => {
    submitScore(finalScore, finalAnswers, true);
    setShowSummary(true);
    setTimerStarted(false);
    setTimerPaused(false);
    setQuestionTimeLeft(null);
  };

  const handleAnswer = (isCorrect, optionId) => {
    if (isEvaluated || timeLeft <= 0 || timerPaused) return;

    // Work out the new score now: the timeout below would otherwise see the old value
    const newScore = isCorrect ? score + 1 : score;
    const q = questions[currentQuestion];
    const newAnswers = optionId != null && q ? { ...answers, [q.id]: optionId } : answers;
    setSelectedOption(optionId);
    setIsEvaluated(true);
    setSelectedAnswers([...selectedAnswers, { questionId: currentQuestion, optionId }]);
    setAnswers(newAnswers);
    setScore(newScore);

    // Leave time to read the explanation, if there is one
    const delay = q?.explanation ? 3200 : 1500;
    setTimeout(() => {
      setSelectedOption(null);
      setIsEvaluated(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        finishQuiz(newScore, newAnswers);
      }
    }, delay);
  };

  const handleSubmitQuiz = () => {
    if (timeLeft > 0) finishQuiz(score);
  };

  const closeSummary = () => { setShowSummary(false); resetQuiz(); };
  const closeTimeUp = () => { setShowTimeUp(false); resetQuiz(); };

  // Save a timed-out attempt too, so it counts in history and stats
  useEffect(() => {
    if (showTimeUp) submitScore(score, answers, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTimeUp]);
  const handleWarningContinue = () => { setShowWarning(false); resetQuiz(selectedTournament); startTimer(); };
  const handleWarningCancel = () => setShowWarning(false);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!isLoggedIn) { setNotice('Sign in to start a discussion.'); return; }
    if (!newPostContent.trim()) return;
    try {
      const response = await axios.post(
        `${apiUrl}/api/learning/learning-material/${id}/add_discussion/`,
        { content: newPostContent, quiz: id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDiscussionPosts([...discussionPosts, { ...response.data, replies: response.data.replies || [] }]);
      setNewPostContent('');
    } catch (err) {
      console.error('Error posting discussion:', err.response?.status || err.message);
      setNotice('Your post couldn’t be published. Try again.');
    }
  };

  const handleReplySubmit = async (postId, e) => {
    e.preventDefault();
    setNotice(null);
    if (!isLoggedIn) { setNotice('Sign in to reply.'); return; }
    if (!replyContent[postId]?.trim()) return;
    try {
      const response = await axios.post(
        `${apiUrl}/api/learning/learning-material/${id}/add_reply/`,
        { content: replyContent[postId], post_id: postId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDiscussionPosts(discussionPosts.map((post) =>
        post.id === postId ? { ...post, replies: [...(post.replies || []), response.data] } : post
      ));
      setReplyContent({ ...replyContent, [postId]: '' });
    } catch (err) {
      console.error('Error posting reply:', err.response?.status || err.message);
      setNotice('Your reply couldn’t be published. Try again.');
    }
  };

  const toggleShowReplies = (postId) => setShowAllReplies((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const handleOpenTournamentModal = (tournamentId) => {
    setSelectedTournament(tournamentId);
    setTournamentScores([]);
    setShowTournamentModal(true);
    learningApi.tournamentLeaderboard(apiUrl, tournamentId)
      .then((rows) => setTournamentScores(rows || []))
      .catch((err) => console.error('Error fetching tournament scores:', err.response?.status || err.message));
  };

  const closeTournamentModal = () => {
    setShowTournamentModal(false);
    setSelectedTournament(null);
    setTournamentScores([]);
  };

  const optionClass = (option) => {
    if (!isEvaluated) return styles.option;
    if (option.is_correct) return `${styles.option} ${styles.optionCorrect}`;
    if (option.id === selectedOption) return `${styles.option} ${styles.optionWrong}`;
    return `${styles.option} ${styles.optionDimmed}`;
  };

  /* ---------- Loading / error ---------- */
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}><p>Loading quiz…</p></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}>
          <h2>{error || 'Quiz not found'}</h2>
          <p>Check your connection, or pick another quiz from the Learning hub.</p>
          <Link to="/learning" className={styles.primaryButton}>Back to Learning</Link>
        </div>
      </div>
    );
  }

  const total = questions.length;
  const question = questions[currentQuestion];
  const timeFraction = timeLeft / quizDuration;
  const qLimit = perQuestionLimit(question);
  const percent = total ? Math.round((score / total) * 100) : 0;
  // Tournaments for this quiz first; fall back to any live tournament
  const live = tournaments.filter((t) => t.is_active);
  const forThisQuiz = live.filter((t) => String(t.learning_item) === String(id));
  const activeTournaments = (forThisQuiz.length ? forThisQuiz : live).slice(0, 3);
  const playing = timerStarted && !timerPaused;

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={quiz.title}
        subtitle={quiz.description}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Learning', to: '/learning' }, { label: quiz.title || 'Quiz' }]}
      >
        <div className={styles.heroActions}>
          <button type="button" className={styles.heroButton} onClick={() => handleStartQuiz()}>
            <FaPlay aria-hidden="true" /> Start quiz
          </button>
          {(quiz.is_restricted || quiz.is_premium) && (
            <span className={styles.heroNote}>
              {quiz.is_premium ? <FaCrown aria-hidden="true" /> : <FaLock aria-hidden="true" />}
              {quiz.is_premium ? 'Premium quiz' : 'Sign in required'}
            </span>
          )}
        </div>
      </PageHero>

      {notice && (
        <div className={styles.noticeWrap}>
          <p className={styles.notice} role="alert">
            {notice}
            {isBlocked && (
              <Link to={quiz.is_premium ? '/premium' : '/login'}>{quiz.is_premium ? 'See plans' : 'Sign in'}</Link>
            )}
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><FaTimes /></button>
          </p>
        </div>
      )}

      <div className={`${styles.section} ${styles.layout}`}>
        {/* ---------- Quiz console ---------- */}
        <section className={styles.console} ref={consoleRef} aria-label="Quiz">
          <div className={styles.consoleTop}>
            <div
              className={`${styles.timerRing} ${timeLeft <= 60 && timerStarted ? styles.timerLow : ''}`}
              role="timer"
              aria-label={`Time left ${formatTime(timeLeft)}`}
            >
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className={styles.ringTrack} cx="60" cy="60" r="52" />
                <circle
                  className={styles.ringFill}
                  cx="60" cy="60" r="52"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - timeFraction)}
                />
              </svg>
              <span className={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>

            <div className={styles.consoleInfo}>
              <h2 className={styles.consoleTitle}>
                {total ? `Question ${currentQuestion + 1} of ${total}` : 'No questions yet'}
              </h2>
              <p className={styles.consoleMeta}>
                {timerStarted
                  ? (timerPaused ? 'Paused' : (questionTimeLeft !== null ? `${questionTimeLeft}s left for this question` : 'In progress'))
                  : `${describeDuration(quizDuration)}${qLimit ? ` · ${qLimit}s per question` : ''} · pass mark ${quiz.pass_percentage || 60}%`}
              </p>
              {total > 0 && (
                <ol className={styles.progress} aria-label="Progress">
                  {questions.map((q, i) => (
                    <li
                      key={q.id || i}
                      className={`${styles.step} ${i < currentQuestion ? styles.stepDone : ''} ${i === currentQuestion ? styles.stepNow : ''}`}
                    >
                      <span className={styles.srOnly}>Question {i + 1}{i < currentQuestion ? ', answered' : ''}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={timerStarted ? togglePauseResume : () => handleStartQuiz()}
              disabled={!total}
            >
              {timerStarted
                ? (timerPaused ? <><FaPlay aria-hidden="true" /> Resume</> : <><FaPause aria-hidden="true" /> Pause</>)
                : <><FaPlay aria-hidden="true" /> Start</>}
            </button>
          </div>

          {total > 0 ? (
            <div className={`${styles.questionCard} ${!playing ? styles.questionIdle : ''}`}>
              <p className={styles.questionText}>{question.text}</p>
              <div className={styles.options}>
                {question.options.map((option, i) => (
                  <button
                    key={option.id}
                    type="button"
                    className={optionClass(option)}
                    onClick={() => handleAnswer(option.is_correct, option.id)}
                    disabled={!timerStarted || isEvaluated || timeLeft <= 0 || timerPaused}
                  >
                    <span className={styles.optionLetter} aria-hidden="true">
                      {isEvaluated && option.is_correct ? <FaCheck /> : OPTION_LETTERS[i] || i + 1}
                    </span>
                    <span>{option.text}</span>
                  </button>
                ))}
              </div>
              {isEvaluated && question.explanation && (
                <p className={styles.idleHint} role="status">{question.explanation}</p>
              )}
              {!timerStarted && (
                <p className={styles.idleHint}>
                  {isBlocked
                    ? 'This quiz is locked.'
                    : `Press Start to begin. The timer runs for ${describeDuration(quizDuration)}.`}
                  {quiz.my_best && ` Your best: ${quiz.my_best.score}/${quiz.my_best.max_score ?? total}.`}
                </p>
              )}
            </div>
          ) : (
            <p className={styles.emptyNote}>This quiz has no questions yet.</p>
          )}

          {total > 0 && (
            <div className={styles.navRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={currentQuestion === 0 || timeLeft <= 0 || timerPaused}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                <FaChevronLeft aria-hidden="true" /> Previous
              </button>
              {currentQuestion < total - 1 ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!isEvaluated || timeLeft <= 0 || timerPaused}
                >
                  Next <FaChevronRight aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleSubmitQuiz}
                  disabled={!timerStarted || timeLeft <= 0 || timerPaused}
                >
                  Submit quiz
                </button>
              )}
            </div>
          )}
        </section>

        {/* ---------- Side panels ---------- */}
        <aside className={styles.aside}>
          <section className={styles.panel} aria-labelledby="tournaments-title">
            <h2 id="tournaments-title" className={styles.panelTitle}><FaTrophy aria-hidden="true" /> Live tournaments</h2>
            {activeTournaments.length > 0 ? (
              <ul className={styles.panelList}>
                {activeTournaments.map((t) => (
                  <li key={t.id} className={styles.tournament}>
                    <h3>{t.title}</h3>
                    <p className={styles.tournamentMeta}>
                      <span><FaClock aria-hidden="true" /> {t.time_left || tournamentTimeLeft(t.end_time)}</span>
                      <span><FaUsers aria-hidden="true" /> {t.participant_count} joined</span>
                    </p>
                    <button type="button" className={styles.smallButton} onClick={() => handleOpenTournamentModal(t.id)}>
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.panelEmpty}>No tournaments are running right now.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="scorers-title">
            <h2 id="scorers-title" className={styles.panelTitle}><FaMedal aria-hidden="true" /> Top scorers</h2>
            {topScorers.length > 0 ? (
              <ol className={styles.scorers}>
                {topScorers.map((scorer, index) => (
                  <li key={`${scorer.user}-${index}`} className={styles.scorer}>
                    <span className={styles.rank}>{index + 1}</span>
                    <span className={styles.scorerName}>{scorer.name || scorer.user}</span>
                    <span className={styles.scorerScore}>
                      {scorer.score}{scorer.max_score ? `/${scorer.max_score}` : ' pts'}
                      {scorer.time_taken_seconds ? ` · ${formatTime(scorer.time_taken_seconds)}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.panelEmpty}>No scores yet. Be the first.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="badges-title">
            <h2 id="badges-title" className={styles.panelTitle}><FaCrown aria-hidden="true" /> Your badges</h2>
            {badges.length > 0 ? (
              <ul className={styles.badges}>
                {badges.map((badge, index) => (
                  <li key={`${badge.badge_type}-${index}`} className={styles.badge}>
                    <span className={styles.badgeIcon} aria-hidden="true">
                      <BadgeIcon name={badge.badge?.icon || (badge.badge_type === 'quiz_master' ? 'FaTrophy' : 'FaMedal')} image={badge.badge?.image} />
                    </span>
                    <div>
                      <h3>{badge.display_name}</h3>
                      <p>{badge.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.panelEmpty}>
                {isLoggedIn ? 'Finish quizzes to earn badges.' : <><Link to="/login">Sign in</Link> to collect badges.</>}
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* ---------- Discussion ---------- */}
      <section className={styles.section} aria-labelledby="forum-title">
        <div className={styles.forum}>
          <h2 id="forum-title" className={styles.sectionTitle}>Discussion</h2>
          <p className={styles.lede}>Talk through the answers with other learners.</p>

          <form className={styles.composer} onSubmit={handlePostSubmit}>
            {!isLoggedIn && <p className={styles.formNote}><Link to="/login">Sign in</Link> to post or reply.</p>}
            <label htmlFor="new-post" className={styles.srOnly}>New discussion</label>
            <textarea
              id="new-post"
              className={styles.textarea}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Start a new discussion…"
              disabled={!isLoggedIn}
            />
            <div className={styles.composerActions}>
              <button type="submit" className={styles.primaryButton} disabled={!isLoggedIn}>Post</button>
            </div>
          </form>

          {discussionPosts.length === 0 ? (
            <p className={styles.emptyNote}>No discussions yet. Start the first one.</p>
          ) : (
            <ul className={styles.postList}>
              {discussionPosts.map((post) => {
                const replies = post.replies || [];
                const shown = showAllReplies[post.id] ? replies : replies.slice(0, 2);
                return (
                  <li key={post.id} className={styles.post}>
                    <div className={styles.postHead}>
                      <span className={styles.avatar} aria-hidden="true">{String(post.author || '?').charAt(0).toUpperCase()}</span>
                      <div>
                        <div className={styles.postAuthor}>{post.author}</div>
                        <div className={styles.postTime}>{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    <p className={styles.postBody}>{post.content}</p>

                    {replies.length > 0 && (
                      <ul className={styles.replies}>
                        {shown.map((reply) => (
                          <li key={reply.id} className={styles.reply}>
                            <div className={styles.postHead}>
                              <span className={`${styles.avatar} ${styles.avatarSmall}`} aria-hidden="true">{String(reply.author || '?').charAt(0).toUpperCase()}</span>
                              <div>
                                <div className={styles.postAuthor}>{reply.author}</div>
                                <div className={styles.postTime}>{formatDate(reply.created_at)}</div>
                              </div>
                            </div>
                            <p className={styles.postBody}>{reply.content}</p>
                          </li>
                        ))}
                        {replies.length > 2 && (
                          <button type="button" className={styles.showMore} onClick={() => toggleShowReplies(post.id)}>
                            {showAllReplies[post.id] ? 'Show fewer replies' : `Show all ${replies.length} replies`}
                          </button>
                        )}
                      </ul>
                    )}

                    <form className={styles.replyForm} onSubmit={(e) => handleReplySubmit(post.id, e)}>
                      <textarea
                        className={styles.textarea}
                        value={replyContent[post.id] || ''}
                        onChange={(e) => setReplyContent({ ...replyContent, [post.id]: e.target.value })}
                        placeholder="Write a reply…"
                        aria-label={`Reply to ${post.author}`}
                        disabled={!isLoggedIn}
                      />
                      <button type="submit" className={styles.smallButton} disabled={!isLoggedIn}>Reply</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ---------- Dialogs ---------- */}
      {showSummary && (
        <Dialog labelledBy="summary-title" onClose={closeSummary}>
          <div className={styles.scoreRing} aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle className={styles.ringTrack} cx="60" cy="60" r="52" />
              <circle className={styles.ringFill} cx="60" cy="60" r="52" strokeDasharray={RING} strokeDashoffset={RING * (1 - percent / 100)} />
            </svg>
            <span>{percent}%</span>
          </div>
          <h2 id="summary-title" className={styles.dialogTitle}>Quiz complete</h2>
          <p className={styles.dialogText}>
            You got {score} out of {total} right{secondsTaken() ? ` in ${formatTime(secondsTaken())}` : ''}.
            {quiz.pass_percentage ? (percent >= quiz.pass_percentage ? ' You passed.' : ` The pass mark is ${quiz.pass_percentage}%.`) : ''}
          </p>
          {total > 0 && score === total && (
            <p className={styles.dialogHighlight}><FaTrophy aria-hidden="true" /> Perfect score</p>
          )}
          {isLoggedIn && isSubmitting && <p className={styles.dialogText}>Saving your score…</p>}
          {result && (
            <ul className={styles.badges}>
              <li className={styles.badge}>
                <span className={styles.badgeIcon} aria-hidden="true"><FaMedal /></span>
                <div>
                  <h3>+{result.xp_earned} XP{result.coins_earned ? ` · +${result.coins_earned} coins` : ''}</h3>
                  <p>{result.is_new_best ? 'New personal best!' : `Your best is ${result.best_score}.`}</p>
                </div>
              </li>
              {(result.new_badges || []).map((b) => (
                <li key={b.key} className={styles.badge}>
                  <span className={styles.badgeIcon} aria-hidden="true"><BadgeIcon name={b.icon} image={b.image} /></span>
                  <div>
                    <h3>Badge earned: {b.name}</h3>
                    <p>{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!isLoggedIn && <p className={styles.dialogText}><Link to="/login">Sign in</Link> to save your scores and earn badges.</p>}
          <div className={styles.dialogActions}>
            <button type="button" className={styles.primaryButton} onClick={closeSummary}>Done</button>
          </div>
        </Dialog>
      )}

      {showTimeUp && (
        <Dialog labelledBy="timeup-title" onClose={closeTimeUp}>
          <span className={styles.dialogIcon} aria-hidden="true"><FaClock /></span>
          <h2 id="timeup-title" className={styles.dialogTitle}>Time’s up</h2>
          <p className={styles.dialogText}>Time ran out before you finished. You got {score} right. You can try again from the start.</p>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.primaryButton} onClick={closeTimeUp}><FaRedo aria-hidden="true" /> Try again</button>
          </div>
        </Dialog>
      )}

      {showWarning && (
        <Dialog labelledBy="warning-title" onClose={handleWarningCancel}>
          <h2 id="warning-title" className={styles.dialogTitle}>Restart the quiz?</h2>
          <p className={styles.dialogText}>Your current attempt and score will be lost.</p>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleWarningCancel}>Keep going</button>
            <button type="button" className={styles.primaryButton} onClick={handleWarningContinue}>Restart</button>
          </div>
        </Dialog>
      )}

      {showTournamentModal && (
        <Dialog labelledBy="tournament-title" onClose={closeTournamentModal} className={styles.dialogWide}>
          <button type="button" className={styles.dialogClose} onClick={closeTournamentModal} aria-label="Close">
            <FaTimes />
          </button>
          <span className={styles.dialogIcon} aria-hidden="true"><FaTrophy /></span>
          <h2 id="tournament-title" className={styles.dialogTitle}>Join tournament</h2>
          <p className={styles.dialogText}>Scores to beat</p>
          {tournamentScores.length > 0 ? (
            <ol className={styles.scorers}>
              {tournamentScores.map((s, index) => (
                <li key={`${s.user}-${index}`} className={styles.scorer}>
                  <span className={styles.rank}>{index + 1}</span>
                  <span className={styles.scorerName}>{s.name || s.user}</span>
                  <span className={styles.scorerScore}>{s.score} pts</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.panelEmpty}>No scores yet for this tournament.</p>
          )}
          <div className={styles.dialogActions}>
            <button type="button" className={styles.primaryButton} onClick={() => handleStartQuiz(selectedTournament)}>
              <FaPlay aria-hidden="true" /> Start
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Quizzes;
