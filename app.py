from flask import Flask, render_template, request, jsonify, send_from_directory
import yt_dlp
import os
import requests 
import google.generativeai as genai


app = Flask(__name__)



DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

genai.configure(api_key="AIzaSyD98IaF8bMI6Kg10h1ELKAST3rPFpYC_6I")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/audio')
def audio():
    return render_template('audio.html')

@app.route('/summary')
def summary():
    return render_template('summary.html')

@app.route('/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'video')  # Default to video

    if not url:
        return jsonify({"error": "URL is required"}), 400

    ydl_opts = {
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
    }

    if format_type == "audio":
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:
        ydl_opts.update({'format': 'best'})

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if format_type == "audio":
                filename = filename.rsplit(".", 1)[0] + ".mp3"

        return jsonify({"message": "Download complete", "file": os.path.basename(filename)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/downloads/<filename>')
def get_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename)

@app.route('/summarize', methods=['POST'])
def summarize_sub():
    data = request.json
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    ydl_opts = {
        'writesubtitles': True,
        'subtitleslangs': ['en'],
        'skip_download': True,
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            subtitles = info.get('subtitles', {}).get('en', [])
            if not subtitles:
                return jsonify({"error": "No subtitles found"}), 404
            
            subtitle_url = subtitles[0]['url']
            response = requests.get(subtitle_url)  
            subtitle_text = response.text if response.status_code == 200 else "Failed to fetch subtitles"

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"Summarize the following subtitles:\n\n{subtitle_text}")
            summary_text = response.text
        except Exception as e:
            return jsonify({"error": f"Gemini API error: {str(e)}"}), 500

        return jsonify({"summary": summary_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
