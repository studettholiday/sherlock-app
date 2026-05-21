async function searchYouTube(query) {
  const axios = require('axios');
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${apiKey}`;

  const response = await axios.get(url);
  const items = response.data.items;

  return items.map(item => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));
}

async function searchWeb(query) {
  const axios = require('axios');

  const response = await axios.post('https://google.serper.dev/search',
    { q: query, num: 5 },
    { headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  const results = response.data.organic || [];
  return results.slice(0, 5).map(r => ({
    title: r.title,
    snippet: r.snippet,
    url: r.link
  }));
}

module.exports = { searchYouTube, searchWeb };
