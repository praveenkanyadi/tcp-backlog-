import express from "express";
import routes from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Id, X-User-Name, X-User-Role");
  next();
});
app.options("*", (_, res) => res.sendStatus(204));
app.use(express.json({ limit: "10mb" }));
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.listen(port, "0.0.0.0", () => console.log(`API listening on port ${port}`));
