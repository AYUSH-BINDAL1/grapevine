import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EventDetails.css';
import { base_url } from '../config';

function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [registrationMessage, setRegistrationMessage] = useState("");
    const [hostNames, setHostNames] = useState({});
    const [reminders, setReminders] = useState([]);
    const [reminderTime, setReminderTime] = useState("");


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


    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const sessionId = localStorage.getItem("sessionId");
                const res = await axios.get(`${base_url}/events/${eventId}/reminders`, {
                    headers: { 'Session-Id': sessionId }
                });
                const userEmail = JSON.parse(localStorage.getItem("userData"))?.userEmail;
                const userReminders = res.data.filter(rem => rem.userEmail === userEmail);
                setReminders(userReminders);
            } catch (err) {
                console.error("Failed to fetch reminders", err);
            }
        };
        fetchReminders();
    }, [eventId]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const sessionId = localStorage.getItem("sessionId");
                if (!sessionId) {
                    alert("Session expired. Please log in again.");
                    navigate("/");
                    return;
                }
                const response = await axios.get(`${base_url}/events/${eventId}`, {
                    headers: { "Session-Id": sessionId }
                });
                setEventData(response.data);
                setEditedData(response.data);

                if (response.data.groupId) {
                    const groupResponse = await axios.get(`${base_url}/groups/${response.data.groupId}`, {
                        headers: { "Session-Id": sessionId }
                    });
                    setGroupName(groupResponse.data.name);
                }

                const hosts = response.data.hosts || [];
                const names = {};
                await Promise.all(
                    hosts.map(async (email) => {
                        try {
                            const userRes = await axios.get(`${base_url}/users/${email}`, {
                                headers: { "Session-Id": sessionId }
                            });
                            names[email] = userRes.data.name || email;
                        } catch {
                            names[email] = email;
                        }
                    })
                );
                setHostNames(names);
            } catch (error) {
                console.error("Error fetching event details:", error);
                navigate("/events");
            }
        };

        fetchEventDetails();
    }, [eventId, navigate]);

    const handleSaveReminder = async () => {
        const sessionId = localStorage.getItem("sessionId");

        if (!reminderTime) {
            console.error("No reminder time selected");
            return;
        }

        const minutes = parseInt(reminderTime, 10);
        const eventStart = new Date(eventData.startTime);

        // ✅ Check for duplicates by comparing minute offsets
        const duplicate = reminders.some(r => {
            const reminderDate = new Date(r.reminderTime);
            const diff = Math.round((eventStart - reminderDate) / 60000); // in minutes
            return diff === minutes;
        });

        if (duplicate) {
            console.warn("Reminder for that time already exists.");
            return;
        }

        try {
            await axios.post(`${base_url}/events/${eventId}/reminders`, {
                minutesBefore: minutes
            }, {
                headers: { "Session-Id": sessionId }
            });

            console.log("Reminder saved successfully");

            // ✅ Refresh reminders
            const res = await axios.get(`${base_url}/events/${eventId}/reminders`, {
                headers: { "Session-Id": sessionId }
            });
            setReminders(res.data);

        } catch (error) {
            console.error("Failed to save reminder:", error.response?.data || error.message);
        }
    };

    const handleDeleteReminder = async (reminderId) => {
        try {
            const sessionId = localStorage.getItem("sessionId");
            await axios.delete(`${base_url}/events/reminders/${reminderId}`, {
                headers: { 'Session-Id': sessionId }
            });
            setReminders(reminders.filter(rem => rem.reminderId !== reminderId));
        } catch (err) {
            console.error("Failed to delete reminder", err);
            alert("Failed to delete reminder");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setEditedData((prev) => ({ ...prev, [name]: newValue }));
    };

    const handleSave = async () => {
        const sessionId = localStorage.getItem("sessionId");
        try {
            await axios.put(`${base_url}/events/${eventId}`, editedData, {
                headers: { "Session-Id": sessionId }
            });
            setEventData(editedData);
            setEditMode(false);
        } catch (error) {
            console.error("Failed to update event:", error);
            alert("Update failed.");
        }
    };

    const handleDelete = async () => {
        const sessionId = localStorage.getItem("sessionId");
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await axios.delete(`${base_url}/events/${eventId}`, {
                headers: { "Session-Id": sessionId }
            });
            alert("Event deleted.");
            navigate("/events");
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Could not delete event.");
        }
    };


    const handleRegistration = async () => {
        const sessionId = localStorage.getItem("sessionId");
        const currentUserEmail = JSON.parse(localStorage.getItem("userData"))?.userEmail;
        if (!sessionId || !currentUserEmail) return;

        try {
            await axios.post(
                `${base_url}/events/${eventId}/join`,
                { userEmail: currentUserEmail },
                { headers: { "Session-Id": sessionId } }
            );

            setRegistrationMessage("✅ You have successfully registered for this event.");

            // Re-fetch the event to update members
            const updatedEvent = await axios.get(`${base_url}/events/${eventId}`, {
                headers: { "Session-Id": sessionId }
            });
            setEventData(updatedEvent.data);
        } catch (error) {
            console.error("Registration failed:", error);
            setRegistrationMessage("❌ Failed to register for event.");
        }
    };

    const currentUserEmail = JSON.parse(localStorage.getItem('userData'))?.userEmail;

    // Define these variables to check if the user is a host or participant
    const isHost = eventData?.hosts?.includes(currentUserEmail) || false;
    const isParticipant = eventData?.participants?.includes(currentUserEmail) || false;

    if (!eventData) {
        return <div className="event-details-loading">Loading...</div>;
    }

    const locationLabel = hardcodedLocations.find(
        (loc) => loc.id === parseInt(editedData.locationId)
    )?.shortName || "Not specified";

    return (
        <div className="event-details-container">
            <button className="event-details-back" onClick={() => navigate("/events")}>
                ← Back to Events
            </button>

            <div className="event-details-header">
                {editMode ? (
                    <input
                        className="event-details-title-input"
                        name="name"
                        value={editedData.name}
                        onChange={handleInputChange}
                    />
                ) : (
                    <h1 className="event-details-title">{eventData.name}</h1>
                )}
                <div className="event-details-meta">
                    {editMode ? (
                        <>
                            <label>
                                Location:
                                <select name="locationId" value={editedData.locationId} onChange={handleInputChange}>
                                    {hardcodedLocations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.shortName}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Max Users:
                                <input type="number" name="maxUsers" value={editedData.maxUsers} onChange={handleInputChange} />
                            </label>
                            <label>
                                Event Time:
                                <input type="datetime-local" name="eventTime" value={editedData.eventTime} onChange={handleInputChange} />
                            </label>
                        </>
                    ) : (
                        <>
                            <div className="event-details-meta-item">📍 {locationLabel}</div>
                            <div className="event-details-meta-item">🕒 {new Date(eventData.eventTime).toLocaleString()}</div>
                            <div className="event-details-meta-item">👥 Max Participants: {eventData.maxUsers}</div>
                            <div className="event-details-meta-item event-details-link" onClick={() => navigate(`/group/${eventData.groupId}`)}>
                                🔗 {groupName}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="event-details-body">
                <div className="event-details-section">
                    <h2>Description</h2>
                    {editMode ? (
                        <textarea name="description" value={editedData.description} onChange={handleInputChange} />
                    ) : (
                        <p>{eventData.description}</p>
                    )}
                </div>
                <div className="event-details-section">
                    <h2>Members</h2>
                    <div className="members-list">
                        {eventData.hosts?.map((host, index) => (
                            <div key={`host-${index}`} className="member-card host-member">
                                <span className="member-name">{hostNames[host] || host}</span>
                                <span className="member-role">Host</span>
                            </div>
                        ))}
                        {eventData.participants?.map((participant, index) => {
                            const name = hostNames[participant] || participant;
                            if (eventData.hosts?.includes(participant)) return null;
                            return (
                                <div key={`participant-${index}`} className="member-card">
                                    <span className="member-name">{name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="event-details-actions">

                {/* Reminder UI (only for host or participant) */}
                {(isHost || isParticipant) && (
                    <div className="reminder-section">
                        <h3>Reminders</h3>
                        <div className="reminder-container">
                            <label htmlFor="reminder-time">⏰ Set Reminder:</label>
                            <select
                                id="reminder-time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                            >
                                <option value="">Select time</option>
                                <option value="15">15 minutes before</option>
                                <option value="30">30 minutes before</option>
                                <option value="60">1 hour before</option>
                            </select>
                            <button className="save-button" onClick={handleSaveReminder}>Save Reminder</button>
                        </div>
                        {reminders.length > 0 && (
                            <div className="reminder-list">
                                <h4>Current Reminders</h4>
                                {reminders.map((reminder) => (
                                    <div key={reminder.reminderId} className="reminder-item">
                                        <span>⏰ {new Date(reminder.reminderTime).toLocaleString()}</span>
                                        <button
                                            className="reminder-delete-button"
                                            onClick={() => handleDeleteReminder(reminder.reminderId)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Registration Button (only if not host or participant and not full) */}
                {eventData &&
                    !eventData.hosts?.includes(currentUserEmail) &&
                    !eventData.participants?.includes(currentUserEmail) &&
                    eventData.participants?.length < eventData.maxUsers && (
                        <button className="register-button" onClick={handleRegistration}>
                            Register
                        </button>
                    )}

                {editMode ? (
                    <>
                        <button className="save-button" onClick={handleSave}>Save</button>
                        <button className="cancel-button" onClick={() => setEditMode(false)}>Cancel</button>
                    </>
                ) : (
                    eventData.hosts?.includes(currentUserEmail) && (
                        <>
                            <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
                            <button className="delete-button" onClick={handleDelete}>Delete</button>
                        </>
                    )
                )}
            </div>
            {registrationMessage && <p className="registration-message">{registrationMessage}</p>}
        </div>
    );
}

export default EventDetails;