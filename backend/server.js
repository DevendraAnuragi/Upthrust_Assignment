// server.js
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory history
let history = [];

// Root route
app.get("/", (req, res) => {
  res.send("✅ Backend running! Use /run-workflow or /history.");
});

// Run workflow
app.post("/run-workflow", async (req, res) => {
  try {
    const { prompt, action } = req.body;

    // Step 1: AI Response
    let ai_response = "This is a mock AI response";
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
        });
        ai_response = completion.choices[0].message.content.trim();
      } catch (err) {
        console.error("OpenAI error:", err.message);
      }
    }

    // Step 2: API Response
    let api_response = "";

    if (action === "weather") {
      try {
        const city = process.env.DEFAULT_CITY || "Delhi";
        const weatherKey = process.env.OPENWEATHER_API_KEY;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherKey}`;
        const weatherRes = await axios.get(weatherUrl);
        const { main, weather } = weatherRes.data;
        api_response = `${weather[0].description}, ${main.temp}°C in ${city}`;
      } catch {
        api_response = "Weather API unavailable";
      }
    } else if (action === "github") {
      try {
        const githubRes = await axios.get(
          "https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc",
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN || ""}`,
            },
          }
        );
        const topRepo = githubRes.data.items[0];
        api_response = `Trending repo: ${topRepo.full_name} ⭐${topRepo.stargazers_count}`;
      } catch {
        api_response = "GitHub API unavailable";
      }
    } else if (action === "news") {
      try {
        const newsKey = process.env.NEWS_API_KEY;
        const newsUrl = `https://newsapi.org/v2/top-headlines?country=in&pageSize=1&apiKey=${newsKey}`;
        const newsRes = await axios.get(newsUrl);
        const topHeadline = newsRes.data.articles[0];
        api_response = `Top headline: ${topHeadline.title}`;
      } catch {
        api_response = "News API unavailable";
      }
    } else {
      api_response = "Invalid action";
    }

    // Combine final result
    const final_result = `${ai_response} ${api_response}`;

    // Save history (last 10)
    const entry = {
      id: Date.now(),
      prompt,
      action,
      ai_response,
      api_response,
      final_result,
      created_at: new Date().toISOString(),
    };
    history.unshift(entry);
    if (history.length > 10) history = history.slice(0, 10);

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Workflow failed", details: err.message });
  }
});

// History route
app.get("/history", (req, res) => {
  res.json({ history });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
