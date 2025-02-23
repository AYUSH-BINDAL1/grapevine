import { useState } from 'react'
import tempProfile from './assets/temp-profile.webp'
import './App.css'

function handleClick() {
  alert('Button clicked!')
}



function App() {

  return (
    <>
      <div className='taskbar'>
        <nav className='taskbar-elem'>
          <h3 onClick={handleClick} className='elem'>Groups</h3>
          <h3 onClick={handleClick} className='elem'>Events</h3>
          <h3 onClick={handleClick} className='elem'>Forum</h3>
          <h3 onClick={handleClick} className='elem'>Messages</h3>
          <img onClick={handleClick} className='profile' src={tempProfile} alt="" />
        </nav>

        
      </div>
    </>
  )
}

export default App
