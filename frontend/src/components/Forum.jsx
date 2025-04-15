import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Forum.css';
import { base_url } from '../config';

const EXAMPLE_CATEGORIES = [
  { id: '1', name: 'General', threadCount: 10 },
  { id: '2', name: 'Announcements', threadCount: 5 },
  { id: '3', name: 'Feedback', threadCount: 8 },
];

const EXAMPLE_THREADS = [
  {
    id: '1',
    title: 'Welcome to the forum!',
    content: 'This is the first thread in the forum. Feel free to discuss anything here.',
    author: { name: 'Admin', profilePictureUrl: '' },
    createdAt: '2023-01-01T12:00:00Z',
    category: { id: '1', name: 'General' },
    views: 100,
    commentCount: 5,
  },
  {
    id: '2',
    title: 'Forum Rules',
    content: 'Please read the forum rules before posting.',
    author: { name: 'Admin', profilePictureUrl: '' },
    createdAt: '2023-01-02T12:00:00Z',
    category: { id: '2', name: 'Announcements' },
    views: 50,
    commentCount: 2,
  },
];

function Forum() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', categoryId: '' });

  // Fetch forum data
  useEffect(() => {
    const fetchForumData = async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          toast.error("Please log in to access the forum");
          navigate("/");
          return;
        }

        setLoading(true);
        
        // Use example categories directly
        setCategories(EXAMPLE_CATEGORIES);
        
        try {
          // Attempt to fetch threads from API
          console.log("Attempting to fetch threads from API...");
          const threadsResponse = await axios.get(`${base_url}/threads`, {
            headers: { 'Session-Id': sessionId }
          });
          
          console.log("API response received:", threadsResponse.data);
          const responseData = threadsResponse.data;
          
          // Process API response
          if (Array.isArray(responseData)) {
            setThreads(responseData);
            setTotalPages(Math.ceil(responseData.length / 10));
          } else if (responseData.threads && Array.isArray(responseData.threads)) {
            setThreads(responseData.threads);
            setTotalPages(responseData.totalPages || Math.ceil(responseData.threads.length / 10));
          } else {
            console.warn('Unexpected response format, falling back to sample data');
            useExampleThreads();
          }
        } catch (error) {
          console.warn(`API error: ${error.message}. Status: ${error.response?.status}`);
          console.log('Using example thread data due to API error');
          
          // Show only a single toast message, not for every failed request
          if (currentPage === 1 && selectedCategory === 'all' && !searchQuery) {
            toast.info("Using demo data while server is unavailable", {
              autoClose: 3000,
              toastId: "api-error" // Prevents duplicate toasts
            });
          }
          
          useExampleThreads();
        }
      } catch (error) {
        console.error('Unexpected error in fetchForumData:', error);
      } finally {
        setLoading(false);
      }
      
      // Extract the example threads filtering logic into a helper function
      function useExampleThreads() {
        let filteredThreads = EXAMPLE_THREADS;
        
        if (selectedCategory !== 'all') {
          filteredThreads = EXAMPLE_THREADS.filter(
            thread => thread.category.id === selectedCategory
          );
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredThreads = filteredThreads.filter(thread => 
            thread.title.toLowerCase().includes(query) || 
            thread.content.toLowerCase().includes(query)
          );
        }
        
        // Basic pagination
        const threadsPerPage = 5;
        const start = (currentPage - 1) * threadsPerPage;
        const end = start + threadsPerPage;
        const paginatedThreads = filteredThreads.slice(start, end);
        
        setThreads(paginatedThreads);
        setTotalPages(Math.ceil(filteredThreads.length / threadsPerPage));
      }
    };
    
    fetchForumData();
  }, [navigate, currentPage, selectedCategory, searchQuery]);

  // Create new thread
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
      
      // Get user email from localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userEmail = userData.userEmail;
      
      if (!userEmail) {
        toast.error("User information not found. Please log in again.");
        return;
      }
      
      // Create the request payload in the format expected by the API
      const threadPayload = {
        title: newThread.title,
        description: newThread.content,     // API expects 'description', not 'content'
        authorEmail: userEmail,             // Add author email from user data
        categoryId: newThread.categoryId    // Include category if your API supports it
      };
      
      console.log('Creating thread with payload:', threadPayload);
      
      // Show creating status
      toast.info("Creating thread...", { autoClose: 2000, toastId: "creating" });
      
      // Attempt to create thread via API
      try {
        const response = await axios.post(`${base_url}/threads`, threadPayload, {
          headers: { 
            'Content-Type': 'application/json',
            'Session-Id': sessionId 
          }
        });
        
        toast.success("Thread created successfully!");
      } catch (apiError) {
        console.warn("API error when creating thread:", apiError);
        toast.warning("Thread creation API unavailable. Using demo mode.");
        
        // Simulate thread creation in demo mode
        const newThreadObj = {
          id: `demo-${Date.now()}`,
          title: newThread.title,
          content: newThread.content,
          author: { 
            name: userData.fullName || userData.name || "Current User",
            profilePictureUrl: userData.profilePictureUrl || ""
          },
          createdAt: new Date().toISOString(),
          category: categories.find(c => c.id === newThread.categoryId) || { id: '1', name: 'General' },
          views: 0,
          commentCount: 0
        };
        
        // Add to example threads for the demo experience
        EXAMPLE_THREADS.unshift(newThreadObj);
      }
      
      // Clean up form regardless of API success
      setShowNewThreadForm(false);
      setNewThread({ title: '', content: '', categoryId: '' });
      
      // Refresh the thread list (will use API or sample data as appropriate)
      fetchForumData();
    } catch (error) {
      console.error('Error in thread creation process:', error);
      toast.error("An unexpected error occurred");
    }
  };

  // Format date for display
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

  // Navigate to thread detail page
  const goToThread = (threadId) => {
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
              <label htmlFor="thread-category">Category</label>
              <select
                id="thread-category"
                value={newThread.categoryId}
                onChange={(e) => setNewThread({...newThread, categoryId: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
          <div className="categories-section">
            <h3>Categories</h3>
            <ul className="categories-list">
              <li 
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </li>
              {categories.map(category => (
                <li 
                  key={category.id}
                  className={selectedCategory === category.id ? 'active' : ''}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                  <span className="thread-count">{category.threadCount || 0}</span>
                </li>
              ))}
            </ul>
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
            <h2>{selectedCategory === 'all' ? 'All Threads' : `Threads in ${categories.find(c => c.id === selectedCategory)?.name || ''}`}</h2>
            <div className="thread-filters">
              <select className="sort-select">
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
                {threads.map(thread => (
                  <li key={thread.id} className="thread-item" onClick={() => goToThread(thread.id)}>
                    <div className="thread-avatar">
                      <img src={thread.author.profilePictureUrl || 'https://via.placeholder.com/40'} alt={thread.author.name} />
                    </div>
                    <div className="thread-content">
                      <h3 className="thread-title">{thread.title}</h3>
                      <div className="thread-meta">
                        <span className="thread-author">by {thread.author.name}</span>
                        <span className="thread-date">Posted on {formatDate(thread.createdAt)}</span>
                        <span className="thread-category">{thread.category.name}</span>
                      </div>
                      <p className="thread-excerpt">{thread.content.substring(0, 120)}...</p>
                      <div className="thread-stats">
                        <span className="thread-views">{thread.views} views</span>
                        <span className="thread-comments">{thread.commentCount} comments</span>
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

      {/* Add floating action button for posting new threads */}
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