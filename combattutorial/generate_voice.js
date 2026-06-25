const fs = require('fs');
const path = require('path');

// Local simple .env loader
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts[1].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;

if (!apiKey || !voiceId) {
  console.error("\x1b[31mError: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is missing!\x1b[0m");
  console.error("Please create a file named '.env' in this directory and fill it out:");
  console.error("--------------------------------------------------");
  console.error("ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key");
  console.error("ELEVENLABS_VOICE_ID=your_actual_elevenlabs_voice_id");
  console.error("--------------------------------------------------");
  process.exit(1);
}

// Load slides database
global.window = {};
try {
  eval(fs.readFileSync('slides.js', 'utf8'));
} catch (e) {
  console.error("Failed to load slides.js:", e);
  process.exit(1);
}

const slides = global.window.SLIDES;
if (!slides || !Array.isArray(slides)) {
  console.error("SLIDES database not found in slides.js");
  process.exit(1);
}

const voiceDir = path.join(__dirname, 'assets', 'voice');
if (!fs.existsSync(voiceDir)) {
  fs.mkdirSync(voiceDir, { recursive: true });
}

async function generateAllVoices() {
  console.log(`Starting voice generation for ${slides.length} slides...`);
  
  let generatedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const outputFile = path.join(voiceDir, `slide_${i}.mp3`);
    
    // We only voice dialogue and interactive slides with text content
    if (slide.type === 'video' || !slide.text) {
      continue;
    }
    
    if (fs.existsSync(outputFile)) {
      skippedCount++;
      continue;
    }
    
    const cleanText = slide.text.replace(/\*\*/g, '');
    console.log(`[${i + 1}/${slides.length}] Generating voice for: "${cleanText.substring(0, 50)}..."`);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputFile, buffer);
      generatedCount++;
      console.log(`\x1b[32m[Success] Saved assets/voice/slide_${i}.mp3\x1b[0m`);
      
      // Short delay to avoid hitting ElevenLabs rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`\x1b[31m[Error] Failed to generate voice for Slide ${i}:`, err.message, `\x1b[0m`);
      console.log("Stopping execution to prevent character waste.");
      break;
    }
  }
  
  console.log("--------------------------------------------------");
  console.log(`Voice generation complete!`);
  console.log(`Generated: ${generatedCount} files.`);
  console.log(`Skipped (already exist): ${skippedCount} files.`);
}

generateAllVoices();
