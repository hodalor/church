import { Router } from 'express';
import { body, param } from 'express-validator';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import { createHttpError } from '../../utils/httpError.js';
import * as memberController from './member.controller.js';
import {
  bulkImportValidation,
  createMemberValidation,
  updateMemberValidation,
} from './member.validation.js';

const router = Router();

const importRoles = new Set(['head_pastor', 'treasurer', 'super_admin']);

const requireBulkImportRole = (req, res, next) => {
  if (!importRoles.has(req.user?.role)) {
    return next(createHttpError(403, 'You are not allowed to bulk import members.'));
  }

  return next();
};

router.use(auth, tenantScope);

router.get('/', memberController.getAllMembers);
router.post('/', auditMiddleware('members', 'Member'), createMemberValidation, validate, memberController.createMember);
router.get('/search', memberController.searchMembers);
router.get('/stats', memberController.getMemberStats);
router.get('/health-scores', memberController.getMembersByHealthStatus);
router.post(
  '/bulk-import',
  requireBulkImportRole,
  bulkImportValidation,
  validate,
  memberController.bulkImportMembers,
);
router.get('/export', auditMiddleware('members', 'Member', { action: 'EXPORT' }), memberController.exportMembers);
router.get(
  '/family/:familyGroupId',
  [param('familyGroupId').trim().notEmpty().withMessage('Family group ID is required.')],
  validate,
  memberController.getFamilyGroup,
);
router.patch(
  '/:memberId/photo',
  [
    param('memberId').trim().notEmpty().withMessage('Member ID is required.'),
    body('photoUrl').trim().isURL().withMessage('Photo URL must be valid.'),
  ],
  validate,
  memberController.updateMemberPhoto,
);
router.patch(
  '/:memberId/health-score',
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  memberController.recalculateHealthScore,
);
router.post(
  '/:memberId/restore',
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  memberController.restoreMember,
);
router.get(
  '/:memberId/qr-code',
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  memberController.getMemberQrCode,
);
router.get(
  '/:memberId',
  auditMiddleware('members', 'Member', { logView: true }),
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  memberController.getMemberById,
);
router.patch(
  '/:memberId',
  auditMiddleware('members', 'Member'),
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.'), ...updateMemberValidation],
  validate,
  memberController.updateMember,
);
router.delete(
  '/:memberId',
  auditMiddleware('members', 'Member'),
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  memberController.softDeleteMember,
);

export default router;
