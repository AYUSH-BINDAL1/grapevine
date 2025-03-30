import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EventDetails.css';

function EventDetails() {
    const { eventId } = useParams();
    const [eventData, setEventData] = useState(null);
    const [groupName, setGroupName] = useState('');
    const navigate = useNavigate();

    const hardcodedLocations = [
        { id: 1, shortName: "WALC" }, { id: 2, shortName: "LWSN" }, { id: 3, shortName: "PMUC" },
        { id: 4, shortName: "HAMP" }, { id: 5, shortName: "RAWL" }, { id: 6, shortName: "CHAS" },
        { id: 7, shortName: "CL50" }, { id: 8, shortName: "FRNY" }, { id: 9, shortName: "KRAN" },
        { id: 10, shortName: "MSEE" }, { id: 11, shortName: "MATH" }, { id: 12, shortName: "PHYS" },
        { id: 13, shortName: "POTR" }, { id: 14, shortName: "HAAS" }, { id: 15, shortName: "HIKS" },
        { id: 16, shortName: "BRWN" }, { id: 17, shortName: "HEAV" }, { id: 18, shortName: "BRNG" },
        { id: 19, shortName: "SC" }, { id: 20, shortName: "WTHR" }, { id: 21, shortName: "UNIV" },
        { id: 22, shortName: "YONG" }, { id: 23, shortName: "ME" }, { id: 24, shortName: "ELLT" },
        { id: 25, shortName: "PMU" }, { id: 26, shortName: "STEW" }
    ];

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

                if (response.data.groupId) {
                    const groupResponse = await axios.get(`http://localhost:8080/groups/${response.data.groupId}`, {
                        headers: { "Session-Id": sessionId },
                    });
                    setGroupName(groupResponse.data.name);
                }

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

    const locationLabel = hardcodedLocations.find(
        (loc) => loc.id === eventData.locationId
    )?.shortName || "Not specified";

    return (
        <div className="event-details-container">
            <button className="event-details-back" onClick={() => navigate("/events")}>
                ← Back to Events
            </button>

            <div className="event-details-header">
                <h1 className="event-details-title">{eventData.name}</h1>
                <div className="event-details-meta">
                    <div className="event-details-meta-item">📍 {locationLabel}</div>
                    <div className="event-details-meta-item">🕒 {new Date(eventData.eventTime).toLocaleString()}</div>
                    <div className="event-details-meta-item">👥 Max Participants: {eventData.maxUsers}</div>
                    <div className="event-details-meta-item">🔒 {eventData.isPublic ? "Public" : "Private"}</div>
                    {eventData.groupId && (
                        <div className="event-details-meta-item event-details-link" onClick={handleGroupRedirect}>
                            🔗 {groupName || "View Group"}
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
