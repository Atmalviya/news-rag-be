const express = require('express');
const router = express.Router();
const { retrieveRelevantPassages } = require('../retrieval/retriever');
const { generateAnswer } = require('../llm/geminiService');
const { 
  createSession, 
  getSessionHistory, 
  addMessageToHistory, 
  isValidSession,
  clearSessionHistory
} = require('../session/sessionManager');
const { loadArticles } = require('../data/rssParser');


router.post('/session', async (req, res) => {
  try {
    const sessionId = await createSession();
    res.status(200).json({
      success: true,
      sessionId,
      message: 'New session created'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});


router.get('/session/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!await isValidSession(sessionId)) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const history = await getSessionHistory(sessionId);
    
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session history'
    });
  }
});


router.get('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { sessionId, message } = req.query; // Note: using req.query instead of req.body
    
    if (!message || typeof message !== 'string') {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Invalid message format' })}\n\n`);
      return res.end();
    }
    
    if (!await isValidSession(sessionId)) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Session not found' })}\n\n`);
      return res.end();
    }
    
    await addMessageToHistory(sessionId, {
      role: 'user',
      content: message
    });
    
    const { context, articles } = await retrieveRelevantPassages(message, 5);
    
    const answer = await generateAnswer(message, context, articles);
    
    await addMessageToHistory(sessionId, {
      role: 'assistant',
      content: answer,
      sources: articles
    });
    
    const chunks = answer.split(' ');
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    res.write(`event: sources\ndata: ${JSON.stringify({ sources: articles })}\n\n`);
    
    res.write(`event: complete\ndata: ${JSON.stringify({ success: true })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to process your message' })}\n\n`);
    res.end();
  }
});




router.get('/articles', async (req, res) => {
  try {
    const articles = await loadArticles();
    
    res.status(200).json({
      success: true,
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        link: article.link,
        publishDate: article.publishDate,
        source: article.source,
        snippet: article.content.substring(0, 150) + '...'
      }))
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
});


router.delete('/session/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionExists = await isValidSession(sessionId);
    if (!sessionExists) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    await clearSessionHistory(sessionId);
    
    const history = await getSessionHistory(sessionId);
    if (history.length === 0) {
      res.status(200).json({ 
        success: true,
        message: 'Session history cleared'
      });
    } else {
      throw new Error('Failed to clear session history');
    }
  } catch (error) {
    console.error('Error clearing session history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear session history'
    });
  }
});

module.exports = router;