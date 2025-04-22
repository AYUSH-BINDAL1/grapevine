import { useState, useEffect, useCallback, memo, useMemo, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FixedSizeList as List } from 'react-window';
import PropTypes from 'prop-types';
import AutoSizer from 'react-virtualized-auto-sizer';
import remarkGfm from 'remark-gfm';
import 'react-toastify/dist/ReactToastify.css';
import './Forum.css';
import { base_url } from '../config';
import MarkdownToolbar from './MarkdownToolbar';
import { getProfilePictureUrl } from '../utils/imageUtils';
import { getCachedUserByEmail } from '../utils/userUtils';

// Add this debounce hook near your imports
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Add these functions near the top of your file with other utility functions

const fetchAllCourses = async () => {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return [];
  
  try {
    const response = await axios.get(`${base_url}/courses/all`, {
      headers: { 'Session-Id': sessionId }
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

const fetchAllMajors = async () => {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return [];
  
  try {
    const response = await axios.get(`${base_url}/courses/subjects`, {
      headers: { 'Session-Id': sessionId }
    });
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching subjects/majors:", error);
    return [];
  }
};

// Create a new SearchableDropdown component for filter selections
const SearchableDropdown = memo(({ 
  options, 
  value, 
  onChange, 
  placeholder,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);
  
  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);
  
  const handleSelectOption = (option) => {
    onChange(option);
    setIsOpen(false);
  };
  
  const displayValue = value || placeholder || "Select...";
  
  return (
    <div className="filter-group searchable-dropdown-container" ref={dropdownRef}>
      <label className="filter-label">{label}</label>
      <div className="searchable-dropdown">
        <div 
          className={`dropdown-header ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="selected-value">{displayValue}</span>
          <span className="dropdown-arrow">▼</span>
        </div>
        
        {isOpen && (
          <div className="dropdown-content">
            <div className="search-wrapper">
              <input
                type="text"
                className="dropdown-search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            
            <div className="dropdown-options">
              <div 
                className={`dropdown-option ${!value ? 'selected' : ''}`}
                onClick={() => handleSelectOption('')}
              >
                All
              </div>
              
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`dropdown-option ${option === value ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(option)}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div className="no-options">No matches found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SearchableDropdown.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired
};

SearchableDropdown.displayName = 'SearchableDropdown';

// Add a function to fetch user data for thread authors
const ThreadRowWithAuthor = memo(({ thread, index, style, data }) => {
  const { isThreadRead, bookmarks, toggleBookmark, formatDate, goToThread } = data;
  const [author, setAuthor] = useState(null);
  
  useEffect(() => {
    if (thread?.authorEmail) {
      const fetchAuthor = async () => {
        const userData = await getCachedUserByEmail(thread.authorEmail);
        if (userData) {
          setAuthor(userData);
        }
      };
      
      fetchAuthor();
    }
  }, [thread?.authorEmail]);
  
  return (
    <div style={style} className="virtualized-thread-wrapper">
      <li 
        key={thread.threadId || `thread-${index}`} 
        className={`thread-item ${isThreadRead(thread.threadId) ? 'thread-read' : ''} ${bookmarks.includes(thread.threadId) ? 'thread-bookmarked' : ''}`}
        onClick={() => goToThread(thread.threadId)}
      >
        <div className="thread-avatar">
          <img 
            src={getProfilePictureUrl(author || thread.author, thread.author?.name?.charAt(0) || 'U', 40)} 
            alt={author?.name || thread.author?.name || "User"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getProfilePictureUrl(null, thread.author?.name?.charAt(0) || 'U', 40);
            }}
            loading="lazy"
          />
        </div>
        
        <div className="thread-content">
          <div className="thread-header">
            <h3 className="thread-title">{thread.title}</h3>
            <button 
              className="bookmark-button" 
              onClick={(e) => toggleBookmark(e, thread.threadId)}
              aria-label={bookmarks.includes(thread.threadId) ? "Remove bookmark" : "Bookmark thread"}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path 
                  fill="currentColor" 
                  d={bookmarks.includes(thread.threadId) 
                    ? "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" 
                    : "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"} 
                />
              </svg>
            </button>
          </div>
          <div className="thread-meta">
            <span className="thread-author">by {author?.name || thread.authorName || "Anonymous"}</span>
            <span className="thread-date">Posted on {formatDate(thread.createdAt)}</span>
          </div>
          <div className="thread-excerpt">
            {thread.format === 'markdown' ? (
              <div className="markdown-excerpt">
                <ReactMarkdown
                  rehypePlugins={[rehypeSanitize]}
                  className="thread-excerpt-content"
                  components={{
                    code({ inline, className, children }) {
                      return inline ? (
                        <code className={className}>{children}</code>
                      ) : (
                        <code className="code-block-preview">{'{code}'}</code>
                      );
                    },
                    h1: ({children}) => <strong>{children}</strong>,
                    h2: ({children}) => <strong>{children}</strong>,
                    h3: ({children}) => <strong>{children}</strong>,
                    h4: ({children}) => <strong>{children}</strong>,
                    h5: ({children}) => <strong>{children}</strong>,
                    h6: ({children}) => <strong>{children}</strong>,
                    img: () => <span>[img]</span>,
                    p: ({children}) => <p>{children}</p>
                  }}
                >
                  {(thread.content || thread.description || "").substring(0, 80)}
                  {(thread.content || thread.description || "").length > 80 ? "..." : ""}
                </ReactMarkdown>
              </div>
            ) : (
              <p>
                {(thread.content || thread.description || "")
                  .replace(/[#*_~`[\]]/g, '')
                  .substring(0, 80)}
                {(thread.content || thread.description || "").length > 80 ? "..." : ""}
              </p>
            )}
          </div>
          <div className="thread-stats">
            <div className="stats-item comments">
              <svg className="stats-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
              <span>{data.formatNumber(thread.comments ? thread.comments.length : 0)}</span>
            </div>
            
            <div className="stats-item score">
              <svg className="stats-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
              </svg>
              <span>{data.formatNumber((thread.upvotes || 0) - (thread.downvotes || 0))}</span>
            </div>
            
            <div className="stats-item upvotes">
              <svg className="stats-icon upvote" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 14l5-5 5 5H7z"/>
              </svg>
              <span>{data.formatNumber(thread.upvotes || 0)}</span>
            </div>
            
            <div className="stats-item downvotes">
              <svg className="stats-icon downvote" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 10l5 5 5-5H7z"/>
              </svg>
              <span>{data.formatNumber(thread.downvotes || 0)}</span>
            </div>
            
            {/* Additional stats items */}
            {thread.isRecent && (
              <div className="stats-badge new">
                <span>New</span>
              </div>
            )}
            
            {data.isHotThread(thread) && (
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
    </div>
  );
});

ThreadRowWithAuthor.displayName = 'ThreadRowWithAuthor';

// Define thread shape for better documentation
const ThreadShape = PropTypes.shape({
  threadId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  description: PropTypes.string,
  createdAt: PropTypes.string,
  upvotes: PropTypes.number,
  downvotes: PropTypes.number,
  comments: PropTypes.array,
  author: PropTypes.shape({
    name: PropTypes.string,
    profilePictureUrl: PropTypes.string
  }),
  authorEmail: PropTypes.string,
  authorName: PropTypes.string,
  format: PropTypes.string,
  isRecent: PropTypes.bool
});

// Use this in the ThreadRowWithAuthor PropTypes
ThreadRowWithAuthor.propTypes = {
  thread: ThreadShape.isRequired,
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.shape({
    isThreadRead: PropTypes.func.isRequired,
    bookmarks: PropTypes.array.isRequired,
    toggleBookmark: PropTypes.func.isRequired,
    formatDate: PropTypes.func.isRequired,
    goToThread: PropTypes.func.isRequired,
    formatNumber: PropTypes.func.isRequired,
    isHotThread: PropTypes.func.isRequired
  }).isRequired
};

// Add default props
ThreadRowWithAuthor.defaultProps = {
  data: {
    bookmarks: [],
    isThreadRead: () => false,
    toggleBookmark: () => {},
    goToThread: () => {},
    formatNumber: (n) => n,
    formatDate: (d) => d,
    isHotThread: () => false
  }
};

// Update the threadFormReducer to handle course and major fields:

const threadFormReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_CONTENT':
      return { ...state, content: action.payload };
    case 'SET_COURSE':
      return { ...state, course: action.payload };
    case 'SET_MAJOR':
      return { ...state, major: action.payload };
    case 'TOGGLE_PREVIEW':
      return { ...state, showPreview: !state.showPreview };
    case 'RESET':
      return { title: '', content: '', course: '', major: '', showPreview: false };
    case 'LOAD_DRAFT':
      return { ...action.payload, showPreview: false };
    default:
      return state;
  }
};

// Add this above your main Forum component
const ThreadForm = memo(({ 
  threadForm,
  dispatchThreadForm,
  handleCreateThread,
  setShowNewThreadForm,
  clearDraft,
  availableCourses,
  availableMajors
}) => {
  const insertMarkdown = (prefix, suffix, placeholder) => {
    const textarea = document.getElementById('thread-content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const contentBefore = text.substring(0, start);
    const contentAfter = text.substring(end);
    
    const newContent = `${contentBefore}${prefix}${selectedText || placeholder}${suffix}${contentAfter}`;
    
    dispatchThreadForm({ 
      type: 'SET_CONTENT', 
      payload: newContent
    });
    
    // After state updates, set selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + (selectedText || placeholder).length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="new-thread-form">
      <div className="form-header">
        <h2>Create New Thread</h2>
        {(threadForm.title || threadForm.content) && (
          <span className="draft-status">Draft saved</span>
        )}
      </div>
      <form onSubmit={handleCreateThread}>
        <div className="form-group">
          <label htmlFor="thread-title">Title</label>
          <input
            id="thread-title"
            type="text"
            value={threadForm.title}
            onChange={(e) => dispatchThreadForm({ 
              type: 'SET_TITLE', 
              payload: e.target.value 
            })}
            placeholder="Thread title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="thread-content">Content</label>
          
          <div className="thread-editor-tabs">
            <button 
              type="button"
              className={`tab ${!threadForm.showPreview ? 'active' : ''}`}
              onClick={() => dispatchThreadForm({ type: 'TOGGLE_PREVIEW' })}
            >
              Write
            </button>
            <button 
              type="button"
              className={`tab ${threadForm.showPreview ? 'active' : ''}`}
              onClick={() => dispatchThreadForm({ type: 'TOGGLE_PREVIEW' })}
            >
              Preview
            </button>
          </div>
          
          {!threadForm.showPreview ? (
            <>
              <MarkdownToolbar onInsert={insertMarkdown} />
              <textarea
                id="thread-content"
                value={threadForm.content}
                onChange={(e) => dispatchThreadForm({ 
                  type: 'SET_CONTENT', 
                  payload: e.target.value 
                })}
                placeholder="Write your thread content here. Markdown formatting is supported!"
                rows={10}
                required
              />
            </>
          ) : (
            <div className="markdown-preview">
              {threadForm.content ? (
                <ReactMarkdown
                  rehypePlugins={[rehypeSanitize]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {threadForm.content}
                </ReactMarkdown>
              ) : (
                <p className="empty-preview">Nothing to preview yet. Start writing to see how your post will look!</p>
              )}
            </div>
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
        </div>

        <div className="form-group">
          <label htmlFor="thread-course">Related Course (Optional)</label>
          <select
            id="thread-course"
            value={threadForm.course || ""}
            onChange={(e) => dispatchThreadForm({ 
              type: 'SET_COURSE', 
              payload: e.target.value 
            })}
            className="thread-select"
          >
            <option value="">None</option>
            {availableCourses.map((course, index) => (
              <option key={index} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="thread-major">Related Major (Optional)</label>
          <select
            id="thread-major"
            value={threadForm.major || ""}
            onChange={(e) => dispatchThreadForm({ 
              type: 'SET_MAJOR', 
              payload: e.target.value 
            })}
            className="thread-select"
          >
            <option value="">None</option>
            {availableMajors.map((major, index) => (
              <option key={index} value={major}>{major}</option>
            ))}
          </select>
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
          <button 
            type="button"
            className="clear-button"
            onClick={clearDraft}
          >
            Clear Draft
          </button>
        </div>
      </form>
    </div>
  );
});

ThreadForm.propTypes = {
  threadForm: PropTypes.object.isRequired,
  dispatchThreadForm: PropTypes.func.isRequired,
  handleCreateThread: PropTypes.func.isRequired,
  setShowNewThreadForm: PropTypes.func.isRequired,
  clearDraft: PropTypes.func.isRequired,
  availableCourses: PropTypes.array.isRequired,
  availableMajors: PropTypes.array.isRequired
};

ThreadForm.displayName = 'ThreadForm';

// Update the ForumSidebar component with new filter options

const ForumSidebar = memo(({
  searchInputValue,
  setSearchInputValue,
  forumStats,
  bookmarks,
  formatNumber,
  filterMajor,
  setFilterMajor,
  filterCourse,
  setFilterCourse,
  filterRole,
  setFilterRole,
  availableMajors,
  availableCourses,
  resetFilters
}) => {
  return (
    <div className="forum-sidebar">
      <div className="sidebar-search">
        <h3>Filter Threads</h3>
        <div className="search-form">
          <input
            type="text"
            placeholder="Search in threads..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="sidebar-search-input"
          />
          <button className="search-button">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
        
        <div className="filter-options">
          {/* Major filter with searchable dropdown */}
          <SearchableDropdown
            options={availableMajors}
            value={filterMajor}
            onChange={setFilterMajor}
            placeholder="All Majors"
            label="Major:"
          />
          
          {/* Course filter with searchable dropdown */}
          <SearchableDropdown
            options={availableCourses}
            value={filterCourse}
            onChange={setFilterCourse}
            placeholder="All Courses"
            label="Course:"
          />
          
          {/* Role filter with searchable dropdown */}
          <SearchableDropdown
            options={["Student", "Instructor", "UTA", "GTA"]}
            value={filterRole}
            onChange={setFilterRole}
            placeholder="All Roles"
            label="Author Role:"
          />
          
          {/* Reset filters button */}
          <button 
            className="reset-filters-button" 
            onClick={resetFilters}
            disabled={!filterMajor && !filterCourse && !filterRole && !searchInputValue}
          >
            Reset Filters
          </button>
          
          <div className="filter-group">
            <label>Time period:</label>
            <select className="filter-select">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="forum-stats">
        <h3>Forum Statistics</h3>
        <div className="stat-item">
          <span className="stat-label">Total Threads:</span>
          <span className="stat-value">{formatNumber(forumStats.totalThreads)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Replies:</span>
          <span className="stat-value">{formatNumber(forumStats.totalReplies)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Your Bookmarks:</span>
          <span className="stat-value">{formatNumber(bookmarks.length)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Activity Score:</span>
          <span className="stat-value">{formatNumber(forumStats.totalThreads + forumStats.totalReplies * 2)}</span>
        </div>
      </div>
    </div>
  );
});

// Update PropTypes for the ForumSidebar
ForumSidebar.propTypes = {
  searchInputValue: PropTypes.string.isRequired,
  setSearchInputValue: PropTypes.func.isRequired,
  forumStats: PropTypes.object.isRequired,
  bookmarks: PropTypes.array.isRequired,
  formatNumber: PropTypes.func.isRequired,
  filterMajor: PropTypes.string.isRequired,
  setFilterMajor: PropTypes.func.isRequired,
  filterCourse: PropTypes.string.isRequired,
  setFilterCourse: PropTypes.func.isRequired,
  filterRole: PropTypes.string.isRequired,
  setFilterRole: PropTypes.func.isRequired,
  availableMajors: PropTypes.array.isRequired,
  availableCourses: PropTypes.array.isRequired,
  resetFilters: PropTypes.func.isRequired
};

ForumSidebar.displayName = 'ForumSidebar';

// Add this above your main Forum component
const ThreadListing = memo(({
  loading,
  displayThreads,
  showBookmarksOnly,
  setShowBookmarksOnly,
  setShowNewThreadForm,
  sortOrder,
  setSortOrder,
  listData,
  currentPage,
  setCurrentPage,
  totalPages
}) => {
  return (
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
            <option value="oldest">Oldest</option>
            <option value="comments">Most Comments</option>
            <option value="score">Highest Score</option>
          </select>
          <label className="bookmark-filter">
            <input 
              type="checkbox" 
              checked={showBookmarksOnly} 
              onChange={(e) => setShowBookmarksOnly(e.target.checked)} 
            />
            Show Bookmarks Only
          </label>
        </div>
      </div>
      
      {loading ? (
        <div className="skeleton-loading">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="thread-skeleton">
              <div className="skeleton-avatar skeleton"></div>
              <div className="skeleton-content">
                <div className="skeleton-title skeleton"></div>
                <div className="skeleton-meta skeleton"></div>
                <div className="skeleton-excerpt skeleton"></div>
                <div className="skeleton-stats">
                  <div className="skeleton-stat-item skeleton"></div>
                  <div className="skeleton-stat-item skeleton"></div>
                  <div className="skeleton-stat-item skeleton"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayThreads.length === 0 ? (
        <div className="empty-state">
          {showBookmarksOnly ? (
            <>
              <p>No bookmarked threads found.</p>
              <div className="bookmark-actions">
                <button 
                  className="clear-bookmarks"
                  onClick={() => setShowBookmarksOnly(false)}
                >
                  Show all threads
                </button>
              </div>
            </>
          ) : (
            <>
              <p>No threads found. Be the first to start a discussion!</p>
              <button 
                className="new-thread-button"
                onClick={() => setShowNewThreadForm(true)}
              >
                Create Thread
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="virtualized-thread-container">
            <AutoSizer disableHeight>
              {({ width }) => (
                <List
                  className="virtualized-threads-list"
                  height={600}
                  width={width}
                  itemCount={displayThreads.length}
                  itemSize={160}
                  itemData={listData}
                >
                  {({ index, style }) => (
                    <ThreadRowWithAuthor
                      thread={displayThreads[index]}
                      index={index}
                      style={style}
                      data={listData}
                    />
                  )}
                </List>
              )}
            </AutoSizer>
          </div>
          
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
  );
});

ThreadListing.propTypes = {
  loading: PropTypes.bool.isRequired,
  displayThreads: PropTypes.array.isRequired,
  showBookmarksOnly: PropTypes.bool.isRequired,
  setShowBookmarksOnly: PropTypes.func.isRequired,
  setShowNewThreadForm: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  setSortOrder: PropTypes.func.isRequired,
  listData: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  totalPages: PropTypes.number.isRequired
};

ThreadListing.displayName = 'ThreadListing';

function Forum() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unsortedThreads, setUnsortedThreads] = useState([]);
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchQuery = useDebounce(searchInputValue, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [forumData, setForumData] = useState([]);
  const [sortOrder, setSortOrder] = useState('recent');
  const [forumStats, setForumStats] = useState({
    totalThreads: 0,
    totalReplies: 0
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [filterMajor, setFilterMajor] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [availableMajors, setAvailableMajors] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  const [threadForm, dispatchThreadForm] = useReducer(threadFormReducer, {
    title: '',
    content: '',
    course: '',
    major: '',
    showPreview: false
  });

  // Memoize these utility functions
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  }, []);

  const isHotThread = useCallback((thread) => {
    const commentsThreshold = 5;
    const upvotesThreshold = 3;
    
    const commentsWeight = 10;
    const upvotesWeight = 15;
    
    const score = 
      (thread.comments?.length || 0) * commentsWeight + 
      (thread.upvotes || 0) * upvotesWeight;
    
    return score > (commentsThreshold * commentsWeight) || 
           (thread.upvotes || 0) >= upvotesThreshold;
  }, []);

  const calculateForumStats = useCallback((threadsArray) => {
    if (!threadsArray || !Array.isArray(threadsArray)) {
      return { totalThreads: 0, totalReplies: 0 };
    }
    
    const totalThreads = threadsArray.length;
    let totalReplies = 0;
    
    // Sum up all comments across all threads
    threadsArray.forEach(thread => {
      if (thread.comments && Array.isArray(thread.comments)) {
        totalReplies += thread.comments.length;
      }
    });
    
    return { totalThreads, totalReplies };
  }, []);

  // Add function to check if thread has been read
  const isThreadRead = (threadId) => {
    const readThreads = JSON.parse(localStorage.getItem('readThreads') || '{}');
    return !!readThreads[threadId];
  };

  // Function to mark thread as read when clicked
  const markThreadAsRead = (threadId) => {
    const readThreads = JSON.parse(localStorage.getItem('readThreads') || '{}');
    readThreads[threadId] = Date.now();
    
    // Clean up old entries (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    Object.keys(readThreads).forEach(id => {
      if (readThreads[id] < thirtyDaysAgo) {
        delete readThreads[id];
      }
    });
    
    localStorage.setItem('readThreads', JSON.stringify(readThreads));
  };

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
          setUnsortedThreads(response.data);
          setTotalPages(Math.ceil(response.data.length / 10));
          
          // Calculate and set forum stats
          const stats = calculateForumStats(response.data);
          setForumStats(stats);
          console.log('Forum statistics calculated:', stats);
          
          // Log thread IDs with the correct property name
          console.log('Thread IDs:', response.data.map(thread => thread.threadId));
        } else if (response.data.threads && Array.isArray(response.data.threads)) {
          console.log(`Processing ${response.data.threads.length} threads from nested response`);
          setUnsortedThreads(response.data.threads);
          setTotalPages(response.data.totalPages || Math.ceil(response.data.threads.length / 10));
          
          // Calculate and set forum stats
          const stats = calculateForumStats(response.data.threads);
          setForumStats(stats);
          console.log('Forum statistics calculated:', stats);
          
          // Log thread IDs to help identify any missing or duplicate IDs
          console.log('Thread IDs:', response.data.threads.map(thread => thread.id));
        } else {
          console.warn('Unexpected response format:', response.data);
          setUnsortedThreads([]);
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
  }, [navigate, calculateForumStats]);

  useEffect(() => {
    fetchForumData();
  }, [fetchForumData]);

  useEffect(() => {
    // Load saved draft when component mounts
    const savedDraft = localStorage.getItem('threadDraft');
    if (savedDraft) {
      try {
        dispatchThreadForm({ 
          type: 'LOAD_DRAFT', 
          payload: JSON.parse(savedDraft) 
        });
      } catch (e) {
        console.error("Error parsing saved draft", e);
      }
    }
  }, []);

  useEffect(() => {
    // Load saved bookmarks when component mounts
    const savedBookmarks = JSON.parse(localStorage.getItem('threadBookmarks') || '[]');
    setBookmarks(savedBookmarks);
  }, []);

  // Update the course processing in your useEffect that loads filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Fetch majors and courses in parallel
        const [majorsData, coursesData] = await Promise.all([
          fetchAllMajors(),
          fetchAllCourses()
        ]);
        
        // Process majors
        if (Array.isArray(majorsData)) {
          const majors = [...new Set(majorsData.map(major => major.name || major))].sort();
          setAvailableMajors(majors);
          console.log(`Loaded ${majors.length} majors from API`);
        }
        
        // Extract only courseKeys from course data
        if (Array.isArray(coursesData)) {
          const courseKeys = coursesData
            .filter(course => course && course.courseKey)
            .map(course => course.courseKey)
            .sort();
          setAvailableCourses(courseKeys);
          console.log(`Loaded ${courseKeys.length} course keys from API`);
        }
      } catch (error) {
        console.error("Error loading filter data:", error);
        toast.error("Failed to load filter options. Some filters may be incomplete.");
      }
    };

    loadFilterData();
  }, []); // Run once when component mounts

  // Auto-save draft when user types
  useEffect(() => {
    // Debounced draft saving
    const draftTimer = setTimeout(() => {
      if (threadForm.title.trim() || threadForm.content.trim()) {
        localStorage.setItem('threadDraft', JSON.stringify({
          title: threadForm.title,
          content: threadForm.content,
          course: threadForm.course,
          major: threadForm.major
        }));
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(draftTimer);
  }, [threadForm.title, threadForm.content, threadForm.course, threadForm.major]);

  const clearDraft = useCallback(() => {
    dispatchThreadForm({ type: 'RESET' });
    localStorage.removeItem('threadDraft');
  }, []);

  const toggleBookmark = useCallback((e, threadId) => {
    e.stopPropagation(); // Prevent navigating to thread
    
    setBookmarks(prevBookmarks => {
      const isCurrentlyBookmarked = prevBookmarks.includes(threadId);
      const updatedBookmarks = isCurrentlyBookmarked
        ? prevBookmarks.filter(id => id !== threadId)
        : [...prevBookmarks, threadId];
        
      // Update localStorage inside the state updater
      localStorage.setItem('threadBookmarks', JSON.stringify(updatedBookmarks));
      
      // Show toast notification
      /*toast.info(
        isCurrentlyBookmarked ? 'Thread removed from bookmarks' : 'Thread bookmarked!', 
        { autoClose: 1500 }
      );*/
      
      return updatedBookmarks;
    });
  }, []); // No dependencies needed since we use functional updates

  const handleCreateThread = async (e) => {
    e.preventDefault();
    
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error("Please log in to create a new thread");
        return;
      }
      
      if (!threadForm.title.trim() || !threadForm.content.trim()) {
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
        title: threadForm.title,
        description: threadForm.content,
        authorEmail: userEmail,
        course: threadForm.course,
        major: threadForm.major
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
          console.log('New thread added to forumData:', newThread);
          
          // Clear draft before navigating away
          clearDraft();
          
          navigate(`/forum/thread/${newThread.threadId}`);
        }
        
      } catch (apiError) {
        console.warn("API error when creating thread:", apiError);
        toast.error("Failed to create thread. Please try again.");
      }
      
      setShowNewThreadForm(false);
      
      // Refresh the data
      fetchForumData();
    } catch (error) {
      console.error('Error in thread creation process:', error);
      toast.error("An unexpected error occurred");
    }
  };

  const goToThread = useCallback((threadId) => {
    if (!threadId) {
      console.warn('Attempted to navigate to thread with undefined ID');
      toast.error('Cannot view this thread: Invalid thread ID');
      return;
    }
    markThreadAsRead(threadId);
    navigate(`/forum/thread/${threadId}`);
  }, [navigate]);

  const resetFilters = useCallback(() => {
    setFilterMajor('');
    setFilterCourse('');
    setFilterRole('');
    setSearchInputValue('');
  }, []);

  const displayThreads = useMemo(() => {
    if (!unsortedThreads.length) return [];
    
    let filteredThreads = [...unsortedThreads];
    
    // Apply bookmark filter if enabled
    if (showBookmarksOnly) {
      filteredThreads = filteredThreads.filter(thread => 
        bookmarks.includes(thread.threadId)
      );
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredThreads = filteredThreads.filter(thread => 
        (thread.title && thread.title.toLowerCase().includes(query)) ||
        (thread.content && thread.content.toLowerCase().includes(query)) ||
        (thread.description && thread.description.toLowerCase().includes(query))
      );
    }
    
    // Apply major filter
    if (filterMajor) {
      filteredThreads = filteredThreads.filter(thread => 
        thread.authorMajor === filterMajor || 
        (thread.subject && thread.subject === filterMajor) ||
        (thread.major && thread.major === filterMajor)
      );
    }
    
    // Apply course filter
    if (filterCourse) {
      filteredThreads = filteredThreads.filter(thread => 
        thread.courseKey === filterCourse || 
        (thread.course && thread.course === filterCourse)
      );
    }
    
    // Apply role filter
    if (filterRole) {
      filteredThreads = filteredThreads.filter(thread => 
        thread.authorRole && thread.authorRole.toLowerCase() === filterRole
      );
    }
    
    // Apply existing sort order
    switch(sortOrder) {
      case 'recent':
        return filteredThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return filteredThreads.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'comments':
        return filteredThreads.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
      case 'score':
        return filteredThreads.sort((a, b) => 
          ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0))
        );
      default:
        return filteredThreads;
    }
  }, [unsortedThreads, bookmarks, showBookmarksOnly, sortOrder, searchQuery, filterMajor, filterCourse, filterRole]);

  const listData = useMemo(() => ({
    threads: displayThreads,
    isThreadRead,
    bookmarks,
    toggleBookmark,
    goToThread,
    formatNumber,
    formatDate,
    isHotThread
  }), [displayThreads, bookmarks, toggleBookmark, goToThread, formatNumber, formatDate, isHotThread]);

  return (
    <div className="forum-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="forum-header">
        <h1>Student Forums</h1>
        <p>Join the discussion and connect with your peers!</p>
      </div>
      
      {showNewThreadForm && (
        <ThreadForm
          threadForm={threadForm}
          dispatchThreadForm={dispatchThreadForm}
          handleCreateThread={handleCreateThread}
          setShowNewThreadForm={setShowNewThreadForm}
          clearDraft={clearDraft}
          availableCourses={availableCourses}
          availableMajors={availableMajors}
        />
      )}
      
      <div className="forum-content">
        <ForumSidebar
          searchInputValue={searchInputValue}
          setSearchInputValue={setSearchInputValue}
          forumStats={forumStats}
          bookmarks={bookmarks}
          formatNumber={formatNumber}
          filterMajor={filterMajor}
          setFilterMajor={setFilterMajor}
          filterCourse={filterCourse}
          setFilterCourse={setFilterCourse}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          availableMajors={availableMajors}
          availableCourses={availableCourses}
          resetFilters={resetFilters}
        />
        
        <ThreadListing
          loading={loading}
          displayThreads={displayThreads}
          showBookmarksOnly={showBookmarksOnly}
          setShowBookmarksOnly={setShowBookmarksOnly}
          setShowNewThreadForm={setShowNewThreadForm}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          listData={listData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
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

export default memo(Forum);