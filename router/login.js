const express = require("express");
const { PrismaClient } = require('@prisma/client')
const router = express.Router();
let bodyParser = require("body-parser");
let jsonParser = bodyParser.json();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const mm16ztoken = "example-only";
const mm16zrefreshtoken = "example-only";

const db = require("../db");
const prisma = new PrismaClient()

router.post("/login", jsonParser, async (req, res, next) => {
  try {
    // const emailQuery = `SELECT * FROM "mm16-webboard".users WHERE email = $1`;
    // const emailResult = await db.any(emailQuery, [req.body.email]);

    const emailResult = await prisma.users.findMany({
      where: {
        email: req.body.email
      }
    });

    if (emailResult.length === 0) {
      return res.json({ status: "error", message: "user not found" });
    }

    const user = emailResult[0];

    bcrypt.compare(req.body.password, user.password, async (err, isLogin) => {
      if (isLogin) {
        const accessToken = jwt.sign(
            {
              email: user.email,
              username: user.username,
              userId: user.user_id,
            },
            mm16ztoken,
            {
              expiresIn: "900s",
            }
        );
        const refreshToken = jwt.sign(
            {
              username: user.username,
              userId: user.user_id,
            },
            mm16zrefreshtoken,
            {
              expiresIn: "1d",
            }
        );

        // const updateRefreshTokenQuery = `UPDATE "mm16-webboard".users SET refresh_token = $1 WHERE email = $2`;
        // db.none(updateRefreshTokenQuery, [refreshToken, user.email]);

        await prisma.users.update({
          where: {
            user_id: user.user_id
          },
          data: {
            refresh_token: refreshToken
          }
        });

        res.cookie("jwtToken", refreshToken, {
          httpOnly: true,
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "none",
        });

        res.json({
          status: "ok",
          message: "login success",
          accessToken,
        });
      } else {
        res.json({status: "error", message: err});
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

module.exports = router;
