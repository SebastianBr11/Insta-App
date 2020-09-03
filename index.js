const express = require("express");
const path = require("path");
const router = require("./util/router");

const app = express();

const PORT = process.env.PORT || 8000;

app.use("/", router);
app.use(express.static(__dirname + "/client/build"));

app.get("*", function (req, res) {
  console.log(
    "sending file" + path.join(__dirname, "client", "build", "index.html")
  );
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => console.log(`server started on Port ${PORT}`));
