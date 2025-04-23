import React, { useState, useEffect } from 'react';
import './NotificationDropdown.css';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import { base_url } from '../config';

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const sessionId = localStorage.getItem("sessionId");

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${base_url}/notifications`, {
                headers: {
                    "Session-Id": sessionId
                }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    return (
        <div className="notification-wrapper">
            <button className="bell-button" onClick={() => setOpen(!open)}>
                <FaBell />
            </button>

            {open && (
                <div className="notification-dropdown">
                    {notifications.length === 0 ? (
                        <div className="notification-card">
                            <span className="notif-content">No new notifications.</span>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.notificationId} className="notification-card">
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
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;