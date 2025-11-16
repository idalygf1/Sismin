import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import upload from '../middlewares/upload.js'; // ✅
import { addDoc, listDocs, expiringDocs } from '../controllers/empdocs.controller.js';
import { deleteDoc, updateDoc } from '../controllers/empdocs.controller.js';

const router = Router();
router.use(authJwt);

router.post('/:id/documents', upload.single('file'), addDoc); // body: type, expiresAt?, notes?
router.get('/:id/documents', listDocs);
router.get('/alerts/expiring', expiringDocs); // ?days=30
router.delete('/documents/:docId', deleteDoc);
router.patch('/documents/:docId', updateDoc);

export default router;
