const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/resumeDB")
.then(() => {
    console.log("MongoDB Connected Successfully");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err);
});
// Schema
const ResumeSchema = new mongoose.Schema({
    candidateName: String,
    matchedSkills: [String],
    missingSkills: [String],
    percentage: Number,
    status: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Model
const Resume = mongoose.model("Resume", ResumeSchema);

// Save API
app.post("/save", async (req, res) => {
console.log("SAVE API HIT");
console.log(req.body);
    try {
      // CHECK DUPLICATE CANDIDATE
const existingCandidate = await Resume.findOne({
    candidateName: req.body.candidateName
});

if (existingCandidate) {
    return res.status(409).json({
        message: "Candidate already exists"
    });
}

        const newResume = new Resume({
            candidateName: req.body.candidateName,
            matchedSkills: req.body.matchedSkills,
            missingSkills: req.body.missingSkills,
            percentage: req.body.percentage,
            status: req.body.status
        });

        await newResume.save();

        res.status(200).json({
            success: true,
            message: "Resume data stored successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

// Get All Records API
app.get("/resumes", async (req, res) => {

    try {

        const data = await Resume.find();

        res.status(200).json(data);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});
// DELETE CANDIDATE
app.delete("/resumes/:id", async (req, res) => {
    try {
        await Resume.findByIdAndDelete(req.params.id);

        res.json({
            message: "Candidate deleted successfully"
        });

    } catch (error) {
        console.error("Delete Error:", error);

        res.status(500).json({
            message: "Failed to delete candidate"
        });
    }
});

// Server Start
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});