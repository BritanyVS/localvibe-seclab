import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import cors from "cors";
import express from "express";
import placesRouter from "./routes/places";
import conciergeRouter from "./routes/concierge";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import adminPlacesRouter from "./routes/adminPlaces";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "localvibe-api" });
});

app.get("/api/openapi.yaml", (_req, res) => {
  const spec = fs.readFileSync(path.join(process.cwd(), "openapi.yaml"), "utf8");
  res.type("text/yaml").send(spec);
});

app.get("/60d5e20a-06ef-4cee-9145-4e89176405cc.txt", (_req, res) => {
  res.type("text/plain").send("Probely");
});

app.use("/api/places", placesRouter);
app.use("/api/concierge", conciergeRouter);
app.use("/api/admin", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/places", adminPlacesRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

app.listen(port, () => {
  console.log(`LocalVibe API escuchando en http://localhost:${port}`);
});