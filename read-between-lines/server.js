const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const DOCS = [
  { file: "handbook.txt", label: "Employee Handbook" },
  { file: "onboarding.txt", label: "Onboarding Guide" },
  { file: "architecture.txt", label: "Architecture Overview" },
  { file: "policies.txt", label: "Company Policies" },
];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/documents", (req, res) => {
  res.json(DOCS);
});

app.get("/download", (req, res) => {
  const requestedFile = req.query.file;

  if (!requestedFile) {
    return res
      .status(400)
      .sendFile(path.join(__dirname, "public", "error.html"));
  }

  // VULNERABLE LINE: user input flows straight into the filesystem path.
  const filePath = path.join(__dirname, ".", requestedFile);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(404)
        .sendFile(path.join(__dirname, "public", "error.html"));
    }
    res.type("text/plain").send(data);
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "error.html"));
});

app.listen(PORT, () => {
  console.log(`Read Between the Lines running at http://localhost:${PORT}`);
});
