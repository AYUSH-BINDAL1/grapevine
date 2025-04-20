import './Groups.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp';
import PropTypes from 'prop-types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FixedSizeList as List } from 'react-window';
import { base_url, image_url } from '../config';

// Optimize the ProfileImage component
const ProfileImage = memo(({ user, altText }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tryLoadImageById = useCallback((id, userEmail) => {
    // Try cached version first
    const cachedUrl = sessionStorage.getItem(`profile-image-id-${id}`);
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      setLoading(false);
      return;
    }
    
    // Try standard format
    const standardUrl = `${image_url}/images/${id}`;
    const img = new Image();
    img.onload = () => {
      setImageUrl(standardUrl);
      setLoading(false);
      // Cache the result
      sessionStorage.setItem(`profile-image-id-${id}`, standardUrl);
      if (userEmail) {
        sessionStorage.setItem(`profile-image-${userEmail}`, standardUrl);
      }
    };
    img.onerror = () => {
      // Try API format
      const apiUrl = `${base_url}/api/files/getImage/${id}`;
      const apiImg = new Image();
      apiImg.onload = () => {
        setImageUrl(apiUrl);
        setLoading(false);
        // Cache the result
        sessionStorage.setItem(`profile-image-id-${id}`, apiUrl);
        if (userEmail) {
          sessionStorage.setItem(`profile-image-${userEmail}`, apiUrl);
        }
      };
      apiImg.onerror = () => {
        setError(true);
        setLoading(false);
      };
      apiImg.src = apiUrl;
    };
    img.src = standardUrl;
  }, []);
  
  useEffect(() => {
    // Skip unnecessary work if user doesn't have image data
    if (!user.profilePictureUrl && !user.profilePictureId) {
      setError(true);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(false);
    
    // Check if we already processed this image (caching)
    const cachedUrl = sessionStorage.getItem(`profile-image-${user.userEmail}`);
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      setLoading(false);
      return;
    }
    
    // Try profile picture URL if available
    if (user.profilePictureUrl) {
      const img = new Image();
      img.onload = () => {
        setImageUrl(user.profilePictureUrl);
        setLoading(false);
        // Cache the result
        sessionStorage.setItem(`profile-image-${user.userEmail}`, user.profilePictureUrl);
      };
      img.onerror = () => {
        // If URL fails, try using the ID
        if (user.profilePictureId) {
          tryLoadImageById(user.profilePictureId, user.userEmail);
        } else {
          setError(true);
          setLoading(false);
        }
      };
      img.src = user.profilePictureUrl;
    }
    // If no URL, try ID
    else if (user.profilePictureId) {
      tryLoadImageById(user.profilePictureId, user.userEmail);
    }
    // If no URL or ID, show default
    else {
      setError(true);
      setLoading(false);
    }
  }, [user.profilePictureUrl, user.profilePictureId, user.userEmail, tryLoadImageById]);
  
  
  // Use proper image attributes for optimization
  return (
    <>
      {loading && <div className="skeleton-member-avatar"></div>}
      {!loading && error && <img src={profileImage} alt={altText || 'User'} className="member-avatar" loading="lazy" />}
      {!loading && !error && (
        <img 
          src={imageUrl} 
          alt={altText || 'User'} 
          className="member-avatar" 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = profileImage;
          }} 
        />
      )}
    </>
  );
});

// Add PropTypes validation
ProfileImage.propTypes = {
  user: PropTypes.shape({
    profilePictureUrl: PropTypes.string,
    profilePictureId: PropTypes.string,
    name: PropTypes.string,
    userEmail: PropTypes.string
  }).isRequired,
  altText: PropTypes.string
};

// Add display name
ProfileImage.displayName = 'ProfileImage';

// Extract and memoize child components
const MemberCard = memo(({ member, onClick }) => (
  <div 
    className={`member-card ${member.isHost ? 'host-card' : ''} clickable`}
    onClick={() => onClick(member.userEmail)}
  >
    {member.isHost && <div className="host-badge">Host</div>}
    <ProfileImage user={member} altText={member.name} />
    <div className="member-info">
      <p className="member-name">{member.name}</p>
      <p className="member-major">{member.major || 'Not specified'}</p>
    </div>
  </div>
));

