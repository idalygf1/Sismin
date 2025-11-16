import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import {
  listConcessions,
  createConcession,
  grantUser,
  updateConcession,
  deleteConcession
} from '../controllers/concessions.controller.js';

const router = Router();
router.use(authJwt);
router.get('/', listConcessions);
router.post('/', createConcession);      // solo propietario
router.post('/grant', grantUser);        // solo propietario
router.patch('/:id', updateConcession);   // editar nombre o active
router.delete('/:id', deleteConcession);  // desactivar concesión
export default router;
