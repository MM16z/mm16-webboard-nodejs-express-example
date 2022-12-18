const express = require("express");
const db = require("../db");
const router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require("jsonwebtoken");

const mm16ztoken = "private";
const mm16zrefreshtoken = "private";

router.post("/refreshjwtauth", jsonParser, (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies?.jwtToken) return res.sendStatus(401);
  const refreshToken = cookies.jwtToken;
  db.query(
    "SELECT * FROM `mm16-webboard`.`users` WHERE username=?",
    [req.body.username],
    (err, username, field) => {
      if (err) return res.sendStatus(403);
      if (!username[0]) return res.sendStatus(204);
      if (username[0]?.refresh_token !== refreshToken)
        return res.sendStatus(403);
      jwt.verify(refreshToken, mm16zrefreshtoken, (err, decoded) => {
        if (err) return res.sendStatus(403);
        // if (err) return res.json({ ERROR: err });
        if (username[0].username !== decoded.username)
          return res.sendStatus(403);
        const accessToken = jwt.sign(
          {
            email: username[0].email,
            username: username[0].username,
            userId: username[0].user_id,
          },
          mm16ztoken,
          {
            expiresIn: "1d",
          }
        );
        res.json({ status: "ok", accessToken });
      });
    }
  );
});

module.exports = router;
