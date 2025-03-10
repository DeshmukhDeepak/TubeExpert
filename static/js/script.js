function downloadVideo(){
    let progress = 0;
    let progressBar = document.getElementById("progressBar");
    let progressText = document.getElementById("progressText");
    let progressContainer = document.querySelector(".progress-container");
    let url = document.getElementById("videoURL").value;
    let format = "video";
    
    
    if (!url) {
        document.getElementById("video-error").innerText = "Please enter a valid URL";
        return;
    }

    // Show the progress bar
    progressContainer.style.display = "block";

    // Simulate progress update every 400ms
    let interval = setInterval(() => {
        if (progress < 90) { // Keep it below 90% until response
            progress += 10;
            progressBar.style.width = progress + "%";
            progressText.textContent = "Downloading.." + progress + "%";

            if (progress > 45) { // Change color after 50%
                progressText.style.color = "white";
            } else {
                progressText.style.color = "black";
            }

        }
    }, 400);
    
    document.getElementById("video-error").innerText = "";

    fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, format: format })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById("video-error").innerText = data.error;
        } else {
            clearInterval(interval);  // Stop progress updates
                    progressBar.style.width = "100%";
                    progressText.textContent = "100%";
                    setTimeout(() => {
                        progressContainer.style.display = "none"; // Hide after completion
                    }, 1000);

            let link = document.getElementById("downloadVideoLink");
            link.href = "/downloads/" + data.file;
            link.innerText = "Download " + format.toUpperCase();
            link.style.display = "block";
        }
    })
    .catch(err => {
        document.getElementById("video-error").innerText = "An error occurred!";
        document.getElementById("video-message").innerText = "";
    });
}



function downloadAudio(){
    let progress = 0;
    let progressBar = document.getElementById("progressBar");
    let progressText = document.getElementById("progressText");
    let progressContainer = document.querySelector(".progress-container");
    let url = document.getElementById("audioURL").value;
    let format = "audio";
    
    if (!url) {
        document.getElementById("audio-error").innerText = "Please enter a valid URL";
        return;
    }

    // Show the progress bar
    progressContainer.style.display = "block";

    // Simulate progress update every 400ms
    let interval = setInterval(() => {
        if (progress < 90) { // Keep it below 90% until response
            progress += 10;
            progressBar.style.width = progress + "%";
            progressText.textContent = "Downloading.." + progress + "%";

            if (progress > 45) { // Change color after 50%
                progressText.style.color = "white";
            } else {
                progressText.style.color = "black";
            }

        }
    }, 400);
    
    document.getElementById("audio-error").innerText = "";

    fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, format: format })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById("audio-error").innerText = data.error;
        } else {
            clearInterval(interval);  // Stop progress updates
                    progressBar.style.width = "100%";
                    progressText.textContent = "100%";
                    setTimeout(() => {
                        progressContainer.style.display = "none"; // Hide after completion
                    }, 1000);

            let link = document.getElementById("downloadAudioLink");
            link.href = "/downloads/" + data.file;
            link.innerText = "Download " + format.toUpperCase();
            link.style.display = "block";
        }
    })
    .catch(err => {
        document.getElementById("audio-error").innerText = "An error occurred!";
    });
}

function getSummary(){

    let url = document.getElementById("videoURL").value;
    let summaryContainer = document.getElementById("summaryContainer");
    let summaryText = document.getElementById("summaryText");
    let summary_errorr = document.getElementById("summary-error");

    summaryText.innerText = "";
    summary_errorr.innerText = "";
    summary_errorr.style.display = "none";
    summaryContainer.style.display = "none";


    if (!url) {
        summary_errorr.style.display = "block";
        summary_errorr.innerText = "Please enter a valid URL";
        return;
    }

    summaryContainer.style.display = "block";
    summaryText.innerText = "Fetching subtitles and summarizing...";

    fetch('/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })

    .then(function(response) {
        return response.json();
    })

    .then(function(data) {
        if (data.error) {
            summaryText.innerText = "Error: " + data.error;
        } else {
            summaryText.innerText = data.summary;
        }
    })

    .catch(function(err) {
        summaryText.innerText = "An error occurred!";
    });
}


//Subtitle doownload part
function downloadSubtitle() {
    const url = document.getElementById("audioURL").value;
    const language = document.getElementById("language").value;
    const progressContainer = document.querySelector(".progress-container");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const fileDisplay = document.getElementById("fileDisplay");
    const subtitleLink = document.getElementById("subtitleLink");

    if (!url) {
        alert("Please enter a valid YouTube URL.");
        return;
    }

    // Show the progress bar
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "Loading... 0%";

    // Simulate progress (replace with actual backend call)
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Loading... ${progress}%`;
        }
    }, 400);

    // Send request to backend
    fetch('/generate_subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url, target_languages: [language] })
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(interval); // Stop progress updates
        if (data.error) {
            progressText.textContent = "Error: " + data.error;
        } else {
            progressBar.style.width = "100%";
            progressText.textContent = "Completed!";
            setTimeout(() => {
                progressContainer.style.display = "none"; // Hide after completion
            }, 1000);

            // Display the subtitle file
            fileDisplay.style.display = "block";
            subtitleLink.href = `data:text/plain;charset=utf-8,${encodeURIComponent(data.translations[language])}`;
            subtitleLink.download = `subtitles_${language}.txt`;
            subtitleLink.innerText = `Download Subtitles (${language.toUpperCase()})`;
        }
    })
    .catch(err => {
        clearInterval(interval);
        progressText.textContent = "An error occurred!";
        console.error(err);
    });
}