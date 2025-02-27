import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './components/Registration';
import profileImage from './assets/temp-profile.webp';
import './App.css';

function Taskbar() {
  const handleClick = (e) => {
    console.log('Clicked:', e.target.textContent || 'profile');
  };

  return (
    <div className='taskbar'>
      <nav className='taskbar-elem'>
        <h3 onClick={handleClick} className='elem'>Groups</h3>
        <h3 onClick={handleClick} className='elem'>Events</h3>
        <h3 onClick={handleClick} className='elem'>Forum</h3>
        <h3 onClick={handleClick} className='elem'>Messages</h3>
        <img onClick={handleClick} className='profile' src={profileImage} alt="Profile" />
      </nav>
    </div>
  );
}

function Home() {
  return (
    <>
      <Taskbar />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;