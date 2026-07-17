import "dotenv/config";

import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.disable("x-powered-by");
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_request, response) => {
  response.json({ message: "Agentic AI API" });
});

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});