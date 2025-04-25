import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import { base_url } from '../config';

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        forumReplies: true,
        directMessages: true,
        eventReminders: true
    });
    const [loadingPreferences, setLoadingPreferences] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Add state for user data rather than reading directly from localStorage
    const [userData, setUserData] = useState(null);
    
    const sessionId = localStorage.getItem("sessionId");
    
    // Add a function to fetch fresh user data from the server
    const fetchUserData = useCallback(async () => {
        try {
            const response = await axios.get(`${base_url}/users/me`, {
                headers: {
                    "Session-Id": sessionId
                }
            });
            
            // Update both local state and localStorage
            setUserData(response.data);
            localStorage.setItem('userData', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error("Failed to fetch user data", error);
            return null;
        }
    }, [sessionId]);
    
    // Load initial user data on component mount
    useEffect(() => {
        // First load from localStorage for quick initial render
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                setUserData(JSON.parse(storedUserData));
            } catch (e) {
                console.error("Failed to parse stored user data", e);
            }
        }
        
        // Then fetch fresh data from server
        fetchUserData();
    }, [fetchUserData]);

    // Set up click outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        // Add event listener only when dropdown is open
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get(`${base_url}/notifications`, {
                headers: {
                    "Session-Id": sessionId
                }
            });
            
            // Filter notifications based on user preferences
            const filteredNotifications = response.data.filter(notification => {
                // Default to showing if type is unknown
                if (!notification.type) return true;
                
                switch (notification.type) {
                    case "COMMENT":
                        return preferences.forumReplies;
                    case "MESSAGE":
                        return preferences.directMessages;
                    case "EVENT_REMINDER":
                        return preferences.eventReminders;
                    default:
                        // For unknown types, default to showing them
                        return true;
                }
            });
            
            setNotifications(filteredNotifications);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [sessionId, preferences]); // Add preferences to dependency array

    // Update fetchNotificationPreferences to use the latest user data
    const fetchNotificationPreferences = useCallback(async () => {
        try {
            setLoadingPreferences(true);
            
            // Fetch fresh data to ensure we have the latest preferences
            const freshUserData = await fetchUserData();
            
            if (freshUserData) {
                setPreferences({
                    forumReplies: freshUserData.notifyForumReplies,
                    directMessages: freshUserData.notifyDirectMessages,
                    eventReminders: freshUserData.notifyEventReminders
                });
                console.log("Fresh preferences loaded from server");
            } else {
                // Fallback to current state if fetch fails
                console.log("Using current user data for preferences");
                setPreferences({
                    forumReplies: userData?.notifyForumReplies ?? true,
                    directMessages: userData?.notifyDirectMessages ?? true,
                    eventReminders: userData?.notifyEventReminders ?? true
                });
            }
        } catch (error) {
            console.error("Failed to fetch notification preferences", error);
        } finally {
            setLoadingPreferences(false);
        }
    }, [fetchUserData, userData]);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [fetchNotifications, open]);

    // Add this effect to refresh notifications when preferences change
    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [preferences, open, fetchNotifications]);
    
    // Handle notification click based on type
    const handleNotificationClick = async (notification) => {
        // Close the dropdown
        setOpen(false);
        // Mark notification as read
        try {
            await axios.post(
                `${base_url}/notifications/mark-read/${notification.notificationId}`,
                {},
                {
                    headers: { "Session-Id": sessionId }
                }
            );
            
            // Update local state to show as read
            setNotifications(prevNotifications => 
                prevNotifications.map(n => 
                    n.notificationId === notification.notificationId 
                        ? {...n, read: true} 
                        : n
                )
            );
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
        
        // Navigate based on notification type
        switch(notification.type) {
            case "MESSAGE":
                navigate(`/messaging?user=${notification.senderEmail}`);
                break;
            case "COMMENT":
                navigate(`/forum/thread/${notification.referenceId}`);
                break;
            case "EVENT_REMINDER":
                navigate(`/events/${notification.referenceId}`);
                break;
            default:
                // If type is unknown, try to navigate based on referenceId
                if (notification.referenceId) {
                    navigate(`/forum/thread/${notification.referenceId}`);
                }
        }
    };

    // Update the handleTogglePreference function to refresh user data after update
    const handleTogglePreference = async (key) => {
        const updatedPreferences = {
            ...preferences,
            [key]: !preferences[key]
        };
        
        // Update UI immediately for better user experience
        setPreferences(updatedPreferences);
        
        try {
            // Make sure we have user data
            if (!userData || !userData.userEmail) {
                throw new Error("User data not available");
            }
            
            // Update server with preference changes
            await axios.post(
                `${base_url}/users/${userData.userEmail}/notification-preferences`,
                updatedPreferences,
                {
                    headers: { "Session-Id": sessionId }
                }
            );
            
            // Fetch fresh user data to ensure our state is consistent with server
            await fetchUserData();
            
        } catch (error) {
            console.error("Failed to update notification preferences", error);
            
            // Revert change on failure
            setPreferences(preferences);
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="bell-button" onClick={() => setOpen(!open)}>
                <FaBell />
                {notifications.some(n => !n.read) && (
                    <span className="notification-badge"></span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    {notifications.length > 0 && (
                        <div className="mark-all-read-link">
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await axios.post(`${base_url}/notifications/mark-all-read`, {}, {
                                            headers: { "Session-Id": sessionId }
                                        });
                                        setNotifications(prev =>
                                            prev.map(n => ({ ...n, read: true }))
                                        );
                                    } catch (error) {
                                        console.error("Failed to mark all as read", error);
                                    }
                                }}
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}

                    {notifications.length === 0 ? (
                        <div className="notification-card">
                            <span className="notif-content">No new notifications.</span>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div 
                                key={n.notificationId} 
                                className={`notification-card ${n.read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(n)}
                            >
                                <div className="notif-img-placeholder"></div>
                                <div className="notif-content">
                                    <strong>{n.title || 'New Notification'}</strong>
                                    <p>{n.body || n.content || 'You have a new update.'}</p>
                                    <span className="notif-time">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    {notifications.length > 0 && (
                        <div className="notification-actions">
                            <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await axios.post(
                                            `${base_url}/notifications/mark-all-read`,
                                            {},
                                            {
                                                headers: { "Session-Id": sessionId }
                                            }
                                        );
                                        setNotifications(prevNotifications => 
                                            prevNotifications.map(n => ({...n, read: true}))
                                        );
                                    } catch (error) {
                                        console.error("Failed to mark all as read", error);
                                    }
                                }}
                            >
                            </button>

                        </div>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(!showSettings);
                            if (!showSettings) {
                                fetchNotificationPreferences();
                            }
                        }}
                        className="settings-button"
                    >
                        Notification Settings
                    </button>
                </div>
            )}

            {showSettings && (
                <div className="notification-settings-panel">
                    <h3>Notification Settings</h3>
                    
                    {loadingPreferences ? (
                        <div className="loading-preferences">Loading your preferences...</div>
                    ) : (
                        <>
                            <div className="preference-item">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={preferences.forumReplies}
                                        onChange={() => handleTogglePreference('forumReplies')}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span className="toggle-text">
                                        Forum Replies
                                        <span className="toggle-description">
                                            Get notified when someone replies to your threads
                                        </span>
                                    </span>
                                </label>
                            </div>
                            
                            <div className="preference-item">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={preferences.directMessages}
                                        onChange={() => handleTogglePreference('directMessages')}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span className="toggle-text">
                                        Direct Messages
                                        <span className="toggle-description">
                                            Get notified when you receive a new message
                                        </span>
                                    </span>
                                </label>
                            </div>
                            
                            <div className="preference-item">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={preferences.eventReminders}
                                        onChange={() => handleTogglePreference('eventReminders')}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span className="toggle-text">
                                        Event Reminders
                                        <span className="toggle-description">
                                            Get notified about upcoming events
                                        </span>
                                    </span>
                                </label>
                            </div>
                            
                            <div className="settings-footer">
                                <button onClick={() => setShowSettings(false)}>Close</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;