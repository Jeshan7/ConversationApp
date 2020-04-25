export const convertToMp3 = (buffer) => {
    const file = new File(buffer, 'recording.mp3', {
        type: "audio/mp3",
        lastModified: Date.now()
    });

    return file;
}  