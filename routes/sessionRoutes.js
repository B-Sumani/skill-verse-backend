const express = require('express');
const router = express.Router();

// TODO: Import session controller when created
// const { createSession, getSession, updateSession, deleteSession } = require('../controllers/sessionController');

// Session routes
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Session controller not implemented yet'
  });
});

router.get('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Session controller not implemented yet'
  });
});

router.put('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Session controller not implemented yet'
  });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Session controller not implemented yet'
  });
});

module.exports = router; 