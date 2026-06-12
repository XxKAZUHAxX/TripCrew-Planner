import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMyTrips, createTrip } from "../api/trips.api.js";

export default function TripsList() {
    const [trips, setTrips] = useState([]);
    const [title, setTitle] = useState("");
    const [votingDeadline, setVotingDeadline] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    async function load() {
        try {
            setTrips(await listMyTrips());
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load trips");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate(e) {
        e.preventDefault();
        setError(null);
        try {
            const trip = await createTrip({
                title,
                votingDeadline: votingDeadline || undefined,
            });
            navigate(`/trips/${trip._id}`);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create trip");
        }
    }

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-md-7">
                    <h1 className="h3 mb-3">My Trips</h1>
                    {loading && <p>Loading…</p>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    {!loading && trips.length === 0 && (
                        <p className="text-muted">No trips yet.</p>
                    )}
                    <div className="list-group">
                        {trips.map((t) => (
                            <Link
                                key={t._id}
                                to={`/trips/${t._id}`}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            >
                                <span>{t.title}</span>
                                <span className="badge bg-secondary text-uppercase">
                                    {t.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="card p-3 shadow-sm">
                        <h2 className="h5">Create a trip</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-2">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-control"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">
                                    Voting deadline (optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={votingDeadline}
                                    onChange={(e) =>
                                        setVotingDeadline(e.target.value)
                                    }
                                />
                            </div>
                            <button className="btn btn-primary w-100">
                                Create
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
