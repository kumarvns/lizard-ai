const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const ffmpeg = require('fluent-ffmpeg');
const { join } = require("path");
const { unlink } = require("fs").promises;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const myFFmpeg = {};


myFFmpeg.mergeAudio = (audio1, audio2, name) => {
    return new Promise((resolve, reject) => {
        try {
            const volume1 = 1;
            const volume2 = 0.2;
            const startFrom = 5;
            const output = join(process.cwd(), "audioGenerated", `${name.split('.')[0]}_merged.mp3`);

            ffmpeg()
                .input(audio1)
                .input(audio2)
                .audioCodec('libmp3lame') // or choose the codec you prefer
                .outputOptions(`-filter_complex`, `[0:a]volume=${volume1}[a0];[1:a]atrim=start=${startFrom},volume=${volume2}[a1];[a0][a1]amix=inputs=2:duration=shortest[outa]`)
                .outputOptions('-map', '[outa]')
                .output(output)
                .on('end', () => {
                    resolve(output);

                    unlink(audio1);
                    unlink(audio2);
                })
                .on('error', (err) => {
                    reject(err);
                })
                .run();
        } catch (error) {
            reject(error);
        }
    });
};

myFFmpeg.createVideo = (script, prefix, musicPath, volumeMix, outputPath) => {
    try {
        const command = ffmpeg();

        const length = script.length;
        let streams = '';   // [0:v:0][0:a:0][1:v:0][1:a:0]...
        let sar = '';       // setsar=sar=1/1
        script.forEach((scene, index) => {
            const name = prefix + (index + 1);
            command.input(join(process.cwd(), 'temp', `${name}.mp4`));
            sar += `[${index}:v:0]setsar=sar=1/1[v${index}];`;
            streams += `[v${index}][${index}:a:0]`;
        });

        // Add the background music
        command.input(musicPath);

        // '[0:v:0]setsar=sar=1/1[v0];[1:v:0]setsar=sar=1/1[v1];[v0][0:a:0][v1][1:a:0]concat=n=2:v=1:a=1[vout][aout]'
        command
            .inputOptions('-filter_complex', `${sar}${streams}concat=n=${length}:v=1:a=1[vou][aou];[aou]volume=${volumeMix.speech}[a0];[${length}:a:0]atrim=start=10,volume=${volumeMix.bgMusic}[a1];[a0][a1]amix=inputs=2:duration=shortest[aout]`)
            .outputOptions('-map', '[vou]', '-map', '[aout]', '-r', '27', '-strict', 'experimental', '-c:v', 'libx264', '-b:v', '2000k', '-b:a', '128k', '-pix_fmt', 'yuv420p')
            .output(outputPath)
            .on('start', () => {
                console.log('Final video creation started.....');
            })
            .on('end', () => {
                console.log('Video created successfully');
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error:', err);
                console.error('ffmpeg stdout:', stdout);
                console.error('ffmpeg stderr:', stderr);
            })
            .run();
    } catch (error) {
        console.log(error);
    }
}

module.exports = myFFmpeg;