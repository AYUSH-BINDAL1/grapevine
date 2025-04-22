import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { base_url } from '../config';
import './Thread.css';

function Thread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [threadVotes, setThreadVotes] = useState({
    score: thread?.likes || 0,
    userVote: 0 // 1 for upvote, -1 for downvote, 0 for no vote
  });
  
  // Add a function to sort comments by date (newest first)
  const sortCommentsByDate = (commentsArray) => {
    return [...commentsArray].sort((a, b) => {
      // Convert dates for comparison
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      // Sort descending (newer dates first)
      return dateB - dateA;
    });
  };
  
  // Fetch thread data
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
        
        // Optionally fetch comments separately if needed
        // try {
        //   const commentsResponse = await axios.get...
        // } ...
      }
      
      // Increment view count (commented out in your original code)
      
    } catch (error) {
      console.error('Error fetching thread data:', error);
      setError('Failed to load thread data. Please try again.');
      toast.error('Error loading thread data');
    } finally {
      setLoading(false);
    }
  }, [threadId, navigate]);
  
  useEffect(() => {
    fetchThreadData();
  }, [fetchThreadData]);
  
  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle posting a new comment
  const handleSubmitComment = async (e) => {
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

      // Log the full response structure
      console.log('Comment API response:', response);

      // Check if response contains the comment directly or nested
      let commentResponse = response.data;
      if (response.data && response.data.comment) {
        commentResponse = response.data.comment;
      }
      console.log('Comment data to process:', commentResponse);

      // Extract comment properties with better fallbacks
      const newCommentData = {
        commentId: commentResponse.commentId || commentResponse.id || `new-${Date.now()}`,
        content: commentResponse.content || commentResponse.body || commentResponse.text || newComment,
        authorEmail: commentResponse.authorEmail || userData.userEmail,
        authorName: commentResponse.authorName || commentResponse.author?.name || userData.name,
        likes: commentResponse.likes || 0,
        createdAt: commentResponse.createdAt || new Date().toISOString()
      };

      console.log('Processed new comment:', newCommentData);

      // Add to state with new comment at the top
      const currentLength = comments.length;
      setComments(prevComments => {
        // Place new comment at the beginning of the array
        const updatedComments = [newCommentData, ...prevComments];
        console.log('Updated comments array length:', updatedComments.length, 'Previous:', currentLength);
        return updatedComments;
      });
      
      // Clear the comment input
      setNewComment('');
      toast.success('Comment posted successfully');
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Navigate back to forum
  const handleBackToForum = () => {
    navigate('/forum');
  };

  const handleThreadVote = async (vote) => {
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
            score: prev.score - vote, // Adjust score in opposite direction
            userVote: 0 // Reset to no vote
          };
        }
        
        // If changing vote direction (e.g., from upvote to downvote)
        if (prev.userVote !== 0 && prev.userVote !== vote) {
          return {
            score: prev.score + 2 * vote, // Double the effect (remove old vote + add new vote)
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
  };

  if (loading) {
    return (
      <div className="thread-view-container loading">
        <div className="thread-view-loading">
          <div className="thread-view-spinner"></div>
          <p>Loading thread...</p>
        </div>
      </div>
    );
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
        <div className="thread-view-meta">
          <div className="thread-view-author-info">
            <div className="thread-view-author-avatar">
              <img 
                src={thread.author?.profilePictureUrl || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3E${thread.authorName?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`} 
                alt={thread.authorName || "User"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EU%3C/text%3E%3C/svg%3E`;
                }}
              />
            </div>
            <div className="thread-view-author-details">
              <span className="thread-view-author-name">{thread.authorName || thread.author?.name || 'Anonymous'}</span>
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
        <div className="thread-view-body">
          <p>{thread.content || thread.description}</p>
        </div>
      </div>
      
      <div className="thread-view-comments-section">
        <h2>Comments ({comments.length})</h2>
        
        <div className="comment-form">
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={4}
              disabled={submitting}
              required
            ></textarea>
            <button 
              type="submit" 
              className="submit-comment" 
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
        
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="thread-view-comments-list">
            {comments.map((comment, index) => {
              const commentId = comment.commentId || `comment-${index}`;
              
              return (
                <div key={commentId} className="thread-view-comment-item">
                  <div className="thread-view-comment-header">
                    <div className="commenter-info">
                      <div className="commenter-avatar">
                        <img 
                          src={comment.author?.profilePictureUrl || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='white' text-anchor='middle' dy='.3em'%3E${comment.authorName?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`} 
                          alt={comment.authorName || "User"}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='white' text-anchor='middle' dy='.3em'%3EU%3C/text%3E%3C/svg%3E`;
                          }}
                        />
                      </div>
                      <div className="commenter-details">
                        <span className="commenter-name">{comment.authorName || comment.author?.name || 'Anonymous'}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="thread-view-comment-body">
                    <p>{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Thread;