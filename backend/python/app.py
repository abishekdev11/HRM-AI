from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import os

app = FastAPI()

# Load model once when the server starts
model = WhisperModel(
    "tiny",
    device="cpu",
    compute_type="int8"
)

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    # Save uploaded audio temporarily
    suffix = os.path.splitext(audio.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        temp_audio.write(await audio.read())
        temp_path = temp_audio.name

    try:
        # Transcribe audio
        segments, info = model.transcribe(
            temp_path,
            beam_size=5,
             vad_filter=True
        )

        transcript = ""

        for segment in segments:
               print(segment)
               transcript += segment.text + " "

        print("FINAL:", transcript)

        return {
            "text": transcript.strip(),
            "language": info.language,
            "language_probability": info.language_probability
        }

    finally:
        os.remove(temp_path)