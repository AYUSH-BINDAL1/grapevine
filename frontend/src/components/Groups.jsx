/*
import './Groups.css';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

function Groups() {
  const groups = [
    { id: 1, name: 'Group 1', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 2, name: 'Group 2', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 3, name: 'Group 3', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 4, name: 'Group 4', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 5, name: 'Group 5', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 6, name: 'Group 6', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 7, name: 'Group 7', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 8, name: 'Group 8', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
  ];

  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
      <div className="app">
        <h1>Groups</h1>
        <button onClick={handleCreateGroup} className="create-group-button">
          Create Group
        </button>
        <div className="scroll-wrapper2">
          <button className="scroll-arrow2 left" onClick={scrollLeft}>&lt;</button>
          <div className="scroll-container2" ref={scrollContainerRef}>
            {groups.length === 0 ? (
                <p>You are not part of any groups. Create one or join an existing group!</p>
            ) : (
                groups.map((group) => (
                    <div key={group.id} className="group-card" onClick={() => handleGroupClick(group.id)}>
                      <img src={group.image} alt={group.name} />
                      <h3>{group.name}</h3>
                    </div>
                ))
            )}
          </div>
          <button className="scroll-arrow2 right" onClick={scrollRight}>&gt;</button>
        </div>
      </div>
  );
}

export default Groups;
*/

import './Groups.css';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function Groups() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const storedUserInfo = localStorage.getItem('userData');
      if (storedUserInfo) {
        const userEmail = JSON.parse(storedUserInfo).userEmail;
        try {
          const response = await axios.get(`http://localhost:8080/users/${userEmail}/all-groups-short`);
          setGroups(response.data);
        } catch (error) {
          console.error('Error fetching groups:', error);
        }
      } else {
        alert('No user information found. Please register again.');
        navigate('/registration');
      }
    };

    fetchGroups();
  }, [navigate]);

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  const handleGroupClick = async (groupId) => {
    try {
      await axios.get(`http://localhost:8080/groups/${groupId}`);
      navigate(`/group/${groupId}`);
    } catch (error) {
      console.error('Error navigating to group:', error);
    }
  };

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <h1>Groups</h1>
      <button onClick={handleCreateGroup} className="create-group-button">
        Create Group
      </button>
      <div className="scroll-wrapper2">
        <button className="scroll-arrow2 left" onClick={scrollLeft}>&lt;</button>
        <div className="scroll-container2" ref={scrollContainerRef}>
          {groups.length === 0 ? (
            <p>You are not part of any groups. Create one or join an existing group!</p>
          ) : (
            groups.map((group) => (
              <div key={group.groupId} className="group-card" onClick={() => handleGroupClick(group.groupId)}>
                <h3>{group.name}</h3>
              </div>
            ))
          )}
        </div>
        <button className="scroll-arrow2 right" onClick={scrollRight}>&gt;</button>
      </div>
    </div>
  );
}

export default Groups;
