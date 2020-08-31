const express = require("express");
const path = require("path");
const { pupReq } = require("./util/util");

const app = express();

app.use(express.static(path.join(__dirname, "client/build")));

const PORT = process.env.PORT || 8000;

app.use(express.json());

// Test for bypassing heroku 30 sec timeout

const extendTimeoutMiddleware = (req, res, next) => {
  const space = " ";
  let isFinished = false;
  let isDataSent = false;

  // Only extend the timeout for API requests
  if (!req.url.includes("/api")) {
    next();
    return;
  }

  res.once("finish", () => {
    isFinished = true;
  });

  res.once("end", () => {
    isFinished = true;
  });

  res.once("close", () => {
    isFinished = true;
  });

  res.on("data", data => {
    // Look for something other than our blank space to indicate that real
    // data is now being sent back to the client.
    if (data !== space) {
      isDataSent = true;
    }
  });

  const waitAndSend = () => {
    setTimeout(() => {
      // If the response hasn't finished and hasn't sent any data back....
      if (!isFinished && !isDataSent) {
        // Need to write the status code/headers if they haven't been sent yet.
        if (!res.headersSent) {
          res.writeHead(202);
        }

        res.write(space);

        // Wait another 15 seconds
        waitAndSend();
      }
    }, 15000);
  };

  waitAndSend();
  next();
};

app.use(extendTimeoutMiddleware);

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  const results = await pupReq(q).catch(e => console.log(e));
  res.json({ query: q, results });
});

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  res.json({ id, p: "hi" });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.listen(PORT, () => console.log(`server started on Port ${PORT}`));
