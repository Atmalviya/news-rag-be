const axios = require("axios");

async function generateAnswer(query, context, articles) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  try {
    const apiUrl ="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

    const formattedCitations = articles
      .map((article, index) => {
        return `[${index + 1}] "${article.title}" - ${
          article.source
        } (${formatDate(article.publishDate)})\n${article.link}`;
      })
      .join("\n\n");

    const prompt = `
      You are a helpful news assistant that answers questions based on recent news articles.

      Question: ${query}

      Below are relevant passages from news articles to help answer this question:

      ${context}

      Sources for citation:
      ${formattedCitations}

      Instructions:
      1. Answer the question accurately based ONLY on the provided article passages.
      2. If the provided passages don't contain enough information to answer, acknowledge this limitation.
      3. When referring to information from articles, cite the source using numbers in square brackets [1], [2], etc.
      4. Make your response conversational and helpful.
      5. Keep your answer concise but comprehensive.

      Please provide a well-formed answer with appropriate citations:
`;

    const response = await axios.post(
      `${apiUrl}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }
    );

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    console.error("Error generating answer with Gemini API:", error);
    if (error.response) {
      console.error("API response:", error.response.data);
    }
    throw error;
  }
}

function formatDate(dateString) {
  if (!dateString) return "Unknown Date";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Unknown Date";
  }
}

module.exports = {
  generateAnswer,
};
