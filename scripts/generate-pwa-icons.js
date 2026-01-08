const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImage = path.join(__dirname, '../public/impress_enterprise_logo.png');
const iconsDir = path.join(__dirname, '../public/icons');

async function generatePWAIcons() {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputImage)) {
      console.error('Input image not found:', inputImage);
      return;
    }

    // Create icons directory if it doesn't exist
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
      console.log('Created icons directory');
    }

    console.log('Generating PWA icons...');

    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of sizes) {
      await sharp(inputImage)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`✓ icon-${size}x${size}.png`);
    }

    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating PWA icons:', error);
  }
}

generatePWAIcons();
