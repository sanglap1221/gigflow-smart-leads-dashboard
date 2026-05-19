import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  exportLeadsCSV,
} from '../controllers/lead.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createLeadSchema,
  updateLeadSchema,
  leadIdParamSchema,
} from '../validations/lead.js';

const router = Router();

// Require authentication for all lead operations
router.use(protect);

router.get('/export', exportLeadsCSV);

router
  .route('/')
  .get(getLeads)
  .post(validate(createLeadSchema), createLead);

router
  .route('/:id')
  .get(validate(leadIdParamSchema), getLead)
  .put(validate(updateLeadSchema), updateLead)
  .delete(
    validate(leadIdParamSchema),
    authorize('ADMIN', 'MANAGER'),
    deleteLead
  );

export default router;
