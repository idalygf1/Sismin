import { Router } from 'express';
import {
  addDoc,
  listDocs,
  expiringDocs,
  deleteDoc,
  updateDoc,
  getDoc,
} from '../controllers/empdocs.controller.js';

const router = Router();

// Crear documento de empleado
router.post('/', addDoc);

// Listar documentos
router.get('/', listDocs);

// Documentos que vencen pronto
router.get('/expiring', expiringDocs);

// Obtener un documento por id
router.get('/:id', getDoc);

// Actualizar documento
router.put('/:id', updateDoc);

// Eliminar documento
router.delete('/:id', deleteDoc);

export default router;
