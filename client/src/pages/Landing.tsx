import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
    const { token } = useAuth();
    return (
        <div className="container py-5">
            <div className="text-center py-5">
                <h1 className="display-4 fw-bold">Plan group trips without the chaos.</h1>
                <p className="lead text-muted mt-3">
                    Propose destinations, vote with ranked choices, settle on dates, and let the
                    Wheel of Destiny break the ties. TripCrew solves group indecision.
                </p>
                <div className="mt-4 d-flex gap-3 justify-content-center">
                    {token ? (
                        <Link className="btn btn-primary btn-lg" to="/trips">
                            Go to my trips
                        </Link>
                    ) : (
                        <>
                            <Link className="btn btn-primary btn-lg" to="/register">
                                Get started
                            </Link>
                            <Link className="btn btn-outline-secondary btn-lg" to="/login">
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
