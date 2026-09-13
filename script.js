// PDF text extraction
function extractTextFromPDF(file, callback){
    const reader = new FileReader();

    reader.onload = function(){
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedarray).promise.then(pdf => {

            let text = "";
            let count = 0;

            for(let i = 1; i <= pdf.numPages; i++){

                pdf.getPage(i).then(page => {

                    page.getTextContent().then(content => {

                        content.items.forEach(item => {
                            text += item.str + " ";
                        });

                        count++;

                        if(count === pdf.numPages){
                            callback(text);
                        }

                    });

                });

            }

        });
    };

    reader.readAsArrayBuffer(file);
}


// ===============================
// MAIN FUNCTION - CHECK MATCH
// ===============================

function checkMatch(resumeContent, candidateName = "Candidate"){

    const jobDesc =
        document.getElementById("jobDesc").value
        .toLowerCase()
        .trim();

    if(jobDesc === "" || resumeContent.trim() === ""){

        alert("Please fill Job Skills and Resume text / upload PDF!");

        return;
    }


    // Required skills
    const jobWords = [...new Set(jobDesc.split(","))];

    let matched = 0;

    let matchedWords = [];

    let missingWords = [];


    // Check matched skills
    for(let i = 0; i < jobWords.length; i++){

        const skill = jobWords[i].trim();

        if(
            skill !== "" &&
            resumeContent.toLowerCase().includes(skill)
        ){

            matched++;

            matchedWords.push(skill);
        }
    }


    // Check missing skills
    for(let i = 0; i < jobWords.length; i++){

        const skill = jobWords[i].trim();

        if(
            skill !== "" &&
            !resumeContent.toLowerCase().includes(skill)
        ){

            missingWords.push(skill);
        }
    }


    // Calculate percentage
    let percentage =
        jobWords.length > 0
        ? (matched / jobWords.length) * 100
        : 0;

    percentage = parseFloat(percentage.toFixed(2));


    // Candidate status
    let status = "";

    let progressColor = "";

    let bgColor = "";


    if(percentage < 40){

        status = "Low Match & Candidate not suitable";

        progressColor = "red";

        bgColor = "#ffcccc";

    }
    else if(percentage >= 40 && percentage < 60){

        status = "Moderate Match & Candidate partially suitable";

        progressColor = "orange";

        bgColor = "#ffe6cc";

    }
    else{

        status = "Excellent Match  &  Candidate highly suitable";

        progressColor = "green";

        bgColor = "#ccffcc";
    }


    // Display result
    document.getElementById("result").innerHTML =

        `Total Required Skills: ${jobWords.length}<br>
         Matched Skills: ${
            matchedWords.length > 0
            ? matchedWords.join(", ")
            : "None"
         }<br>
         Match Percentage: ${percentage.toFixed(2)}%<br>
         Status: ${status}`;


    // Missing skills
    document.getElementById("result").innerHTML +=

        `<br>Missing Skills: ${
            missingWords.length > 0
            ? missingWords.join(", ")
            : "None"
        }`;


    // Progress bar
    const progressBar =
        document.getElementById("progressBar");

    progressBar.style.width = percentage + "%";

    progressBar.innerHTML =
        percentage.toFixed(0) + "%";

    progressBar.style.backgroundColor =
        progressColor;


    document.body.style.backgroundColor =
        bgColor;


    // ===============================
    // SAVE TO MONGODB
    // ===============================

    fetch("http://localhost:5000/save", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            candidateName:
                candidateName || "Candidate",

            matchedSkills:
                matchedWords,
            missingSkills: missingWords,

            percentage:
                percentage,

            status:
                status
        })

    })

    .then(async response => {

    const data = await response.json();

    if (response.status === 409) {
        alert(" Candidate already exists!");
        return;
    }

    if (!response.ok) {
        throw new Error(data.message || "Save failed");
    }

    console.log("Saved Successfully");

})

    .catch(error => {

        console.error("Save Error:", error);

    });


    // ===============================
    // ADD CANDIDATE TO DASHBOARD
    // ===============================

    const tbody =
        document.querySelector("#dashboard tbody");

    const tr =
        document.createElement("tr");

    tr.dataset.percentage =
        percentage;

    tr.innerHTML =

        `<td>${candidateName}</td>
         <td>${matchedWords.join(", ") || "None"}</td>
         <td>${percentage.toFixed(2)}%</td>
         <td>${status}</td>`;

    tbody.appendChild(tr);


    // Sort by percentage
    const rows =
        Array.from(
            tbody.querySelectorAll("tr")
        );

    rows.sort(
        (a, b) =>
            parseFloat(b.dataset.percentage) -
            parseFloat(a.dataset.percentage)
    );

    tbody.innerHTML = "";

    rows.forEach(r =>
        tbody.appendChild(r)
    );


    // Highlight highest and lowest
    rows.forEach((r, i) => {

        r.style.backgroundColor = "";

        if(i === 0){

            r.style.backgroundColor =
                "#ccffcc";
        }

        if(i === rows.length - 1){

            r.style.backgroundColor =
                "#ffcccc";
        }

    });

}


