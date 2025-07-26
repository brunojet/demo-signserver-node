// Controller para IntentService
import { Request, Response } from 'express';
import { IntentService } from './intent_service';

const intentService = new IntentService();

export const createIntentHandler = (req: Request, res: Response) => {
  try {
    const { profile_id, callback_url } = req.body;
    const intent = intentService.createIntent(profile_id, callback_url);
    res.status(201).json(intent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
