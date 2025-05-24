import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
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
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const LearningMaterial = ({ isDarkMode }) => {
  const { id } = useParams();
  const { isLoggedIn, isPremium, accessToken } = useAuth();
  const getImagePath = useProductionImagePath();
  const headerLight = '/images/Learning/header-image.png';
  const headerDark = '/images/Learning/header-image-dark.png';
  const [item, setItem] = useState(null);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showAllReplies, setShowAllReplies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/learning/learning-material/${id}/`, {
          headers: isLoggedIn ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        setItem(response.data);
        console.log('Fetched item:', response.data);
      } catch (err) {
        console.error('Error fetching learning item:', err.response?.data, err.message);
        setError('Failed to load learning material');
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
        console.error('Error fetching discussions:', err.response?.data, err.message);
      }
    };

    fetchItem();
    fetchDiscussions();
  }, [id, isLoggedIn, accessToken]);

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
      setFormError('Please log in to post a discussion.');
      return;
    }
    if (!newPostContent.trim()) {
      setFormError('Post content cannot be empty.');
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:8000/api/learning/learning-material/${id}/add_discussion/`,
        { content: newPostContent, learning_item: id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('Post response:', response.data);
      const newPost = { ...response.data, replies: response.data.replies || [] };
      setDiscussionPosts([...discussionPosts, newPost]);
      setNewPostContent('');
    } catch (err) {
      console.error('Post error:', err.response?.data, err.message);
      setFormError('Failed to post discussion. Please try again.');
    }
  };

  const handleReplySubmit = async (postId, e) => {
    e.preventDefault();
    setFormError(null);
    if (!isLoggedIn) {
      setFormError('Please log in to post a reply.');
      return;
    }
    if (!replyContent[postId]?.trim()) {
      setFormError('Reply content cannot be empty.');
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:8000/api/learning/learning-material/${id}/add_reply/`,
        { content: replyContent[postId], post_id: postId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('Reply response:', response.data);
      setDiscussionPosts(
        discussionPosts.map((post) =>
          post.id === postId
            ? { ...post, replies: [...(post.replies || []), response.data] }
            : post
        )
      );
      setReplyContent({ ...replyContent, [postId]: '' });
    } catch (err) {
      console.error('Reply error:', err.response?.data, err.message);
      setFormError('Failed to post reply. Please try again.');
    }
  };

  const toggleShowReplies = (postId) => {
    setShowAllReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={`${styles.materialContainer} ${isDarkMode ? styles.darkMode : ''}`}>
      <div
        className={styles.headerSection}
        style={{
          backgroundImage: `url(${isDarkMode ? getImagePath(headerDark) : getImagePath(headerLight)})`,
        }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headerTitle}>{item?.title || 'Learning Material'}</h1>
          <p className={styles.headerDescription}>
            {item?.description || 'Explore detailed learning materials to enhance your knowledge!'}
          </p>
          <button className={styles.headerButton} onClick={() => window.scrollTo(0, 500)}>
            Start Learning
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
        <span>{item?.title}</span>
      </div>

      <div className={styles.mainContent}>
        {isAccessible() ? (
          <div className={styles.materialDetails}>
            <h2 className={styles.title}>{item.title}</h2>
            <p className={styles.category}>{item.category}</p>
            <p className={styles.description}>{item.description}</p>            
            {item.video_file && (
              <div className={styles.videoContainer}>
                <iframe
                  className={styles.video}
                  src={getYouTubeEmbedUrl(item.video_file)}
                  title={item.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.lockedContent}>
            <FaLock className={styles.lockIcon} />
            <p>{item.is_premium ? 'Premium Required' : 'Login Required'}</p>
          </div>
        )}

        <div className={styles.discussionSection}>
          <h2 className={styles.discussionTitle}>Discussion Forum</h2>
          <div className={styles.newPostForm}>
            {!isLoggedIn && (
              <p className={styles.description}>Please log in to post or reply.</p>
            )}
            {formError && <p className={styles.description}>{formError}</p>}
            <textarea
              className={styles.newPostTextarea}
              value={newPostContent}
              onChange={(e) => {
                console.log('New post content:', e.target.value);
                setNewPostContent(e.target.value);
              }}
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
                    onChange={(e) => {
                      console.log('Reply content:', e.target.value);
                      setReplyContent({ ...replyContent, [post.id]: e.target.value });
                    }}
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
      </div>
    </div>
  );
};

export default LearningMaterial;