// src/routes/empdocs.routes.js
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import multer from 'multer';
import {
  uploadDoc,
  listDocs,
  deleteDoc,
  updateDoc,
} from '../controllers/empdocs.controller.js';

const router = Router();
router.use(authJwt);

const upload = multer({ dest: 'uploads/' });

// SUBIR DOCUMENTO (Empleado o General)
router.post('/', upload.single('file'), uploadDoc);

// ACTUALIZAR DOCUMENTO
router.put('/:id', upload.single('file'), updateDoc);

// LISTAR DOCUMENTOS
router.get('/', listDocs);

// ELIMINAR (soft delete)
router.delete('/:id', deleteDoc);

export default router;
