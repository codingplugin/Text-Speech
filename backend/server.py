from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
import tempfile
import os
import time

app = Flask(__name__)
CLIENT_URL = os.environ.get('CLIENT_URL', "http://localhost:5173")
if CLIENT_URL and not CLIENT_URL.startswith('http'):
    CLIENT_URL = f"https://{CLIENT_URL}"
CORS(app, origins=CLIENT_URL, supports_credentials=True)

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        voice = data.get('voice', '')

        if not text:
            return jsonify({"error": "Text required"}), 400

        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_path = temp_file.name
        temp_file.close()

        # Determine language based on voice ID (simplified mapping)
        # Map voice IDs to language codes
        lang_map = {
            'en-GB': 'en',
            'en-US': 'en',
            'en-AU': 'en',
            'en-CA': 'en'
        }
        
        # Extract language prefix from voice (e.g., 'en-GB-RyanNeural' -> 'en-GB')
        lang_prefix = '-'.join(voice.split('-')[:2]) if voice else 'en-US'
        lang = lang_map.get(lang_prefix, 'en')

        # Generate audio using gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(temp_path)

        # Send file and delete immediately
        filename = f"tts-{int(time.time())}.mp3"
        response = send_file(
            temp_path,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name=filename
        )

        # Delete temp file after sending
        @response.call_on_close
        def remove_file():
            try:
                os.unlink(temp_path)
            except:
                pass

        return response

    except Exception as e:
        print("REAL ERROR:", str(e))
        return jsonify({"error": "Conversion failed"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"TTS SERVER RUNNING → http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)