import edge_tts
import asyncio, os, textwrap

# === SETTINGS ===
INPUT_FILE = "scriptforall.txt"
CHUNK_SIZE = 4000
OUTPUT_FOLDER = "audio_all"

# List of voice IDs to generate in one run
VOICE_LIST = [
    'en-GB-RyanNeural', 'en-GB-SoniaNeural', 'en-GB-AlfieNeural', 'en-GB-HollieNeural',
    'en-GB-NoahNeural', 'en-GB-OliverNeural', 'en-GB-ThomasNeural', 'en-GB-OliviaNeural',
    'en-US-DavisNeural', 'en-US-JasonNeural', 'en-US-TonyNeural', 'en-US-JaneNeural',
    'en-US-NancyNeural', 'en-US-AriaNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
    'en-AU-DarrenNeural', 'en-AU-NeilNeural', 'en-CA-ClaraNeural', 'en-CA-LiamNeural'
]

os.makedirs(OUTPUT_FOLDER, exist_ok=True)


async def generate_audio_all():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        print("No text found in script; nothing to generate.")
        return

    text = text.replace("\n", " ").replace(".  ", ". ")
    chunks = textwrap.wrap(text, CHUNK_SIZE)

    print(f"🎙️ Generating audio for {len(VOICE_LIST)} voices ({len(chunks)} chunks each)...")

    for voice in VOICE_LIST:
        print(f"\n🔊 Voice: {voice}")
        temp_parts = []
        for i, chunk in enumerate(chunks, start=1):
            part_file = os.path.join(OUTPUT_FOLDER, f"{voice}_part{i}.mp3")
            tts = edge_tts.Communicate(chunk, voice)
            await tts.save(part_file)
            temp_parts.append(part_file)
            print(f"  ✅ Saved part {i}: {part_file}")

        # Concatenate parts into single file
        out_file = os.path.join(OUTPUT_FOLDER, f"{voice}.mp3")
        with open(out_file, 'ab') as outfile:
            for part in temp_parts:
                with open(part, 'rb') as pf:
                    outfile.write(pf.read())

        # Remove temp parts
        for part in temp_parts:
            try:
                os.remove(part)
            except OSError:
                pass

        print(f"✅ Final file: {out_file}")

    print("\n✅ All voices generated successfully!")


if __name__ == '__main__':
    asyncio.run(generate_audio_all())