// Add PropTypes definitions for MemberCard
MemberCard.propTypes = {
  member: PropTypes.shape({
    isHost: PropTypes.bool,
    userEmail: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    major: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

// Add display name for MemberCard
MemberCard.displayName = 'MemberCard';

const ReviewCard = memo(({ review }) => {
  // Move rendering logic here from the main component
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
    ));
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <ProfileImage user={review} altText={review.userName || 'User'} />
        <div className="review-meta">
          <p className="reviewer-name">{review.userName || 'Anonymous User'}</p>
          <p className="review-date">
            {review.date ? new Date(review.date).toLocaleDateString() : 'Recent'}
          </p>
        </div>
      </div>
      <div className="review-rating">
        {renderStars(Number(review.score))}
      </div>
      <p className="review-comment">{review.review || 'No comment provided'}</p>
    </div>
  );
});

// Add PropTypes definitions for ReviewCard
ReviewCard.propTypes = {
  review: PropTypes.shape({
    userName: PropTypes.string,
    date: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    review: PropTypes.string
  }).isRequired
};

// Add display name for ReviewCard
ReviewCard.displayName = 'ReviewCard';

const ReviewsList = memo(({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p className="no-reviews-message">No reviews available for this group yet.</p>
        <p className="no-reviews-prompt">Be the first to share your experience!</p>
      </div>
    );
  }

  const Row = memo(({ index, style }) => (
    <div style={style}>
      <ReviewCard review={reviews[index]} />
    </div>
  ));

  Row.propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired
  };

  Row.displayName = 'ReviewRow';

  return (
    <div className="reviews-list-container">
      <List
        height={Math.min(500, reviews.length * 180)}
        itemCount={reviews.length}
        itemSize={180}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
});

// Add PropTypes definitions for ReviewsList
ReviewsList.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    userEmail: PropTypes.string,
    userName: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    review: PropTypes.string,
    date: PropTypes.string
  })).isRequired
};

