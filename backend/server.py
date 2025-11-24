        filename = f"tts-{voice}-{int(time.time())}.mp3"
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
    print(f"TTS SERVER 100% WORKING → http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)