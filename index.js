const express = require("express");
const path = require("path");
const { pupReq, getUser } = require("./util/util");
const { get } = require("http");

const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  const results = await pupReq(q).catch(e => console.log(e));
  res.json({ query: q, results });
});

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  let user = { id };
  try {
    user = await getUser(id);
  } catch (error) {
    console.log(error);
  }
  if (user != null) {
    res.json(user);
  } else {
    res.sendStatus(404);
  }
});

app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => console.log(`server started on Port ${PORT}`));
