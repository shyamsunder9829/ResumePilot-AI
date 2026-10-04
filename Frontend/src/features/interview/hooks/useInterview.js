import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

const getErrorMessage = (requestError, fallback) =>
    requestError.response?.data?.message || requestError.message || fallback

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            const generatedReport = response.interviewReport
            setReport(generatedReport)
            setReports(currentReports => [
                generatedReport,
                ...currentReports.filter(item => item._id !== generatedReport._id)
            ])
            return generatedReport
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not generate the interview report."))
            throw requestError
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport, setReports])

    const getReportById = useCallback(async (reportId) => {
        setLoading(true)
        setReport(null)
        setError("")
        try {
            const response = await getInterviewReportById(reportId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not load this interview report."))
            throw requestError
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await getAllInterviewReports()
            const interviewReports = response.interviewReports
            setReports(interviewReports)
            return interviewReports
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not load your interview reports."))
            throw requestError
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReports])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(response)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        }
        catch (requestError) {
            let message = getErrorMessage(requestError, "Could not download the resume.")
            if (requestError.response?.data instanceof Blob) {
                try {
                    const body = JSON.parse(await requestError.response.data.text())
                    message = body.message || message
                } catch {
                    message = "The server could not generate the resume PDF. Please try again."
                }
            }
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading])

    useEffect(() => {
        const loadReports = async () => {
            try {
                if (interviewId) {
                    await getReportById(interviewId)
                } else {
                    await getReports()
                }
            } catch (requestError) {
                setError(getErrorMessage(requestError, "Could not load your interview reports."))
            }
        }

        loadReports()
    }, [ interviewId, getReportById, getReports, setError ])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf }

}