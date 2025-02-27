import React from "react";
import "./Profile.css";
import profileImage from "../assets/temp-profile.webp";


function Profile() {
  return (
    <div className="profile-page">
        <div className="profile-image-container">
            <img src={profileImage} alt="Profile" className="profile-image" />
        </div>
        <div classname="profile-info">
            <div className="nametag-container">
                <h2 className="name">John Doe</h2>
                <div className="tags">
                    <span className="tag">CS</span>
                </div>
            </div>
            <div className="description-info">
                <h3 className="description">Description</h3>
                <p className="description-details">Example Discription</p>
            </div>
        </div>
        <div className="friends-container">
            <h3 className="friends">Friends</h3>
            <div className="friends-list">
                <div className="friend">
                    <img src={profileImage} alt="Profile" className="friend-image" />
                    <p className="friend-name">Name</p>
                    <button className="add-friend">Add Friend</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
