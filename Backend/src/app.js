const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()
const configuredFrontendOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)

function isAllowedFrontendOrigin(origin) {
    if (!origin || origin === "http://localhost:5173") {
        return true
    }

    if (configuredFrontendOrigins.includes(origin)) {
        return true
    }

    return configuredFrontendOrigins.some((configuredOrigin) => {
        let configuredUrl
        let requestUrl

        try {
            configuredUrl = new URL(configuredOrigin)
            requestUrl = new URL(origin)
        } catch {
            return false
        }

        if (
            configuredUrl.protocol !== "https:" ||
            !configuredUrl.hostname.endsWith(".netlify.app") ||
            requestUrl.protocol !== "https:"
        ) {
            return false
        }

        const siteHostname = configuredUrl.hostname.includes("--")
            ? configuredUrl.hostname.slice(configuredUrl.hostname.indexOf("--") + 2)
            : configuredUrl.hostname
        const escapedHostname = siteHostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        return new RegExp(`^[a-z0-9-]+--${escapedHostname}$`, "i").test(requestUrl.hostname)
    })
}

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        callback(null, isAllowedFrontendOrigin(origin) ? origin : false)
    },
    credentials: true
}))

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app