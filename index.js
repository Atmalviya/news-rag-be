require('dotenv').config();
const app = require('./app');
const { initVectorCollection } = require('./vectorStore/vectorDb');
const { ingestData } = require('./data/ingest');

const PORT = process.env.PORT || 3000;

async function waitForServices() {
  console.log('Waiting for Redis and Qdrant to be ready...');
  await new Promise(resolve => setTimeout(resolve, 10000));
}

async function startServer() {
  try {
    await waitForServices();
    
    await initVectorCollection();
    console.log('Vector collection initialized successfully');
    
    console.log('Starting data ingestion...');
    await ingestData();
    console.log('Data ingestion completed successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();