// Add display name for ReviewsList
ReviewsList.displayName = 'ReviewsList';

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
    image: 'https://dummyimage.com/300x200/e0e0e0/333333&text=Group+Image'
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
  const [reviews, setReviews] = useState([]);
  const [existingReview, setExistingReview] = useState(null);

  // Add these state variables near your other state declarations
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    maxUsers: 0,
    location: '',
    meetingTimes: '',
    description: '',
    image: null,
    imagePreview: null
  });

  // Update the openEditForm function to include the new fields
  const openEditForm = () => {
    setEditFormData({
      name: group.title,
      maxUsers: group.maxUsers || 50, // Default to 50 if not set
      location: group.location || '',
      meetingTimes: group.meetingTimes || '',
      description: group.description || '',
      image: null,
      imagePreview: group.image
    });
    setShowEditForm(true);
  };

  // Handle form field changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update the handleSubmitGroupEdit function to include the new fields in the form data
  const handleSubmitGroupEdit = async (e) => {
    e.preventDefault();
    
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    // Show loading toast
    toast.info("Updating group details...", { autoClose: false, toastId: 'update-group' });
    
    // Use FormData to handle file upload
    const formData = new FormData();
    formData.append('name', editFormData.name);
    formData.append('maxUsers', editFormData.maxUsers);
    formData.append('location', editFormData.location);
    formData.append('meetingTimes', editFormData.meetingTimes);
    formData.append('description', editFormData.description);
    if (editFormData.image) {
      formData.append('image', editFormData.image);
    }
    
    try {
      await axios.put(
        `${base_url}/groups/${id}/update`,
        formData,
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.dismiss('update-group');
      toast.success('Group details updated successfully');
      setShowEditForm(false);
      fetchData(); // Refresh the group data
    } catch (error) {
      console.error('Error updating group:', error);
      toast.dismiss('update-group');
      toast.error('Failed to update group details');
    }
  };

  // Memoize the average rating calculation
  const calculateAverageRating = useCallback((reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  }, []);

  // Memoize the handler functions
  const handleMemberClick = useCallback((userEmail) => {
    if (!userEmail) {
      toast.info("Cannot view this user's profile");
      return;
    }
    
    // Get current user's email from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const currentUserEmail = userData?.userEmail;
    
    if (currentUserEmail && userEmail === currentUserEmail) {
      navigate('/profile');
    } else {
      navigate(`/user/${userEmail}`);
    }
  }, [navigate]);

  // Replace the existing loadUserDetails function with this useCallback version
  const loadUserDetails = useCallback((userEmails) => {
    if (userEmails.length === 0) return;
    
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;
    
    // Process users in batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < userEmails.length; i += batchSize) {
      batches.push(userEmails.slice(i, i + batchSize));
    }
    
    // Process batches sequentially
    batches.forEach(async (batch, batchIndex) => {
      // Add slight delay between batches to avoid API rate limiting
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, batchIndex * 100));
      }
      
      const userPromises = batch.map(email => 
        axios.get(`${base_url}/users/${encodeURIComponent(email)}`, {
          headers: { 'Session-Id': sessionId }
        })
        .then(response => ({
          userEmail: email,
          name: response.data.name || response.data.fullName || email.split('@')[0],
          profilePictureUrl: response.data.profilePictureUrl,
          profilePictureId: response.data.profilePictureId,
          major: response.data.major || (response.data.majors && response.data.majors[0])
        }))
        .catch(() => ({
          userEmail: email,
          name: email.split('@')[0]
        }))
      );
      
      try {
        // Wait for all promises in this batch
        const userDetails = await Promise.all(userPromises);
        
        // Update the group state with these user details
        setGroup(prevGroup => {
          const updatedHosts = [...prevGroup.hosts];
          const updatedMembers = [...prevGroup.members];
          
          userDetails.forEach(user => {
            // Find and update in hosts array
            const hostIndex = updatedHosts.findIndex(h => h.userEmail === user.userEmail);
            if (hostIndex >= 0) {
              updatedHosts[hostIndex] = { ...user, isHost: true, loading: false };
            }
            
            // Find and update in members array
            const memberIndex = updatedMembers.findIndex(m => m.userEmail === user.userEmail);
            if (memberIndex >= 0) {
              updatedMembers[memberIndex] = { ...user, isHost: false, loading: false };
            }
          });
          
          return {
            ...prevGroup,
            hosts: updatedHosts,
            members: updatedMembers
          };
        });
      } catch (error) {
        console.error('Error processing user batch:', error);
      }
    });
  }, []); // Empty dependency array since setGroup has a stable identity by React

  // Replace the processGroupData regular function with this useCallback version
  const processGroupData = useCallback((apiGroup, userEmail) => {
    // Determine if user is host or member
    const isUserHost = apiGroup.hosts && apiGroup.hosts.includes(userEmail);
    const isUserMember = apiGroup.participants && apiGroup.participants.includes(userEmail);
    
    // Extract member emails
    const hostEmails = apiGroup.hosts || [];
    const memberEmails = apiGroup.participants ? 
      apiGroup.participants.filter(email => !hostEmails.includes(email)) : 
      [];
    
    // Create placeholder user objects
    const enhancedHosts = hostEmails.map(email => ({
      userEmail: email,
      name: email.split('@')[0],
      isHost: true,
      loading: true
    }));
    
    const enhancedMembers = memberEmails.map(email => ({
      userEmail: email,
      name: email.split('@')[0],
      isHost: false,
      loading: true
    }));
    
    // Create formatted group
    const formattedGroup = {
      id: apiGroup.groupId || apiGroup.id,
      title: apiGroup.name || apiGroup.title || 'Unnamed Group',
      image: apiGroup.image || 'https://dummyimage.com/300x200/e0e0e0/333333&text=Group+Image',
      description: apiGroup.description || 'No description available',
      hosts: enhancedHosts,
      members: enhancedMembers,
      location: apiGroup.location || 'No location specified',
      meetingTimes: apiGroup.meetingTimes || 'No schedule specified',
      reviews: apiGroup.reviews || []
    };
    
    // Start loading user details in background
    loadUserDetails(hostEmails.concat(memberEmails));
    
    return { isUserHost, isUserMember, formattedGroup };
  }, [loadUserDetails]); // Include loadUserDetails as dependency

  // Replace the fetchData function with more efficient implementation
  const fetchData = useCallback(async () => {
    console.log(`Fetching group with ID: ${id}`);
    setLoading(true);
    const sessionId = localStorage.getItem('sessionId');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!sessionId || !userData) {
      navigate('/');
      return;
    }
  
    // Fetch data in parallel when possible
    try {
      // Run access check and group data in parallel
      const [accessResponse, groupDataPromise] = await Promise.allSettled([
        axios.get(`${base_url}/groups/${id}/check-access`, {
          headers: { 'Session-Id': sessionId }
        }),
        axios.get(`${base_url}/groups/${id}`, {
          headers: { 'Session-Id': sessionId }
        }).catch(err => {
          // Only treat as error if not a 403 (which is expected)
          if (!err.response || err.response.status !== 403) {
            throw err;
          }
          return { status: 403 };
        })
      ]);
      
      // Process the access check result
      if (accessResponse.status === 'fulfilled' && accessResponse.value.data.hasAccess) {
        // User has access - process group data
        if (groupDataPromise.status === 'fulfilled' && groupDataPromise.value.status !== 403) {
          const groupResponse = groupDataPromise.value;
          const apiGroup = groupResponse.data;
          
          // Process group data
          const { isUserHost, isUserMember, formattedGroup } = processGroupData(apiGroup, userData.userEmail);
          
          setUserMembership({
            isHost: isUserHost,
            isMember: isUserMember
          });
          
          setGroup(formattedGroup);
          
          // Fetch ratings and reviews in parallel if user is a member
          if (isUserHost || isUserMember) {
            const [myRatingPromise, ratingDataPromise, reviewsPromise] = await Promise.allSettled([
              axios.get(`${base_url}/groups/${id}/my-rating`, {
                headers: { 'Session-Id': sessionId }
              }),
              axios.get(`${base_url}/groups/${id}/average-rating`, {
                headers: { 'Session-Id': sessionId }
              }),
              axios.get(`${base_url}/groups/${id}/ratings-reviews`, {
                headers: { 'Session-Id': sessionId }
              })
            ]);
            
            // Process my rating
            if (myRatingPromise.status === 'fulfilled' && myRatingPromise.value.data) {
              const myRatingData = myRatingPromise.value.data;
              setMyRating(myRatingData.score);
              setUserRating(myRatingData.score);
              
              if (myRatingData.score && myRatingData.review) {
                setExistingReview(myRatingData);
                setUserReview({
                  rating: myRatingData.score,
                  comment: myRatingData.review || ''
                });
              }
            }
            
            // Process rating data
            if (ratingDataPromise.status === 'fulfilled') {
              setRatingData(ratingDataPromise.value.data);
            } else {
              // Calculate fallback rating data
              const reviews = formattedGroup.reviews || [];
              const averageRating = calculateAverageRating(reviews);
              setRatingData({
                averageRating: parseFloat(averageRating),
                totalReviews: reviews.length
              });
            }
            
            // Process reviews
            if (reviewsPromise.status === 'fulfilled') {
              const reviewsData = reviewsPromise.value.data;
              processReviewsData(reviewsData);
            }
          } else {
            // User is not a member, reset rating-related states
            setMyRating(null);
            setUserRating(0);
            setExistingReview(null);
            
            // Still get average rating
            try {
              const ratingResponse = await axios.get(
                `${base_url}/groups/${id}/average-rating`,
                { headers: { 'Session-Id': sessionId }
              });
              setRatingData(ratingResponse.data);
            } catch (err) {
              console.error('Error fetching rating data:', err);
              // Use calculated fallback
              const reviews = formattedGroup.reviews || [];
              setRatingData({
                averageRating: calculateAverageRating(reviews),
                totalReviews: reviews.length
              });
            }
          }
        } else {
          // Error getting group data
          console.error('Error fetching group data');
        }
      } else {
        // User does not have access
        setAccessDenied(true);
        try {
          const basicInfoResponse = await axios.get(
            `${base_url}/groups/${id}/basic-info`,
            { headers: { 'Session-Id': sessionId } }
          ).catch(error => {
            // Handle 500 error specifically
            console.log('Error fetching basic info:', error.response?.status);
            // Return a default response instead of throwing
            return { 
              data: { 
                name: "Private Group",
                description: "This is a private group. You need to request access to view details."
              } 
            };
          });
          
          setGroup({
            id: id,
            title: basicInfoResponse.data.name || "Private Group",
            isPrivate: true,
            description: basicInfoResponse.data.description || 
              "This is a private group. You need to request access to view details."
          });
        } catch (error) {
          console.error('Error handling private group access:', error);
          // Set default group information
          setGroup({
            id: id,
            title: "Private Group",
            isPrivate: true,
            description: "This is a private group. You need to request access to view details."
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      handleGroupFetchError(error);
    } finally {
      setLoading(false);
    }
  }, [calculateAverageRating, id, navigate, processGroupData]);
  
  // Function to process reviews data
  const processReviewsData = (reviewsData) => {
    // Transform the parallel arrays into review objects
    const formattedReviews = reviewsData.reviews.map((review, index) => ({
      id: index,
      userEmail: reviewsData.userEmails?.[index] || 'user@example.com',
      userName: reviewsData.userNames[index],
      score: reviewsData.scores[index],
      review: review,
      date: reviewsData.dates?.[index] || new Date().toISOString()
    }));
  
    setReviews(formattedReviews);
  };

  const handleGroupFetchError = (error) => {
    console.error("Failed to fetch groups:", error);
    // Update your state to show error message to users
    // Optionally set loading state to false if applicable
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        `${base_url}/groups/${id}/delete-rating`,
        {
          headers: {
            'Session-Id': sessionId
          }
        }
      );
  
      // Refresh the average rating
      const ratingResponse = await axios.get(
        `${base_url}/groups/${id}/average-rating`,
        { headers: { 'Session-Id': sessionId }
      });
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const sessionId = localStorage.getItem('sessionId');
  
    if (!sessionId) {
      navigate('/');
      return;
    }
  
    if (userReview.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
  
    try {
      if (existingReview) {
        // Update existing review
        await axios.put(
          `${base_url}/groups/${id}/update-rating`,
          {
            score: userReview.rating,
            review: userReview.comment
          },
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create new review
        await axios.post(
          `${base_url}/groups/${id}/add-rating`,
          {
            score: userReview.rating,
            review: userReview.comment
          },
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );
      }
  
      // Refresh reviews and ratings
      fetchData();
      toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    }
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
          `${base_url}/groups/${id}/add-rating`,
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
          `${base_url}/groups/${id}/average-rating`,
          { headers: { 'Session-Id': sessionId }
        });
        
        // Update states
        setRatingData(ratingResponse.data);
        setMyRating(userRating); // Set myRating to the rating we just submitted
      } catch (error) {
        console.error('Error submitting rating:', error);
      } finally {
        setSubmittingRating(false);
      }
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
          `${base_url}/groups/${id}/request-access`,
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
          `${base_url}/groups/${id}/join`,
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
        <div className="skeleton-back-button"></div>
        
        <div className="group-header skeleton-header">
          <div className="skeleton-image"></div>
          <div className="group-title-section">
            <div className="skeleton-title"></div>
            <div className="group-meta">
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
              <div className="skeleton-meta-item"></div>
            </div>
            <div className="skeleton-button"></div>
          </div>
        </div>
        
        <div className="group-content">
          <div className="skeleton-section">
            <div className="skeleton-heading"></div>
            <div className="skeleton-paragraph"></div>
            <div className="skeleton-paragraph"></div>
          </div>
          
          <div className="skeleton-section">
            <div className="skeleton-heading"></div>
            <div className="skeleton-members-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-member-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-member-info">
                    <div className="skeleton-member-name"></div>
                    <div className="skeleton-member-major"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="skeleton-section">
            <div className="skeleton-heading"></div>
            <div className="skeleton-reviews-list">
              {[1, 2].map(i => (
                <div key={i} className="skeleton-review-card">
                  <div className="skeleton-review-header">
                    <div className="skeleton-reviewer-avatar"></div>
                    <div className="skeleton-review-meta">
                      <div className="skeleton-reviewer-name"></div>
                      <div className="skeleton-review-date"></div>
                    </div>
                  </div>
                  <div className="skeleton-review-rating"></div>
                  <div className="skeleton-review-comment"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
          {userMembership.isHost && (
            <button 
              className="edit-group-button"
              onClick={openEditForm}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '6px' }}>
                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Group
            </button>
          )}
          <div className="group-meta">
            <div className="group-meta-item">
              <span className="meta-icon">👥</span>
              <span>{(group.hosts?.length || 0) + (group.members?.length || 0)} members</span>
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
                        : '(N/A) (0 reviews)'
                    ) : 'Loading...'}
                  </span>
                  {userMembership.isMember && ( // Changed from isMember to userMembership.isMember
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
                  <MemberCard 
                    key={host.id || `host-${index}`} 
                    member={host} 
                    onClick={handleMemberClick} 
                  />
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
                  <MemberCard 
                    key={member.id || `member-${index}`} 
                    member={member} 
                    onClick={handleMemberClick} 
                  />
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
          <h2>Reviews ({reviews ? reviews.length : 0})</h2>
          {userMembership.isMember && (
           // Update the write review button section:
            <button 
              className="write-review-button"
              onClick={() => {
                if (!showReviewForm && existingReview) {
                  // Pre-populate form when opening with existing review
                  setUserReview({
                    rating: existingReview.score,
                    comment: existingReview.review || ''
                  });
                }
                setShowReviewForm(!showReviewForm);
              }}
            >
              {showReviewForm ? 'Cancel' : existingReview ? 'Edit Review' : 'Write a Review'}
            </button>

          )}
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
                  <button type="submit" className="submit-review-button">
                    {existingReview ? 'Update Review' : 'Submit Review'}
                  </button>
              </form>
            </div>
          )}
          
          <ReviewsList reviews={reviews} />
        </div>
      </div>

      {/* Add this at the end of the component, before the final closing div */}
      {showEditForm && (
        <div className="edit-group-form-container">
          <div className="edit-group-form-overlay" onClick={() => setShowEditForm(false)}></div>
          <div className="edit-group-form">
            <h3>Edit Group Details</h3>
            <form onSubmit={handleSubmitGroupEdit}>
              <div className="form-group">
                <label htmlFor="group-name">Group Name</label>
                <input
                  id="group-name"
                  name="name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="max-users">Maximum Users</label>
                <input
                  id="max-users"
                  name="maxUsers"
                  type="number"
                  min="1"
                  max="1000"
                  value={editFormData.maxUsers}
                  onChange={handleEditFormChange}
                  required
                />
                <small>Set the maximum number of users allowed in this group</small>
              </div>

              <div className="form-group">
                <label htmlFor="group-location">Location</label>
                <input
                  id="group-location"
                  name="location"
                  type="text"
                  value={editFormData.location}
                  onChange={handleEditFormChange}
                  placeholder="Enter meeting location"
                />
                <small>Where does this group typically meet?</small>
              </div>

              <div className="form-group">
                <label htmlFor="group-schedule">Meeting Schedule</label>
                <input
                  id="group-schedule"
                  name="meetingTimes"
                  type="text"
                  value={editFormData.meetingTimes}
                  onChange={handleEditFormChange}
                  placeholder="E.g., Mondays at 5 PM, Weekly on Thursdays"
                />
                <small>When does this group typically meet?</small>
              </div>

              <div className="form-group">
                <label htmlFor="group-description">Description</label>
                <textarea
                  id="group-description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  placeholder="Describe your group's purpose, activities, and goals"
                  rows={5}
                />
                <small>Tell others what your group is all about</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="group-image">Group Image</label>
                <div className="image-preview-container">
                  {editFormData.imagePreview && (
                    <img 
                      src={editFormData.imagePreview} 
                      alt="Group preview" 
                      className="image-preview" 
                    />
                  )}
                </div>
                <input
                  id="group-image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <small>Upload a new image or leave blank to keep the current one</small>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit" className="save-button">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

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