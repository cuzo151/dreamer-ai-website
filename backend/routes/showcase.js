const express = require('express');

const router = express.Router();
const { 
  processDocument, 
  transcribeAudio, 
  generateVisual,
  analyzeData 
} = require('../services/showcaseService');

// Document analysis demo
router.post('/analyze-document', async (req, res) => {
  try {
    const { text, type } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    const result = await processDocument(text, type);
    
    res.json({
      summary: result.summary,
      keyPoints: result.keyPoints,
      processedBy: 'Dreamer AI Document Intelligence'
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ 
      error: 'Unable to process document at this time' 
    });
  }
});

// Voice transcription demo
router.post('/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Audio URL is required' });
    }

    const result = await transcribeAudio(audioUrl);
    
    res.json({
      transcript: result.text,
      confidence: result.confidence,
      processedBy: 'Dreamer AI Voice Solutions'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Unable to process audio at this time' 
    });
  }
});

// Data analysis demo
router.post('/analyze-data', async (req, res) => {
  try {
    const { data, analysisType } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const result = await analyzeData(data, analysisType);
    
    res.json({
      insights: result.insights,
      patterns: result.patterns,
      recommendations: result.recommendations,
      processedBy: 'Dreamer AI Analytics Engine'
    });
  } catch (error) {
    console.error('Data analysis error:', error);
    res.status(500).json({ 
      error: 'Unable to analyze data at this time' 
    });
  }
});

module.exports = router;