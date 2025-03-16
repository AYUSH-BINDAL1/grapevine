import { useRef } from 'react';
import profileImage from '../assets/temp-profile.webp';
import './Friends.css';

function Friends() {
    const friendsListRef = useRef(null);
    
    return (
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Friends</h2>
                
                <div className="friends-list" ref={friendsListRef}>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>John Doe</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>Jane Smith</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>Robert Johnson</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>Emily Davis</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>James Brown</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>Sarah Wilson</h3>
                    </div>
                    <div className="friend-card">
                        <img src={profileImage} alt="Friend" />
                        <h3>David Miller</h3>
                    </div>
                </div>
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