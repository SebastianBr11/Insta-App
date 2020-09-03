const express = require("express");
const { pupReq, getUser, tryLogin } = require("./util");

const router = express.Router();

router.use(express.json());

router.get("/api/search", async (req, res) => {
  const { q } = req.query;
  console.log("/api/search?q=" + q);
  try {
    const results = await pupReq(q);
    if (results == 401) {
      res.sendStatus(401);
    }
    res.json({ query: q, results });
  } catch (e) {
    console.log("send 400 " + e);
    res.sendStatus(400);
  }
});

router.get("/api/login", async (req, res) => {
  console.log("/api/login");
  const { login } = req.headers;
  try {
    const code = await tryLogin(JSON.parse(login));
    if (code != "good") {
      res.sendStatus(code);
      return;
    }
    res.json({ message: "successful" });
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

router.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  console.log("/api/user/" + id);
  let user = null;
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

module.exports = router;
