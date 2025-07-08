from flask import Flask, render_template, request, jsonify, send_from_directory
import yt_dlp
import os
import requests
import google.generativeai as genai
import speech_recognition as sr
from googletrans import Translator

app = Flask(__name__)

x
DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)


genai.configure(api_key="xxxx")


translator = Translator()


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/audio')
def audio():
    return render_template('audio.html')

@app.route('/summary')
def summary():
    return render_template('summary.html')

@app.route('/subtitle')
def subtitle():
    return render_template('subtitle.html')

@app.route('/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'video')

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

@app.route('/generate_subtitles', methods=['POST'])
def generate_subtitles():
    data = request.json
    video_url = data.get('video_url')
    target_languages = data.get('target_languages', ['en'])  

    if not video_url:
        return jsonify({"error": "video_url is required"}), 400

  
    subtitles = generate_subtitles_for_video(video_url, target_languages)

    return jsonify(subtitles)


def download_youtube_video(video_url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, 'temp_audio.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        audio_path = ydl.prepare_filename(info).replace('.webm', '.wav')
    return audio_path

def transcribe_audio(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio = recognizer.record(source)
    try:
        text = recognizer.recognize_google(audio)
    except sr.UnknownValueError:
        text = "Could not understand audio"
    except sr.RequestError:
        text = "API unavailable"
    return text

def translate_text(text, target_languages):
    translations = {}
    for lang in target_languages:
        try:
            translated = translator.translate(text, dest=lang)
            translations[lang] = translated.text
        except Exception as e:
            translations[lang] = f"Translation failed for {lang}: {str(e)}"
    return translations

def generate_subtitles_for_video(video_url, target_languages):

    audio_path = download_youtube_video(video_url)


    transcribed_text = transcribe_audio(audio_path)


    translations = translate_text(transcribed_text, target_languages)


    if os.path.exists(audio_path):
        os.remove(audio_path)


    subtitles = {
        'original_text': transcribed_text,
        'translations': translations
    }
    return subtitles


if __name__ == '__main__':
    app.run(debug=True)
