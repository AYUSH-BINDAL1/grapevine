import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Registration() {
  const [formData, setFormData] = useState({
    userEmail: '',
    password: '',
    name: '',
    birthday: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Create Account</h2>
        <div className="form-group">
          <input
            type="email"
            name="userEmail"
            value={formData.userEmail}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="register-button">
          Register
        </button>
        <button type="button" className="sign-in-button" onClick={() => navigate('/')}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Registration;