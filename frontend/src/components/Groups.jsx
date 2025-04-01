import './Groups.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp'; // Import the profile image for review avatars
import { toast, ToastContainer } from 'react-toastify'; // Import toast for notifications
import 'react-toastify/dist/ReactToastify.css';

function Groups() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get group ID from URL
  const [group, setGroup] = useState({
    title: '',
    description: '',
    members: [],
    hosts: [],
    reviews: [],
    location: '',
    meetingTimes: '',
    image: 'https://via.placeholder.com/300x200?text=Group+Image'
  });
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState(null);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userMembership, setUserMembership] = useState({
    isHost: false,
    isMember: false
  });
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [isMember, setIsMember] = useState(false);

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

  // Update your fetchData function to include the access check API
  const fetchData = async () => {
    console.log(`Attempting to fetch group with ID: ${id}, type: ${typeof id}`);
    setLoading(true);
    const sessionId = localStorage.getItem('sessionId');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userEmail = userData?.userEmail;
  
    if (!sessionId || !userData) {
      navigate('/');
      return;
    }

    // First check if the user has access to the group
    try {
      // Check access using the dedicated endpoint
      const accessResponse = await axios.get(
        `http://localhost:8080/groups/${id}/check-access`,
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Access check response:', accessResponse.data);
      
      // If access is granted, proceed with getting the full group data
      if (accessResponse.data.hasAccess) {
        try {
          // Your existing code to get group data
          const groupResponse = await axios.get(
            `http://localhost:8080/groups/${id}`,
            {
              headers: {
                'Session-Id': sessionId,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Rest of your existing group data processing...
          console.log('API group data:', groupResponse.data);
          
          // Transform API data to match your component's expected structure
          const apiGroup = groupResponse.data;
          
          // Check if the current user is a host or member
          const isUserHost = apiGroup.hosts && apiGroup.hosts.includes(userEmail);
          const isUserMember = apiGroup.participants && apiGroup.participants.includes(userEmail);
          
          // Update the membership status
          setUserMembership({
            isHost: isUserHost,
            isMember: isUserMember
          });
          
          const formattedGroup = {
            id: apiGroup.groupId || apiGroup.id,
            title: apiGroup.name || apiGroup.title || 'Unnamed Group',
            image: apiGroup.image || 'https://via.placeholder.com/300x200?text=Group+Image',
            description: apiGroup.description || 'No description available',
            
            // Handle hosts separately from regular members
            hosts: apiGroup.hosts 
              ? apiGroup.hosts.map((host, index) => ({
                  id: `host-${index}`,
                  name: host,
                  major: 'Major: Not specified', // API might not provide this
                  isHost: true // Flag to identify hosts
                }))
              : [],
              
            // Handle regular members
            members: apiGroup.participants 
              ? apiGroup.participants
                  .filter(participant => !apiGroup.hosts || !apiGroup.hosts.includes(participant)) // Filter out hosts to avoid duplication
                  .map((participant, index) => ({
                    id: `member-${index}`,
                    name: participant,
                    major: 'Major: Not specified', // API might not provide this
                    isHost: false
                  }))
              : apiGroup.members || [],
              
            // Other fields remain the same
            location: apiGroup.location || 'No location specified',
            meetingTimes: apiGroup.meetingTimes || 'No schedule specified',
            reviews: apiGroup.reviews || []
          };
          
          console.log('Formatted group data:', formattedGroup);
          setGroup(formattedGroup);
          
          // Now fetch the rating data
          try {
            const ratingResponse = await axios.get(
              `http://localhost:8080/groups/${id}/average-rating`,
              {
                headers: {
                  'Session-Id': sessionId,
                  'Content-Type': 'application/json'
                }
              }
            );
            setRatingData(ratingResponse.data);
          } catch (ratingError) {
            console.error('Error fetching rating data, using calculated:', ratingError);
            // Calculate rating data manually if API fails
            const reviews = formattedGroup.reviews || [];
            const averageRating = calculateAverageRating(reviews);
            setRatingData({
              averageRating: parseFloat(averageRating),
              totalReviews: reviews.length
            });
          }
          
        } catch (groupError) {
          console.error('Error fetching group data after access check:', groupError);
          // Fall back to mock data if needed
          fallbackToMockData(id);
        }
      } else {
        // User does not have access - show access denied view
        console.log('Access denied by check-access API');
        setAccessDenied(true);
        
        // Get basic info for the group
        try {
          const basicInfoResponse = await axios.get(
            `http://localhost:8080/groups/${id}/basic-info`,
            {
              headers: {
                'Session-Id': sessionId,
                'Content-Type': 'application/json'
              }
            }
          );
          
          setGroup({
            id: id,
            title: basicInfoResponse.data.name || "Private Group",
            isPrivate: true,
            description: "This is a private group. You need to request access to view details."
          });
        } catch (basicInfoError) {
          console.error('Could not fetch basic group info:', basicInfoError);
          setGroup({
            id: id,
            title: "Private Group",
            isPrivate: true,
            description: "This is a private group. You need to request access to view details."
          });
        }
      }
    } catch (accessCheckError) {
      console.error('Error checking access:', accessCheckError);
      
      // If the access check fails, fall back to the previous method
      if (accessCheckError.response && accessCheckError.response.status === 403) {
        console.log('Access denied via error response');
        setAccessDenied(true);
        
        // Rest of your existing 403 handling...
        
      } else {
        // Try to get the group data anyway, in case the access check API is just not implemented
        try {
          // Your existing code to get group data
          const groupResponse = await axios.get(
            `http://localhost:8080/groups/${id}`,
            {
              headers: {
                'Session-Id': sessionId,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Process the response as before...
          
        } catch (fallbackError) {
          // Handle this error with your existing error handling...
          handleGroupFetchError(fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle errors from group data fetch
  const handleGroupFetchError = (error) => {
    console.error('Error fetching group data:', error);
    
    // Enhanced error inspection
    if (error.response) {
          setMyRating(null);
          setUserRating(0);
      console.log('Server responded with status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received from server:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
    
    // More robust 403 detection
    if (
      (error.response && error.response.status === 403) || 
      (error.response && error.response.data && error.response.data.error === "Access denied") ||
      (error.message && error.message.includes("forbidden"))
    ) {
      console.log('Access denied condition detected - showing access denied view');
      setAccessDenied(true);
      
      // Your existing access denied handling...
      
    } else {
      // Make sure accessDenied is reset for other errors
      setAccessDenied(false);
      
      // Fall back to mock data
      fallbackToMockData(id);
    }
  };

  // Helper function to use mock data
  const fallbackToMockData = (groupId) => {
    console.log('Falling back to mock data for group:', groupId);
    const numericId = parseInt(groupId, 10);
    
    if (groupsData[numericId]) {
      console.log('Mock data found for group:', numericId);
      setGroup(groupsData[numericId]);
      
      // Calculate mock rating data
      const reviews = groupsData[numericId].reviews || [];
      const averageRating = calculateAverageRating(reviews);
      setRatingData({
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length
      });
    } else {
      console.error('No mock data found for group ID:', numericId);
      setGroup(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    console.log('accessDenied state changed:', accessDenied);
  }, [accessDenied]);
  

  const handleDeleteRating = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }
  
    try {
      await axios.delete(
        `http://localhost:8080/groups/${id}/delete-rating`,
        {
          headers: {
            'Session-Id': sessionId
          }
        }
      );
  
      // Refresh the average rating
      const ratingResponse = await axios.get(
        `http://localhost:8080/groups/${id}/average-rating`,
        { headers: { 'Session-Id': sessionId } }
      );
      setRatingData(ratingResponse.data);
      setMyRating(null);
      setUserRating(0);
    } catch (error) {
      console.error('Error deleting rating:', error);
    }
  };  

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

  const handleRatingSubmit = async () => {
      if (!userRating) return;
      
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }
    
      setSubmittingRating(true);
      try {
        // Submit the new rating
        await axios.post(
          `http://localhost:8080/groups/${id}/add-rating`,
          { score: userRating },
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );

        // Get updated average rating
        const ratingResponse = await axios.get(
          `http://localhost:8080/groups/${id}/average-rating`,
          { headers: { 'Session-Id': sessionId } }
        );
        
        // Update states
        setRatingData(ratingResponse.data);
        setMyRating(userRating); // Set myRating to the rating we just submitted
      } catch (error) {
        console.error('Error submitting rating:', error);
      } finally {
        setSubmittingRating(false);
      }
  };

  // Calculate the average rating for a group
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  // Update the requestAccess function
  const requestAccess = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      if (!sessionId || !userData) {
        toast.error("You must be logged in to request access");
        return;
      }
      
      // Show loading toast
      toast.info("Sending access request...", { autoClose: false, toastId: 'access-request' });
      
      try {
        // Try to call the real API
        const response = await axios.post(
          `http://localhost:8080/groups/${id}/request-access`,
          {
            message: `${userData.name} (${userData.userEmail}) would like to join this group.`
          },
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Dismiss the loading toast
        toast.dismiss('access-request');
        
        if (response.data.emailSent) {
          toast.success("Access request sent to group hosts. You'll be notified when they respond.");
        } else {
          toast.info("Access request submitted. The hosts will review your request soon.");
        }
      } catch (apiError) {
        console.log("API error, using mock response", apiError);
        
        // Mock response for testing - simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dismiss the loading toast
        toast.dismiss('access-request');
        toast.success("Access request sent to group hosts. (Demo Mode)");
      }
      
      // Set requestSent to true regardless of API or mock path
      setRequestSent(true);
    } catch (error) {
      console.error('Error in request access flow:', error);
      toast.dismiss('access-request');
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Add this function to handle joining a group
  const handleJoinGroup = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      // For public groups - direct join
      if (group.public !== false) {
        // Show loading toast
        toast.info("Joining group...", { autoClose: false, toastId: 'join-group' });
        
        const response = await axios.post(
          `http://localhost:8080/groups/${id}/join`,
          {},
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.dismiss('join-group');
        
        if (response.data.success) {
          toast.success("You've successfully joined the group!");
          
          // Update membership status
          setUserMembership({
            ...userMembership,
            isMember: true
          });
          
          // Refresh group data
          fetchData(); // You'll need to extract your data fetching logic to a named function
        }
      } else {
        // For private groups - request access
        requestAccess();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.dismiss('join-group');
      toast.error("Failed to join the group. Please try again.");
    }
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

  if (accessDenied) {
    return (
      <div className="group-details-container">
        <button className="back-button" onClick={handleBackClick}>
          &larr; Back to Groups
        </button>
        
        <div className="access-denied-container">
          <div className="lock-icon-large">🔒</div>
          <h2>{group.title}</h2>
          <p>This is a private group. You need permission to view its details.</p>
          
          {!requestSent ? (
            <button 
              className="request-access-button"
              onClick={requestAccess}
            >
              Request Access
            </button>
          ) : (
            <div className="request-sent-message">
              <p>✓ Your request has been sent to the group hosts.</p>
              <p>You&apos;ll be notified once they respond to your request.</p>
            </div>
          )}
        </div>
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
              <span>{group.members ? group.members.length : 0} members</span>
            </div>
            <div className="group-meta-item">
              <span className="meta-icon">📍</span>
              <span>{group.location}</span>
            </div>
            <div className="group-meta-item">
              <span className="meta-icon">🕒</span>
              <span>{group.meetingTimes}</span>
            </div>
            <div className="group-meta-item">
              <span className="meta-icon">★</span>
              <div className="rating-container">
                <span>
                  {ratingData ? (
                    ratingData.totalReviews > 0 
                      ? `${ratingData.averageRating.toFixed(1)}/5.0 (${ratingData.totalReviews} reviews)`
                      : '(N/A)'
                  ) : 'Loading...'}
                </span>
                {isMember && (
                  <>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`rating-star ${star <= userRating ? 'filled' : ''}`}
                          onClick={() => setUserRating(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {myRating ? (
                      <button
                        className="delete-rating-button"
                        onClick={handleDeleteRating}
                      >
                        Delete Rating
                      </button>
                    ) : (
                      <button
                        className="submit-rating-button"
                        onClick={handleRatingSubmit}
                        disabled={!userRating || submittingRating}
                      >
                        {submittingRating ? 'Submitting...' : 'Rate'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Only show join button if user is not already a host or member */}
          {!userMembership.isHost && !userMembership.isMember ? (
            <button 
              className="join-group-button"
              onClick={handleJoinGroup}
            >
              Join Group
            </button>
          ) : (
            <div className="membership-status">
              {userMembership.isHost ? (
                <span className="host-badge-status">You are a host of this group</span>
              ) : (
                <span className="member-badge-status">You are a member of this group</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="group-content">
        <div className="group-description-section">
          <h2>About this group</h2>
          <p>{group.description}</p>
        </div>
        
        <div className="group-members-section">
          <h2>Members ({(group.hosts?.length || 0) + (group.members?.length || 0)})</h2>
          
          {/* Show hosts section if there are hosts */}
          {group.hosts && group.hosts.length > 0 && (
            <div className="hosts-section">
              <h3>Hosts</h3>
              <div className="members-grid">
                {group.hosts.map((host, index) => (
                  <div key={host.id || `host-${index}`} className="member-card host-card">
                    <div className="host-badge">Host</div>
                    <img src={profileImage} alt={host.name} className="member-avatar" />
                    <div className="member-info">
                      <p className="member-name">{host.name}</p>
                      <p className="member-major">{host.major || 'Not specified'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show regular members */}
          {group.members && group.members.length > 0 && (
            <div className="regular-members-section">
              <h3>Members</h3>
              <div className="members-grid">
                {group.members.map((member, index) => (
                  <div key={member.id || `member-${index}`} className="member-card">
                    <img src={profileImage} alt={member.name} className="member-avatar" />
                    <div className="member-info">
                      <p className="member-name">{member.name}</p>
                      <p className="member-major">{member.major || 'Not specified'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show message if no members */}
          {(!group.hosts || group.hosts.length === 0) && (!group.members || group.members.length === 0) && (
            <div className="no-members-message">
              <p>This group doesn&apos;t have any members yet.</p>
            </div>
          )}
        </div>
        
        <div className="group-reviews-section">
          <div className="reviews-header">
            <h2>Reviews ({group.reviews ? group.reviews.length : 0})</h2>
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
      <ToastContainer 
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default Groups;
