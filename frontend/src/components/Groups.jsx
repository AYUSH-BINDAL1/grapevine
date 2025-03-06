import './Groups.css';
import { useNavigate } from 'react-router-dom';

function Groups() {
    // Dummy data – in a real app you’d fetch this from your API
    const groups = [
        { id: 1, name: 'Group 1', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 2, name: 'Group 2', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 3, name: 'Group 3', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 4, name: 'Group 4', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    ];

    const navigate = useNavigate();

    const handleCreateGroup = () => {
        navigate('/create-group');
    };

    const handleGroupClick = (groupId) => {
        navigate(`/group/${groupId}`);
    };

    return (
        <div className="app">
            <h1>Groups</h1>
            <button onClick={handleCreateGroup} className="create-group-button">
                Create Group
            </button>
            <div className="scroll-container">
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
        </div>
    );
}

export default Groups;
