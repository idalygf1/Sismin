// src/routes/simpledocs.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  listSimpleDocs,
  createSimpleDoc,
  deleteSimpleDoc,
} from "../controllers/simpledocs.controller.js";
import { authJwt } from "../middlewares/authJwt.js";

const router = Router();

// Para resolver rutas de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// Configuración de multer
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const rand = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, rand + ext);
  },
});

const upload = multer({ storage });

// -----------------------------
// Middleware de auth
// -----------------------------
router.use(authJwt);

// -----------------------------
// Rutas
// -----------------------------
router.get("/", listSimpleDocs);
router.post("/", upload.single("file"), createSimpleDoc);
router.delete("/:id", deleteSimpleDoc);

export default router;
