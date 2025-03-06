import './CreateEvent.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

function CreateEvent() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                alert('You must be logged in to create an event.');
                return;
            }

            const response = await axios.post(
                'http://localhost:8080/events',
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Session-Id': sessionId
                    }
                }
            );

            if (response.status === 201) {
                console.log('Event Created:', response.data);
                navigate('/events');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/events');
    };

    return (
        <div className="registration-container">
            <form onSubmit={handleSubmit} className="registration-form">
                <h2>Create Event</h2>
                <div className="form-group">
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Title"
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
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Location"
                        required
                    />
                </div>
                <button type="submit" className="register-button">
                    Create Event
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                    Cancel
                </button>
            </form>
        </div>
    );
}

export default CreateEvent;