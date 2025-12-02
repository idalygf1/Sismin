// src/controllers/simpledocs.controller.js
import SimpleDoc from "../models/SimpleDoc.js";

const HOST = process.env.HOST_URL || "https://sismin.onrender.com";

// ------------------------------------------------------
// GET /api/simpledocs
// ------------------------------------------------------
export async function listSimpleDocs(req, res) {
  try {
    const docs = await SimpleDoc.find().sort({ createdAt: -1 });

    const fixed = docs.map((doc) => ({
      ...doc._doc,
      fileUrl: doc.fileUrl.startsWith("http")
        ? doc.fileUrl
        : `${HOST}${doc.fileUrl}`,
    }));

    res.json(fixed);
  } catch (err) {
    console.error("Error listSimpleDocs:", err);
    res.status(500).json({ error: err.message });
  }
}

// ------------------------------------------------------
// POST /api/simpledocs
// body: title, dueDate?, file (multipart)
// ------------------------------------------------------
export async function createSimpleDoc(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const { title, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;

    const doc = await SimpleDoc.create({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      fileName: req.file.originalname,
      fileUrl: relativeUrl, // guardamos relativo en BD
    });

    res.status(201).json({
      ...doc._doc,
      fileUrl: `${HOST}${relativeUrl}`, // respondemos absoluto
    });
  } catch (err) {
    console.error("Error createSimpleDoc:", err);
    res.status(500).json({ error: err.message });
  }
}

// ------------------------------------------------------
// DELETE /api/simpledocs/:id
// ------------------------------------------------------
export async function deleteSimpleDoc(req, res) {
  try {
    const { id } = req.params;
    await SimpleDoc.findByIdAndDelete(id);
    res.json({ message: "Documento eliminado" });
  } catch (err) {
    console.error("Error deleteSimpleDoc:", err);
    res.status(500).json({ error: err.message });
  }
}
