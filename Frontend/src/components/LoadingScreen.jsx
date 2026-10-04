import "./loading-screen.scss"

const LoadingScreen = ({ message = "Loading...", compact = false }) => (
    <main className={`loading-screen${compact ? " loading-screen--compact" : ""}`} role="status" aria-live="polite">
        <span className="loading-screen__spinner" aria-hidden="true" />
        <p>{message}</p>
    </main>
)

export default LoadingScreen
