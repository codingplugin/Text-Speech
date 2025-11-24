import sys
import os
import subprocess

"""
Small wrapper so the backend can execute `python voice.py` from the `backend/` folder.
It forwards all command-line arguments to the repository root `voice.py` and relays
stdout/stderr and the exit code.
"""

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    voice_py = os.path.join(repo_root, 'voice.py')
    if not os.path.exists(voice_py):
        print(f"voice.py not found at {voice_py}", file=sys.stderr)
        sys.exit(2)

    cmd = [sys.executable, voice_py] + sys.argv[1:]
    try:
        proc = subprocess.run(cmd, cwd=repo_root)
        sys.exit(proc.returncode)
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    import edge_tts
    import asyncio
    import os
    import textwrap
    import sys

    # Backend-local TTS generator.
    # Reads input from backend/script.txt and writes output MP3s to frontend/public/audio_all

    REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    INPUT_FILE = os.path.join(BACKEND_DIR, 'script.txt')
    CHUNK_SIZE = 4000
    # Use a backend-local output folder to avoid overwriting frontend sample files
    OUTPUT_FOLDER = os.path.join(BACKEND_DIR, 'generated')

    VOICE_LIST = [
        'en-GB-RyanNeural', 'en-GB-SoniaNeural', 'en-GB-AlfieNeural', 'en-GB-HollieNeural',
        'en-GB-NoahNeural', 'en-GB-OliverNeural', 'en-GB-ThomasNeural', 'en-GB-OliviaNeural',
        'en-US-DavisNeural', 'en-US-JasonNeural', 'en-US-TonyNeural', 'en-US-JaneNeural',
        'en-US-NancyNeural', 'en-US-AriaNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
        'en-AU-DarrenNeural', 'en-AU-NeilNeural', 'en-CA-ClaraNeural', 'en-CA-LiamNeural'
    ]

    os.makedirs(OUTPUT_FOLDER, exist_ok=True)


    async def generate_audio_all(target_voice=None):
        if not os.path.exists(INPUT_FILE):
            print('No script.txt found in backend folder; nothing to generate.')
            return

        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            text = f.read()

        if not text.strip():
            print('No text found in script; nothing to generate.')
            return

        text = text.replace('\n', ' ').replace('.  ', '. ')
        chunks = textwrap.wrap(text, CHUNK_SIZE)

        voices_to_run = VOICE_LIST if not target_voice else [target_voice]
        try:
            print(f"Generating audio for {len(voices_to_run)} voice(s) ({len(chunks)} chunks each)...")
        except UnicodeEncodeError:
            print(f"Generating audio for {len(voices_to_run)} voice(s) ({len(chunks)} chunks each)...")

        for voice in voices_to_run:
            try:
                print(f"\nVoice: {voice}")
            except UnicodeEncodeError:
                print(f"\nVoice: {voice}")

            temp_parts = []
            for i, chunk in enumerate(chunks, start=1):
                part_file = os.path.join(OUTPUT_FOLDER, f"{voice}_part{i}.mp3")
                tts = edge_tts.Communicate(chunk, voice)
                await tts.save(part_file)
                temp_parts.append(part_file)
                try:
                    print(f"  Saved part {i}: {part_file}")
                except UnicodeEncodeError:
                    print(f"  Saved part {i}: {part_file}")

            out_file = os.path.join(OUTPUT_FOLDER, f"{voice}.mp3")
            # remove existing output to avoid appending/duplicating previous runs
            try:
                if os.path.exists(out_file):
                    os.remove(out_file)
            except Exception:
                pass
            with open(out_file, 'wb') as outfile:
                for part in temp_parts:
                    with open(part, 'rb') as pf:
                        outfile.write(pf.read())

            for part in temp_parts:
                try:
                    os.remove(part)
                except OSError:
                    pass

            try:
                print(f"Final file: {out_file}")
            except UnicodeEncodeError:
                print(f"Final file: {out_file}")

        try:
            print('\nGeneration finished')
        except UnicodeEncodeError:
            print('\nGeneration finished')


    if __name__ == '__main__':
        import argparse

        p = argparse.ArgumentParser()
        p.add_argument('--voice', '-v', help='Generate only this voice id (e.g. en-GB-RyanNeural)')
        p.add_argument('--out', help='Full path to write the resulting mp3 file (optional)')
        args = p.parse_args()

        out_arg = args.out
        # If an out path was provided, pass it into the generator via closure
        async def run_with_out():
            if out_arg:
                # ensure output directory exists
                out_dir = os.path.dirname(out_arg)
                os.makedirs(out_dir, exist_ok=True)
                # generate only the requested voice and write to out_arg
                await generate_audio_all(target_voice=args.voice)
                # move/rename the generated default file to the requested out path if it exists
                default_file = os.path.join(OUTPUT_FOLDER, f"{args.voice}.mp3") if args.voice else None
                if default_file and os.path.exists(default_file):
                    try:
                        # copy to out_arg
                        with open(default_file, 'rb') as sf, open(out_arg, 'wb') as df:
                            df.write(sf.read())
                    except Exception:
                        pass
            else:
                await generate_audio_all(target_voice=args.voice)

        asyncio.run(run_with_out())
        # Print resulting path (if any) so callers can detect output location
        if out_arg:
            # print web-accessible path relative to frontend/public (e.g. /converted/filename.mp3)
            try:
                rel = os.path.relpath(out_arg, os.path.join(REPO_ROOT, 'frontend', 'public'))
                web_path = '/' + rel.replace('\\', '/')
            except Exception:
                web_path = out_arg
            print(web_path)
