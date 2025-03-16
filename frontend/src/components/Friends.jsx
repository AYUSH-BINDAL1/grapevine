import { useRef, useState } from 'react';
import profileImage from '../assets/temp-profile.webp';
import './Friends.css';

function Friends() {
    const friendsListRef = useRef(null);
    
    // Sample data - in a real app, this would come from props or API
    const [friends, setFriends] = useState([
        { id: 1, name: "John Doe", image: profileImage },
        { id: 2, name: "Jane Smith", image: profileImage },
        { id: 3, name: "Robert Johnson", image: profileImage },
        { id: 4, name: "Emily Davis", image: profileImage },
        { id: 5, name: "James Brown", image: profileImage },
        { id: 6, name: "Sarah Wilson", image: profileImage },
        { id: 7, name: "David Miller", image: profileImage }
    ]);
    
    // To test the empty state, uncomment this line:
    // const [friends, setFriends] = useState([]);
    
    return (
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Friends</h2>
                
                {friends.length > 0 ? (
                    <div className="friends-list" ref={friendsListRef}>
                        {friends.map(friend => (
                            <div className="friend-card" key={friend.id}>
                                <img src={friend.image} alt={friend.name} />
                                <h3>{friend.name}</h3>
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
            <div className="search-container">
                <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Search to add friends..." 
                />
                <button className="search-button">
                    <i className="friend-search"></i>
                    Search
                </button>
            </div>
        </div>
    );
}

export default Friends;