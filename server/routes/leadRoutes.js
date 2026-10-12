import express from 'express';
import {
  generateCampaignLeads,
  getLeads,
  getLeadById,
  updateLeadStatus,
  sendOutreachEmail,
  bulkSendOutreach,
  exportCsv,
  deleteLead,
  clearAllLeads
} from '../controllers/leadController.js';

const router = express.Router();

// Campaign generation
router.post('/campaigns/generate', generateCampaignLeads);

// Leads CRUD & Operations
router.get('/leads', getLeads);
router.get('/leads/export/csv', exportCsv);
router.post('/leads/bulk-send', bulkSendOutreach);
router.delete('/leads/all', clearAllLeads);

router.get('/leads/:id', getLeadById);
router.patch('/leads/:id/status', updateLeadStatus);
router.post('/leads/:id/send', sendOutreachEmail);
router.delete('/leads/:id', deleteLead);

export default router;
