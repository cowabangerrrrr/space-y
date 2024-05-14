import * as path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import cookieParser from "cookie-parser";
import v4 from "uuid";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const rootDir = process.cwd();
const port = 3030;
const app = express();

let nameUser = null;

app.use(express.static(path.join(rootDir, "spa/build")));
app.use(express.json());
app.use(cookieParser(require('cookie-parser')));

app.get("/client.mjs", (_, res) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.sendFile(path.join(rootDir, "client.mjs"), {
    maxAge: -1,
    cacheControl: false,
  });
});

function routeCheck(request, response, next) {
    const username = request.cookies["logged"];
    if (!username && !(request.path.startsWith("/static") || request.path.startsWith("/api") || request.path === "/login")) {
        response.redirect("/login");
    }
    next();
}

app.use(routeCheck);

app.get("/", (_, res) => {
  res.send(":)");
});

app.get("*", (_, res) => {
  res.sendFile(path.join(rootDir, "spa/build/index.html"));
})

app.get('/api/user', (_, res) => {
    const nameUser = req.cookies["logged"];
    res.json({user: nameUser || null});
});

app.post('/api/login', (req, res) => {
    const username = req.body?.username;
    console.log(req.body);
    res.cookie("logged", username, {httpOnly: true, secure: true, sameSite: "strict"});
    if (username) {
        nameUser = username;
        res.json({ username });
    } else {
        res.status(400).json({ error: 'Username is required' });
    }
});

app.delete('/api/logout', (req, res) => {
    nameUser = null;
    res.clearCookie("logged");
    res.json({ message: 'User logged out' });
});

https
    .createServer(
        {
            key: fs.readFileSync("certs/server.key"),
            cert: fs.readFileSync("certs/server.cert"),
        },
        app
    )
    .listen(port, function () {
        console.log(
            `Example app listening on port ${port}! Go to https://localhost:3000/`
        );
    });