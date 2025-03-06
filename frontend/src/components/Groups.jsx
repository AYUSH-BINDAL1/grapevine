import './Groups.css';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

function Groups() {
  const groups = [
    { id: 1, title: 'Group 1', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 2, title: 'Group 2', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 3, title: 'Group 3', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 4, title: 'Group 4', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 5, title: 'Group 5', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 6, title: 'Group 6', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 7, title: 'Group 7', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    { id: 8, title: 'Group 8', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
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
                <img src={group.image} alt={group.title} />
                <h3>{group.title}</h3>
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