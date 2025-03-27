import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EventDetails.css';

function EventDetails() {
    const { eventId } = useParams();
    const [eventData, setEventData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const sessionId = localStorage.getItem("sessionId");
                if (!sessionId) {
                    alert("Session expired. Please log in again.");
                    navigate("/");
                    return;
                }

                const response = await axios.get(`http://localhost:8080/events/${eventId}`, {
                    headers: { "Session-Id": sessionId },
                });

                setEventData(response.data);
            } catch (error) {
                console.error("Error fetching event details:", error);
                alert("Failed to load event details.");
                navigate("/events");
            }
        };

        fetchEventDetails();
    }, [eventId, navigate]);

    if (!eventData) {
        return <div className="event-details-loading">Loading event details...</div>;
    }

    const handleGroupRedirect = () => {
        if (eventData.groupId) {
            navigate(`/group/${eventData.groupId}`);
        }
    };

    return (
        <div className="event-details-container">
            <button className="event-details-back" onClick={() => navigate("/events")}>
                ← Back to Events
            </button>

            <div className="event-details-header">
                <h1 className="event-details-title">{eventData.name}</h1>
                <div className="event-details-meta">
                    <div className="event-details-meta-item">📍 {eventData.location || "Not specified"}</div>
                    <div className="event-details-meta-item">🕒 {new Date(eventData.eventTime).toLocaleString()}</div>
                    <div className="event-details-meta-item">👥 Max Participants: {eventData.maxUsers}</div>
                    <div className="event-details-meta-item">🔒 {eventData.isPublic ? "Public" : "Private"}</div>
                    {eventData.groupId && (
                        <div className="event-details-meta-item event-details-link" onClick={handleGroupRedirect}>
                            🔗 Go to Group
                        </div>
                    )}
                </div>
            </div>

            <div className="event-details-body">
                <div className="event-details-section">
                    <h2>Description</h2>
                    <p>{eventData.description || "No description provided."}</p>
                </div>

                <div className="event-details-section">
                    <h2>Host(s)</h2>
                    {eventData.hosts?.length > 0 ? (
                        <ul>
                            {eventData.hosts.map((host, index) => (
                                <li key={index}>{host}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No hosts assigned.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventDetails;
