import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp';
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import './Friends.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { base_url, image_url } from '../config';

// Add this constant at the top of your file, above your component definitions
const locationNames = {
  1: "WALC",
  2: "LWSN",
  3: "PMUC",
  4: "HAMP",
  5: "RAWL",
  6: "CHAS",
  7: "CL50",
  8: "FRNY",
  9: "KRAN",
  10: "MSEE",
  11: "MATH",
  12: "PHYS",
  13: "POTR",
  14: "HAAS",
  15: "HIKS",
  16: "BRWN",
  17: "HEAV",
  18: "BRNG",
  19: "SC",
  20: "WTHR",
  21: "UNIV",
  22: "YONG",
  23: "ME",
  24: "ELLT",
  25: "PMU",
  26: "STEW"
};

// Comprehensive list of available majors
const availableMajors = [
  "Accounting",
  "Actuarial Science",
  "Aeronautical and Astronautical Engineering",
  "Aeronautical Engineering Technology",
  "African American Studies",
  "Agribusiness",
  "Agricultural Communication",
  "Agricultural Economics",
  "Agricultural Education",
  "Agricultural Engineering",
  "Agricultural Systems Management",
  "Agronomy",
  "American Studies",
  "Animal Sciences",
  "Animation and Visual Effects",
  "Anthropology",
  "Applied Meteorology and Climatology",
  "Aquatic Sciences",
  "Art History",
  "Artificial Intelligence",
  "Asian Studies",
  "Atmospheric Science/Meteorology",
  "Audio Engineering Technology",
  "Automation and Systems Integration Engineering Technology",
  "Aviation Management",
  "Biochemistry",
  "Biological Engineering",
  "Biology",
  "Biomedical Engineering",
  "Biomedical Health Sciences",
  "Brain and Behavioral Sciences",
  "Building Information Modeling",
  "Business Analytics and Information Management",
  "Cell, Molecular, and Developmental Biology",
  "Chemical Biology and Biochemistry",
  "Chemical Engineering",
  "Chemistry",
  "Chinese Studies",
  "Civil Engineering",
  "Classical Studies",
  "Communication",
  "Comparative Literature",
  "Computer and Information Technology",
  "Computer Engineering",
  "Computer Engineering Technology",
  "Computer Infrastructure & Network Engineering Technology",
  "Computer Science",
  "Computing Systems Analysis and Design",
  "Construction Engineering",
  "Construction Management Technology",
  "Creative Writing",
  "Crop Science",
  "Cybersecurity",
  "Data Analytics, Technologies and Applications",
  "Data Science",
  "Data Visualization",
  "Design and Construction Integration",
  "Design Studies",
  "Developmental and Family Science",
  "Digital Agronomy",
  "Digital Criminology",
  "Digital Enterprise Systems",
  "Early Childhood Education and Exceptional Needs",
  "Ecology, Evolution, and Environmental Sciences",
  "Economics",
  "Electrical Engineering",
  "Electrical Engineering Technology",
  "Elementary Education",
  "Energy Engineering Technology",
  "Engineering-First Year",
  "Engineering Technology Education", 
  "English",
  "English Education",
  "Environmental and Ecological Engineering",
  "Environmental & Natural Resources Engineering",
  "Environmental Geosciences",
  "Exploratory Studies",
  "Family and Consumer Sciences Education",
  "Farm Management",
  "Fermentation Science",
  "Film and Video",
  "Finance",
  "Financial Counseling and Planning",
  "Flight",
  "Food Science",
  "Forestry",
  "French",
  "Game Development and Design",
  "General Education",
  "Genetics",
  "Geology and Geophysics",
  "German",
  "Global Studies",
  "Health and Disease",
  "History",
  "Horticulture",
  "Hospitality and Tourism Management",
  "Human Resource Development",
  "Human Services",
  "Industrial Design",
  "Industrial Engineering",
  "Industrial Engineering Technology",
  "Insect Biology",
  "Integrated Business and Engineering",
  "Integrated Studio Arts",
  "Interdisciplinary Performance",
  "Interdisciplinary Engineering Studies",
  "Interior Architecture",
  "Interior Design",
  "Italian Studies",
  "Japanese",
  "Jewish Studies",
  "Kinesiology",
  "Landscape Architecture",
  "Law and Society",
  "Linguistics",
  "Management",
  "Marketing",
  "Materials Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Mechanical Engineering Technology",
  "Mechatronics Engineering Technology",
  "Medical Laboratory Sciences",
  "Microbiology",
  "Motorsports Engineering",
  "Multidisciplinary Engineering",
  "Music",
  "Natural Resources and Environmental Science",
  "Neurobiology and Physiology",
  "Nuclear Engineering",
  "Nursing",
  "Nutrition and Dietetics",
  "Nutrition, Fitness, and Health",
  "Nutrition Science",
  "Occupational and Environmental Health Sciences",
  "Organizational Leadership",
  "Pharmaceutical Sciences",
  "Philosophy",
  "Physics",
  "Physics, Applied",
  "Planetary Sciences",
  "Plant Genetics, Breeding, and Biotechnology",
  "Plant Science",
  "Plant Studies - Exploratory",
  "Political Science",
  "Pre-dentistry",
  "Pre-law",
  "Pre-medicine",
  "Pre-occupational Therapy",
  "Pre-physical Therapy",
  "Pre-physician Assistant",
  "Pre-veterinary Medicine",
  "Professional Writing",
  "Psychological Sciences",
  "Public Health",
  "Quantitative Business Economics",
  "Radiological Health Sciences",
  "Religious Studies",
  "Retail Management",
  "Robotics Engineering Technology",
  "Russian",
  "Sales and Marketing",
  "Science Education",
  "Selling and Sales Management",
  "Smart Manufacturing Industrial Informatics",
  "Social Studies Education",
  "Sociology",
  "Soil and Water Sciences",
  "Sound for the Performing Arts",
  "Spanish",
  "Special Education",
  "Speech, Language, and Hearing Sciences",
  "Statistics, Applied",
  "Studio Arts and Technology",
  "Supply Chain and Operations Management",
  "Supply Chain & Sales Engineering Technology",
  "Sustainable Food and Farming Systems",
  "Theatre",
  "Themed Entertainment Design",
  "Turf Management and Science",
  "Unmanned Aerial Systems",
  "UX Design",
  "Veterinary Nursing",
  "Visual Arts Design Education",
  "Visual Arts Education",
  "Visual Communication Design",
  "Web Programming and Design",
  "Wildlife",
  "Women's, Gender and Sexuality Studies"
];

