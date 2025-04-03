import './CreateGroup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateGroup() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxUsers: '',
        public: true
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const sessionId = localStorage.getItem('sessionId');
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!sessionId || !userData || !userData.userEmail) {
            alert('You must be logged in to create a group.');
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            maxUsers: parseInt(formData.maxUsers, 10),
            public: formData.public,
            hosts: [userData.userEmail],
            participants: [],
            events: null
        };

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
                <div className="form-group checkbox-inline">
                    <input
                        type="checkbox"
                        name="public"
                        checked={formData.public}
                        onChange={handleChange}
                        id="public-checkbox"
                    />
                    <label htmlFor="public-checkbox">Public Group</label>
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