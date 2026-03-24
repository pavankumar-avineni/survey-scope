const db = require('../models/db');
const slugify = require('../utils/slugify');

class WorkspaceService {
  async getUserWorkspaces(userId) {
    return db('workspaces')
      .join('workspace_members', 'workspaces.id', 'workspace_members.workspace_id')
      .where('workspace_members.user_id', userId)
      .whereNull('workspaces.deleted_at')
      .select('workspaces.*', 'workspace_members.role')
      .orderBy('workspaces.created_at', 'desc');
  }
  
  async createWorkspace(userId, name) {
    // Generate unique slug
    let slug = slugify(name);
    let counter = 1;
    while (await db('workspaces').where({ slug }).first()) {
      slug = `${slugify(name)}-${counter}`;
      counter++;
    }
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Create workspace
      const [workspace] = await trx('workspaces')
        .insert({
          name,
          slug,
          owner_id: userId,
        })
        .returning('*');
      
      // Add user as owner
      await trx('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      });
      
      await trx.commit();
      return workspace;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getWorkspaceById(workspaceId, userId) {
    const workspace = await db('workspaces')
      .where({ id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!workspace) {
      throw new Error('WORKSPACE_NOT_FOUND');
    }
    
    // Check membership
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    return { ...workspace, role: membership.role };
  }
  
  async updateWorkspace(workspaceId, userId, updates) {
    // Check permissions
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // If updating slug, check uniqueness
    if (updates.slug) {
      const existing = await db('workspaces')
        .where({ slug: updates.slug })
        .whereNot({ id: workspaceId })
        .first();
      
      if (existing) {
        throw new Error('SLUG_ALREADY_EXISTS');
      }
    }
    
    const [updated] = await db('workspaces')
      .where({ id: workspaceId })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');
    
    return updated;
  }
  
  async getWorkspaceMembers(workspaceId, userId) {
    // Verify access
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    return db('workspace_members')
      .where({ workspace_id: workspaceId })
      .join('users', 'workspace_members.user_id', 'users.id')
      .select('users.id', 'users.email', 'users.name', 'workspace_members.role', 'workspace_members.created_at')
      .orderBy('workspace_members.created_at', 'desc');
  }
  
  async inviteUser(workspaceId, inviterId, email, role) {
    // Check permissions
    const inviter = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: inviterId })
      .first();
    
    if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Find user by email
    const user = await db('users').where({ email }).first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    
    // Check if already a member
    const existing = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: user.id })
      .first();
    
    if (existing) {
      throw new Error('ALREADY_MEMBER');
    }
    
    // Add to workspace
    await db('workspace_members').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role,
    });
    
    return { userId: user.id, email: user.email, role };
  }
  
  async removeMember(workspaceId, userIdToRemove, actingUserId) {
    // Check permissions
    const actingUser = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: actingUserId })
      .first();
    
    if (!actingUser || (actingUser.role !== 'owner' && actingUser.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Cannot remove the last owner
    const owners = await db('workspace_members')
      .where({ workspace_id: workspaceId, role: 'owner' });
    
    const isLastOwner = owners.length === 1 && owners[0].user_id === userIdToRemove;
    if (isLastOwner) {
      throw new Error('CANNOT_REMOVE_LAST_OWNER');
    }
    
    await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userIdToRemove })
      .delete();
  }
}

module.exports = new WorkspaceService();