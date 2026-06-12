import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function NavBar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          TripCrew
        </Link>
        <div className="ms-auto d-flex align-items-center gap-3">
          {token ? (
            <>
              <Link className="nav-link text-light" to="/trips">
                My Trips
              </Link>
              <span className="text-light small">{user?.name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link text-light" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
