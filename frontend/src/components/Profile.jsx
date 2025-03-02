import React from "react";
import "./Profile.css";
import profileImage from "../assets/temp-profile.webp";

<datalist id="valid-times">
    <option value='12'></option>
    <option value='1'></option>
    <option value='2'></option>
    <option value='3'></option>
    <option value='4'></option>
    <option value='5'></option>
    <option value='6'></option>
    <option value='7'></option>
    <option value='8'></option>
    <option value='9'></option>
    <option value='10'></option>
    <option value='11'></option>
</datalist>

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
        <div className="availability-panel">
            <h3>Set Your Availability</h3>
            <div className="time-input">
                    <label>
                        Start Time:
                        <input type="time" list="valid-times" step={3600}/>
                    </label>
                    <label>
                        End Time:
                        <input type="time" list="valid-times" step={3600}/>
                    </label>
                    <select>
                        <option value="">Select Day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                    </select>
                    <button className="add-time">Add Availability</button>
            </div>
        </div>
        <div className="friends-container">
                <h3 className="friends">Friends</h3>
                <div className="friends-list">
                        <div className="friend">
                            <img src={profileImage} alt="Profile" className="friend-image" />
                            <p className="friend-name">Name</p>
                        </div>
                        <button className="add-friend">Add Friend</button>
                </div>
        </div>
    </div>
    );
}

export default Profile;
