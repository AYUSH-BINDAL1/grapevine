import { useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp';
import './Friends.css';

function Friends() {
    const friendsListRef = useRef(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Sample data - in a real app, this would come from props or API
    const [friends, setFriends] = useState([
        { id: 1, name: "John Doe", image: profileImage },
        { id: 2, name: "Jane Smith", image: profileImage },
        { id: 3, name: "Robert Johnson", image: profileImage },
        { id: 4, name: "Emily Davis", image: profileImage },
        { id: 5, name: "James Brown", image: profileImage },
        { id: 6, name: "Sarah Wilson", image: profileImage },
        { id: 7, name: "David Miller", image: profileImage },
    ]);

    // To test the empty state, uncomment this line:
    // const [friends, setFriends] = useState([]);

    const [friendRequests, setFriendRequests] = useState([
        { id: 201, name: "Chris Parker", image: profileImage, major: "Economics" },
        { id: 202, name: "Jordan Lee", image: profileImage, major: "Computer Science" }
    ]);

    // To test the empty state, uncomment this line:
    // const [friendRequests, setFriendRequests] = useState([]);
    
    // Function to handle navigation to user profile page
    const handleFriendClick = (userId) => {
        navigate(`/user/${userId}`);
    };

    // Function to handle search input changes
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Function to handle search form submission
    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        
        try {
            // In a real app, this would be an API call
            // For this demo, we'll simulate a search with mock data
            const sessionId = localStorage.getItem('sessionId');
            
            //actual API call
            try {
                const response = await axios.get(
                    `http://localhost:8080/users/search?query=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: {
                            'Session-Id': sessionId
                        }
                    }
                );
                
                setSearchResults(response.data);
            } catch (apiError) {
                console.log('API search failed, using mock data:', apiError);
                
                // Mock data for demo purposes
                const mockUsers = [
                    { id: 101, name: "Alex Thompson", image: profileImage, major: "Computer Science" },
                    { id: 102, name: "Morgan Smith", image: profileImage, major: "Engineering" },
                    { id: 103, name: "Taylor Johnson", image: profileImage, major: "Psychology" },
                    { id: 104, name: "Alex Johnson", image: profileImage, major: "Computer Engineering" },
                    { id: 105, name: "Morgan Thompson", image: profileImage, major: "Mathematics" },
                    { id: 106, name: "Taylor Smith", image: profileImage, major: "Biology" },
                    { id: 107, name: "Alex Smith", image: profileImage, major: "Physics" },
                    { id: 108, name: "Morgan Johnson", image: profileImage, major: "Chemistry" },
                    { id: 109, name: "Taylor Thompson", image: profileImage, major: "Art" }
                ];
                
                // Filter the mock data based on the search query
                const filteredUsers = mockUsers.filter(user => 
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.major.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                setTimeout(() => {
                    setSearchResults(filteredUsers);
                }, 500); // Simulate network delay
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Function to add a user as a friend
    const handleAddFriend = async (user) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            
            // In a real app, this would be an API call
            // For this demo, we'll just add to the local state
            try {
                await axios.post(
                    `http://localhost:8080/users/add-friend`,
                    { friendId: user.id },
                    {
                        headers: {
                            'Session-Id': sessionId,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                // If API call succeeds, add to friends list
                setFriends(prev => [...prev, user]);
                
                // Remove from search results
                setSearchResults(prev => prev.filter(result => result.id !== user.id));
                
                alert(`${user.name} added as a friend!`);
            } catch (apiError) {
                console.log('API add friend failed, updating UI anyway:', apiError);
                
                // For demo purposes, update the UI anyway
                setFriends(prev => [...prev, user]);
                setSearchResults(prev => prev.filter(result => result.id !== user.id));
                
                alert(`${user.name} added as a friend! (Demo mode)`);
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Failed to add friend. Please try again.');
        }
    };

    
    
    return (
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Friends</h2>
                
                {friends.length > 0 ? (
                    <div className="friends-list" ref={friendsListRef}>
                        {friends.map(user => (
                            <div className="friend-card" key={user.id}>
                                <button 
                                className="remove-friend-btn" 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent navigation when clicking the button
                                    handleRemoveFriend(user.id, user.name);
                                }}
                                title="Remove friend"
                                >
                                Remove
                                </button>
                                <div 
                                className="friend-card-content"
                                onClick={() => handleFriendClick(user.id)}
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
                                <div className="user-info" onClick={() => handleFriendClick(request.id)}>
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
                                        onClick={() => handleRejectRequest(request.id, request.name)}
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
                <form className="search-container" onSubmit={handleSearchSubmit}>
                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder="Search to add friends..." 
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <button type="submit" className="search-button" disabled={isSearching}>
                        <i className="friend-search"></i>
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>
                
                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h3>Search Results</h3>
                        <div className="search-results-list">
                            {searchResults.map(user => (
                                <div key={user.id} className="search-result-card">
                                    <div className="user-info" onClick={() => handleFriendClick(user.id)}>
                                        <img src={user.image} alt={user.name} className="search-result-avatar" />
                                        <div className="search-result-details">
                                            <h4>{user.name}</h4>
                                            <p>{user.major || 'No major listed'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        className="add-friend-btn"
                                        onClick={() => handleAddFriend(user)}
                                    >
                                        Add Friend
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="no-results">
                        <p>No users found matching &#34;{searchQuery}&#34;</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friends;