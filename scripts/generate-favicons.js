const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImage = path.join(__dirname, '../public/impress_enterprise_logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputImage)) {
      console.error('Input image not found:', inputImage);
      return;
    }

    console.log('Generating favicons...');

    // Generate favicon.ico (32x32)
    await sharp(inputImage)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-temp-32.png'));
    
    // Rename to .ico
    fs.renameSync(
      path.join(outputDir, 'favicon-temp-32.png'),
      path.join(outputDir, 'favicon.ico')
    );
    console.log('✓ favicon.ico (32x32)');

    // Generate favicon-16x16.png
    await sharp(inputImage)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    console.log('✓ favicon-16x16.png');

    // Generate favicon-32x32.png
    await sharp(inputImage)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    console.log('✓ favicon-32x32.png');

    // Generate apple-touch-icon.png (180x180)
    await sharp(inputImage)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png (180x180)');

    // Generate android-chrome icons (192x192 and 512x512)
    await sharp(inputImage)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'android-chrome-192x192.png'));
    console.log('✓ android-chrome-192x192.png');

    await sharp(inputImage)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'android-chrome-512x512.png'));
    console.log('✓ android-chrome-512x512.png');

    console.log('\n✅ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
