require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
    res.send("AI Resume Server is running!");
});

app.post("/ai-analyze", async (req, res) => {
    try {
        const { resume, jobDescription } = req.body;

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            input: `Analyze this resume for the given job description.

Job Description:
${jobDescription}

Resume:
${resume}

Give:
1. AI Match Score
2. Strengths
3. Missing Skills
4. Short Candidate Summary`
        });

        res.json({
            success: true,
            analysis: response.output_text
        });

    } catch (error) {
        console.error("AI Error:", error);

        res.status(500).json({
            success: false,
            error: "AI analysis failed"
        });
    }
});

app.listen(5050, () => {
    console.log("AI Server running on port 5050");
});