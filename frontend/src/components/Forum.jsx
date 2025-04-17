import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Forum.css';
import { base_url } from '../config';

function Forum() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [forumData, setForumData] = useState([]);
  const [sortOrder, setSortOrder] = useState('recent');

  const fetchForumData = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error("Session expired. Please login again.");
        navigate("/");
        return;
      }

      try {
        console.log('Fetching threads from API...');
        
        // Get threads from API
        const response = await axios.get(`${base_url}/threads`, {
          headers: { 'Session-Id': sessionId }
        });
        
        // Log the raw API response
        console.log('Raw API response:', response);
        console.log('Thread data received:', response.data);
        
        // Store complete forum data
        setForumData(response.data);
        
        // Process the response data
        if (Array.isArray(response.data)) {
          console.log(`Processing ${response.data.length} threads from array response`);
          setThreads(response.data);
          setTotalPages(Math.ceil(response.data.length / 10));
          
          // Log thread IDs with the correct property name
          console.log('Thread IDs:', response.data.map(thread => thread.threadId));
        } else if (response.data.threads && Array.isArray(response.data.threads)) {
          console.log(`Processing ${response.data.threads.length} threads from nested response`);
          setThreads(response.data.threads);
          setTotalPages(response.data.totalPages || Math.ceil(response.data.threads.length / 10));
          
          // Log thread IDs to help identify any missing or duplicate IDs
          console.log('Thread IDs:', response.data.threads.map(thread => thread.id));
        } else {
          console.warn('Unexpected response format:', response.data);
          setThreads([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.warn("Error fetching forum data from API:", error);
        console.log("Error details:", error.response || error.message);
      }
    } catch (error) {
      console.error("Unexpected error in fetchForumData:", error);
      toast.error("Failed to load forum data. Please try again later.");
    } finally {
      setLoading(false);
      console.log('Thread fetching complete.');
    }
  }, [navigate]);

  useEffect(() => {
    fetchForumData();
  }, [fetchForumData]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error("Please log in to create a new thread");
        return;
      }
      
      if (!newThread.title.trim() || !newThread.content.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userEmail = userData.userEmail;
      
      if (!userEmail) {
        toast.error("User information not found. Please log in again.");
        return;
      }
      
      const threadPayload = {
        title: newThread.title,
        description: newThread.content,
        authorEmail: userEmail,
      };
      
      console.log('Creating thread with payload:', threadPayload);
      
      toast.info("Creating thread...", { autoClose: 2000, toastId: "creating" });
      
      try {
        const response = await axios.post(`${base_url}/threads`, threadPayload, {
          headers: { 
            'Content-Type': 'application/json',
            'Session-Id': sessionId 
          }
        });
        
        toast.success("Thread created successfully!");
        
        // Add to forumData if it's an array
        if (Array.isArray(forumData)) {
          const newThread = response.data;
          setForumData([newThread, ...forumData]);
        }
        
      } catch (apiError) {
        console.warn("API error when creating thread:", apiError);
        toast.error("Failed to create thread. Please try again.");
      }
      
      setShowNewThreadForm(false);
      setNewThread({ title: '', content: '' });
      
      // Refresh the data
      fetchForumData();
    } catch (error) {
      console.error('Error in thread creation process:', error);
      toast.error("An unexpected error occurred");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  const isHotThread = (thread) => {
    const viewsThreshold = 100;
    const commentsThreshold = 5;
    const viewsWeight = 1;
    const commentsWeight = 10;
    
    const score = (thread.views || 0) * viewsWeight + 
                 (thread.commentCount || 0) * commentsWeight;
    
    return score > viewsThreshold + (commentsThreshold * commentsWeight);
  };

  const goToThread = (threadId) => {
    if (!threadId) {
      console.warn('Attempted to navigate to thread with undefined ID');
      toast.error('Cannot view this thread: Invalid thread ID');
      return;
    }
    navigate(`/forum/thread/${threadId}`);
  };

  return (
    <div className="forum-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="forum-header">
        <h1>Student Forums</h1>
        <div className="forum-search-controls">
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            className="new-thread-button"
            onClick={() => setShowNewThreadForm(!showNewThreadForm)}
          >
            {showNewThreadForm ? 'Cancel' : 'New Thread'}
          </button>
        </div>
      </div>
      
      {showNewThreadForm && (
        <div className="new-thread-form">
          <h2>Create New Thread</h2>
          <form onSubmit={handleCreateThread}>
            <div className="form-group">
              <label htmlFor="thread-title">Title</label>
              <input
                id="thread-title"
                type="text"
                value={newThread.title}
                onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                placeholder="Thread title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="thread-content">Content</label>
              <textarea
                id="thread-content"
                value={newThread.content}
                onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                placeholder="Thread content"
                rows={5}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">Create Thread</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowNewThreadForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="forum-content">
        <div className="forum-sidebar">
          <div className="sidebar-search">
            <h3>Filter Threads</h3>
            <div className="search-form">
              <input
                type="text"
                placeholder="Search in threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
              <button className="search-button">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
            
            <div className="filter-options">
              <div className="filter-group">
                <label>Time period:</label>
                <select className="filter-select">
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Thread type:</label>
                <div className="filter-checkboxes">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Questions</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Announcements</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Discussions</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="forum-stats">
            <h3>Forum Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">Total Threads:</span>
              <span className="stat-value">N/A</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Replies:</span>
              <span className="stat-value">N/A</span>
            </div>
          </div>
        </div>
        
        <div className="threads-container">
          <div className="threads-header">
            <h2>All Threads</h2>
            <div className="thread-filters">
              <select 
                className="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading threads...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="empty-state">
              <p>No threads found. Be the first to start a discussion!</p>
              <button 
                className="new-thread-button"
                onClick={() => setShowNewThreadForm(true)}
              >
                Create Thread
              </button>
            </div>
          ) : (
            <>
              <ul className="threads-list">
                {threads.map((thread, index) => (
                  <li 
                    key={thread.threadId || `thread-${index}`} 
                    className="thread-item" 
                    onClick={() => goToThread(thread.threadId)}
                  >
                    <div className="thread-avatar">
                      <img 
                        src={thread.author?.profilePictureUrl || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3E${thread.author?.name?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`} 
                        alt={thread.author?.name || "User"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3E${thread.author?.name?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    </div>
                    <div className="thread-content">
                      <h3 className="thread-title">{thread.title}</h3>
                      <div className="thread-meta">
                        <span className="thread-author">by {thread.author?.name || "Anonymous"}</span>
                        <span className="thread-date">Posted on {formatDate(thread.createdAt)}</span>
                      </div>
                      <p className="thread-excerpt">
                        {(thread.content || thread.description || "").substring(0, 120)}
                        {(thread.content || thread.description || "").length > 120 ? "..." : ""}
                      </p>
                      <div className="thread-stats">
                        <div className="stats-item views">
                          <svg className="stats-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                          <span>{formatNumber(thread.views || 0)}</span>
                        </div>
                        
                        <div className="stats-item comments">
                          <svg className="stats-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                          </svg>
                          <span>{formatNumber(thread.commentCount || 0)}</span>
                        </div>
                        
                        {thread.isRecent && (
                          <div className="stats-badge new">
                            <span>New</span>
                          </div>
                        )}
                        
                        {isHotThread(thread) && (
                          <div className="stats-badge hot">
                            <svg className="hot-icon" viewBox="0 0 24 24" width="14" height="14">
                              <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                            </svg>
                            <span>Hot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <button 
        className="post-thread-fab"
        onClick={() => setShowNewThreadForm(true)}
        aria-label="Create a new thread"
      >
        <span className="fab-icon">+</span>
        <span className="fab-text">Post Thread</span>
      </button>
    </div>
  );
}

export default Forum;