import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Confirmation.css';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { base_url } from '../config';

function Confirmation() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      setError('No user information found. Please register again.');
      setTimeout(() => {
        navigate('/Registration');
      }, 3000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    // Convert to uppercase automatically
    setConfirmationCode(e.target.value.toUpperCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!userInfo) {
      setError('No user information found. Please register again.');
      return;
    }

    try {
      const response = await axios.post(`${base_url}/users/verify?token=${confirmationCode}`, userInfo, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setSuccess('Account verified successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Invalid confirmation code. Please try again.');
    }
  };


  return (
    <div className="confirmation-container">
      <div className="confirmation-form">
        <h2>Verify Your Account</h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <FaCheckCircle />
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="confirmation-group">
            <input
              type="text"
              name="confirmationCode"
              value={confirmationCode}
              onChange={handleChange}
              placeholder="Enter Code"
              required
              pattern="[A-Z0-9]{6}"
              minLength="6"
              maxLength="6"
              title="Confirmation code must be 6 characters long and contain only capital letters and numbers."
              autoComplete="off"
            />
            <div className="code-format">6-character code sent to your email</div>
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={confirmationCode.length < 6}
          >
            Verify Account
          </button>
        </form>
        
      </div>
    </div>
  );
}

export default Confirmation;