import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Registration.css'; // Import the new CSS file
import { FaEnvelope, FaLock, FaUser, FaBirthdayCake, FaExclamationCircle } from 'react-icons/fa'; // For icons

function Registration() {
  const [formData, setFormData] = useState({
    userEmail: '',
    password: '',
    name: '',
    birthday: ''
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };
  
  // Function to check password strength
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = 
      (hasLowerCase ? 1 : 0) + 
      (hasUpperCase ? 1 : 0) + 
      (hasNumbers ? 1 : 0) + 
      (hasSpecialChars ? 1 : 0);
    
    if (password.length < 8) {
      setPasswordStrength('weak');
    } else if (strength < 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/users/register', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        localStorage.setItem('userInfo', JSON.stringify(formData));
        navigate('/Confirmation');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Create Account</h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            name="userEmail"
            value={formData.userEmail}
            onChange={handleChange}
            placeholder="Email"
            required
            className="with-icon"
          />
          <FaEnvelope className="input-icon" />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="with-icon"
          />
          <FaLock className="input-icon" />
          
          {formData.password && (
            <>
              <div className={`password-strength ${passwordStrength}`}></div>
              <div className="password-feedback">
                {passwordStrength === 'weak' && 'Password is weak'}
                {passwordStrength === 'medium' && 'Password is medium strength'}
                {passwordStrength === 'strong' && 'Password is strong'}
              </div>
            </>
          )}
        </div>
        
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="with-icon"
          />
          <FaUser className="input-icon" />
        </div>
        
        <div className="form-group">
          <label className="birthday-label">Date of Birth</label>
          <div className="date-input-container">
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              required
              className="with-icon"
            />
            <FaBirthdayCake className="input-icon" />
          </div>
        </div>
        
        <button type="submit" className="register-button">
          Create Account
        </button>
        
        <div className="form-divider">or</div>
        
        <button 
          type="button" 
          className="sign-in-button" 
          onClick={() => navigate('/')}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

export default Registration;