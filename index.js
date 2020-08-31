const express = require("express");
const path = require("path");
const { pupReq } = require("./util/util");

const app = express();

app.use(express.static(path.join(__dirname, "build")));

const PORT = 8000 || process.env.PORT;

app.use(express.json());

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  const results = await pupReq(q).catch(e => console.log(e));
  res.json({ query: q, results });
});

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  res.json({ id });
});

app.listen(PORT, () => console.log(`server started on Port ${PORT}`));
