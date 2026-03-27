const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static("public"));

const MUSIC_DIR = path.join(__dirname, "music");

// 🎵 Get all songs
app.get("/songs", (req, res) => {
  const files = fs.readdirSync(MUSIC_DIR);
  const songs = files.filter(f => f.endsWith(".mp3"));
  res.json(songs);
});

// ▶️ Stream song
app.get("/stream/:song", (req, res) => {
  const songPath = path.join(MUSIC_DIR, req.params.song);

  if (!fs.existsSync(songPath)) {
    return res.status(404).send("Song not found");
  }

  const stat = fs.statSync(songPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0]);
    const end = parts[1] ? parseInt(parts[1]) : fileSize - 1;

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(songPath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    });

    stream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    });

    fs.createReadStream(songPath).pipe(res);
  }
});

// ❤️ Favorites (temporary memory)
let favorites = [];

app.post("/favorite", (req, res) => {
  const { song } = req.body;
  if (!favorites.includes(song)) favorites.push(song);
  res.json(favorites);
});

app.get("/favorites", (req, res) => {
  res.json(favorites);
});

// 🌐 PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🔥 Server running at http://localhost:${PORT}`)
);
