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
                    headers: { "Session-Id": sessionId }
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
        return <p>Loading event details...</p>;
    }

    return (
        <div className="event-details-container">
            <h1 className="event-title">{eventData.name}</h1>
            <div className="event-info">
                <p><strong>Description:</strong> {eventData.description}</p>
                <p><strong>Location:</strong> {eventData.location || "Not specified"}</p>
                <p><strong>Event Time:</strong> {new Date(eventData.eventTime).toLocaleString()}</p>
                <p><strong>Max Participants:</strong> {eventData.maxUsers}</p>
                <p><strong>Visibility:</strong> {eventData.isPublic ? "Public" : "Private"}</p>
                <p><strong>Host:</strong> {eventData.hosts && eventData.hosts.join(', ')}</p>
            </div>
            <button className="back-button" onClick={() => navigate("/events")}>
                Back to Events
            </button>
        </div>
    );
}

export default EventDetails;
