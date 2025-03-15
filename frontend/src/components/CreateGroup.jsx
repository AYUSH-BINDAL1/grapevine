import './CreateGroup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateGroup() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxUsers: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                alert('You must be logged in to create a group.');
                return;
            }

            // Prepare the payload for the group creation request
            const payload = {
                name: formData.name,
                description: formData.description,
                maxUsers: parseInt(formData.maxUsers, 10),
                hosts: [localStorage.getItem('email') || "test@example.com"],
                participants: [],
                events: null
            };

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
                <button type="submit" className="create-group-button">
                    Create Group
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                    Cancel
                </button>
            </form>
        </div>
    );
}

export default CreateGroup;
