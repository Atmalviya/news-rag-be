const { fetchAndStoreArticles } = require('./rssParser');
const { createEmbeddings } = require('../embeddings/embeddingService');
const { storeEmbeddings } = require('../vectorStore/vectorDb');


async function ingestData() {
  try {
    console.log('Starting data ingestion pipeline...');
    
    console.log('Fetching articles from RSS feeds...');
    const articles = await fetchAndStoreArticles();
    console.log(`Fetched ${articles.length} articles successfully.`);
    
    if (articles.length === 0) {
      console.error('No articles fetched. Aborting ingestion.');
      return;
    }
    
    console.log('Creating embeddings for articles...');
    const articlesWithEmbeddings = await createEmbeddings(articles);
    console.log(`Created embeddings for ${articlesWithEmbeddings.length} articles.`);
    
    console.log('Storing embeddings in vector database...');
    await storeEmbeddings(articlesWithEmbeddings);
    console.log('Data ingestion completed successfully!');
    
  } catch (error) {
    console.error('Data ingestion failed:', error);
  }
}


if (require.main === module) {
  require('dotenv').config();
  ingestData()
    .then(() => console.log('Ingestion process completed'))
    .catch(err => console.error('Ingestion process failed:', err));
}

module.exports = {
  ingestData
};