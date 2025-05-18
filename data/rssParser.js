const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const { v4 : uuidv4 } = require('uuid');

const parser = new Parser();

const RSS_FEEDS = [
  'https://rss.app/feeds/t4Qy9rzx18tClHXo.xml',
  'https://rss.app/feeds/tX5rkoDovj47fkir.xml'
];

async function fetchAndStoreArticles() {
  try {
    const allItems = [];
    
    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        console.log(`Fetched ${feed.items.length} items from ${feedUrl}`);
        
        feed.items.forEach(item => {
          const article = {
            id: uuidv4(),
            title: item.title,
            link: item.link,
            publishDate: item.pubDate,
            content: item.contentSnippet || item.content || '',
            source: feed.title || 'Unknown Source'
          };
          
          allItems.push(article);
        });
      } catch (error) {
        console.error(`Error fetching feed ${feedUrl}:`, error.message);
      }
    }
    
    const sortedItems = allItems.sort((a, b) => {
      return new Date(b.publishDate) - new Date(a.publishDate);
    });
    
    const latestArticles = sortedItems.slice(0, 50);
    const dataDir = path.join(__dirname, '..', 'data');
    
    try {
      console.log('Creating data directory:', dataDir);
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create data directory:', err);
      if (err.code !== 'EEXIST') throw err;
    }
    
    const filePath = path.join(dataDir, 'articles.json');
    await fs.writeFile(filePath, JSON.stringify(latestArticles, null, 2));
    
    console.log(`Saved ${latestArticles.length} articles to ${filePath}`);
    return latestArticles;
  } catch (err) {
    console.error('Failed to fetch and store articles:', err);
    throw err;
  }
}




async function loadArticles() {
  try {
    const filePath = path.join(__dirname, 'articles.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load articles:', err);
    return [];
  }
}

module.exports = {
  fetchAndStoreArticles,
  loadArticles
};