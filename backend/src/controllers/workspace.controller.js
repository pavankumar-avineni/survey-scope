const workspaceService = require('../services/workspace.service');
const { validate, createWorkspaceSchema, updateWorkspaceSchema, inviteUserSchema } = require('../utils/validation');

class WorkspaceController {
  async getWorkspaces(req, res, next) {
    try {
      const workspaces = await workspaceService.getUserWorkspaces(req.user.id);
      
      res.json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createWorkspace(req, res, next) {
    try {
      const validation = validate(createWorkspaceSchema, req.body);
      if (!validation.success) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
        });
      }
      
      const workspace = await workspaceService.createWorkspace(
        req.user.id,
        validation.data.name
      );
      
      res.status(201).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getWorkspace(req, res, next) {
    try {
      const { wid } = req.params;
      const workspace = await workspaceService.getWorkspaceById(wid, req.user.id);
      
      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateWorkspace(req, res, next) {
    try {
      const validation = validate(updateWorkspaceSchema, req.body);
      if (!validation.success) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
        });
      }
      
      const { wid } = req.params;
      const workspace = await workspaceService.updateWorkspace(
        wid,
        req.user.id,
        validation.data
      );
      
      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getMembers(req, res, next) {
    try {
      const { wid } = req.params;
      const members = await workspaceService.getWorkspaceMembers(wid, req.user.id);
      
      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async inviteUser(req, res, next) {
    try {
      const validation = validate(inviteUserSchema, req.body);
      if (!validation.success) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
        });
      }
      
      const { wid } = req.params;
      const { email, role } = validation.data;
      
      const result = await workspaceService.inviteUser(
        wid,
        req.user.id,
        email,
        role
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async removeMember(req, res, next) {
    try {
      const { wid, uid } = req.params;
      
      await workspaceService.removeMember(wid, uid, req.user.id);
      
      res.json({
        success: true,
        data: {
          message: 'Member removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkspaceController();