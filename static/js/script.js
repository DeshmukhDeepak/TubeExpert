function downloadVideo(){
    let url = document.getElementById("videoURL").value;
    let format = "video";
    
    if (!url) {
        document.getElementById("video-error").innerText = "Please enter a valid URL";
        return;
    }
    
    document.getElementById("video-message").innerText = "Downloading...";
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
            document.getElementById("video-message").innerText = "";
        } else {
            document.getElementById("video-message").innerText = "Download complete!";
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
    let url = document.getElementById("audioURL").value;
    let format = "audio";
    
    if (!url) {
        document.getElementById("audio-error").innerText = "Please enter a valid URL";
        return;
    }
    
    document.getElementById("audio-message").innerText = "Downloading...";
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
            document.getElementById("audio-message").innerText = "";
        } else {
            document.getElementById("audio-message").innerText = "Download complete!";
            let link = document.getElementById("downloadAudioLink");
            link.href = "/downloads/" + data.file;
            link.innerText = "Download " + format.toUpperCase();
            link.style.display = "block";
        }
    })
    .catch(err => {
        document.getElementById("audio-error").innerText = "An error occurred!";
        document.getElementById("audio-message").innerText = "";
    });
}