import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { base_url } from '../config';
import './Thread.css';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import PropTypes from 'prop-types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MarkdownToolbar from './MarkdownToolbar';
import { getCachedUserByEmail } from '../utils/userUtils';
import { getProfilePictureUrl } from '../utils/imageUtils';

const Comment = memo(({ comment, formatDate, onUserClick, className = '' }) => {
  const [commentAuthor, setCommentAuthor] = useState(comment._authorData || null);
  
  useEffect(() => {
    // Skip fetching if we already have the author data
    if (commentAuthor || !comment?.authorEmail) return;
    
    const fetchCommentAuthor = async () => {
      const userData = await getCachedUserByEmail(comment.authorEmail);
      if (userData) {
        setCommentAuthor(userData);
      }
    };
    
    fetchCommentAuthor();
  }, [comment?.authorEmail, commentAuthor]);

  return (
    <div className={`thread-view-comment-item ${className}`}>
      <div className="thread-view-comment-header">
        <div className="commenter-info">
          <div className="commenter-avatar">
            <img 
              src={getProfilePictureUrl(
                commentAuthor || comment.author, 
                comment.authorName?.charAt(0) || 'U', 
                32
              )}
              alt={commentAuthor?.name || comment.authorName || "User"}
              title={`View ${commentAuthor?.name || comment.authorName || "user"}'s profile`}
              onClick={(e) => {
                e.stopPropagation();
                onUserClick && onUserClick(commentAuthor?.email || comment.authorEmail);
              }}
              className="clickable-avatar"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getProfilePictureUrl(null, comment.authorName?.charAt(0) || 'U', 32);
              }}
            />
          </div>
          <div className="commenter-details">
            <span 
              className="commenter-name clickable"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick && onUserClick(commentAuthor?.email || comment.authorEmail);
              }}
            >
              {commentAuthor?.name || comment.authorName || comment.author?.name || 'Anonymous'}
            </span>
            <span className="comment-date">{formatDate(comment.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="thread-view-comment-body">
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="code-block-container">
                  <div className="code-header">
                    <span className="code-language">{match[1]}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                        toast.info('Code copied to clipboard!', {autoClose: 1000})
                      }}
                      className="copy-code-button"
                      aria-label="Copy code"
                    >
                      Copy
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a({ children, href, ...props }) {
              return (
                <a 
                  href={href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="markdown-link"
                  {...props}
                >
                  {children}
                  <svg className="external-link-icon" width="12" height="12" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                </a>
              );
            },
            img({ src, alt, ...props }) {
              return (
                <React.Fragment>
                  <img 
                    src={src} 
                    alt={alt || "Image"} 
                    className="markdown-image" 
                    {...props} 
                  />
                  {alt && <span className="image-caption">{alt}</span>}
                </React.Fragment>
              );
            },
            table({ children, ...props }) {
              return (
                <div className="table-responsive">
                  <table className="markdown-table" {...props}>
                    {children}
                  </table>
                </div>
              );
            }
          }}
        >
          {comment.content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

Comment.propTypes = {
  comment: PropTypes.shape({
    commentId: PropTypes.string,
    content: PropTypes.string.isRequired,
    authorName: PropTypes.string,
    authorEmail: PropTypes.string,
    author: PropTypes.shape({
      name: PropTypes.string,
      profilePictureUrl: PropTypes.string
    }),
    createdAt: PropTypes.string,
    likes: PropTypes.number,
    _authorData: PropTypes.object
  }).isRequired,
  formatDate: PropTypes.func.isRequired,
  onUserClick: PropTypes.func,
  className: PropTypes.string
};

Comment.displayName = 'Comment';

const MarkdownPreview = memo(({ content }) => {
  if (!content) {
    return <p className="empty-preview">Nothing to preview yet. Start writing to see how your comment will look!</p>;
  }
  
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="code-block-container">
              <div className="code-header">
                <span className="code-language">{match[1]}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                    toast.info('Code copied to clipboard!', {autoClose: 1000})
                  }}
                  className="copy-code-button"
                  aria-label="Copy code"
                >
                  Copy
                </button>
              </div>
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        a({ children, href, ...props }) {
          return (
            <a 
              href={href} 
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link"
              {...props}
            >
              {children}
              <svg className="external-link-icon" width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </a>
          );
        },
        img({ src, alt, ...props }) {
          return (
            <React.Fragment>
              <img 
                src={src} 
                alt={alt || "Image"} 
                className="markdown-image" 
                {...props} 
              />
              {alt && <span className="image-caption">{alt}</span>}
            </React.Fragment>
          );
        },
        table({ children, ...props }) {
          return (
            <div className="table-responsive">
              <table className="markdown-table" {...props}>
                {children}
              </table>
            </div>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MarkdownPreview.propTypes = {
  content: PropTypes.string
};

MarkdownPreview.defaultProps = {
  content: ''
};

MarkdownPreview.displayName = 'MarkdownPreview';

const ThreadContent = memo(({ content }) => {
  return (
    <div className="thread-view-body">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="code-block-container">
                <div className="code-header">
                  <span className="code-language">{match[1]}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                      toast.info('Code copied to clipboard!', {autoClose: 1000})
                    }}
                    className="copy-code-button"
                    aria-label="Copy code"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a 
                href={href} 
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
                {...props}
              >
                {children}
                <svg className="external-link-icon" width="12" height="12" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
              </a>
            );
          },
          img({ src, alt, ...props }) {
            return (
              <React.Fragment>
                <img 
                  src={src} 
                  alt={alt || "Image"} 
                  className="markdown-image" 
                  {...props} 
                />
                {alt && <span className="image-caption">{alt}</span>}
              </React.Fragment>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="table-responsive">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

ThreadContent.propTypes = {
  content: PropTypes.string.isRequired
};

ThreadContent.displayName = 'ThreadContent';

const ThreadSkeleton = memo(() => {
  return (
    <div className="thread-view-skeleton">
      <div className="skeleton-header">
        <div className="back-button-skeleton skeleton"></div>
        <div className="thread-title-skeleton skeleton"></div>
        <div className="thread-meta-skeleton">
          <div className="author-skeleton">
            <div className="avatar-skeleton skeleton"></div>
            <div className="author-details-skeleton">
              <div className="author-name-skeleton skeleton"></div>
              <div className="post-date-skeleton skeleton"></div>
            </div>
          </div>
          <div className="thread-stats-skeleton">
            <div className="stat-item-skeleton skeleton"></div>
            <div className="stat-item-skeleton skeleton"></div>
          </div>
        </div>
      </div>
      
      <div className="thread-voting-skeleton">
        <div className="vote-button-skeleton skeleton"></div>
        <div className="vote-score-skeleton skeleton"></div>
        <div className="vote-button-skeleton skeleton"></div>
      </div>
      
      <div className="thread-content-skeleton">
        <div className="content-line-skeleton skeleton"></div>
        <div className="content-line-skeleton skeleton"></div>
        <div className="content-line-skeleton skeleton"></div>
        <div className="content-line-skeleton skeleton" style={{ width: '75%' }}></div>
        <div className="content-line-skeleton skeleton" style={{ width: '85%' }}></div>
      </div>
      
      <div className="comments-section-skeleton">
        <div className="comments-header-skeleton skeleton"></div>
        <div className="comment-form-skeleton skeleton"></div>
        
        {/* Skeleton for 3 comments */}
        {[...Array(3)].map((_, index) => (
          <div key={`comment-skeleton-${index}`} className="comment-skeleton">
            <div className="comment-header-skeleton">
              <div className="comment-avatar-skeleton skeleton"></div>
              <div className="comment-author-skeleton skeleton"></div>
            </div>
            <div className="comment-content-skeleton">
              <div className="content-line-skeleton skeleton"></div>
              <div className="content-line-skeleton skeleton"></div>
              <div className="content-line-skeleton skeleton" style={{ width: '60%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ThreadSkeleton.displayName = 'ThreadSkeleton';

function Thread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [threadVotes, setThreadVotes] = useState({
    score: thread?.likes || 0,
    userVote: 0 // 1 for upvote, -1 for downvote, 0 for no vote
  });
  
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const sortCommentsByDate = useCallback((commentsArray) => {
    return [...commentsArray].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, []);
  
  useEffect(() => {
    if (newComment.trim()) {
      localStorage.setItem(`commentDraft-${threadId}`, newComment);
    }
  }, [newComment, threadId]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(`commentDraft-${threadId}`);
    if (savedDraft) {
      setNewComment(savedDraft);
    }
  }, [threadId]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.userEmail) {
        // Try to get cached user data first
        const cachedUser = await getCachedUserByEmail(userData.userEmail);
        if (cachedUser) {
          setCurrentUser(cachedUser);
        } else {
          // Fallback to localStorage data
          setCurrentUser(userData);
        }
      }
    };
    
    loadCurrentUser();
  }, []);

  const fetchThreadData = useCallback(async () => {
    if (!threadId) {
      setError('Invalid thread ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error('Session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      // Fetch thread details
      const threadResponse = await axios.get(`${base_url}/threads/${threadId}`, {
        headers: { 'Session-Id': sessionId }
      });
      
      console.log('Thread data:', threadResponse.data);
      setThread(threadResponse.data);

      // Get current user email
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userEmail = userData.userEmail;

      // Calculate score from upvotes and downvotes
      const score = (threadResponse.data.upvotes || 0) - (threadResponse.data.downvotes || 0);

      // Check if user has already voted
      let userVote = 0;
      if (threadResponse.data.votes && userEmail) {
        userVote = threadResponse.data.votes[userEmail] || 0;
      }

      // Set thread votes
      setThreadVotes({
        score: score,
        userVote: userVote
      });
      
      // Extract and set comments from thread data
      if (threadResponse.data.comments && Array.isArray(threadResponse.data.comments)) {
        console.log('Comments found in thread data:', threadResponse.data.comments.length);
        
        // Extract comments but avoid circular references
        const extractedComments = threadResponse.data.comments.map(comment => ({
          commentId: comment.commentId,
          content: comment.content,
          authorEmail: comment.authorEmail,
          authorName: comment.authorName,
          likes: comment.likes || 0,
          createdAt: comment.createdAt
        }));
        
        // Sort comments by date (newest first) before setting state
        setComments(sortCommentsByDate(extractedComments));
      } else {
        console.log('No comments found in thread data');
        setComments([]);
      }
      
      // Increment view count (commented out in your original code)
      
    } catch (error) {
      console.error('Error fetching thread data:', error);
      setError('Failed to load thread data. Please try again.');
      toast.error('Error loading thread data');
    } finally {
      setLoading(false);
    }
  }, [threadId, navigate, sortCommentsByDate]);
  
  useEffect(() => {
    fetchThreadData();
  }, [fetchThreadData]);

  useEffect(() => {
    if (thread?.authorEmail) {
      const fetchAuthorData = async () => {
        const userData = await getCachedUserByEmail(thread.authorEmail);
        if (userData) {
          setAuthorData(userData);
        }
      };
      
      fetchAuthorData();
    }
  }, [thread?.authorEmail]);
  
  const handleSubmitComment = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.warning('Please enter a comment');
      return;
    }
    
    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!sessionId || !userData.userEmail) {
        toast.error('Session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      const commentData = {
        content: newComment,
        authorEmail: userData.userEmail
      };
      
      const response = await axios.post(`${base_url}/threads/${threadId}/comments`, commentData, {
        headers: { 'Session-Id': sessionId }
      });

      console.log('Comment API response:', response);

      // Check if response contains the comment directly or nested
      let commentResponse = response.data;
      if (response.data && response.data.comment) {
        commentResponse = response.data.comment;
      }
      
      // Create new comment with current user info already included
      const newCommentData = {
        commentId: commentResponse.commentId || commentResponse.id || `new-${Date.now()}`,
        content: commentResponse.content || commentResponse.body || commentResponse.text || newComment,
        authorEmail: userData.userEmail,
        authorName: userData.name,
        likes: commentResponse.likes || 0,
        createdAt: commentResponse.createdAt || new Date().toISOString(),
        // Pre-include author data to avoid loading delay
        author: {
          name: userData.name,
          profilePictureUrl: userData.profilePictureUrl
        }
      };

      // Add the current user information directly to make it available immediately
      // This prevents the need for the Comment component to fetch it
      newCommentData._authorData = currentUser || userData;

      // Add to state with new comment at the top
      setComments(prevComments => [newCommentData, ...prevComments]);
      
      setNewComment('');
      localStorage.removeItem(`commentDraft-${threadId}`);
      toast.success('Comment posted successfully');
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, navigate, threadId, currentUser]);
  
  const handleBackToForum = useCallback(() => {
    navigate('/forum');
  }, [navigate]);

  const handleThreadVote = useCallback(async (vote) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error('Please log in to vote');
        return;
      }
      
      // Save current vote state to determine what we're doing
      const isRemovingVote = threadVotes.userVote === vote;
      
      // Determine the endpoint based on vote direction
      const endpoint = vote === 1 
        ? `${base_url}/threads/${threadId}/upvote` 
        : `${base_url}/threads/${threadId}/downvote`;
      
      // Optimistically update UI
      setThreadVotes(prev => {
        // If same vote type clicked, remove the vote (toggle behavior)
        if (prev.userVote === vote) {
          return {
            score: prev.score - vote,
            userVote: 0
          };
        }
        
        if (prev.userVote !== 0 && prev.userVote !== vote) {
          return {
            score: prev.score + 2 * vote,
            userVote: vote
          };
        }
        
        // New vote (no previous vote)
        return {
          score: prev.score + vote,
          userVote: vote
        };
      });
      
      // Always call API regardless of whether voting or removing vote
      await axios.post(endpoint, {}, {
        headers: { 'Session-Id': sessionId }
      });
      
      if (isRemovingVote) {
        console.log(`Vote removed from thread ${threadId}`);
      } else {
        console.log(`Thread ${vote === 1 ? 'upvoted' : 'downvoted'} successfully`);
      }
      
    } catch (error) {
      console.error('Error voting on thread:', error);
      toast.error('Failed to register vote');
      
      // Revert to previous state on error
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setThreadVotes(() => ({
        score: (thread.upvotes || 0) - (thread.downvotes || 0),
        userVote: thread.votes ? thread.votes[userData?.userEmail] || 0 : 0
      }));
    }
  }, [thread, threadId, threadVotes.userVote]);

  const insertMarkdown = useCallback((prefix, suffix = '', placeholder = '') => {
    const textarea = document.querySelector('.comment-form textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const insertion = selectedText || placeholder;
    const newText = text.substring(0, start) + prefix + insertion + suffix + text.substring(end);
    
    setNewComment(newText);
    
    // Set cursor position after insertion when component updates
    setTimeout(() => {
      textarea.focus();
      const cursorPosition = start + prefix.length + insertion.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }, []);

  const navigateToUserProfile = useCallback((userEmail) => {
    if (!userEmail) return;
    navigate(`/user/${userEmail}`);
  }, [navigate]);

  if (loading) {
    return <ThreadSkeleton />;
  }
  
  if (error || !thread) {
    return (
      <div className="thread-view-container error">
        <div className="thread-view-error">
          <h2>Error</h2>
          <p>{error || 'Thread not found'}</p>
          <button className="back-button" onClick={handleBackToForum}>Back to Forum</button>
        </div>
      </div>
    );
  }

  return (
    <div className="thread-view-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="thread-view-header">
        <button className="back-button" onClick={handleBackToForum}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Forum
        </button>
        <h1 className="thread-view-title">{thread.title}</h1>

        {/* Add thread indicators for major, course, and role */}
        <div className="thread-view-indicators">
          {(thread.major || thread.authorMajor || thread.subject) && (
            <span className="thread-indicator thread-major" title={thread.major || thread.authorMajor || thread.subject}>
              <svg className="indicator-icon" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              {(thread.major || thread.authorMajor || thread.subject)}
            </span>
          )}
          
          {(thread.course || thread.courseKey) && (
            <span className="thread-indicator thread-course" title={thread.course || thread.courseKey}>
              <svg className="indicator-icon" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
              {(thread.course || thread.courseKey)}
            </span>
          )}
          
          {thread.authorRole && (
            <span className={`thread-indicator thread-role th_role-${thread.authorRole.toLowerCase()}`} title={`Posted by ${thread.authorRole}`}>
              <svg className="indicator-icon" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {thread.authorRole}
            </span>
          )}
        </div>

        <div className="thread-view-meta">
          <div className="thread-view-author-info">
            <div className="thread-view-author-avatar">
              <img 
                src={getProfilePictureUrl(authorData || thread.author, thread.authorName?.charAt(0) || 'U', 40)} 
                alt={authorData?.name || thread.authorName || "User"}
                title={`View ${authorData?.name || thread.authorName || "user"}'s profile`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent other click handlers from firing
                  navigateToUserProfile(authorData?.email || thread.authorEmail);
                }}
                className="clickable-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getProfilePictureUrl(null, thread.authorName?.charAt(0) || 'U', 40);
                }}
              />
            </div>
            <div className="thread-view-author-details">
              <span 
                className="thread-view-author-name clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToUserProfile(authorData?.email || thread.authorEmail);
                }}
              >
                {thread.authorName || thread.author?.name || 'Anonymous'}
              </span>
              <span className="post-date">Posted on {formatDate(thread.createdAt)}</span>
            </div>
          </div>
          <div className="thread-view-stats">
            <div className="thread-view-stats-item views">
              <svg className="thread-view-stats-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span>{thread.views || 0} views</span>
            </div>
            <div className="thread-view-stats-item comments">
              <svg className="thread-view-stats-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
              <span>{comments.length || 0} comments</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="thread-view-voting">
        <button 
          className={`vote-button upvote ${threadVotes.userVote === 1 ? 'active' : ''}`}
          onClick={() => handleThreadVote(1)}
          aria-label="Upvote thread"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M7 14l5-5 5 5H7z"/>
          </svg>
        </button>
        <span className="vote-score">{threadVotes.score}</span>
        <button 
          className={`vote-button downvote ${threadVotes.userVote === -1 ? 'active' : ''}`}
          onClick={() => handleThreadVote(-1)}
          aria-label="Downvote thread"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M7 10l5 5 5-5H7z"/>
          </svg>
        </button>
      </div>

      <div className="thread-view-content">
        <ThreadContent content={thread.content || thread.description} />
      </div>
      
      <div className="thread-view-comments-section">
        <h2>Comments ({comments.length})</h2>
        
        <div className="comment-form">
          <form onSubmit={handleSubmitComment}>
            {newComment && localStorage.getItem(`commentDraft-${threadId}`) && (
              <div className="draft-indicator">
                <span>Draft saved</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setNewComment('');
                    localStorage.removeItem(`commentDraft-${threadId}`);
                  }}
                  className="discard-draft"
                >
                  Discard draft
                </button>
              </div>
            )}
            
            <div className="comment-tabs">
              <button 
                type="button"
                className={`tab ${!showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(false)}
              >
                Write
              </button>
              <button 
                type="button"
                className={`tab ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(true)}
              >
                Preview
              </button>
            </div>

            {!showPreview && (
              <MarkdownToolbar onInsert={insertMarkdown} />
            )}
            
            {showPreview ? (
              <div className="comment-preview">
                <MarkdownPreview content={newComment} />
              </div>
            ) : (
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... Supports markdown formatting!"
                rows={4}
                disabled={submitting}
                required
              ></textarea>
            )}
            
            <div className="markdown-hint">
              <details>
                <summary>Markdown formatting tips</summary>
                <div className="markdown-tips-grid">
                  <div className="tip-item">
                    <code>**bold**</code> → <strong>bold</strong>
                  </div>
                  <div className="tip-item">
                    <code>*italic*</code> → <em>italic</em>
                  </div>
                  <div className="tip-item">
                    <code>[link](url)</code> → <a href="#">link</a>
                  </div>
                  <div className="tip-item">
                    <code>![alt](image-url)</code> → image
                  </div>
                  <div className="tip-item">
                    <code># Heading</code> → heading
                  </div>
                  <div className="tip-item">
                    <code>- list item</code> → bullet list
                  </div>
                  <div className="tip-item">
                    <code>1. numbered item</code> → numbered list
                  </div>
                  <div className="tip-item">
                    <code>```code```</code> → code block
                  </div>
                  <div className="tip-item">
                    <code>&gt; quote</code> → blockquote
                  </div>
                </div>
              </details>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-comment" 
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
        
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="thread-view-comments-list">
            {comments.map((comment, index) => {
              const isCurrentUser = comment.authorEmail === JSON.parse(localStorage.getItem('userData') || '{}').userEmail;
              
              return (
                <Comment 
                  key={comment.commentId || `comment-${index}`} 
                  comment={comment} 
                  formatDate={formatDate}
                  onUserClick={navigateToUserProfile}
                  className={isCurrentUser ? 'current-user' : ''}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Thread);