// ===============================
// DOM CONTENT LOADED
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function(){
// ===============================
// JOB ROLE PRESETS
// ===============================

const jobRole = document.getElementById("jobRole");
const jobDesc = document.getElementById("jobDesc");

if (jobRole && jobDesc) {

    jobRole.addEventListener("change", function () {

        if (jobRole.value === "java") {

            jobDesc.value =
                "java, spring boot, sql, html, css, javascript";

        }

        else if (jobRole.value === "web") {

            jobDesc.value =
                "html, css, javascript, bootstrap, react, node.js";

        }

        else if (jobRole.value === "data") {

            jobDesc.value =
                "python, sql, excel, powerbi, tableau";

        }

        else if (jobRole.value === "software") {

            jobDesc.value =
                "java, python, sql, git, html, css";

        }

        else {

            jobDesc.value = "";

        }

    });

}

        // ===============================
        // CHECK MATCH BUTTON
        // ===============================

        const checkBtn =
            document.getElementById("checkBtn");


        if(checkBtn){

            checkBtn.addEventListener(
                "click",
                function(){

                    const fileInput =
                        document.getElementById(
                            "resumeFile"
                        );

                    const textarea =
                        document.getElementById(
                            "resumeText"
                        );


                    // PDF
                    if(fileInput.files.length > 0){

                        const file =
                            fileInput.files[0];


                        if(file.type === "application/pdf"){

                            const candidateInput =
                                document
                                .getElementById(
                                    "candidateName"
                                )
                                .value
                                .trim();


                            const nameToUse =
                                candidateInput !== ""
                                ? candidateInput
                                : file.name;


                            extractTextFromPDF(
                                file,
                                text =>
                                    checkMatch(
                                        text,
                                        nameToUse
                                    )
                            );

                        }
                        else{

                            alert(
                                "Only PDF supported in this demo."
                            );
                        }

                    }

                    // Textarea
                    else if(
                        textarea.value.trim() !== ""
                    ){

                        const candidateInput =
                            document
                            .getElementById(
                                "candidateName"
                            )
                            .value
                            .trim();


                        const nameToUse =
                            candidateInput !== ""
                            ? candidateInput
                            : "Candidate";


                        checkMatch(
                            textarea.value.trim(),
                            nameToUse
                        );

                    }

                    else{

                        alert(
                            "Please provide resume text or upload PDF!"
                        );
                    }

                }
            );

        }


        // ===============================
        // CANDIDATE SEARCH
        // ===============================

        const searchBtn =
            document.getElementById(
                "searchBtn"
            );

        const showAllBtn =
            document.getElementById(
                "showAllBtn"
            );


        if(searchBtn){

            searchBtn.addEventListener(
                "click",
                function(){

                    const searchText =
                        document
                        .getElementById(
                            "searchCandidate"
                        )
                        .value
                        .trim()
                        .toLowerCase();


                    if(searchText === ""){

                        alert(
                            "Please enter candidate name!"
                        );

                        return;
                    }


                    fetch(
                        "http://localhost:5000/resumes"
                    )

                    .then(response =>
                        response.json()
                    )

                    .then(data => {

                        const tbody =
                            document.querySelector(
                                "#dashboard tbody"
                            );


                        tbody.innerHTML = "";


                        const results =
                            data.filter(candidate =>

                                (candidate.candidateName || "")
                                .toLowerCase()
                                .includes(searchText)

                            );


                        if(results.length === 0){

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML =

                                `<td colspan="5">
                                    No candidate found
                                </td>`;


                            tbody.appendChild(row);

                            return;
                        }


                        results.forEach(candidate => {

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML =

                                `<td>
                                    ${candidate.candidateName || "Unknown"}
                                </td>

                                <td>
                                    ${
                                        Array.isArray(
                                            candidate.matchedSkills
                                        )
                                        ? candidate.matchedSkills.join(", ")
                                        : "None"
                                    }
                                </td>

                                <td>
                                    ${Number(
                                        candidate.percentage || 0
                                    ).toFixed(2)}%
                                </td>

                                <td>
                                    ${candidate.status || "N/A"}
                                </td>

                                <td>
                                    <button onclick='viewCandidate(${JSON.stringify(candidate)})'>
                                        View
                                    </button>
                                     <button onclick='downloadReport(${JSON.stringify(candidate)})'>
                                       Download Report
                                     </button>
                                     <button onclick="deleteCandidate('${candidate._id}')">
                                            Delete
                                        </button>

                                </td>`;


                            tbody.appendChild(row);

                        });

                    })

                    .catch(error => {

                        console.error(
                            "Search Error:",
                            error
                        );


                        alert(
                            "Unable to search candidates. Make sure server.js is running."
                        );

                    });

                }
            );

        }


        // ===============================
        // SHOW ALL CANDIDATES
        // ===============================

        if(showAllBtn){

            showAllBtn.addEventListener(
                "click",
                function(){

                    const searchInput =
                        document.getElementById(
                            "searchCandidate"
                        );


                    if(searchInput){

                        searchInput.value = "";

                    }


                    fetch(
                        "http://localhost:5000/resumes"
                    )

                    .then(response =>
                        response.json()
                    )

                    .then(data => {

                        const tbody =
                            document.querySelector(
                                "#dashboard tbody"
                            );


                        tbody.innerHTML = "";


                        if(data.length === 0){

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML =

                                `<td colspan="5">
                                    No candidates available
                                </td>`;


                            tbody.appendChild(row);

                            return;
                        }


                        data.forEach(candidate => {

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML =

                                `<td>
                                    ${candidate.candidateName || "Unknown"}
                                </td>

                                <td>
                                    ${
                                        Array.isArray(
                                            candidate.matchedSkills
                                        )
                                        ? candidate.matchedSkills.join(", ")
                                        : "None"
                                    }
                                </td>

                                <td>
                                    ${Number(
                                        candidate.percentage || 0
                                    ).toFixed(2)}%
                                </td>

                                <td>
                                    ${candidate.status || "N/A"}
                                </td>

                                <td>
                                    <button onclick='viewCandidate(${JSON.stringify(candidate)})'>
                                        View
                                    </button>
                                    <button onclick='downloadReport(${JSON.stringify(candidate)})'>
                                        Download Report
                                    </button>
                                     <button onclick="deleteCandidate('${candidate._id}')">
                                            Delete
                                        </button>
                                </td>`;


                            tbody.appendChild(row);

                        });

                    })

                    .catch(error => {

                        console.error(
                            "Show All Error:",
                            error
                        );


                        alert(
                            "Unable to load candidates. Make sure server.js is running."
                        );

                    });

                }
            );

        }

// ===============================
// SKILL SEARCH
// ===============================

    const searchSkill = document.getElementById("searchSkill");
    const searchSkillBtn = document.getElementById("searchSkillBtn");

    if (!searchSkillBtn || !searchSkill) {
        console.log("Skill Search elements not found");
        return;
    }

    searchSkillBtn.addEventListener("click", function () {

        const skillText = searchSkill.value.trim().toLowerCase();

        if (skillText === "") {
            alert("Please enter a skill!");
            return;
        }

        fetch("http://localhost:5000/resumes")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Server error");
                }
                return response.json();
            })
            .then(data => {

                const tbody = document.querySelector("#dashboard tbody");

                tbody.innerHTML = "";

                const results = data.filter(candidate => {

                    const skills = Array.isArray(candidate.matchedSkills)
                        ? candidate.matchedSkills
                        : [];

                    return skills.some(skill =>
                        String(skill).toLowerCase().includes(skillText)
                    );
                });

                if (results.length === 0) {

                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td colspan="5">
                            No candidate found for this skill
                        </td>
                    `;

                    tbody.appendChild(row);
                    return;
                }

                results.forEach(candidate => {

                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${candidate.candidateName || "Unknown"}</td>

                        <td>
                            ${Array.isArray(candidate.matchedSkills)
                                ? candidate.matchedSkills.join(", ")
                                : "None"}
                        </td>

                        <td>
                            ${Number(candidate.percentage || 0).toFixed(2)}%
                        </td>

                        <td>
                            ${candidate.status || "N/A"}
                        </td>

                        <td>
                            <button onclick='viewCandidate(${JSON.stringify(candidate)})'>
                                View
                            </button>
                        </td>
                    `;

                    tbody.appendChild(row);
                });

            })
            .catch(error => {

                console.error("Skill Search Error:", error);

                alert("Unable to search candidates. Make sure server.js is running.");

            });

    });

        // ===============================
        // CANDIDATE RANKING
        // ===============================

        const rankBtn =
            document.getElementById(
                "rankBtn"
            );


        if(rankBtn){

            rankBtn.addEventListener(
                "click",
                function(){

                    fetch(
                        "http://localhost:5000/resumes"
                    )

                    .then(response =>
                        response.json()
                    )

                    .then(data => {

                        const tbody =
                            document.querySelector(
                                "#dashboard tbody"
                            );


                        tbody.innerHTML = "";


                        if(data.length === 0){

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML =

                                `<td colspan="5">
                                    No candidates available
                                </td>`;


                            tbody.appendChild(row);

                            return;
                        }


                        // Highest → Lowest
                        data.sort(
                            (a, b) =>
                                Number(
                                    b.percentage || 0
                                ) -
                                Number(
                                    a.percentage || 0
                                )
                        );


                        data.forEach(
                            (candidate, index) => {

                                const row =
                                    document.createElement(
                                        "tr"
                                    );


                                row.innerHTML =

                                    `<td>
                                        ${index + 1}. ${
                                            candidate.candidateName || "Unknown"
                                        }
                                    </td>

                                    <td>
                                        ${
                                            Array.isArray(
                                                candidate.matchedSkills
                                            )
                                            ? candidate.matchedSkills.join(", ")
                                            : "None"
                                        }
                                    </td>

                                    <td>
                                        ${Number(
                                            candidate.percentage || 0
                                        ).toFixed(2)}%
                                    </td>

                                    <td>
                                        ${candidate.status || "N/A"}
                                    </td>

                                    <td>
                                        <button onclick='viewCandidate(${JSON.stringify(candidate)})'>
                                            View
                                        </button>
                                        <button onclick='downloadReport(${JSON.stringify(candidate)})'>
                                            Download Report
                                        </button>
                                        <button onclick="deleteCandidate('${candidate._id}')">
                                            Delete
                                        </button>
                                    </td>`;


                                tbody.appendChild(row);

                            }
                        );

                    })

                    .catch(error => {

                        console.error(
                            "Ranking error:",
                            error
                        );


                        alert(
                            "Unable to load ranking. Make sure server.js is running."
                        );

                    });

                }
            );

        }

    }
);


