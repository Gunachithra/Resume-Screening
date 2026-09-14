document.getElementById("aiAnalyzeBtn").addEventListener("click", async function () {

    const resume = document.getElementById("resumeText").value;
    const jobDescription = document.getElementById("jobDesc").value;

    if (!resume || !jobDescription) {
        alert("Please enter Resume Text and Job Description first.");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5050/ai-analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                resume: resume,
                jobDescription: jobDescription
            })
        });

        const data = await response.json();

        if (data.success) {

            // Remove old AI result if already present
            const oldResult = document.getElementById("aiResultBox");
            if (oldResult) {
                oldResult.remove();
            }

            // Create AI result box
            const resultBox = document.createElement("div");
            resultBox.id = "aiResultBox";

            resultBox.style.cssText = `
                margin: 25px auto;
                padding: 25px;
                max-width: 850px;
                background: #ffffff;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                border: 1px solid #ddd;
                font-family: Arial, sans-serif;
                line-height: 1.7;
            `;

            // Convert AI Markdown to simple HTML
            let formattedAnalysis = data.analysis
                .replace(/^##\s*/gm, "")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br>");

            resultBox.innerHTML = `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:15px;
                ">
                    <h2 style="margin:0;">🤖 AI Resume Analysis</h2>

                    <button id="closeAiResult" style="
                        border:none;
                        background:none;
                        font-size:22px;
                        cursor:pointer;
                    ">✕</button>
                </div>

                <hr>

                <div style="
                    margin-top:20px;
                    font-size:16px;
                ">
                    ${formattedAnalysis}
                </div>
            `;

            // Add result below AI button
            document.getElementById("aiAnalyzeBtn")
                .insertAdjacentElement("afterend", resultBox);

            // Close button
            document.getElementById("closeAiResult").addEventListener("click", function () {
                resultBox.remove();
            });

        } else {
            alert("AI analysis failed.");
        }

    } catch (error) {
        console.error("AI Error:", error);
        alert("Cannot connect to AI server.");
    }

});