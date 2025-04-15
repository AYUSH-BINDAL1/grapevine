import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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
    
    setIsSubmitting(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading("Logging in...");
      
      const response = await axios.post('http://localhost:8080/users/login', formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Add timeout for better error handling
      });

      if (response.status === 200) {
        // Update loading toast to success
        toast.update(loadingToast, {
          render: "Login successful! Redirecting...",
          type: "success",
          isLoading: false,
          autoClose: 2000
        });
        
        // Store session ID and user data in localStorage
        const { sessionId, user } = response.data;
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Navigate to home page after a short delay to show the success toast
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // First dismiss the loading toast
      toast.dismiss();
      
      // Then show the appropriate error message
      if (error.code === 'ECONNABORTED') {
        toast.error('Connection timeout. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password.');
      } else if (error.response?.status === 404) {
        toast.error('Account not found. Please check your email.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, navigate]);

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        
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
      
      <ToastContainer
        position="bottom-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default Login;