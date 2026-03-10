import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
import path from 'path';

const convert = (src, dest) => {
    try {
        console.log(`Converting ${src} to ${dest}...`);
        execSync(`"${ffmpeg}" -y -i "${src}" "${dest}"`);
        console.log(`Converted ${src} to ${dest} successfully.`);
    } catch (err) {
        console.error(`Failed to convert ${src}:`, err.message);
    }
};

convert('audios/intro_0.wav', 'audios/intro_0.mp3');
convert('audios/intro_1.wav', 'audios/intro_1.mp3');
