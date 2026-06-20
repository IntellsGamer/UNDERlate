from pydub import AudioSegment
from pydub.playback import play

# Load the audio file
audio = AudioSegment.from_mp3("ending.mp3")

louder_audio = audio - 12

# Save the amplified audio
louder_audio.export("ending better.mp3", format="mp3")