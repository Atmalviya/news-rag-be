require('dotenv').config();
const app = require('./app');
const { initVectorCollection } = require('./vectorStore/vectorDb');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initVectorCollection();
    console.log('Vector collection initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();