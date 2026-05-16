const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sherlock Is Smart,
an AI assistant for school management. Be concise and clear.

You MUST follow these rules:
- Do NOT generate, create, or describe images, videos, or music
- If asked to create images/videos/music, decline politely

For web searches: When a user asks to search the web, find
information online, or asks about any real-world topic,
respond with ONLY this format, nothing else:
WEB_SEARCH: <search query>

For YouTube searches: When a user asks to find a YouTube video,
respond with ONLY this format, nothing else:
YOUTUBE_SEARCH: <search query>

For combined requests (both web and YouTube), do the web search
first with WEB_SEARCH: format.

For school tasks (schedules, events, notes, announcements),
answer directly without searching.`;

const RESTRICTED_SYSTEM_PROMPT = SYSTEM_PROMPT;

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

async function callAnthropic(messages, language = 'en') {
  const langInstruction = language === 'ka'
    ? 'The user has set their language preference to Georgian. Respond in Georgian (ქართული) by default. If the user writes to you in English, you may respond in English. Match the language the user is writing in, but default to Georgian.\n\nYou must respond exclusively in Georgian language (ქართული). Even if the uploaded library documents are in English, translate and explain their content in Georgian. Never respond in English when the user is in Georgian mode.\n\nIf the user asks a question that relates to the uploaded library content, find the answer in that content, translate it to Georgian, and respond in Georgian only. Never paste raw English text in your response.'
    : 'Respond in English by default. Match the language the user writes in.';
  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    system: [
      {
        type: 'text',
        text: langInstruction + '\n\n' + SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  const response = await stream.finalMessage();
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}

async function callGemini(messages, language = 'en') {
  const langInstruction = language === 'ka'
    ? 'The user has set their language preference to Georgian. Respond in Georgian (ქართული) by default. If the user writes to you in English, you may respond in English. Match the language the user is writing in, but default to Georgian.\n\nYou must respond exclusively in Georgian language (ქართული). Even if the uploaded library documents are in English, translate and explain their content in Georgian. Never respond in English when the user is in Georgian mode.\n\nIf the user asks a question that relates to the uploaded library content, find the answer in that content, translate it to Georgian, and respond in Georgian only. Never paste raw English text in your response.'
    : 'Respond in English by default. Match the language the user writes in.';
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: langInstruction + '\n\n' + RESTRICTED_SYSTEM_PROMPT
  });

  // Convert messages to Gemini format
  // Gemini uses 'user' and 'model' roles (not 'assistant')
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 2048 }
  });

  const result = await chat.sendMessage(lastMessage.content);
  try {
    return result.response.text();
  } catch (err) {
    console.error('Gemini response.text() failed:', err, JSON.stringify(result.response));
    throw err;
  }
}

async function callOpenAI(messages, language = 'en') {
  const langInstruction = language === 'ka'
    ? 'The user has set their language preference to Georgian. Respond in Georgian (ქართული) by default. If the user writes to you in English, you may respond in English. Match the language the user is writing in, but default to Georgian.\n\nYou must respond exclusively in Georgian language (ქართული). Even if the uploaded library documents are in English, translate and explain their content in Georgian. Never respond in English when the user is in Georgian mode.\n\nIf the user asks a question that relates to the uploaded library content, find the answer in that content, translate it to Georgian, and respond in Georgian only. Never paste raw English text in your response.'
    : 'Respond in English by default. Match the language the user writes in.';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const formatted = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: langInstruction + '\n\n' + RESTRICTED_SYSTEM_PROMPT },
      ...formatted
    ],
    max_tokens: 2048
  });

  return response.choices[0].message.content ?? '';
}

async function routeToProvider(provider, messages, language = 'en') {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(messages, language);
    case 'openai':
      return callOpenAI(messages, language);
    case 'gemini':
      return callGemini(messages, language);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

module.exports = { routeToProvider, searchYouTube, searchWeb };
