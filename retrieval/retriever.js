const { createQueryEmbedding } = require('../embeddings/embeddingService.js');
const { searchSimilar } = require('../vectorStore/vectorDb.js');


async function retrieveRelevantPassages(query, topK = 5) {
  try {
    const queryEmbedding = await createQueryEmbedding(query);
    
    const similarResults = await searchSimilar(queryEmbedding, topK);
    
    const context = formatRetrievedContext(similarResults);

    const articles = extractUniqueArticles(similarResults);
    
    return {
      context,
      articles
    };
  } catch (error) {
    console.error('Error retrieving relevant passages:', error);
    throw error;
  }
}


function formatRetrievedContext(results) {
  const formattedContext = results.map((result, index) => {
    if (result.type === 'article') {
      return `[${index + 1}] Article: "${result.title}"\n${result.content}\n`;
    } else if (result.type === 'chunk') {
      return `[${index + 1}] From article "${result.title}":\n${result.text}\n`;
    }
    return '';
  }).join('\n');
  
  return formattedContext;
}


function extractUniqueArticles(results) {
  const uniqueArticles = {};
  
  results.forEach(result => {
    const articleId = result.type === 'article' ? result.id : result.articleId;
    
    if (!uniqueArticles[articleId] && (result.title && result.link)) {
      uniqueArticles[articleId] = {
        id: articleId,
        title: result.title,
        link: result.link,
        source: result.source || 'Unknown Source',
        publishDate: result.publishDate || null
      };
    }
  });
  
  return Object.values(uniqueArticles);
}

module.exports = {
  retrieveRelevantPassages
};