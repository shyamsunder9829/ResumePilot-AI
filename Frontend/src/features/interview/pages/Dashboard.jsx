import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { getAllInterviewReports } from "../services/interview.api"
import LoadingScreen from "../../../components/LoadingScreen"
import "./../style/dashboard.scss"

const Dashboard = () => {
    const [ reports, setReports ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState("")
    const [ sessionExpired, setSessionExpired ] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        let isMounted = true

        const loadReports = async () => {
            try {
                const response = await getAllInterviewReports()
                if (isMounted) setReports(response.interviewReports)
            } catch (requestError) {
                if (isMounted) {
                    const message = requestError.response?.status === 401
                        ? "Your session has expired. Log in again to view your reports."
                        : requestError.response?.data?.message || "We couldn't load your report history. Please try again."
                    setError(message)
                    setSessionExpired(requestError.response?.status === 401)
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadReports()
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <main className="dashboard-page">
            <section className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
                    <h1>Your <span>Dashboard</span></h1>
                    <p className="dashboard-header__description">
                        Pick up where you left off and revisit your personalized interview plans.
                    </p>
                </div>
                <Link className="dashboard-create" to="/">Create a new report</Link>
            </section>

            <section className="dashboard-history" aria-labelledby="history-heading">
                <div className="dashboard-history__heading">
                    <div>
                        <h2 id="history-heading">Report history</h2>
                        <p>All your generated interview strategies in one place.</p>
                    </div>
                    {!loading && !error && (
                        <span className="dashboard-history__count">
                            {reports.length} {reports.length === 1 ? "report" : "reports"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <LoadingScreen compact message="Loading your reports..." />
                ) : error ? (
                    <div className="dashboard-state dashboard-state--error" role="alert">
                        <p>{error}</p>
                        {sessionExpired && <Link className="dashboard-create" to="/login">Log in</Link>}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="dashboard-empty">
                        <span className="dashboard-empty__icon" aria-hidden="true">✦</span>
                        <h3>No reports yet</h3>
                        <p>Generate your first interview strategy to see it saved here.</p>
                        <Link className="dashboard-create" to="/">Create your first report</Link>
                    </div>
                ) : (
                    <ul className="dashboard-reports">
                        {reports.map((report) => (
                            <li key={report._id}>
                                <button
                                    className="dashboard-report"
                                    type="button"
                                    onClick={() => navigate(`/interview/${report._id}`)}
                                >
                                    <span className="dashboard-report__icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                                            <path d="M14 3.75v4h4M8.5 12h7M8.5 15.5h7" />
                                        </svg>
                                    </span>
                                    <span className="dashboard-report__details">
                                        <strong>{report.title || "Untitled position"}</strong>
                                        <span>Generated {new Date(report.createdAt).toLocaleDateString()}</span>
                                    </span>
                                    <span className="dashboard-report__score">
                                        <strong>{Number.isFinite(report.matchScore) ? `${report.matchScore}%` : "—"}</strong>
                                        <span>Match score</span>
                                    </span>
                                    <span className="dashboard-report__arrow" aria-hidden="true">→</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}

export default Dashboard
