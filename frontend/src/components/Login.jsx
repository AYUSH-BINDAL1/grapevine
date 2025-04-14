import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const debounceTimerRef = useRef(null);

  // Memoized change handler with debounce
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Clear any previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounce timer (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }, 300);
    
    // For immediate UI feedback, update the input value directly
    e.target.value = value;
  }, []);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:8080/users/login', formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Add timeout for better error handling
      });

      if (response.status === 200) {
        // Store session ID and user data in localStorage
        const { sessionId, user } = response.data;
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Navigate to home page
        navigate('/home');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Connection timeout. Please try again.');
      } else {
        setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, navigate]);

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            defaultValue={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            autoComplete="email"
          />
          <FaEnvelope className="input-icon" />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            name="password"
            defaultValue={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            autoComplete="current-password"
          />
          <FaLock className="input-icon" />
        </div>
        
        <button 
          type="submit" 
          className="login-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="form-divider">or</div>
        
        <button 
          type="button" 
          className="register-link-button" 
          onClick={() => navigate('/Registration')}
          disabled={isSubmitting}
        >
          Create New Account
        </button>
      </form>
    </div>
  );
}

export default Login;