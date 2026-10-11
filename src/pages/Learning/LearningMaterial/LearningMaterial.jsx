import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaLock, FaPlay, FaCrown, FaSignInAlt } from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import styles from './LearningMaterial.module.css';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// YouTube link -> embed URL
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '');

const LearningMaterial = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const { isLoggedIn, isPremium, accessToken } = useAuth();
  const getImagePath = useProductionImagePath();
  const contentRef = useRef(null);
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  // Uses the API address the app passes in (this used to be hard-coded to localhost)
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [item, setItem] = useState(null);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const headers = isLoggedIn && accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/learning/learning-material/${id}/`, { headers });
        setItem(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching learning item:', err.response?.status || err.message);
        setError('This lesson couldn’t be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDiscussions = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/learning/learning-material/${id}/discussions/`, { headers });
        setDiscussionPosts((response.data || []).map((p) => ({ ...p, replies: p.replies || [] })));
      } catch (err) {
        console.error('Error fetching discussions:', err.response?.status || err.message);
      }
    };

    fetchItem();
    fetchDiscussions();
  }, [id, isLoggedIn, accessToken, apiUrl]);

  const isAccessible = () => {
    if (!item) return false;
    if (!item.is_restricted) return true;
    if (!isLoggedIn) return false;
    if (item.is_premium && !isPremium) return false;
    return true;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!isLoggedIn) {
      setFormError('Sign in to start a discussion.');
      return;
    }
    if (!newPostContent.trim()) {
      setFormError('Write something before posting.');
      return;
    }
    try {
      const response = await axios.post(
        `${apiUrl}/api/learning/learning-material/${id}/add_discussion/`,
        { content: newPostContent, learning_item: id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDiscussionPosts([...discussionPosts, { ...response.data, replies: response.data.replies || [] }]);
      setNewPostContent('');
    } catch (err) {
      console.error('Post error:', err.response?.status || err.message);
      setFormError('Your post couldn’t be published. Try again.');
    }
  };

  const handleReplySubmit = async (postId, e) => {
    e.preventDefault();
    setFormError(null);
    if (!isLoggedIn) {
      setFormError('Sign in to reply.');
      return;
    }
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
      console.error('Reply error:', err.response?.status || err.message);
      setFormError('Your reply couldn’t be published. Try again.');
    }
  };

  const toggleShowReplies = (postId) => setShowAllReplies((prev) => ({ ...prev, [postId]: !prev[postId] }));

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}><p>Loading lesson…</p></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}>
          <h2>{error || 'Lesson not found'}</h2>
          <p>Check your connection, or go back to the Learning hub.</p>
          <Link to="/learning" className={styles.primaryButton}>Back to Learning</Link>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(item.video_file);
  const open = isAccessible();

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={item.title || 'Learning Material'}
        subtitle={item.description || 'Explore detailed learning materials to enhance your knowledge!'}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Learning', to: '/learning' }, { label: item.title }]}
      >
        <button
          type="button"
          className={styles.heroButton}
          onClick={() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <FaPlay aria-hidden="true" /> Start learning
        </button>
      </PageHero>

      <section className={styles.section} ref={contentRef} aria-label="Lesson">
        {open ? (
          <article className={styles.lesson}>
            {item.category && <span className={styles.chip}>{item.category}</span>}
            <h2 className={styles.sectionTitle}>{item.title}</h2>
            {item.description && <p className={styles.lessonText}>{item.description}</p>}
            {embedUrl && (
              <div className={styles.videoFrame}>
                <iframe
                  src={embedUrl}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </article>
        ) : (
          <div className={styles.locked}>
            <span className={styles.lockIcon} aria-hidden="true">{item.is_premium ? <FaCrown /> : <FaLock />}</span>
            <h2>{item.is_premium ? 'This lesson is for Premium members' : 'Sign in to open this lesson'}</h2>
            <p>{item.is_premium ? 'Upgrade to Premium to watch this lesson and every other premium lesson.' : 'Create a free account or sign in to keep going.'}</p>
            <Link to={item.is_premium ? '/premium' : '/login'} className={styles.primaryButton}>
              {item.is_premium ? <><FaCrown aria-hidden="true" /> See Premium plans</> : <><FaSignInAlt aria-hidden="true" /> Sign in</>}
            </Link>
          </div>
        )}
      </section>

      {/* ---------- Discussion ---------- */}
      <section className={styles.section} aria-labelledby="forum-title">
        <div className={styles.forum}>
          <h2 id="forum-title" className={styles.sectionTitle}>Discussion</h2>
          <p className={styles.lede}>Ask a question or share what you learned.</p>

          <form className={styles.composer} onSubmit={handlePostSubmit}>
            {!isLoggedIn && <p className={styles.formNote}><Link to="/login">Sign in</Link> to post or reply.</p>}
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
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
    </div>
  );
};

export default LearningMaterial;
