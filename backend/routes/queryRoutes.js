const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  getRecipients,
  listQueries,
  createQuery,
  getQueryMessages,
  sendQueryMessage,
} = require('../controllers/queryController');

const router = express.Router();

router.use(protect);
router.get('/recipients', getRecipients);
router.get('/', listQueries);
router.post('/', createQuery);
router.get('/:queryId/messages', getQueryMessages);
router.post('/:queryId/messages', sendQueryMessage);

module.exports = router;