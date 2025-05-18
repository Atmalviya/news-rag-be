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

## 1. Complete System Overview
```mermaid
graph TB
    subgraph Client
        A[Web Frontend] -->|HTTP/SSE| B[API Gateway]
    end

    subgraph Backend Services
        B -->|Route| C[Express Server]
        
        subgraph Session Management
            C -->|Store/Retrieve| D[Redis]
            D -->|Session Data| C
        end
        
        subgraph Vector Search
            C -->|Query| E[Qdrant]
            E -->|Results| C
        end
        
        subgraph LLM Integration
            C -->|Generate| F[Gemini API]
            F -->|Response| C
        end
    end

    subgraph Data Pipeline
        G[RSS Feeds] -->|Fetch| H[Article Parser]
        H -->|Process| I[Embedding Service]
        I -->|Store| E
    end

    subgraph Storage
        D -->|Persist| J[Redis Storage]
        E -->|Persist| K[Qdrant Storage]
    end
```

## 2. Chat Request Flow
```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Redis
    participant Qdrant
    participant Gemini

    Client->>Server: POST /api/chat
    Server->>Redis: Validate Session
    Redis-->>Server: Session Valid
    
    Server->>Redis: Store User Message
    Server->>Qdrant: Search Similar Articles
    Qdrant-->>Server: Return Relevant Articles
    
    Server->>Gemini: Generate Response
    Gemini-->>Server: Stream Response
    
    loop Stream Response
        Server->>Client: SSE: Word Chunks
    end
    
    Server->>Redis: Store Bot Response
    Server->>Client: SSE: Sources
```

## 3. Data Ingestion Pipeline
```mermaid
graph LR
    subgraph RSS Collection
        A[RSS Feed 1] -->|Fetch| B[Article Parser]
        C[RSS Feed 2] -->|Fetch| B
        D[RSS Feed N] -->|Fetch| B
    end

    subgraph Processing
        B -->|Parse| E[Article Storage]
        E -->|Create| F[Embeddings]
        F -->|Store| G[Vector DB]
    end

    subgraph Storage
        E -->|Save| H[JSON Files]
        G -->|Index| I[Qdrant Collection]
    end

    subgraph Monitoring
        J[Ingestion Logs] -->|Track| K[Status Dashboard]
    end
```

## 4. Session Management Flow
```mermaid
stateDiagram-v2
    [*] --> CreateSession
    CreateSession --> StoreSession: Generate UUID
    StoreSession --> ActiveSession: Store in Redis
    
    state ActiveSession {
        [*] --> StoreMessage
        StoreMessage --> UpdateHistory
        UpdateHistory --> [*]
    }
    
    ActiveSession --> ExpiredSession: TTL > 60min
    ExpiredSession --> [*]: Cleanup
    
    state StoreMessage {
        [*] --> ValidateSession
        ValidateSession --> StoreUserMessage
        StoreUserMessage --> StoreBotResponse
        StoreBotResponse --> [*]
    }
```

## 5. Vector Search Process
```mermaid
graph TB
    subgraph Query Processing
        A[User Query] -->|Create| B[Query Embedding]
        B -->|Search| C[Vector Search]
    end

    subgraph Result Processing
        C -->|Retrieve| D[Similar Articles]
        D -->|Format| E[Context]
        E -->|Generate| F[Response]
    end

    subgraph Storage
        G[Article Embeddings] -->|Index| H[Qdrant Collection]
        H -->|Query| C
    end

    subgraph Optimization
        I[Batch Processing] -->|Optimize| J[Search Performance]
        K[Cache] -->|Speed Up| C
    end
```

## 6. Error Handling Flow
```mermaid
graph TD
    subgraph Error Detection
        A[Request] -->|Validate| B{Valid?}
        B -->|No| C[400 Bad Request]
        B -->|Yes| D[Process]
    end

    subgraph Error Processing
        D -->|Error| E{Error Type}
        E -->|Session| F[Session Error]
        E -->|Vector| G[Search Error]
        E -->|LLM| H[Generation Error]
    end

    subgraph Error Response
        F -->|Return| I[Error Response]
        G -->|Return| I
        H -->|Return| I
    end

    subgraph Recovery
        I -->|Log| J[Error Logs]
        J -->|Monitor| K[Alert System]
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

## Deployment

1. **Docker Deployment**:
   ```bash
   docker-compose up --build
   ```

2. **Environment Setup**:
   - Set required environment variables
   - Configure Redis and Qdrant
   - Set up SSL/TLS
