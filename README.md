# News RAG Chatbot Backend

A robust backend system for a news chatbot that uses Retrieval-Augmented Generation (RAG) to provide accurate, context-aware responses based on recent news articles.

## Tech Stack

- **Node.js & Express**: Backend server and API endpoints
- **Redis**: Session management and caching
- **Qdrant**: Vector database for semantic search
- **OpenAI/Gemini**: LLM for response generation
- **Docker**: Containerization and deployment

## System Architecture

```mermaid
graph TD
    A[Client] -->|HTTP/SSE| B[Express Server]
    B -->|Session Management| C[Redis]
    B -->|Vector Search| D[Qdrant]
    B -->|LLM Generation| E[Gemini API]
    
    subgraph Data Pipeline
        F[RSS Feeds] -->|Fetch Articles| G[Article Storage]
        G -->|Create Embeddings| H[Vector Store]
    end
    
    subgraph Request Flow
        A -->|1. Create Session| B
        B -->|2. Store Session| C
        A -->|3. Send Query| B
        B -->|4. Search Vectors| D
        D -->|5. Get Context| B
        B -->|6. Generate Response| E
        E -->|7. Stream Response| A
    end
```

## Key Components

### 1. Data Ingestion Pipeline

The system fetches news articles from RSS feeds, processes them, and stores them in the vector database:

```javascript
// Data ingestion flow
1. Fetch articles from RSS feeds
2. Create embeddings using OpenAI's text-embedding-ada-002
3. Store embeddings in Qdrant vector database
4. Index articles for quick retrieval
```

### 2. Vector Storage & Search

- **Embedding Creation**: Uses OpenAI's text-embedding-ada-002 model
- **Vector Storage**: Qdrant for efficient similarity search
- **Collection Structure**:
  - Name: `news_articles`
  - Vector Dimension: 1536
  - Distance Metric: Cosine similarity

### 3. Session Management

Redis-based session management with the following features:

- **Session Creation**: UUID-based session IDs
- **History Storage**: JSON-serialized chat history
- **TTL Configuration**: 60-minute session expiration
- **Key Structure**:
  ```
  session:{sessionId}:history -> Array of messages
  session:{sessionId}:createdAt -> Timestamp
  ```

### 4. API Endpoints

#### Session Management
- `POST /api/session`: Create new session
- `GET /api/session/:sessionId/history`: Get chat history
- `DELETE /api/session/:sessionId/history`: Clear history

#### Chat
- `POST /api/chat`: Send message and get streaming response
- `GET /api/chat`: SSE endpoint for real-time updates

### 5. Response Generation

1. **Query Processing**:
   - Create query embedding
   - Search similar articles
   - Retrieve relevant context

2. **Response Generation**:
   - Use Gemini API for response generation
   - Include article citations
   - Stream response word by word

## Configuration

### Environment Variables
```bash
REDIS_URL=redis://default:password@host:6379/0
QDRANT_URL=http://host:6333
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

### Docker Configuration
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
```

## Performance Optimizations

1. **Caching Strategy**:
   - Redis for session data
   - 60-minute TTL for sessions
   - Batch processing for embeddings

2. **Vector Search**:
   - Cosine similarity for accurate matching
   - Batch processing for embeddings
   - Efficient indexing in Qdrant

3. **Response Streaming**:
   - Server-Sent Events (SSE)
   - Word-by-word streaming
   - Real-time source citations


## Development

### Local Setup
```bash
# Install dependencies
npm install

# Start services
docker-compose up

# Run data ingestion
npm run ingest

# Start development server
npm run dev
```

### Testing
```bash
# Run tests
npm test

# Test API endpoints
curl http://localhost:3000/api/health
```

## Deployment

1. **Docker Deployment**:
   ```bash
   docker-compose up --build
   ```

2. **Environment Setup**:
   - Set required environment variables
   - Configure Redis and Qdrant
   - Set up SSL/TLS

3. **Monitoring**:
   - Set up logging
   - Configure alerts
   - Monitor resource usage
