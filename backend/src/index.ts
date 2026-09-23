import cors from "cors";
import express from "express";
import placesRouter from "./routes/places";
import conciergeRouter from "./routes/concierge";
import adminRouter from "./routes/admin";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "localvibe-api" });
});

app.use("/api/places", placesRouter);
app.use("/api/concierge", conciergeRouter);
app.use("/api/admin", adminRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

app.listen(port, () => {
  console.log(`LocalVibe API escuchando en http://localhost:${port}`);
});