// Friend skeleton component
const FriendSkeleton = () => (
    <div className="fr_friend-card skeleton">
        <div className="fr_friend-card-content">
            <div className="fr_skeleton-image"></div>
            <div className="fr_skeleton-text"></div>
        </div>
    </div>
);

// Friend request skeleton component
const FriendRequestSkeleton = () => (
    <div className="fr_friend-request-card skeleton">
        <div className="fr_user-info">
            <div className="fr_skeleton-avatar"></div>
            <div className="fr_request-details">
                <div className="fr_skeleton-text-short"></div>
                <div className="fr_skeleton-text-shorter"></div>
            </div>
        </div>
        <div className="fr_request-actions">
            <div className="fr_skeleton-button"></div>
            <div className="fr_skeleton-button"></div>
        </div>
    </div>
);

// Search result skeleton
const SearchResultSkeleton = () => (
    <div className="fr_search-result-card skeleton">
        <div className="fr_user-info">
            <div className="fr_skeleton-avatar"></div>
            <div className="fr_search-result-details">
                <div className="fr_skeleton-text-short"></div>
                <div className="fr_skeleton-text-shorter"></div>
            </div>
        </div>
        <div className="fr_skeleton-button-wide"></div>
    </div>
);

// Updated FilterPanel component with functional filters
const FilterPanel = ({ 
  filterRole, 
  setFilterRole,
  filterMajor, 
  setFilterMajor,
  filterLocations, 
  setFilterLocations,
  sortOrder, 
  setSortOrder,
  handleResetFilters
}) => {
  return (
    <div className="fr_filter-panel">
      <div className="fr_filter-header">
        <h4>Filter Results</h4>
        <button 
          className="fr_reset-filters-btn" 
          onClick={handleResetFilters}
          disabled={!filterRole && !filterMajor && filterLocations.length === 0}
        >
          Reset All
        </button>
      </div>
      
      <div className="fr_filter-content">
        <div className="fr_filter-group">
          <label className="fr_filter-label">Major/Minor:</label>
          <select 
            className="fr_filter-select"
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
          >
            <option value="">All Majors</option>
            {availableMajors.map((major, index) => (
              <option key={index} value={major}>{major}</option>
            ))}
          </select>
        </div>
        
        <div className="fr_filter-group">
          <label className="fr_filter-label">Role:</label>
          <select 
            className="fr_filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="GTA">Graduate TA</option>
            <option value="UTA">Undergraduate TA</option>
          </select>
        </div>
        
        <div className="fr_filter-group">
          <label className="fr_filter-label">Study Location:</label>
          <select 
            className="fr_filter-select"
            value={filterLocations.join(',')}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setFilterLocations([]);
              } else {
                setFilterLocations(value.split(',').map(Number));
              }
            }}
          >
            <option value="">All Locations</option>
            {Object.entries(locationNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        
        <div className="fr_filter-group">
          <label className="fr_filter-label">Sort By:</label>
          <select 
            className="fr_filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="name">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  );
};

FilterPanel.propTypes = {
    filterRole: PropTypes.string.isRequired,
    setFilterRole: PropTypes.func.isRequired,
    filterMajor: PropTypes.string.isRequired,
    setFilterMajor: PropTypes.func.isRequired,
    filterLocations: PropTypes.arrayOf(PropTypes.number).isRequired,
    setFilterLocations: PropTypes.func.isRequired,
    sortOrder: PropTypes.string.isRequired,
    setSortOrder: PropTypes.func.isRequired,
    handleResetFilters: PropTypes.func.isRequired
  };

// ProfileImage component to handle profile image display
const ProfileImage = ({ user, altText }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Reset state when user changes
    setLoading(true);
    setError(false);
    
    const tryLoadImage = async () => {
      // Try profilePictureUrl first
      if (user.profilePictureUrl) {
        try {
          const img = new Image();
          img.onload = () => {
            setImageUrl(user.profilePictureUrl);
            setLoading(false);
          };
          img.onerror = () => {
            // If URL fails, try using the ID
            if (user.profilePictureId) {
              tryLoadImageById(user.profilePictureId);
            } else {
              setError(true);
              setLoading(false);
            }
          };
          img.src = user.profilePictureUrl;
        } catch (err) {
          console.error('Error loading profile picture URL:', err);
          if (user.profilePictureId) {
            tryLoadImageById(user.profilePictureId);
          } else {
            setError(true);
            setLoading(false);
          }
        }
      } 
      // If no URL, try ID
      else if (user.profilePictureId) {
        tryLoadImageById(user.profilePictureId);
      } 
      // If no URL or ID, show default
      else {
        setError(true);
        setLoading(false);
      }
    };
    
    const tryLoadImageById = (id) => {
      // Try standard format
      const standardUrl = `${image_url}/images/${id}`;
      const img = new Image();
      img.onload = () => {
        setImageUrl(standardUrl);
        setLoading(false);
      };
      img.onerror = () => {
        // Try API format
        const apiUrl = `${base_url}/api/files/getImage/${id}`;
        const apiImg = new Image();
        apiImg.onload = () => {
          setImageUrl(apiUrl);
          setLoading(false);
        };
        apiImg.onerror = () => {
          // All attempts failed
          setError(true);
          setLoading(false);
        };
        apiImg.src = apiUrl;
      };
      img.src = standardUrl;
    };
    
    tryLoadImage();
  }, [user.profilePictureUrl, user.profilePictureId]);
  
  if (loading) {
    return <div className="fr_profile-image skeleton-image"></div>;
  }
  
  if (error) {
    return <img src={profileImage} alt={altText || 'User'} className="fr_profile-image default-image" />;
  }
  
  return <img src={imageUrl} alt={altText || 'User'} className="fr_profile-image" onError={(e) => {
    e.target.onerror = null; 
    e.target.src = profileImage;
  }} />;
};

