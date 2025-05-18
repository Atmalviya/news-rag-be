const { QdrantClient } = require('@qdrant/qdrant-js');
const axios = require('axios');

let qdrantClient;
const COLLECTION_NAME = 'news_articles';
const VECTOR_DIMENSION = 1536; 


function getQdrantClient() {
  if (!qdrantClient) {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    qdrantClient = new QdrantClient({ url: qdrantUrl });
  }
  return qdrantClient;
}


async function initVectorCollection() {
  const client = getQdrantClient();
  
  try {
    const response = await axios.get(`${process.env.QDRANT_URL}/collections/${COLLECTION_NAME}`);
    console.log(`Collection ${COLLECTION_NAME} already exists`);
    return;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Creating collection ${COLLECTION_NAME}...`);
      
      await axios.put(`${process.env.QDRANT_URL}/collections/${COLLECTION_NAME}`, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: 'Cosine'
        }
      });
      
      console.log(`Collection ${COLLECTION_NAME} created successfully`);
    } else {
      console.error('Error checking collection:', error);
      throw error;
    }
  }
}


async function storeEmbeddings(articlesWithEmbeddings) {
  // Ensure collection exists
  await initVectorCollection();
  
  const pointsToUpsert = [];
  
  for (const article of articlesWithEmbeddings) {
    pointsToUpsert.push({
      id: article.id,
      vector: article.embedding,
      payload: {
        id: article.id,
        title: article.title,
        content: article.content,
        link: article.link,
        publishDate: article.publishDate,
        source: article.source,
        type: 'article'
      }
    });
    
    if (article.chunks && article.chunks.length > 0) {
      for (const chunk of article.chunks) {
        pointsToUpsert.push({
          id: chunk.id,
          vector: chunk.embedding,
          payload: {
            id: chunk.id,
            articleId: article.id,
            text: chunk.text,
            title: article.title,
            link: article.link,
            type: 'chunk'
          }
        });
      }
    }
  }
  
  const batchSize = 5;
  for (let i = 0; i < pointsToUpsert.length; i += batchSize) {
    const batch = pointsToUpsert.slice(i, i + batchSize);
    try {
      await axios.put(`${process.env.QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
        points: batch
      });
      console.log(`Stored batch ${i/batchSize + 1} of ${Math.ceil(pointsToUpsert.length/batchSize)}`);
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('Qdrant error:', error.response.data);
      }
      throw error;
    }
  }
  
  console.log(`Successfully stored ${pointsToUpsert.length} points in Qdrant`);
}


async function searchSimilar(queryEmbedding, limit = 5) {
  try {
    const response = await axios.post(`${process.env.QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true,
      with_vectors: false
    });
    
    return response.data.result.map(hit => ({
      ...hit.payload,
      score: hit.score
    }));
  } catch (error) {
    console.error('Error searching vector database:', error);
    throw error;
  }
}

module.exports = {
  initVectorCollection,
  storeEmbeddings,
  searchSimilar
};