// ===============================
// VIEW CANDIDATE
// ===============================

function viewCandidate(candidate){

    const matchedSkills =
        Array.isArray(candidate.matchedSkills)
        ? candidate.matchedSkills.join(", ")
        : "None";

    const missingSkills =
        Array.isArray(candidate.missingSkills)
        ? candidate.missingSkills.join(", ")
        : "None";

    alert(

        "Candidate: " +
        (candidate.candidateName || "Unknown") +

        "\n\nMatched Skills: " +
        matchedSkills +

        "\n\nMissing Skills: " +
        missingSkills +

        "\n\nMatch Percentage: " +
        Number(candidate.percentage || 0).toFixed(2) +

        "%" +

        "\n\nStatus: " +
        (candidate.status || "N/A")

    );

}
// ===============================
// DOWNLOAD SCREENING REPORT
// ===============================

function downloadReport(candidate) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("AI Resume Screening Report", 20, 25);

    doc.setFontSize(13);

    doc.text(
        "Candidate Name: " + (candidate.candidateName || "Unknown"),
        20,
        45
    );

    doc.text(
        "Match Percentage: " +
        Number(candidate.percentage || 0).toFixed(2) + "%",
        20,
        60
    );

    doc.text(
        "Status: " + (candidate.status || "N/A"),
        20,
        75
    );

    doc.text(
        "Matched Skills:",
        20,
        95
    );

    const matchedSkills =
        Array.isArray(candidate.matchedSkills)
        ? candidate.matchedSkills.join(", ")
        : "None";

    doc.text(
        matchedSkills,
        20,
        110,
        { maxWidth: 170 }
    );
  const missingSkills =
    Array.isArray(candidate.missingSkills)
    ? candidate.missingSkills.join(", ")
    : "None";