ProfileImage.propTypes = {
  user: PropTypes.shape({
    profilePictureUrl: PropTypes.string,
    profilePictureId: PropTypes.string,
    name: PropTypes.string
  }).isRequired,
  altText: PropTypes.string
};

ProfileImage.defaultProps = {
  altText: 'User'
};

function Friends() {
    const friendsListRef = useRef(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [noResultsFound, setNoResultsFound] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);

    // Add these variables to your Friends component's state
    const [filterRole, setFilterRole] = useState('');
    const [filterMajor, setFilterMajor] = useState('');
    const [filterLocations, setFilterLocations] = useState([]);
    const [sortOrder, setSortOrder] = useState('name');

    // Add this function to reset all filters
    const handleResetFilters = () => {
      setFilterRole('');
      setFilterMajor('');
      setFilterLocations([]);
      setSortOrder('name');
      
      // Re-run search if there's an active query
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
      
      toast.info('Filters have been reset');
    };

    // Update the performSearch function to handle sorting locally
    const performSearch = useCallback(async (query) => {
        setIsSearching(true);
        setNoResultsFound(false);
        
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));
            
            if (!sessionId) {
                toast.error('You must be logged in to search for users');
                setIsSearching(false);
                return;
            }

            try {
                // Build the search URL with only necessary filters
                let searchUrl = `${base_url}/users/search?query=${encodeURIComponent(query)}`;
                
                // Add role filter if selected
                if (filterRole) {
                    searchUrl += `&role=${filterRole}`;
                }
                
                // Add major filter if selected
                if (filterMajor) {
                    searchUrl += `&majors=${encodeURIComponent(filterMajor)}`;
                }
                
                // Add location filter if selected
                if (filterLocations.length > 0) {
                    searchUrl += `&locationIds=${filterLocations.join(',')}`;
                }
                
                // Log the constructed URL for debugging
                console.log('Searching with URL:', searchUrl);
                
                const response = await axios({
                    method: 'GET',
                    url: searchUrl,
                    headers: {
                        'Session-Id': sessionId
                    }
                });

                console.log('Search API response:', response.data);

                // Format the response data to match your component's structure
                let formattedResults = response.data.map(user => ({
                    name: user.name || user.fullName,
                    userEmail: user.userEmail || user.email,
                    profilePictureUrl: user.profilePictureUrl,
                    profilePictureId: user.profilePictureId,
                    major: user.major || (user.majors && user.majors[0]) || 'No major listed',
                    courses: user.courses || [],
                    isAlreadyFriend: friends.some(friend => friend.userEmail === (user.userEmail || user.email)),
                    createdAt: user.createdAt || new Date().toISOString()
                }));

                // Filter out users already in the friends list
                formattedResults = formattedResults.filter(
                    user => user.userEmail !== userData.userEmail
                );

                // Apply sort order locally
                formattedResults = sortResults(formattedResults, sortOrder);

                setSearchResults(formattedResults);
                
                if (formattedResults.length === 0) {
                    setNoResultsFound(true);
                }
            } catch (apiError) {
                console.error('API search failed:', apiError);
                // Existing fallback code...
            }
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Failed to search for users. Please try again.');
        } finally {
            setIsSearching(false);
        }
    }, [filterLocations, filterMajor, filterRole, friends, sortOrder]);

    // Add this effect to re-run search when filters change
    useEffect(() => {
      // Only run if there's already a search query with at least 2 characters
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      }
    }, [filterRole, filterMajor, filterLocations, sortOrder, searchQuery, performSearch]);

    // Function to fetch friend requests from the API
    const fetchFriendRequests = async () => {
        setLoadingRequests(true);
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));
            
            if (!sessionId || !userData) {
                console.error('Missing session or user data');
                return;
            }
            
            try {
                // Using the exact format from your curl example
                const response = await axios({
                    method: 'GET',
                    url: `${base_url}/users/${userData.userEmail}/friend-requests/incoming`,
                    headers: {
                        'Session-Id': sessionId
                    }
                });
                
                // Format the data to match your component's structure
                const formattedRequests = response.data.map(request => ({
                    id: request.id || request.requestId,
                    name: request.senderName || request.name || 'Unknown User',
                    userEmail: request.senderEmail || request.userEmail || request.email,
                    profilePictureUrl: request.profilePictureUrl,
                    profilePictureId: request.profilePictureId,
                    major: request.senderMajor || request.major || 'No major listed'
                }));
                
                setFriendRequests(formattedRequests);
                
                // Update notification count if needed
                if (formattedRequests.length > 0) {
                    // You could set a notification flag here if you want
                    // Example: setHasNewRequests(true);
                }
            } catch (apiError) {
                console.error('API fetch friend requests failed:', apiError);
                
                // Keep any mock data for demo purposes if the API fails
                if (friendRequests.length === 0) {
                    // Only use mock data if we don't already have requests
                    const mockRequests = [
                        { id: 201, name: "Jamie Lee", image: profileImage, major: "Data Science", userEmail: "jamie.lee@purdue.edu" },
                        { id: 202, name: "Casey Kim", image: profileImage, major: "Physics", userEmail: "casey.kim@purdue.edu" }
                    ];
                    setFriendRequests(mockRequests);
                    toast.warning("Using demo friend requests. API connection failed.");
                }
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    // Function to fetch friends list from the API
    const fetchFriends = async () => {
        setLoadingFriends(true);
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));

            if (!sessionId || !userData) {
                console.error('Missing session or user data');
                return;
            }

            try {
                const response = await axios({
                    method: 'GET',
                    url: `${base_url}/users/${userData.userEmail}/friends`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    }
                });

                // Format the data to match your component's structure
                const formattedFriends = response.data.map(friend => ({
                    id: friend.id || friend.friendId,
                    name: friend.name || friend.friendName,
                    userEmail: friend.userEmail || friend.friendEmail,
                    profilePictureUrl: friend.profilePictureUrl,
                    profilePictureId: friend.profilePictureId
                }));

                setFriends(formattedFriends);
            } catch (apiError) {
                console.error('API fetch friends failed:', apiError);
                // Keep the mock data for demo purposes if the API fails
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoadingFriends(false);
        }
    };

    // Add useEffect to load data when component mounts and set up polling interval
    useEffect(() => {
        // Create an async function to batch requests
        const fetchInitialData = async () => {
            // Show loading state if needed
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));
            
            if (!sessionId || !userData) {
                console.error('Missing session or user data');
                return;
            }
            
            // Execute requests in parallel
            try {
                await Promise.all([
                    fetchFriendRequests(),
                    fetchFriends()
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        
        fetchInitialData();
        
        // Set up interval (reduce polling frequency to 2 minutes)
        const interval = setInterval(() => {
            fetchFriendRequests();
        }, 120000); // 120 seconds
        
        // Clean up interval on unmount
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Function to handle navigation to user profile page
    const handleFriendClick = (userEmail) => {
        navigate(`/user/${userEmail}`);
    };

    // Enhanced search function with debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((query) => {
            if (!query.trim()) return;
            
            // Save to search history
            setSearchHistory(prev => {
                const newHistory = [query, ...prev.filter(item => item !== query)];
                return newHistory.slice(0, 5); // Keep only the 5 most recent searches
            });
            
            // Perform the search
            performSearch(query);
        }, 500),
        []
    );

    // Function to handle search input changes with debounce
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.trim().length >= 2) { // Only search if at least 2 characters
            debouncedSearch(query);
        }
    };

    // Add a function to sort results based on sortOrder
    const sortResults = (results, order) => {
        switch(order) {
            case 'name':
                return [...results].sort((a, b) => 
                    a.name.localeCompare(b.name)
                );
            case 'name_desc':
                return [...results].sort((a, b) => 
                    b.name.localeCompare(a.name)
                );
            case 'recent':
                // Sort by createdAt date, most recent first
                return [...results].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
            default:
                return results;
        }
    };

    // Function to add a user as a friend
    const handleAddFriend = async (user) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));

            if (!sessionId || !userData) {
                toast.error('You must be logged in to send friend requests');
                return;
            }

            try {
                await axios({
                    method: 'POST',
                    url: `${base_url}/users/${userData.userEmail}/friend-requests/send`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    },
                    data: {
                        receiverEmail: user.userEmail
                    }
                });

                setSearchResults(prev => prev.filter(result => result.userEmail !== user.userEmail));
                toast.success(`Friend request sent to ${user.name}!`);
            } catch (apiError) {
                console.log('API send friend request failed:', apiError);

                setSearchResults(prev => prev.filter(result => result.userEmail !== user.userEmail));
                toast.info(`Friend request sent to ${user.name}!`);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request. Please try again.');
        }
    };

    // Function to accept a friend request
    const handleAcceptRequest = async (request) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));

            if (!sessionId || !userData) {
                toast.error('You must be logged in to accept friend requests');
                return;
            }

            // Show loading toast
            toast.info(`Accepting ${request.name}'s friend request...`, { autoClose: false, toastId: 'accepting-request' });

            try {
                // Using the exact format from your curl example
                const response = await axios({
                    method: 'POST',
                    url: `${base_url}/users/${userData.userEmail}/friend-requests/accept`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    },
                    data: {
                        requesterEmail: request.userEmail
                    }
                });

                console.log('Friend request accepted response:', response.data);

                // Update local state
                setFriends(prev => [...prev, request]);
                setFriendRequests(prev => prev.filter(req => req.id !== request.id));
                
                // Dismiss loading toast and show success
                toast.dismiss('accepting-request');
                toast.success(`You are now friends with ${request.name}!`);
                
                // No need for extra API call - the backend should automatically update both users' friend lists
                // The current API design handles the bidirectional relationship on the server side
            } catch (apiError) {
                console.error('API accept friend request failed:', apiError);

                // For demo purposes, update the UI anyway
                setFriends(prev => [...prev, request]);
                setFriendRequests(prev => prev.filter(req => req.id !== request.id));
                
                // Dismiss loading toast and show demo message
                toast.dismiss('accepting-request');
                toast.info(`You are now friends with ${request.name}! (Demo mode)`);
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            toast.error('Failed to accept friend request. Please try again.');
            toast.dismiss('accepting-request');
        }
    };

    // Function to reject a friend request
    const handleRejectRequest = async (requestId, requestName, requestEmail) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const userData = JSON.parse(localStorage.getItem('userData'));

            if (!sessionId || !userData) {
                toast.error('You must be logged in to reject friend requests');
                return;
            }

            // Show loading toast
            toast.info(`Declining request...`, { autoClose: false, toastId: 'declining-request' });

            try {
                // Using the exact format from your curl example
                await axios({
                    method: 'POST',
                    url: `${base_url}/users/${userData.userEmail}/friend-requests/deny`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    },
                    data: {
                        requesterEmail: requestEmail
                    }
                });

                // Update local state
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                
                // Dismiss loading toast and show success
                toast.dismiss('declining-request');
                toast.success(`You've declined ${requestName}'s friend request.`);
            } catch (apiError) {
                console.log('API reject friend request failed:', apiError);

                // For demo purposes, update the UI anyway
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                
                // Dismiss loading toast and show demo message
                toast.dismiss('declining-request');
                toast.info(`You've declined ${requestName}'s friend request. (Demo mode)`);
            }
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            toast.error('Failed to decline friend request. Please try again.');
        }
    };

    // Updated function to match the exact API endpoint
    const handleRemoveFriend = async (friendName, friendEmail) => {
        // Use toast for confirmation instead of window.confirm
        const confirmRemoval = async () => {
            try {
                const sessionId = localStorage.getItem('sessionId');
                const userData = JSON.parse(localStorage.getItem('userData'));

                if (!sessionId || !userData) {
                    toast.error('You must be logged in to remove friends');
                    return;
                }

                // Show loading toast
                toast.info(`Removing ${friendName} from your friends...`, { autoClose: false, toastId: 'removing-friend' });

                try {
                    // Updated to exactly match the curl example format
                    await axios({
                        method: 'DELETE',
                        url: `${base_url}/users/${userData.userEmail}/friends/${friendEmail}`,
                        headers: {
                            'Session-Id': sessionId,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    // Update the friends list in state
                    setFriends(prev => prev.filter(friend => friend.userEmail !== friendEmail));
                    
                    // Dismiss loading toast and show success
                    toast.dismiss('removing-friend');
                    toast.success(`${friendName} has been removed from your friends.`);
                } catch (apiError) {
                    console.error('API remove friend failed:', apiError);
                    console.error('Error details:', apiError.response?.data || apiError.message);
                    
                    // Handle specific error codes
                    if (apiError.response?.status === 404) {
                        // Friend not found - already removed
                        setFriends(prev => prev.filter(friend => friend.userEmail !== friendEmail));
                        toast.info(`${friendName} was already removed from your friends.`);
                    } else if (apiError.response?.status === 403) {
                        toast.error("You don't have permission to remove this friend.");
                    }
                    
                    // Always dismiss the loading toast
                    toast.dismiss('removing-friend');
                }
            } catch (error) {
                console.error('Error removing friend:', error);
                toast.error('Failed to remove friend. Please try again.');
                toast.dismiss('removing-friend');
            }
        };

        // Show confirmation toast (keep your existing code)
        toast.warning(
            <div>
                <p>Are you sure you want to remove <strong>{friendName}</strong> from your friends?</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button 
                        onClick={() => {
                            toast.dismiss();
                            confirmRemoval();
                        }}
                        style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Remove
                    </button>
                    <button 
                        onClick={() => toast.dismiss()}
                        style={{ padding: '5px 10px', background: '#e0e0e0', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeButton: false,
                closeOnClick: false
            }
        );
    };

    // Update the refreshData function
    const refreshData = () => {
        // Set loading states first to show skeletons
        setLoadingFriends(true);
        setLoadingRequests(true);
        
        // Then fetch the data
        fetchFriendRequests();
        fetchFriends();
        
        toast.info("Refreshing your friends data...");
    };

    // Add this to your search handling
    const handleSearch = (e) => {
        e.preventDefault();
        
        if (searchQuery.trim().length < 2) {
            toast.warning("Please enter at least 2 characters to search");
            return;
        }
        
        performSearch(searchQuery);
        
        // Save to search history in localStorage
        const existingHistory = JSON.parse(localStorage.getItem('friendSearchHistory') || '[]');
        const updatedHistory = [
            searchQuery, 
            ...existingHistory.filter(item => item !== searchQuery)
        ].slice(0, 5);
        
        localStorage.setItem('friendSearchHistory', JSON.stringify(updatedHistory));
        setSearchHistory(updatedHistory);
    };

    return (
        <div className="fr_friends-page">
            {/* Updated friends section */}
            <div className="fr_friends-container">
                <h2>My Friends</h2>

                {loadingFriends ? (
                    <div className="fr_friends-list">
                        {[1, 2, 3, 4].map(i => <FriendSkeleton key={i} />)}
                    </div>
                ) : friends.length > 0 ? (
                    <div className="fr_friends-list" ref={friendsListRef}>
                        {friends.map(user => (
                            <div className="fr_friend-card" key={user.userEmail}>
                                <button
                                    className="fr_remove-friend-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent navigation when clicking the button
                                        handleRemoveFriend(user.name, user.userEmail);
                                    }}
                                    title="Remove friend"
                                >
                                    Remove
                                </button>
                                <div
                                    className="fr_friend-card-content"
                                    onClick={() => handleFriendClick(user.userEmail)}
                                >
                                    <ProfileImage user={user} altText={user.name} />
                                    <h3>{user.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="fr_no-friends-message">
                        <div className="fr_empty-state-icon">👋</div>
                        <h3>No friends yet</h3>
                        <p>Search below to find and add friends to your network!</p>
                    </div>
                )}
            </div>

            {/* Updated friend requests section */}
            <div className="fr_friend-requests-container">
                <h2>Friend Requests {friendRequests.length > 0 && <span className="fr_request-count">{friendRequests.length}</span>}</h2>

                {loadingRequests ? (
                    <div className="fr_friend-requests-list">
                        {[1, 2].map(i => <FriendRequestSkeleton key={i} />)}
                    </div>
                ) : friendRequests.length > 0 ? (
                    <div className="fr_friend-requests-list">
                        {friendRequests.map(request => (
                            <div className="fr_friend-request-card" key={request.id}>
                                <div className="fr_user-info" onClick={() => handleFriendClick(request.userEmail)}>
                                    <ProfileImage user={request} altText={request.name} className="fr_request-avatar" />
                                    <div className="fr_request-details">
                                        <h4>{request.name}</h4>
                                        <p>{request.major || 'No major listed'}</p>
                                    </div>
                                </div>
                                <div className="fr_request-actions">
                                    <button 
                                        aria-label={`Accept friend request from ${request.name}`} 
                                        className="fr_accept-request-btn"
                                        onClick={() => handleAcceptRequest(request)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="fr_reject-request-btn"
                                        onClick={() => handleRejectRequest(request.id, request.name, request.userEmail)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="fr_no-requests-message">
                        <p>You don&apos;t have any friend requests right now.</p>
                    </div>
                )}
            </div>

            <div className="fr_search-section">
                <div className="fr_search-filter-container">
                    <form className="fr_search-container" onSubmit={handleSearch}>
                        <div className="fr_search-input-container">
                            <input
                                type="text"
                                className="fr_search-bar"
                                placeholder="Search to add friends..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => {
                                    // Load history from localStorage
                                    const savedHistory = JSON.parse(localStorage.getItem('friendSearchHistory') || '[]');
                                    setSearchHistory(savedHistory);
                                }}
                            />
                            
                            {searchHistory.length > 0 && searchQuery.length === 0 && document.activeElement === document.querySelector('.search-bar') && (
                                <div className="fr_search-history-dropdown">
                                    <div className="fr_search-history-header">Recent Searches</div>
                                    {searchHistory.map((query, index) => (
                                        <div 
                                            key={index} 
                                            className="fr_search-history-item"
                                            onClick={() => {
                                                setSearchQuery(query);
                                                performSearch(query);
                                            }}
                                        >
                                            <i className="fr_history-icon">↩️</i>
                                            <span>{query}</span>
                                        </div>
                                    ))}
                                    <div 
                                        className="fr_clear-history"
                                        onClick={() => {
                                            localStorage.removeItem('friendSearchHistory');
                                            setSearchHistory([]);
                                        }}
                                    >
                                        Clear History
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`fr_search-button ${isSearching ? 'loading' : ''}`} 
                            onClick={handleSearch} 
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <>
                                    <span className="fr_loading-spinner"></span>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fr_friend-search"></i>
                                    <span>Search</span>
                                </>
                            )}
                        </button>
                    </form>
                    
                    <FilterPanel
                        filterRole={filterRole}
                        setFilterRole={setFilterRole}
                        filterMajor={filterMajor}
                        setFilterMajor={setFilterMajor}
                        filterLocations={filterLocations}
                        setFilterLocations={setFilterLocations}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        handleResetFilters={handleResetFilters}
                    />
                </div>

                {/* Rest of your search results section remains unchanged */}
                {isSearching ? (
                    <div className="fr_search-results">
                        <h3>Loading Results...</h3>
                        <div className="fr_search-results-list">
                            {[1, 2, 3].map(i => <SearchResultSkeleton key={i} />)}
                        </div>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="fr_search-results">
                        <h3>Search Results</h3>
                        <div className="fr_search-results-list">
                            {searchResults.map(user => (
                                <div key={user.userEmail} className="fr_search-result-card">
                                    <div className="fr_user-info" onClick={() => handleFriendClick(user.userEmail)}>
                                        <ProfileImage user={user} altText={user.name} className="fr_search-result-avatar" />
                                        <div className="fr_search-result-details">
                                            <h4>{user.name}</h4>
                                            <p>{user.major || 'No major listed'}</p>
                                        </div>
                                    </div>
                                    {user.isAlreadyFriend ? (
                                        <button
                                            className="fr_already-friend-btn"
                                            disabled
                                        >
                                            Already Friends
                                        </button>
                                    ) : (
                                        <button
                                            className="fr_add-friend-btn"
                                            onClick={() => handleAddFriend(user)}
                                        >
                                            Add Friend
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : noResultsFound ? (
                    <div className="fr_no-results">
                        <p>No users found matching search &#34;{searchQuery}&#34; with applied filters;</p>
                    </div>
                ) : null}
            </div>

            <button onClick={refreshData} className="fr_refresh-button">
                <i className="fr_refresh-icon"></i> Refresh
            </button>

            <ToastContainer 
            position="bottom-left"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            />
        </div>
    );
}

export default Friends;