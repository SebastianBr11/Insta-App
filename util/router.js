const express = require("express");
const fs = require("fs.promises");
const { pupReq, getUser, tryLogin } = require("./util");

const router = express.Router();

router.use(express.json());

router.get("/api/search", async (req, res) => {
  const { q } = req.query;
  console.log("/api/search?q=" + q);
  const { uid } = req.headers;
  try {
    const results = await pupReq(uid, q);
    if (results == 401) {
      res.sendStatus(401);
    }
    res.json({ query: q, results });
  } catch (e) {
    console.log("send 400 " + e);
    res.sendStatus(400);
  }
});

router.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  console.log("/api/user/" + id);
  const { uid } = req.headers;
  let user = null;
  try {
    user = await getUser(uid, id);
  } catch (error) {
    console.log(error);
  }
  if (user != null) {
    res.json(user);
  } else {
    res.sendStatus(404);
  }
});

router.get("/api/login", async (req, res) => {
  console.log("/api/login");
  const { login, uid } = req.headers;
  console.log(uid + " is uid");
  try {
    const code = await tryLogin(uid, JSON.parse(login));
    if (code != "good") {
      res.sendStatus(code);
      console.log("sending status: " + code);
      return;
    }
    console.log("sending json with successfull message");
    res.json({ message: "successful" });
  } catch (e) {
    console.log(e);
    console.log("sending 500");
    res.sendStatus(500);
  }
});

router.get("/api/logout", async (req, res) => {
  console.log("/api/logout");
  const { uid } = req.headers;
  try {
    await fs.unlink(__dirname + `/cookies_${uid}.json`);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(404);
  }
});

module.exports = router;
