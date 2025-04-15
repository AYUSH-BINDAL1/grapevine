import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Forum.css';
import { base_url } from '../config';

// Sample data for development and testing
const EXAMPLE_THREADS = [
  {
    id: 1,
    title: "Tips for CS 180 Final Exam",
    content: "I'm preparing for the CS 180 final and was wondering if anyone had study tips or resources they could share. I'm especially struggling with the algorithms section. What concepts do you think will be most important to focus on? Last semester's exam had a lot of questions on time complexity and binary trees, but I heard this professor focuses more on practical coding problems.",
    createdAt: "2023-11-15T14:32:00Z",
    category: { id: "cs", name: "Computer Science" },
    author: {
      name: "Alex Johnson",
      profilePictureUrl: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    views: 438,
    commentCount: 24
  },
  {
    id: 2,
    title: "Looking for partner for Biology research project",
    content: "Hello everyone! I'm looking for a partner for the BIO 203 semester research project. My focus area is on plant cellular regeneration, and I want to study the effects of different growth hormones on tissue culture. I've already secured lab space and have some preliminary research done. Let me know if you're interested and what your schedule looks like for the next few weeks!",
    createdAt: "2023-11-20T09:15:00Z",
    category: { id: "bio", name: "Biology" },
    author: {
      name: "Sarah Chen",
      profilePictureUrl: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    views: 126,
    commentCount: 8
  },
  {
    id: 3,
    title: "Purdue vs. Indiana Basketball Game",
    content: "Who's excited for the big game this weekend? Purdue vs. Indiana is always a highlight of the season. Let's show our Boilermaker pride and cheer on the team! Does anyone know if there are any watch parties happening on campus?",
    createdAt: "2023-11-18T18:45:00Z",
    category: { id: "sports", name: "Sports" },
    author: {
      name: "Michael Brown",
      profilePictureUrl: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    views: 312,
    commentCount: 15
  }
];

const EXAMPLE_CATEGORIES = [
  { id: "cs", name: "Computer Science", threadCount: 10 },
  { id: "bio", name: "Biology", threadCount: 5 },
  { id: "sports", name: "Sports", threadCount: 8 }
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
        
        try {
          // Try fetching from API first
          const categoriesResponse = await axios.get(`${base_url}/forum/categories`, {
            headers: { 'Session-Id': sessionId }
          });
          
          setCategories(categoriesResponse.data || []);
        } catch (error) {
          console.log('Using example categories data');
          // Fall back to example data if API fails
          setCategories(EXAMPLE_CATEGORIES);
        }
        
        try {
          // Try fetching threads from API first
          const threadsResponse = await axios.get(`${base_url}/forum/threads`, {
            params: {
              page: currentPage,
              category: selectedCategory !== 'all' ? selectedCategory : undefined,
              search: searchQuery || undefined
            },
            headers: { 'Session-Id': sessionId }
          });
          
          setThreads(threadsResponse.data.threads || []);
          setTotalPages(threadsResponse.data.totalPages || 1);
        } catch (error) {
          console.log('Using example threads data');
          // Fall back to example data if API fails
          
          // Filter by category if selected
          let filteredThreads = EXAMPLE_THREADS;
          if (selectedCategory !== 'all') {
            filteredThreads = EXAMPLE_THREADS.filter(
              thread => thread.category.id === selectedCategory
            );
          }
          
          // Filter by search query if provided
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredThreads = filteredThreads.filter(thread => 
              thread.title.toLowerCase().includes(query) || 
              thread.content.toLowerCase().includes(query) ||
              thread.author.name.toLowerCase().includes(query)
            );
          }
          
          // Sort by most recent first
          filteredThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Basic pagination
          const threadsPerPage = 5;
          const start = (currentPage - 1) * threadsPerPage;
          const end = start + threadsPerPage;
          const paginatedThreads = filteredThreads.slice(start, end);
          
          setThreads(paginatedThreads);
          setTotalPages(Math.ceil(filteredThreads.length / threadsPerPage));
        }
      } catch (error) {
        console.error('Error fetching forum data:', error);
        toast.error("Failed to load forum data");
      } finally {
        setLoading(false);
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
      
      if (!newThread.title.trim() || !newThread.content.trim() || !newThread.categoryId) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      /*const response = await axios.post(`${base_url}/forum/threads`, newThread, {
        headers: { 'Session-Id': sessionId }
      }); */
      
      toast.success("Thread created successfully!");
      setShowNewThreadForm(false);
      setNewThread({ title: '', content: '', categoryId: '' });
      
      // Refresh threads to include the new one
      const threadsResponse = await axios.get(`${base_url}/forum/threads`, {
        params: {
          page: 1, // Go back to first page
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined
        },
        headers: { 'Session-Id': sessionId }
      });
      
      setThreads(threadsResponse.data.threads || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error("Failed to create thread");
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
              <span className="stat-value">1,234</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Posts:</span>
              <span className="stat-value">5,678</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Users:</span>
              <span className="stat-value">42</span>
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
    </div>
  );
}

export default Forum;