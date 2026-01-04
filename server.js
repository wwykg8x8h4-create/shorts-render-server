const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("ok");
});

// Render endpoint (antwortet SOFORT)
app.post("/render", (req, res) => {
  const textRaw = (req.body?.text ?? "Hallo").toString();
  const text = textRaw
    .replace(/[^a-zA-Z0-9äöüÄÖÜß .,!?\-]/g, "")
    .slice(0, 60);

  // sofort antworten, damit kein 502 durch wait/crash
  res.status(202).json({ ok: true, msg: "render started", text });

  const outPath = "/tmp/output.mp4";

  const cmd =
    `ffmpeg -y -f lavfi -i color=c=blue:s=1080x1920:d=5 ` +
    `-vf "drawtext=text='${text}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2" ` +
    `-pix_fmt yuv420p ${outPath}`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("FFMPEG ERROR:", err);
      console.error(stderr);
      return;
    }
    console.log("render done");
  });
});

// Download endpoint
app.get("/download", (req, res) => {
  res.setHeader("Content-Type", "video/mp4");
  res.sendFile("/tmp/output.mp4");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Render server ready on " + port);
});
