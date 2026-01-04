const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("ok"));

// Optional: Debug, ob ffmpeg da ist
app.get("/ffmpeg", (req, res) => {
  const p = spawn("ffmpeg", ["-version"]);
  let out = "";
  p.stdout.on("data", d => (out += d.toString()));
  p.stderr.on("data", d => (out += d.toString()));
  p.on("close", code => res.status(code === 0 ? 200 : 500).send(out));
});

app.post("/render", (req, res) => {
  const textRaw = (req.body?.text ?? "Hallo").toString();
  const text = textRaw
    .replace(/[^a-zA-Z0-9äöüÄÖÜß .,!?\-]/g, "")
    .slice(0, 60);

  // SOFORT antworten → kein 502 mehr
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


  ff.on("error", (e) => {
    console.error("FFMPEG SPAWN ERROR:", e);
    return res.status(500).send("FFmpeg spawn failed");
  });

  // Hard timeout, damit nichts ewig hängt
  const killTimer = setTimeout(() => {
    try { ff.kill("SIGKILL"); } catch {}
  }, 25000);

  ff.on("close", (code) => {
    clearTimeout(killTimer);

    if (code !== 0 || !fs.existsSync(outPath)) {
      console.error("FFMPEG FAILED CODE:", code);
      console.error("FFMPEG STDERR:", stderr);
      return res.status(500).send("FFmpeg failed");
    }

    // MP4 zurückgeben
    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(outPath, (err) => {
      // danach aufräumen
      fs.unlink(outPath, () => {});
      if (err) console.error("sendFile error:", err);
    });
  });
});

// Global error handler (damit nix crasht)
app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR:", err);
  res.status(500).send("Server error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Render server ready on " + port));
