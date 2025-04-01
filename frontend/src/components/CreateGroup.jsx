import './CreateGroup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateGroup() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxUsers: '',
        public: true // Match what the API returns
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle checkbox separately
        const newValue = type === 'checkbox' ? !checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    // Before sending the request, ensure we have a valid email
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const sessionId = localStorage.getItem('sessionId');
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (!sessionId || !userData || !userData.userEmail) {
            alert('You must be logged in to create a group.');
            return;
        }
        
        // Use the email from userData instead of localStorage directly
        const payload = {
            name: formData.name,
            description: formData.description,
            maxUsers: parseInt(formData.maxUsers, 10),
            public: formData.public,
            hosts: [], // Use authenticated user's email
            participants: [],
            events: null
        };
        
        // Rest of your submission code
        try {
            const response = await axios.post(
                'http://localhost:8080/groups/create',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    }
                }
            );

            if (response.status === 200) {
                console.log('Group Created:', response.data);
                navigate(`/group/${response.data.groupId}`);
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/home');
    };

    return (
        <div className="create-group-container">
            <form onSubmit={handleSubmit} className="create-group-form">
                <h2>Create Group</h2>
                <div className="form-group">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Group Name"
                        required
                    />
                </div>
                <div className="form-group">
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description"
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="number"
                        name="maxUsers"
                        value={formData.maxUsers}
                        onChange={handleChange}
                        placeholder="Max Users"
                        required
                    />
                </div>
                
                {/* Add the privacy checkbox */}
                <div className="form-group privacy-setting">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            name="public"
                            checked={!formData.public}
                            onChange={handleChange}
                            className="privacy-checkbox"
                        />
                        <span className="checkmark"></span>
                        Make this group private
                        <span className="privacy-tooltip">
                            Private groups are only visible to members and require an invitation to join
                        </span>
                    </label>
                </div>
                
                <div className="form-actions">
                    <button type="submit" className="create-group-button">
                        Create Group
                    </button>
                    <button type="button" className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateGroup;
