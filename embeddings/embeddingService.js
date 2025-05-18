const { OpenAI } = require('openai');

let openai;


function initOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}


async function createEmbeddings(articles) {
  const client = initOpenAIClient();
  const results = [];
  
  for (const article of articles) {
    const textToEmbed = `${article.title}\n\n${article.content}`;
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: textToEmbed,
    });
    results.push({
      ...article,
      embedding: response.data[0].embedding,
      chunks: [], 
    });
  }
  
  return results;
}


async function createQueryEmbedding(query) {
  const client = initOpenAIClient();
  const response = await client.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  return response.data[0].embedding;
}

module.exports = {
  createEmbeddings,
  createQueryEmbedding
};