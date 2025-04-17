import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CreateEvent.css';
import { base_url } from '../config';

function CreateEvent() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        time: '',
        maxUsers: '',
        groupId: '',
        locationId: ''
    });

    const [groups, setGroups] = useState([]);
    const navigate = useNavigate();

    const hardcodedLocations = [
        { id: 1, shortName: "WALC" },
        { id: 2, shortName: "LWSN" },
        { id: 3, shortName: "PMUC" },
        { id: 4, shortName: "HAMP" },
        { id: 5, shortName: "RAWL" },
        { id: 6, shortName: "CHAS" },
        { id: 7, shortName: "CL50" },
        { id: 8, shortName: "FRNY" },
        { id: 9, shortName: "KRAN" },
        { id: 10, shortName: "MSEE" },
        { id: 11, shortName: "MATH" },
        { id: 12, shortName: "PHYS" },
        { id: 13, shortName: "POTR" },
        { id: 14, shortName: "HAAS" },
        { id: 15, shortName: "HIKS" },
        { id: 16, shortName: "BRWN" },
        { id: 17, shortName: "HEAV" },
        { id: 18, shortName: "BRNG" },
        { id: 19, shortName: "SC" },
        { id: 20, shortName: "WTHR" },
        { id: 21, shortName: "UNIV" },
        { id: 22, shortName: "YONG" },
        { id: 23, shortName: "ME" },
        { id: 24, shortName: "ELLT" },
        { id: 25, shortName: "PMU" },
        { id: 26, shortName: "STEW" }
    ];

    // Fetch user's hosted groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const email = JSON.parse(localStorage.getItem('userData')).userEmail;
                const url = `${base_url}/users/${email}/hosted-groups`;
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
                toast.error('You must be logged in to create an event.');
                return;
            }
            if (!formData.groupId) {
                toast.warning('Please select a group.');
                return;
            }

            const eventTime = new Date(`${formData.date}T${formData.time}`)
                .toISOString()
                .slice(0, 19);

            const locationId = parseInt(formData.locationId, 10);
            console.log("Selected locationId:", formData.locationId);
            console.log("Parsed locationId (int):", locationId);

            const payload = {
                name: formData.name,
                description: formData.description,
                maxUsers: parseInt(formData.maxUsers, 10),
                eventTime: eventTime,
                locationId: parseInt(formData.locationId, 10)
            };

            const url = `${base_url}/events/create/${formData.groupId}`;

            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json', 'Session-Id': sessionId }
            });

            if (response.status === 200) {
                console.log('Event Created:', response.data);
                toast.success('Event created successfully!');
                navigate(`/event/${response.data.eventId}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Failed to create event. Please try again.');
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
                <div className="form-group">
                    <select
                        name="locationId"           // key must match formData
                        value={formData.locationId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Location</option>
                        {hardcodedLocations.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.shortName}
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
            <ToastContainer />
        </div>
    );
}

export default CreateEvent;
