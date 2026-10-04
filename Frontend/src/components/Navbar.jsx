import { useContext, useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { AuthContext } from "../features/auth/auth.context"
import { logout } from "../features/auth/services/auth.api"
import "./navbar.scss"

const Navbar = () => {
    const [ loggingOut, setLoggingOut ] = useState(false)
    const [ error, setError ] = useState("")
    const { setUser } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = async () => {
        setLoggingOut(true)
        setError("")
        try {
            await logout()
            setUser(null)
            navigate("/login", { replace: true })
        } catch {
            setError("Could not log out. Please try again.")
        } finally {
            setLoggingOut(false)
        }
    }

    return (
        <header className="app-navbar">
            <NavLink className="app-navbar__brand" to="/" aria-label="ResumePilot home">
                <span className="app-navbar__logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                        <path d="M14 3.75v4h4M8.5 12h7M8.5 15.5h7" />
                        <path d="m3.5 9 .9.9 1.7-1.8" />
                    </svg>
                </span>
                <span>Resume<span className="app-navbar__brand-accent">Pilot</span></span>
            </NavLink>

            <nav className="app-navbar__actions" aria-label="Main navigation">
                <NavLink
                    className={({ isActive }) => `app-navbar__link${isActive ? " app-navbar__link--active" : ""}`}
                    to="/dashboard"
                >
                    Dashboard
                </NavLink>
                <button
                    className="app-navbar__logout"
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                >
                    {loggingOut ? "Logging out..." : "Logout"}
                </button>
            </nav>
            {error && <p className="app-navbar__error" role="alert">{error}</p>}
        </header>
    )
}

export default Navbar
