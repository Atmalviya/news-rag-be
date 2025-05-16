const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');

const parser = new Parser();

// RSS feeds to fetch from
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
            id: generateId(item.title, item.pubDate),
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
    console.log(latestArticles);
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

fetchAndStoreArticles();
