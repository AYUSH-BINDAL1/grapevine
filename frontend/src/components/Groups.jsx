import './Groups.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import profileImage from '../assets/temp-profile.webp'; // Import the profile image for review avatars

function Groups() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get group ID from URL
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Mock data for the group
  const groupsData = {
    1: {
      id: 1,
      title: 'CS 307 Study Group',
      image: 'https://via.placeholder.com/300x200?text=CS+307+Group',
      description: 'A collaborative study group for CS 307 Software Engineering. We meet twice a week to discuss course material, work on projects, and prepare for exams. All skill levels welcome!',
      members: [
        { id: 1, name: 'John Doe', major: 'CS' },
        { id: 2, name: 'Jane Smith', major: 'CS' },
        { id: 3, name: 'Bob Johnson', major: 'Math' },
      ],
      meetingTimes: 'Mondays and Wednesdays 6-8 PM',
      location: 'LWSN B131',
      reviews: [
        { id: 1, userId: 1, userName: 'John Doe', rating: 5, comment: 'This group helped me understand complex software engineering concepts. Highly recommended!', date: '2023-03-15' },
        { id: 2, userId: 2, userName: 'Jane Smith', rating: 4, comment: 'Great discussions, but sometimes we go off-topic.', date: '2023-02-28' },
        { id: 3, userId: 3, userName: 'Bob Johnson', rating: 5, comment: 'The weekly study sessions are extremely helpful. The members are very knowledgeable and patient with explaining difficult topics.', date: '2023-03-20' },
        { id: 4, userId: 4, userName: 'Sarah Miller', rating: 4, comment: 'I joined this group after struggling with the first exam and my grades improved significantly. Great environment for learning!', date: '2023-04-02' },
        { id: 5, userId: 5, userName: 'Michael Chen', rating: 5, comment: 'This group has been essential for my success in CS 307. We break down complex projects into manageable pieces and help each other debug.', date: '2023-04-10' },
        { id: 6, userId: 6, userName: 'Emily Wilson', rating: 3, comment: 'Good resources and people, but sometimes the sessions run too long and we get sidetracked. Would appreciate more structure.', date: '2023-04-15' },
        { id: 7, userId: 7, userName: 'David Park', rating: 5, comment: 'I was falling behind in class until I joined this group. Now I feel much more confident with the material. Everyone is supportive and willing to help.', date: '2023-04-22' }
      ]
    },
    2: {
      id: 2,
      title: 'Calculus III Study Group',
      image: 'https://via.placeholder.com/300x200?text=Calculus+III+Group',
      description: 'Dedicated to mastering multivariable calculus. We work through complex problems together and explain concepts to each other. Join us to conquer Calc III!',
      members: [
        { id: 4, name: 'Alice Williams', major: 'Math' },
        { id: 5, name: 'Charlie Davis', major: 'Physics' }
      ],
      meetingTimes: 'Tuesdays and Thursdays 5-7 PM',
      location: 'MATH 175',
      reviews: [
        { id: 3, userId: 4, userName: 'Alice Williams', rating: 5, comment: 'Saved my grade in this class! Very helpful group.', date: '2023-03-10' }
      ]
    },
    3: {
      id: 3,
      title: 'Organic Chemistry Group',
      image: 'https://via.placeholder.com/300x200?text=Organic+Chemistry',
      description: 'Focus on mastering organic chemistry concepts, reaction mechanisms, and lab techniques. We help each other prepare for exams and understand difficult topics.',
      members: [
        { id: 6, name: 'David Wilson', major: 'Chemistry' },
        { id: 7, name: 'Emma Lee', major: 'Biochemistry' }
      ],
      meetingTimes: 'Fridays 4-7 PM',
      location: 'CHEM 140',
      reviews: [] // Removed reviews for group 3
    }
  };

  useEffect(() => {
    // Simulate API call to fetch group data
    setLoading(true);
    setTimeout(() => {
      if (id && groupsData[id]) {
        setGroup(groupsData[id]);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const handleBackClick = () => {
    navigate('/home');
  };

  const handleRatingChange = (rating) => {
    setUserReview({ ...userReview, rating });
  };

  const handleCommentChange = (e) => {
    setUserReview({ ...userReview, comment: e.target.value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (userReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    // In a real app, you would send this to your backend API
    alert('Review submitted successfully!');
    
    // Add the review to the group's reviews (for demo purposes)
    const newReview = {
      id: group.reviews.length + 1,
      userId: 999, // This would be the actual user's ID
      userName: 'Current User', // This would be the actual user's name
      rating: userReview.rating,
      comment: userReview.comment,
      date: new Date().toISOString().split('T')[0]
    };
    
    setGroup({
      ...group,
      reviews: [...group.reviews, newReview]
    });
    
    // Reset form
    setUserReview({ rating: 0, comment: '' });
    setShowReviewForm(false);
  };

  const renderStars = (rating, interactive = false) => {
    return Array(5).fill(0).map((_, i) => (
      <span 
        key={i}
        className={`star ${i < rating ? 'filled' : ''}`}
        onClick={interactive ? () => handleRatingChange(i + 1) : undefined}
        style={interactive ? {cursor: 'pointer'} : {}}
      >
        ★
      </span>
    ));
  };

  // Calculate the average rating for a group
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="group-details-container loading">
        <div className="loading-spinner">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-details-container error">
        <h2>Group not found</h2>
        <button className="back-button" onClick={handleBackClick}>
          Return to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="group-details-container">
      <button className="back-button" onClick={handleBackClick}>
        &larr; Back to Groups
      </button>
      
      <div className="group-header">
        <img src={group.image} alt={group.title} className="group-image" />
        <div className="group-title-section">
          <h1>{group.title}</h1>
          <div className="group-meta">
            <div className="group-meta-item">
              <span className="meta-icon">👥</span>
              <span>{group.members.length} members</span>
            </div>
            <div className="group-meta-item">
              <span className="meta-icon">📍</span>
              <span>{group.location}</span>
            </div>
            <div className="group-meta-item">
              <span className="meta-icon">🕒</span>
              <span>{group.meetingTimes}</span>
            </div>
            {group.reviews && group.reviews.length > 0 && (
              <div className="group-meta-item">
                <span className="meta-icon">★</span>
                <span>{calculateAverageRating(group.reviews)}/5.0 ({group.reviews.length} reviews)</span>
              </div>
            )}
          </div>
          <button className="join-group-button">Join Group</button>
        </div>
      </div>
      
      <div className="group-content">
        <div className="group-description-section">
          <h2>About this group</h2>
          <p>{group.description}</p>
        </div>
        
        <div className="group-members-section">
          <h2>Members ({group.members.length})</h2>
          <div className="members-grid">
            {group.members.map(member => (
              <div key={member.id} className="member-card">
                <img src={profileImage} alt={member.name} className="member-avatar" />
                <div className="member-info">
                  <p className="member-name">{member.name}</p>
                  <p className="member-major">{member.major}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="group-reviews-section">
          <div className="reviews-header">
            <h2>Reviews ({group.reviews.length})</h2>
            <button 
              className="write-review-button"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          </div>
          
          {showReviewForm && (
            <div className="review-form-container">
              <h3>Write Your Review</h3>
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="rating-selector">
                  <label>Rating:</label>
                  <div className="stars-input">
                    {renderStars(userReview.rating, true)}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="reviewComment">Comment:</label>
                  <textarea
                    id="reviewComment"
                    value={userReview.comment}
                    onChange={handleCommentChange}
                    placeholder="Share your experience with this group..."
                    required
                  />
                </div>
                <button type="submit" className="submit-review-button">Submit Review</button>
              </form>
            </div>
          )}
          
          {group.reviews && group.reviews.length > 0 ? (
            <div className="reviews-list-container">
              <div className="reviews-list">
                {group.reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <img src={profileImage} alt={review.userName} className="reviewer-avatar" />
                      <div className="review-meta">
                        <p className="reviewer-name">{review.userName}</p>
                        <p className="review-date">{review.date}</p>
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-reviews">
              <p className="no-reviews-message">No reviews available for this group yet.</p>
              <p className="no-reviews-prompt">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Groups;

