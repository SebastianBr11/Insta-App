const express = require("express");
const { pupReq } = require("./util/util");

const app = express();

const PORT = 8000 || process.env.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ test: "hi" });
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
