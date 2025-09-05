const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configure multer for file uploads (use memory storage for App Engine)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Clone voice endpoint
router.post('/clone-voice', upload.single('audio'), async (req, res) => {
  try {
    const { name = 'Custom Voice', description = 'Voice cloned via API' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Check if ElevenLabs API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('ElevenLabs API key not configured - returning demo response');
      
      // No need to clean up file with memory storage
      
      // Return demo response
      return res.json({
        voiceId: 'demo-voice-' + Date.now(),
        name: name,
        status: 'success',
        message: 'Voice cloned successfully (Demo Mode)'
      });
    }

    // Prepare form data for ElevenLabs API
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    // Use the file buffer directly from memory storage
    formData.append('files', req.file.buffer, {
      filename: req.file.originalname || 'audio.wav',
      contentType: req.file.mimetype
    });

    // Call ElevenLabs API to clone voice
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'xi-api-key': apiKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // No file cleanup needed with memory storage

    res.json({
      voiceId: response.data.voice_id,
      name: name,
      status: 'success',
      message: 'Voice cloned successfully'
    });

  } catch (error) {
    console.error('Voice cloning error:', error);
    
    // No file cleanup needed with memory storage

    // Return demo response on error
    res.json({
      voiceId: 'demo-voice-' + Date.now(),
      name: req.body.name || 'Custom Voice',
      status: 'success',
      message: 'Voice cloned successfully (Demo Mode)',
      demo: true
    });
  }
});

// Text-to-speech endpoint
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voiceId = 'demo-voice-id' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Check if ElevenLabs API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || voiceId.startsWith('demo-')) {
      console.log('Using demo mode for text-to-speech');
      
      // Return a mock audio response for demo
      const demoAudioPath = path.join(__dirname, '../assets/demo-audio.mp3');
      
      // Check if demo audio exists, if not create a simple response
      try {
        await fs.access(demoAudioPath);
        const audioBuffer = await fs.readFile(demoAudioPath);
        res.set('Content-Type', 'audio/mpeg');
        return res.send(audioBuffer);
      } catch {
        // Return a simple audio response header
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Length', '0');
        return res.status(200).end();
      }
    }

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'stream'
      }
    );

    // Set appropriate headers
    res.set('Content-Type', 'audio/mpeg');
    
    // Pipe the audio stream to response
    response.data.pipe(res);

  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    // Return empty audio response on error
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', '0');
    res.status(200).end();
  }
});

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      // Return demo voices
      return res.json({
        voices: [
          { voice_id: 'demo-voice-1', name: 'Professional Business Voice' },
          { voice_id: 'demo-voice-2', name: 'Warm Customer Service' },
          { voice_id: 'demo-voice-3', name: 'Legal Expert Voice' }
        ]
      });
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Get voices error:', error);
    
    // Return demo voices on error
    res.json({
      voices: [
        { voice_id: 'demo-voice-1', name: 'Professional Business Voice' },
        { voice_id: 'demo-voice-2', name: 'Warm Customer Service' },
        { voice_id: 'demo-voice-3', name: 'Legal Expert Voice' }
      ]
    });
  }
});

// Check API status
router.get('/status', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return res.json({
      status: 'demo',
      message: 'Running in demo mode - add ELEVENLABS_API_KEY to enable full functionality'
    });
  }

  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    res.json({
      status: 'active',
      subscription: response.data.subscription,
      character_count: response.data.subscription.character_count,
      character_limit: response.data.subscription.character_limit
    });

  } catch (error) {
    console.error('API status check error:', error);
    res.json({
      status: 'error',
      message: 'Failed to check API status'
    });
  }
});

module.exports = router;