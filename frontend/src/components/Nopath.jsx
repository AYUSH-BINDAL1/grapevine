import { Link } from 'react-router-dom';
import './Nopath.css';

const Nopath = () => {
    return (
        <div className="nopath-container">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
            <Link to="/home" className="home-button">
                Return Home
            </Link>
        </div>
    );
};

export default Nopath;