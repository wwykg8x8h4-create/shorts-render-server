const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Health check (damit Render.com sieht: läuft)
app.get("/", (req, res) => res.send("ok"));

// Make.com ruft das auf und bekommt ein MP4 zurück
app.post("/render", (req, res) => {
  const textRaw = (req.body?.text ?? "Hallo").toString();

  // Sicherheits-Filter: keine Sonderzeichen, damit ffmpeg nicht spinnt
  const text = textRaw.replace(/[^a-zA-Z0-9äöüÄÖÜß .,!?\-]/g, "").slice(0, 60);

  const cmd = `
    ffmpeg -y -f lavfi -i color=c=blue:s=1080x1920:d=5 \
    -vf "drawtext=text='${text}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2" \
    -pix_fmt yuv420p output.mp4
  `;

  exec(cmd, (err) => {
    if (err) return res.status(500).send("Render error");
    res.sendFile(__dirname + "/output.mp4");
  });
});

app.listen(3000, () => console.log("Render server ready on 3000"));
