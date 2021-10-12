import os
import sys
from moviepy.editor import VideoFileClip

folder_path = sys.argv[1]
filename = sys.argv[2]
output_bytes = 20 * 1024 ** 2


def trim_to_size(folder_path, filename, output_bytes):
    file_path = os.path.join(folder_path, filename)
    output_filename = filename[:-4] + "_.mp4"

    clip = VideoFileClip(file_path)
    clip_size = os.path.getsize(file_path)
    if clip_size < output_bytes:
        return filename
    output_duration = clip.duration * output_bytes / clip_size * 0.9
    print(output_duration)
    trimmed_clip: VideoFileClip = clip.subclip(0, output_duration).copy()

    output_path = os.path.join(folder_path, output_filename)
    trimmed_clip.write_videofile(output_path)
    if os.path.getsize(output_path) > output_bytes:
        output_filename = trim_to_size(folder_path, output_filename, output_bytes)
    clip.close()
    return output_filename


def trim_in_place(folder_path, filename, output_bytes):
    output_filename = trim_to_size(folder_path, filename, output_bytes)
    for f in os.listdir(folder_path):
        if (
            f.startswith(filename.split(".")[0])
            and f.endswith(".mp4")
            and f != output_filename
        ):
            os.remove(os.path.join(folder_path, f))

    output_path = os.path.join(folder_path, output_filename)
    file_path = os.path.join(folder_path, filename)
    if output_path != file_path:
        os.rename(output_path, file_path)


if __name__ == "__main__":
    trim_in_place(folder_path, filename, output_bytes)
