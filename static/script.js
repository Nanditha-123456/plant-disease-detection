const pages = [
    "home",
    "dashboard",
    "scanner",
    "model",
    "history",
    "about"
];


function showPage(pageName, clickedButton = null) {

    pages.forEach(page => {

        const element = document.getElementById(page);

        if (element) {
            element.classList.remove("active-page");
        }

    });


    const selectedPage = document.getElementById(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }


    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");
    });


    if (clickedButton) {
        clickedButton.classList.add("active");
    } else {

        document.querySelectorAll(".nav-item").forEach(button => {

            if (button.getAttribute("onclick")?.includes(pageName)) {
                button.classList.add("active");
            }

        });

    }


    const titles = {
        home: "Plant Disease Detection",
        dashboard: "Dashboard",
        scanner: "AI Plant Scanner",
        model: "AI Model",
        history: "Prediction History",
        about: "About PlantAI"
    };

    document.getElementById("pageTitle").innerText =
        titles[pageName] || "Plant Disease Detection";


    if (pageName === "history") {
        loadHistory();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showPageByName(pageName) {
    showPage(pageName);
}


/* IMAGE UPLOAD */

const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const previewBox = document.getElementById("previewBox");
const previewImage = document.getElementById("previewImage");
const analyzeBtn = document.getElementById("analyzeBtn");


imageInput.addEventListener("change", function () {

    if (this.files && this.files[0]) {
        showPreview(this.files[0]);
    }

});


uploadArea.addEventListener("click", function (event) {

    if (
        event.target.tagName !== "BUTTON" &&
        !event.target.closest("button")
    ) {
        imageInput.click();
    }

});


uploadArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    uploadArea.classList.add("dragover");

});


uploadArea.addEventListener("dragleave", function () {

    uploadArea.classList.remove("dragover");

});


uploadArea.addEventListener("drop", function (event) {

    event.preventDefault();

    uploadArea.classList.remove("dragover");

    const files = event.dataTransfer.files;

    if (files.length > 0) {

        imageInput.files = files;

        showPreview(files[0]);

    }

});


function showPreview(file) {

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {

        previewImage.src = event.target.result;

        uploadArea.classList.add("hidden");
        previewBox.classList.remove("hidden");

    };

    reader.readAsDataURL(file);
}


function chooseAnother() {

    imageInput.value = "";

    previewBox.classList.add("hidden");
    uploadArea.classList.remove("hidden");

    document.getElementById("resultContent").classList.add("hidden");

}


/* ANALYZE */

analyzeBtn.addEventListener("click", async function () {

    if (!imageInput.files || imageInput.files.length === 0) {

        alert("Please select an image first.");

        return;
    }


    const formData = new FormData();

    formData.append("image", imageInput.files[0]);


    analyzeBtn.disabled = true;

    analyzeBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';


    try {

        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });


        const data = await response.json();


        if (!data.success) {

            alert(data.message || "Prediction failed.");

            return;
        }


        displayResult(data);

    } catch (error) {

        console.error(error);

        alert("Something went wrong while analyzing the image.");

    } finally {

        analyzeBtn.disabled = false;

        analyzeBtn.innerHTML =
            '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Plant';

    }

});


/* DISPLAY RESULT */

function displayResult(data) {

    const resultCard = document.getElementById("resultCard");
    const resultContent = document.getElementById("resultContent");
    const resultEmpty = resultCard.querySelector(".result-empty");


    resultEmpty.classList.add("hidden");

    resultContent.classList.remove("hidden");


    document.getElementById("diseaseName").innerText =
        data.disease;


    document.getElementById("confidenceText").innerText =
        data.confidence + "%";


    document.getElementById("confidenceBar").style.width =
        data.confidence + "%";


    const statusBadge = document.getElementById("statusBadge");

    statusBadge.innerText = data.status;


    if (data.status === "Healthy") {

        statusBadge.style.color = "#37d67a";
        statusBadge.style.background = "rgba(55,214,122,0.1)";

    } else {

        statusBadge.style.color = "#ffae5c";
        statusBadge.style.background = "rgba(255,174,92,0.1)";

    }


    document.getElementById("resultMessage").innerText =
        data.message;


    document.getElementById("careText").innerText =
        data.care;


    const topContainer =
        document.getElementById("topPredictions");

    topContainer.innerHTML = "";


    data.top_predictions.forEach((prediction, index) => {

        const row = document.createElement("div");

        row.className = "prediction-row";

        row.innerHTML = `
            <span>
                ${index + 1}. ${prediction.name}
            </span>

            <strong>
                ${prediction.confidence}%
            </strong>
        `;

        topContainer.appendChild(row);

    });

}


/* HISTORY */

async function loadHistory() {

    const container =
        document.getElementById("historyList");


    try {

        const response = await fetch("/history");

        const history = await response.json();


        if (!history.length) {

            container.innerHTML = `
                <div class="empty-history">

                    <i class="fa-solid fa-clock-rotate-left"></i>

                    <h3>No predictions yet</h3>

                    <p>
                        Scan a plant to create your prediction history.
                    </p>

                    <button class="primary-btn"
                            onclick="showPageByName('scanner')">

                        Start First Scan

                    </button>

                </div>
            `;

            return;
        }


        container.innerHTML = "";


        history.forEach(item => {

            const element = document.createElement("div");

            element.className = "history-item";

            element.innerHTML = `

                <div class="history-icon">
                    <i class="fa-solid fa-leaf"></i>
                </div>

                <div class="history-info">

                    <strong>${item.disease}</strong>

                    <small>
                        ${item.time}
                    </small>

                </div>

                <div class="history-confidence">
                    ${item.confidence}%
                </div>

            `;

            container.appendChild(element);

        });

    } catch (error) {

        console.error(error);

    }

}


/* CLEAR HISTORY */

async function clearHistory() {

    if (!confirm("Clear all prediction history?")) {
        return;
    }


    await fetch("/clear-history", {
        method: "POST"
    });


    loadHistory();

}


/* INITIAL */

document.addEventListener("DOMContentLoaded", function () {

    showPage("home");

});
