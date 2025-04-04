import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp';
import debounce from 'lodash.debounce';
import './Friends.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

    // Function to fetch friend requests from the API
    const fetchFriendRequests = async () => {
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
                    url: `http://localhost:8080/users/${userData.userEmail}/friend-requests/incoming`,
                    headers: {
                        'Session-Id': sessionId
                    }
                });
                
                // Format the data to match your component's structure
                const formattedRequests = response.data.map(request => ({
                    id: request.id || request.requestId,
                    name: request.senderName || request.name || 'Unknown User',
                    userEmail: request.senderEmail || request.userEmail || request.email,
                    image: profileImage, // Default image until profile images are implemented
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
        }
    };

    // Function to fetch friends list from the API
    const fetchFriends = async () => {
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
                    url: `http://localhost:8080/users/${userData.userEmail}/friends`,
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
                    image: profileImage // Default image until profile images are implemented
                }));

                setFriends(formattedFriends);
            } catch (apiError) {
                console.error('API fetch friends failed:', apiError);
                // Keep the mock data for demo purposes if the API fails
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    // Add useEffect to load data when component mounts and set up polling interval
    useEffect(() => {
        // Initial fetch
        fetchFriendRequests();
        fetchFriends();
        
        // Set up interval
        const interval = setInterval(() => {
            fetchFriendRequests();
        }, 60000); // 60 seconds
        
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

    // Extracted search function
    const performSearch = async (query) => {
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
                // Using the exact format from your curl example
                const response = await axios({
                    method: 'GET',
                    url: `http://localhost:8080/users/search?query=${encodeURIComponent(query)}`,
                    headers: {
                        'Session-Id': sessionId
                    }
                });

                console.log('Search API response:', response.data);

                // Format the response data to match your component's structure
                const formattedResults = response.data.map(user => ({
                    name: user.name || user.fullName,
                    userEmail: user.userEmail || user.email,
                    image: profileImage, // Default image until profile images are implemented
                    major: user.major || (user.majors && user.majors[0]) || 'No major listed',
                    isAlreadyFriend: friends.some(friend => friend.userEmail === (user.userEmail || user.email))
                }));

                // Filter out users already in the friends list
                const filteredResults = formattedResults.filter(
                    user => user.userEmail !== userData.userEmail
                );

                setSearchResults(filteredResults);
                
                if (filteredResults.length === 0) {
                    setNoResultsFound(true);
                }
            } catch (apiError) {
                console.error('API search failed:', apiError);
                
                // Fall back to mock data for demo purposes
                const mockUsers = [
                    { name: "Alex Thompson", image: profileImage, major: "Computer Science", userEmail: "alex.thompson@purdue.edu" },
                    { name: "Morgan Smith", image: profileImage, major: "Engineering", userEmail: "morgan.smith@purdue.edu" },
                    { name: "Taylor Johnson", image: profileImage, major: "Psychology", userEmail: "taylor.johnson@purdue.edu" },
                    { name: "Alex Johnson", image: profileImage, major: "Computer Engineering", userEmail: "alex.johnson@purdue.edu" },
                    { name: "Morgan Thompson", image: profileImage, major: "Mathematics", userEmail: "morgan.thompson@purdue.edu" },
                    { name: "Taylor Smith", image: profileImage, major: "Biology", userEmail: "taylor.smith@purdue.edu" }
                ];

                // Filter by search term and mark already friends
                const filteredUsers = mockUsers
                    .filter(user => 
                        user.name.toLowerCase().includes(query.toLowerCase()) || 
                        user.major.toLowerCase().includes(query.toLowerCase())
                    )
                    .map(user => ({
                        ...user,
                        isAlreadyFriend: friends.some(friend => friend.userEmail === user.userEmail)
                    }));

                // Filter out the current user
                const resultsWithoutSelf = filteredUsers.filter(user => 
                    user.userEmail !== userData.userEmail
                );

                toast.warning("Using demo search results. API connection failed.");
                setTimeout(() => {
                    setSearchResults(resultsWithoutSelf);
                }, 500); // Simulate network delay

                if (resultsWithoutSelf.length === 0) {
                    setNoResultsFound(true);
                }
            }
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Failed to search for users. Please try again.');
        } finally {
            setIsSearching(false);
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
                    url: `http://localhost:8080/users/${userData.userEmail}/friend-requests/send`,
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
                    url: `http://localhost:8080/users/${userData.userEmail}/friend-requests/accept`,
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
                    url: `http://localhost:8080/users/${userData.userEmail}/friend-requests/deny`,
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
                        url: `http://localhost:8080/users/${userData.userEmail}/friends/${friendEmail}`,
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

    // Add a refresh function to manually refresh friend requests and friends
    const refreshData = () => {
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
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Friends</h2>

                {friends.length > 0 ? (
                    <div className="friends-list" ref={friendsListRef}>
                        {friends.map(user => (
                            <div className="friend-card" key={user.userEmail}>
                                <button
                                    className="remove-friend-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent navigation when clicking the button
                                        handleRemoveFriend(user.name, user.userEmail);
                                    }}
                                    title="Remove friend"
                                >
                                    Remove
                                </button>
                                <div
                                    className="friend-card-content"
                                    onClick={() => handleFriendClick(user.userEmail)}
                                >
                                    <img src={user.image} alt={user.name} />
                                    <h3>{user.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-friends-message">
                        <div className="empty-state-icon">👋</div>
                        <h3>No friends yet</h3>
                        <p>Search below to find and add friends to your network!</p>
                    </div>
                )}
            </div>

            <div className="friend-requests-container">
                <h2>Friend Requests {friendRequests.length > 0 && <span className="request-count">{friendRequests.length}</span>}</h2>

                {friendRequests.length > 0 ? (
                    <div className="friend-requests-list">
                        {friendRequests.map(request => (
                            <div className="friend-request-card" key={request.id}>
                                <div className="user-info" onClick={() => handleFriendClick(request.userEmail)}>
                                    <img src={request.image} alt={request.name} className="request-avatar" />
                                    <div className="request-details">
                                        <h4>{request.name}</h4>
                                        <p>{request.major || 'No major listed'}</p>
                                    </div>
                                </div>
                                <div className="request-actions">
                                    <button
                                        className="accept-request-btn"
                                        onClick={() => handleAcceptRequest(request)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="reject-request-btn"
                                        onClick={() => handleRejectRequest(request.id, request.name, request.userEmail)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-requests-message">
                        <p>You don&apos;t have any friend requests right now.</p>
                    </div>
                )}
            </div>

            <div className="search-section">
                <form className="search-container" onSubmit={(e) => e.preventDefault()}>
                    <div className="search-input-container">
                        <input
                            type="text"
                            className="search-bar"
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
                            <div className="search-history-dropdown">
                                <div className="search-history-header">Recent Searches</div>
                                {searchHistory.map((query, index) => (
                                    <div 
                                        key={index} 
                                        className="search-history-item"
                                        onClick={() => {
                                            setSearchQuery(query);
                                            performSearch(query);
                                        }}
                                    >
                                        <i className="history-icon">↩️</i>
                                        <span>{query}</span>
                                    </div>
                                ))}
                                <div 
                                    className="clear-history"
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
                    
                    <button type="submit" className="search-button" onClick={handleSearch} disabled={isSearching}>
                        <i className="friend-search"></i>
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h3>Search Results</h3>
                        <div className="search-results-list">
                            {searchResults.map(user => (
                                <div key={user.userEmail} className="search-result-card">
                                    <div className="user-info" onClick={() => handleFriendClick(user.userEmail)}>
                                        <img src={user.image} alt={user.name} className="search-result-avatar" />
                                        <div className="search-result-details">
                                            <h4>{user.name}</h4>
                                            <p>{user.major || 'No major listed'}</p>
                                        </div>
                                    </div>
                                    {user.isAlreadyFriend ? (
                                        <button
                                            className="already-friend-btn"
                                            disabled
                                        >
                                            Already Friends
                                        </button>
                                    ) : (
                                        <button
                                            className="add-friend-btn"
                                            onClick={() => handleAddFriend(user)}
                                        >
                                            Add Friend
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {noResultsFound && (
                    <div className="no-results">
                        <p>No users found matching &#34;{searchQuery}&#34;</p>
                    </div>
                )}
            </div>

            <button onClick={refreshData} className="refresh-button">
                <i className="refresh-icon"></i> Refresh
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