const sharp = require('sharp');
const path = require('path');

async function removeWhiteBg(inputPath, outputPath) {
    const img = sharp(inputPath);
    const { width, height } = await img.metadata();

    const rawBuffer = await img.ensureAlpha().raw().toBuffer();

    // Make white/near-white pixels transparent
    const THRESHOLD = 235;
    for (let i = 0; i < rawBuffer.length; i += 4) {
        const r = rawBuffer[i];
        const g = rawBuffer[i + 1];
        const b = rawBuffer[i + 2];
        if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
            rawBuffer[i + 3] = 0;
        }
    }

    await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
        .png()
        .toFile(outputPath);

    console.log(`Done: ${width}x${height} -> ${outputPath}`);
}

const publicDir = path.join(__dirname, 'public', 'images');
const input = path.join(publicDir, 'logo-pulsoelectoral.png');
const output = path.join(publicDir, 'logo-pulsoelectoral-transparent.png');

removeWhiteBg(input, output).catch(console.error);
