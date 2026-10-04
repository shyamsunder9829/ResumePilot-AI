const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const PDFDocument = require("pdfkit");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  return JSON.parse(response.text);
}

async function generateResumePdf({ resume, selfDescription, jobTitle, candidateName }) {
  const resumePdfSchema = z.object({
    name: z.string(),
    contact: z.string(),
    summary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        role: z.string(),
        organization: z.string(),
        dates: z.string(),
        details: z.array(z.string()),
      }),
    ),
    education: z.array(
      z.object({
        qualification: z.string(),
        institution: z.string(),
        dates: z.string(),
        details: z.array(z.string()),
      }),
    ),
    projects: z.array(
      z.object({
        name: z.string(),
        details: z.array(z.string()),
      }),
    ),
  });

  let content;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rewrite the candidate's information as a concise, ATS-friendly resume tailored to the target role.
Use only facts present in the supplied resume and self-description. Do not invent contact details,
employers, dates, qualifications, skills, or achievements. Use empty strings and arrays for missing data.

Target role: ${jobTitle || "Not specified"}
Resume: ${resume || "(not provided)"}
Self-description: ${selfDescription || "(not provided)"}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
      },
    });

    content = resumePdfSchema.parse(JSON.parse(response.text));
  } catch (error) {
    console.warn("AI resume formatting failed; using saved resume details:", error.message);
    content = {
      name: "",
      contact: "",
      summary: selfDescription || "",
      skills: [],
      experience: [],
      education: [],
      projects: [],
      resume: resume || "",
      jobTitle,
      candidateName,
    };
  }

  return renderResumePdf({ ...content, jobTitle });
}

function renderResumePdf(resume) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 52, right: 52 },
      info: { Title: `${resume.name || "Candidate"} - Resume` },
    });
    const chunks = [];

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    const heading = (text) => {
      if (!text) return;
      document.moveDown(0.65);
      document.font("Helvetica-Bold").fontSize(11).fillColor("#c2185b").text(text.toUpperCase());
      document.moveDown(0.25);
      document.font("Helvetica").fontSize(9.5).fillColor("#252a34");
    };

    document.font("Helvetica-Bold").fontSize(22).fillColor("#172033")
      .text(resume.name || resume.candidateName || "RESUME", { align: "center" });
    if (resume.contact) {
      document.moveDown(0.2);
      document.font("Helvetica").fontSize(9).fillColor("#596273")
        .text(resume.contact, { align: "center" });
    }
    if (resume.jobTitle) {
      document.moveDown(0.25);
      document.font("Helvetica").fontSize(11).fillColor("#c2185b")
        .text(`Target role: ${resume.jobTitle}`, { align: "center" });
    }
    document.moveDown(0.4);

    if (resume.summary) {
      heading("Professional Summary");
      document.text(resume.summary, { lineGap: 3 });
    }

    if (resume.skills?.length) {
      heading("Skills");
      document.text(resume.skills.join("  •  "), { lineGap: 3 });
    }

    const writeEntries = (entries, titleFields) => {
      for (const item of entries) {
        document.font("Helvetica-Bold").fontSize(10).fillColor("#172033")
          .text(titleFields.map((field) => item[field]).filter(Boolean).join(" — "));
        if (item.dates) {
          document.font("Helvetica-Oblique").fontSize(8.5).fillColor("#596273")
            .text(item.dates);
        }
        for (const detail of item.details || []) {
          document.font("Helvetica").fontSize(9.5).fillColor("#252a34")
            .text(`•  ${detail}`, { indent: 10, hanging: 3, paragraphGap: 3, lineGap: 2 });
        }
        document.moveDown(0.35);
      }
    };

    if (resume.experience?.length) {
      heading("Experience");
      writeEntries(resume.experience, ["role", "organization"]);
    }

    if (resume.projects?.length) {
      heading("Projects");
      writeEntries(resume.projects, ["name"]);
    }

    if (resume.education?.length) {
      heading("Education");
      writeEntries(resume.education, ["qualification", "institution"]);
    }

    if (resume.resume) {
      heading("Experience, Education & Qualifications");
      document.font("Helvetica").fontSize(9.5).fillColor("#252a34")
        .text(resume.resume, { lineGap: 3, paragraphGap: 4 });
    }

    if (
      !resume.resume &&
      !resume.summary &&
      !resume.skills?.length &&
      !resume.experience?.length &&
      !resume.projects?.length &&
      !resume.education?.length
    ) {
      document.font("Helvetica").fontSize(10).fillColor("#596273")
        .text("No resume text or self-description was saved with this report.");
    }

    document.end();
  });
}

module.exports = { generateInterviewReport, generateResumePdf };
