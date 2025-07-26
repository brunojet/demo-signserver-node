// Rotas para intent
import { Router } from 'express';
import { createIntentHandler } from './intent_controller';

const router = Router();

router.post('/intent', createIntentHandler);

export default router;
