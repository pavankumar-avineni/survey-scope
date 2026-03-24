const express = require('express');
const workspaceController = require('../controllers/workspace.controller');
const { authenticate, requireVerified } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all workspace routes
router.use(authenticate);
router.use(requireVerified);

router.get('/', workspaceController.getWorkspaces);
router.post('/', workspaceController.createWorkspace);
router.get('/:wid', workspaceController.getWorkspace);
router.patch('/:wid', workspaceController.updateWorkspace);
router.get('/:wid/members', workspaceController.getMembers);
router.post('/:wid/invites', workspaceController.inviteUser);
router.delete('/:wid/members/:uid', workspaceController.removeMember);

module.exports = router;