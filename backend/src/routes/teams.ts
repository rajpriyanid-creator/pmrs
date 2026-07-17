import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTeamSchema, inviteSchema, respondInviteSchema } from './teams.schemas';
import { createTeam, inviteToTeam, listMyInvites, listTeams, lockTeam, respondToInvite } from '../controllers/teamsController';
import { writeLimiter } from '../middleware/rateLimiters';

const router = Router();
router.use(requireAuth());

router.get('/', listTeams);
router.get('/invites/mine', requireRole('student'), listMyInvites);
router.post('/', requireRole('student', 'admin'), writeLimiter, validate(createTeamSchema), createTeam);
router.post('/:id/invite', requireRole('student'), writeLimiter, validate(inviteSchema), inviteToTeam);
router.patch('/invites/:id', requireRole('student'), writeLimiter, validate(respondInviteSchema), respondToInvite);
router.post('/:id/lock', requireRole('student'), writeLimiter, lockTeam);

export default router;
