import './CreateEvent.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

function CreateEvent() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        time: '',
        maxUsers: '',
        isPublic: false,
        groupId: '',
        location: ''
    });

    const [groups, setGroups] = useState([]);
    const navigate = useNavigate();

    const hardcodedLocations = [
        "WALC",
        "LWSN",
        "PMUC",
        "HAMP",
        "RAWL",
        "CHAS",
        "CL50",
        "FRNY",
        "KRAN",
        "MSEE",
        "MATH",
        "PHYS",
        "POTR",
        "HAAS",
        "HIKS",
        "BRWN",
        "HEAV",
        "BRNG",
        "SC",
        "WTHR",
        "UNIV",
        "YONG",
        "ME",
        "ELLT",
        "PMU",
        "STEW"
    ];

    // Fetch user's hosted groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const email = JSON.parse(localStorage.getItem('userData')).userEmail;
                const url = `http://localhost:8080/users/${email}/hosted-groups`;
                const sessionId = localStorage.getItem('sessionId');
                const response = await axios.get(url, {
                    headers: { 'Session-Id': sessionId }
                });
                setGroups(response.data);
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };

        fetchGroups();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                alert('You must be logged in to create an event.');
                return;
            }
            if (!formData.groupId) {
                alert('Please select a group.');
                return;
            }

            const eventTime = new Date(`${formData.date}T${formData.time}`)
                .toISOString()
                .slice(0, 19);

            const payload = {
                name: formData.name,
                description: formData.description,
                maxUsers: parseInt(formData.maxUsers, 10),
                isPublic: formData.isPublic,
                eventTime: eventTime
            };

            const url = `http://localhost:8080/events/create/${formData.groupId}`;

            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json', 'Session-Id': sessionId }
            });

            if (response.status === 200) {
                console.log('Event Created:', response.data);
                navigate(`/event/${response.data.eventId}`);
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
        <div className="create-event-container">
            <form onSubmit={handleSubmit} className="create-event-form">
                <h2>Create Event</h2>
                <div className="form-group">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Event Name"
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
                        type="number"
                        name="maxUsers"
                        value={formData.maxUsers}
                        onChange={handleChange}
                        placeholder="Max Users"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleChange}
                        />
                        Public Event
                    </label>
                </div>
                <div className="form-group">
                    <select
                        name="groupId"
                        value={formData.groupId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Group</option>
                        {groups.map((group) => (
                            <option key={group.groupId} value={group.groupId}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Hardcoded Location Dropdown */}
                <div className="form-group">
                    <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Location</option>
                        {hardcodedLocations.map((location, index) => (
                            <option key={index} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="create-event-button">
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
