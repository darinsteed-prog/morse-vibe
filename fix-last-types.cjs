const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `app.get("*", (req, res) => { res.sendFile(path.join(__dirname, "dist", "index.html")); });`,
  `app.get("*", (req: express.Request, res: express.Response) => { res.sendFile(path.join(__dirname, "dist", "index.html")); });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed last type error");
