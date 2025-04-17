// src/components/NotificationDropdown.jsx
import React, { useState } from 'react';
import './NotificationDropdown.css';
import { FaBell } from 'react-icons/fa';

const mockNotifications = [
    { id: 1, name: 'Yin', time: '10 minutes ago' },
    { id: 2, name: 'Haper', time: '2 hours ago' },
    { id: 3, name: 'San', time: '1 day ago' },
    { id: 4, name: 'Seeba', time: '30 minutes ago' },
];

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="notification-wrapper">
            <button className="bell-button" onClick={() => setOpen(!open)}>
                <FaBell />
            </button>
            {open && (
                <div className="notification-dropdown">
                    {mockNotifications.map((n) => (
                        <div key={n.id} className="notification-card">
                            <div className="notif-img-placeholder"></div>
                            <div className="notif-content">
                                <strong>Your have a new message from {n.name}</strong>
                                <p>Hello there, check this new items in from the your may interested from the motion school.</p>
                                <span className="notif-time">{n.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;