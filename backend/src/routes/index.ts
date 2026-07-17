import { Router } from 'express';
import authRoutes from './auth';
import programRoutes from './programs';
import facultyRoutes from './faculty';
import studentRoutes from './students';
import teamRoutes from './teams';
import guideRequestRoutes from './guideRequests';
import assignmentRoutes from './assignments';
import panelRoutes from './panels';
import reviewRoutes from './reviews';
import attendanceRoutes from './attendance';
import marksRoutes from './marks';
import notificationRoutes from './notifications';
import adminConfigRoutes from './adminConfig';
import schedulingRoutes from './scheduling';
import reportsRoutes from './reports';
import documentsRoutes from './documents';
import signaturesRoutes from './signatures';

import designationLimitRoutes from './designationLimits';

const router = Router();

router.use('/auth', authRoutes);
router.use('/programs', programRoutes);
router.use('/faculty', facultyRoutes);
router.use('/designation-limits', designationLimitRoutes);
router.use('/students', studentRoutes);
router.use('/teams', teamRoutes);
router.use('/guide-requests', guideRequestRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/panels', panelRoutes);
router.use('/reviews', reviewRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/marks', marksRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin-config', adminConfigRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/reports', reportsRoutes);
router.use('/documents', documentsRoutes);
router.use('/signatures', signaturesRoutes);

export default router;
