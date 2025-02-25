import { useState } from 'react';
import tempProfile from './assets/temp-profile.webp';
import './App.css';

function App() {
  return (
    <>
      <Register />
    </>
  );
}

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const user = {
      userEmail: email,
      password: password,
      name: `${firstName} ${lastName}`,
      birthday: '2000-01-01', // You can replace this with a dynamic value if needed
      role: 'STUDENT'
    };

    try {
      const response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        alert('User registered successfully');
      } else {
        alert('Failed to register user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <>
      <div className='main-container2'>
        <h3>Register an Account</h3>
        <div className='add-panel2'>
          <div className='addpaneldiv2'>
            <label htmlFor="firstName">First Name</label><br />
            <input
              className="addpanelinput2"
              type="text"
              name="firstName"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className='addpaneldiv2'>
            <label htmlFor="lastName">Last Name</label><br />
            <input
              className="addpanelinput2"
              type="text"
              name="lastName"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className='addpaneldiv2'>
            <label htmlFor="email">Purdue Email</label><br />
            <input
              className="addpanelinput2"
              type="text"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='addpaneldiv2'>
            <label htmlFor="password">Password</label><br />
            <input
              className="addpanelinput2"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='addpaneldiv2'>
            <label htmlFor="confirmPassword">Confirm Password</label><br />
            <input
              className="addpanelinput2"
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className='addBtn2' onClick={handleRegister}>Register</button>
          <button className='addBtn2'>Sign in</button>
        </div>
      </div>
    </>
  );
}

export default App;