doc.text(
    "Missing Skills:",
    20,
    125
);

doc.text(
    missingSkills,
    20,
    140,
    { maxWidth: 170 }
);

let generatedY = 155;

if (missingSkills.length > 60) {
    generatedY = 170;
}

doc.text(
    "Generated by AI Resume Screening System",
    20,
    generatedY
);



    doc.save(
        (candidate.candidateName || "Candidate") +
        "_Screening_Report.pdf"
    );
}

// ===============================
// DELETE CANDIDATE
// ===============================

function deleteCandidate(candidateId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this candidate?"
    );

    if (!confirmDelete) {
        return;
    }

    fetch(`http://localhost:5000/resumes/${candidateId}`, {
        method: "DELETE"
    })

    .then(response => {

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        return response.json();
    })

    .then(data => {

        alert("Candidate deleted successfully!");

        // Refresh dashboard
        document.getElementById("showAllBtn").click();

    })

    .catch(error => {

        console.error("Delete Error:", error);

        alert(
            "Unable to delete candidate. Make sure server.js is running."
        );

    });
}

// ================= ADVANCED FILTER & SORT =================

document.addEventListener("DOMContentLoaded", () => {

    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const matchFilter = document.getElementById("matchFilter");
    const statusFilter = document.getElementById("statusFilter");
    const sortFilter = document.getElementById("sortFilter");

    applyFilterBtn.addEventListener("click", async () => {

        try {
            const response = await fetch("http://localhost:5000/resumes");
            let candidates = await response.json();

            // Match % Filter
            const minMatch = Number(matchFilter.value);

            candidates = candidates.filter(candidate =>
                candidate.percentage >= minMatch
            );

            // Status Filter
            const selectedStatus = statusFilter.value;

            if (selectedStatus !== "All") {
                candidates = candidates.filter(candidate =>
                    candidate.status === selectedStatus
                );
            }

            // Sorting
            const sortValue = sortFilter.value;

            if (sortValue === "high") {
                candidates.sort((a, b) => b.percentage - a.percentage);
            }

            if (sortValue === "low") {
                candidates.sort((a, b) => a.percentage - b.percentage);
            }

            if (sortValue === "newest") {
                candidates.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
            }

            if (sortValue === "oldest") {
                candidates.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
            }

            // Display filtered candidates
            const dashboard = document.getElementById("dashboard");

            dashboard.innerHTML = `
                <tr>
                    <th>Name / File</th>
                    <th>Matched Skills</th>
                    <th>Match %</th>
                    <th>Status</th>
                </tr>
            `;

            if (candidates.length === 0) {
                dashboard.innerHTML += `
                    <tr>
                        <td colspan="4">No candidates found</td>
                    </tr>
                `;
                return;
            }

            candidates.forEach(candidate => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${candidate.candidateName}</td>
                    <td>${candidate.matchedSkills.join(", ")}</td>
                    <td>${candidate.percentage}%</td>
                    <td>${candidate.status}</td>
                `;

                dashboard.appendChild(row);
            });

        } catch (error) {
            console.error("Filter Error:", error);
            alert("Unable to load candidates. Make sure server is running.");
        }

    });

});