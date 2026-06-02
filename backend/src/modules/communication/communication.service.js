import { randomUUID } from 'node:crypto';
import Broadcast from './broadcast.model.js';
import MessageLog from './messageLog.model.js';
import MessageTemplate from './messageTemplate.model.js';
import PrayerRequest from './prayerRequest.model.js';
import Poll from './poll.model.js';
import NotificationLog from '../notifications/notification.model.js';
import Member from '../members/member.model.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import { createHttpError } from '../../utils/httpError.js';
import { normalizeBranchList } from '../../utils/branchScope.js';

const LEADER_ROLES = new Set([
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'care_leader',
]);

const COMMUNICATION_CHANNELS = ['sms', 'email', 'whatsapp', 'push', 'in_app'];

const DEFAULT_CHANNEL_STATUSES = [
  {
    channel: 'sms',
    configured: false,
    hint: 'Add an SMS provider such as Twilio to enable text broadcasts.',
  },
  {
    channel: 'email',
    configured: false,
    hint: 'Connect SMTP or an email provider to send email broadcasts.',
  },
  {
    channel: 'whatsapp',
    configured: false,
    hint: 'Configure a WhatsApp provider before enabling WhatsApp campaigns.',
  },
  {
    channel: 'push',
    configured: false,
    hint: 'Complete Firebase Cloud Messaging setup to send push alerts.',
  },
  {
    channel: 'in_app',
    configured: true,
    hint: '',
  },
];

const normalizePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const isLeader = (role) => LEADER_ROLES.has(String(role || '').trim());

const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const fullNameFromParts = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).join(' ').trim();

const createActor = (user = {}) => ({
  userId: user.userId,
  name: user.fullName || user.username || 'System',
  role: user.role,
});

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRegex = (value) => new RegExp(`^${escapeRegExp(value)}$`, 'i');

const interpolateTemplate = (value, variables = {}) => {
  if (!value) {
    return '';
  }

  return Object.entries(variables).reduce((output, [key, replacement]) => {
    return output.replaceAll(`{{${key}}}`, replacement ?? '');
  }, String(value));
};

const normalizeAudience = (audience = {}) => ({
  type: audience.type || 'all_members',
  branch: audience.branch,
  departments: Array.isArray(audience.departments) ? audience.departments.filter(Boolean) : [],
  cellGroup: audience.cellGroup,
  role: audience.role,
  memberIds: Array.isArray(audience.memberIds) ? audience.memberIds.filter(Boolean) : [],
  estimatedReach: Number(audience.estimatedReach || 0),
});

const buildAudienceBranchFilter = (branchInput) => {
  const branches = normalizeBranchList(branchInput);
  if (!branches.length) {
    return {};
  }

  return { 'audience.branch': { $in: branches } };
};

const buildAudienceMemberFilter = (tenantId, audience = {}) => {
  const filter = {
    tenantId,
    isDeleted: false,
    isActive: true,
  };

  switch (audience.type) {
    case 'branch':
      if (audience.branch) {
        filter.branch = buildRegex(audience.branch);
      }
      break;
    case 'department':
      if (audience.departments?.length) {
        filter.department = { $in: audience.departments };
      }
      break;
    case 'cell_group':
      if (audience.cellGroup) {
        filter.cell_group = buildRegex(audience.cellGroup);
      }
      break;
    case 'specific_members':
      filter.memberId = { $in: audience.memberIds || [] };
      break;
    case 'first_timers':
      filter.membershipStatus = { $in: ['visitor', 'new_convert'] };
      break;
    default:
      break;
  }

  return filter;
};

const resolveAudienceRecipients = async (tenantId, audience = {}) => {
  const normalizedAudience = normalizeAudience(audience);
  const memberFilter = buildAudienceMemberFilter(tenantId, normalizedAudience);

  const members = await Member.find(memberFilter)
    .select('memberId firstName lastName phone email branch department cell_group membershipStatus')
    .lean();

  const memberMap = new Map(members.map((member) => [member.memberId, member]));
  let users = [];

  if (normalizedAudience.type === 'role') {
    users = await User.find({
      tenantId,
      isActive: true,
      role: normalizedAudience.role,
    })
      .select('memberId fullName username email phone role fcmToken')
      .lean();
  } else if (normalizedAudience.type === 'all_members') {
    users = await User.find({
      tenantId,
      isActive: true,
      role: { $ne: 'super_admin' },
    })
      .select('memberId fullName username email phone role fcmToken')
      .lean();
  } else {
    const memberIds = members.map((member) => member.memberId).filter(Boolean);
    if (memberIds.length > 0) {
      users = await User.find({
        tenantId,
        isActive: true,
        memberId: { $in: memberIds },
      })
        .select('memberId fullName username email phone role fcmToken')
        .lean();
    }
  }

  const userMap = new Map();
  for (const user of users) {
    if (user.memberId) {
      userMap.set(user.memberId, user);
    }
  }

  if (normalizedAudience.type === 'role') {
    return users.map((user) => {
      const member = user.memberId ? memberMap.get(user.memberId) : null;
      return {
        userId: user._id.toString(),
        memberId: user.memberId,
        fullName:
          user.fullName ||
          fullNameFromParts(member?.firstName, member?.lastName) ||
          user.username ||
          'Member',
        email: user.email || member?.email || '',
        phone: user.phone || member?.phone || '',
        role: user.role,
        fcmToken: user.fcmToken || '',
      };
    });
  }

  if (members.length > 0) {
    return members.map((member) => {
      const user = userMap.get(member.memberId);
      return {
        userId: user?._id?.toString() || null,
        memberId: member.memberId,
        fullName:
          user?.fullName ||
          fullNameFromParts(member.firstName, member.lastName) ||
          user?.username ||
          'Member',
        email: user?.email || member.email || '',
        phone: user?.phone || member.phone || '',
        role: user?.role || 'member',
        fcmToken: user?.fcmToken || '',
      };
    });
  }

  return users.map((user) => ({
    userId: user._id.toString(),
    memberId: user.memberId,
    fullName: user.fullName || user.username || 'Member',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role,
    fcmToken: user.fcmToken || '',
  }));
};

const buildAudiencePreview = (recipients = []) => ({
  recipientCount: recipients.length,
  missingPhoneCount: recipients.filter((item) => !item.phone).length,
  missingEmailCount: recipients.filter((item) => !item.email).length,
});

const summarizeBroadcastStats = (channels, recipients, logs) => {
  const channelBreakdown = channels.map((channel) => {
    const channelLogs = logs.filter((item) => item.channel === channel);
    return {
      channel,
      sent: channelLogs.filter((item) => ['sent', 'delivered', 'read'].includes(item.status))
        .length,
      delivered: channelLogs.filter((item) => ['delivered', 'read'].includes(item.status))
        .length,
      failed: channelLogs.filter((item) => ['failed', 'skipped'].includes(item.status)).length,
      read: channelLogs.filter((item) => item.status === 'read').length,
    };
  });

  return {
    totalRecipients: recipients.length,
    sent: logs.filter((item) => ['sent', 'delivered', 'read'].includes(item.status)).length,
    delivered: logs.filter((item) => ['delivered', 'read'].includes(item.status)).length,
    failed: logs.filter((item) => ['failed', 'skipped'].includes(item.status)).length,
    read: logs.filter((item) => item.status === 'read').length,
    skippedNoPhone: logs.filter(
      (item) =>
        ['sms', 'whatsapp'].includes(item.channel) && ['failed', 'skipped'].includes(item.status),
    ).length,
    skippedNoEmail: logs.filter(
      (item) => item.channel === 'email' && ['failed', 'skipped'].includes(item.status),
    ).length,
    channelBreakdown,
  };
};

const createNotificationEntries = async (tenantId, broadcast, recipients) => {
  const docs = recipients
    .filter((recipient) => recipient.userId)
    .map((recipient) => ({
      tenantId,
      type: broadcast.type === 'announcement' ? 'announcement' : 'broadcast',
      title: broadcast.title,
      message: broadcast.message,
      targetUserId: recipient.userId,
      memberId: recipient.memberId,
      memberName: recipient.fullName,
      broadcastId: broadcast._id.toString(),
      mediaUrls: (broadcast.attachments || []).map((item) => item.url).filter(Boolean),
      isRead: false,
      createdAt: new Date(),
    }));

  if (!docs.length) {
    return [];
  }

  return NotificationLog.insertMany(docs);
};

const createMessageLogsForBroadcast = async (tenantId, broadcast, recipients) => {
  const now = new Date();
  const logs = [];

  for (const recipient of recipients) {
    for (const channel of broadcast.channels || []) {
      let status = 'sent';
      let deliveredAt = now;
      let failureReason;

      if (channel === 'sms' || channel === 'whatsapp') {
        if (!recipient.phone) {
          status = 'failed';
          deliveredAt = undefined;
          failureReason = 'Recipient has no phone number.';
        }
      } else if (channel === 'email') {
        if (!recipient.email) {
          status = 'failed';
          deliveredAt = undefined;
          failureReason = 'Recipient has no email address.';
        }
      } else if (channel === 'push') {
        if (!recipient.fcmToken || !recipient.userId) {
          status = 'failed';
          deliveredAt = undefined;
          failureReason = 'Recipient has no active FCM token.';
        }
      } else if (channel === 'in_app' && !recipient.userId) {
        status = 'skipped';
        deliveredAt = undefined;
        failureReason = 'Recipient has no linked user account for in-app delivery.';
      }

      logs.push({
        tenantId,
        broadcastId: broadcast._id.toString(),
        recipientUserId: recipient.userId,
        recipientMemberId: recipient.memberId,
        recipientName: recipient.fullName,
        phone: recipient.phone,
        email: recipient.email,
        channel,
        status,
        failureReason,
        sentAt: status === 'failed' || status === 'skipped' ? undefined : now,
        deliveredAt,
        createdAt: now,
      });
    }
  }

  if (!logs.length) {
    return [];
  }

  return MessageLog.insertMany(logs);
};

const dispatchBroadcastDocument = async (broadcastDoc) => {
  const broadcast = toPlain(broadcastDoc);
  const recipients = await resolveAudienceRecipients(broadcast.tenantId, broadcast.audience || {});

  const [logs] = await Promise.all([
    createMessageLogsForBroadcast(broadcast.tenantId, broadcast, recipients),
    createNotificationEntries(broadcast.tenantId, broadcast, recipients),
  ]);

  const stats = summarizeBroadcastStats(
    broadcast.channels || [],
    recipients,
    logs.map((item) => toPlain(item)),
  );

  return Broadcast.findByIdAndUpdate(
    broadcast._id,
    {
      status: 'sent',
      sentAt: new Date(),
      'audience.estimatedReach': recipients.length,
      stats,
      updatedAt: new Date(),
    },
    { new: true },
  );
};

const serializePrayerRequest = (request) => {
  const plain = toPlain(request);
  return {
    ...plain,
    requestId: plain._id?.toString() || plain.requestId,
  };
};

const serializeInboxItem = (item) => {
  const plain = toPlain(item);
  return {
    ...plain,
    id: plain._id?.toString() || plain.id,
  };
};

const serializePoll = (poll, userId) => {
  const plain = toPlain(poll);
  const selectedOption = (plain.options || []).find((option) =>
    (option.voterUserIds || []).includes(userId),
  );

  return {
    ...plain,
    pollId: plain._id?.toString() || plain.pollId,
    hasVoted: Boolean(selectedOption),
    userVoteOptionId: plain.isAnonymous ? null : selectedOption?.id || null,
    options: (plain.options || []).map((option) => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      percentage:
        plain.totalVotes > 0
          ? Number((((option.votes || 0) / plain.totalVotes) * 100).toFixed(2))
          : 0,
    })),
  };
};

const refreshExpiredPolls = async (tenantId) => {
  await Poll.updateMany(
    {
      tenantId,
      status: 'active',
      expiresAt: { $lte: new Date() },
    },
    {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date(),
    },
  );
};

export const getCommunicationDashboard = async (tenantId, query = {}) => {
  const audienceBranchFilter = buildAudienceBranchFilter(query.branches || query.branch);
  const [
    totalBroadcasts,
    scheduledBroadcasts,
    draftBroadcasts,
    activePolls,
    openPrayerRequests,
    recentBroadcasts,
  ] = await Promise.all([
    Broadcast.countDocuments({ tenantId, ...audienceBranchFilter }),
    Broadcast.countDocuments({ tenantId, status: 'scheduled', ...audienceBranchFilter }),
    Broadcast.countDocuments({ tenantId, status: 'draft', ...audienceBranchFilter }),
    Poll.countDocuments({ tenantId, status: 'active', ...audienceBranchFilter }),
    PrayerRequest.countDocuments({ tenantId, status: { $in: ['open', 'in_prayer'] } }),
    Broadcast.find({ tenantId, ...audienceBranchFilter }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return {
    stats: {
      totalBroadcasts,
      scheduledBroadcasts,
      draftBroadcasts,
      activePolls,
      openPrayerRequests,
    },
    recentBroadcasts,
    channelStatuses: DEFAULT_CHANNEL_STATUSES,
  };
};

export const previewBroadcastAudience = async (tenantId, payload) => {
  const recipients = await resolveAudienceRecipients(tenantId, payload.audience || {});
  return {
    ...buildAudiencePreview(recipients),
    audience: {
      ...normalizeAudience(payload.audience),
      estimatedReach: recipients.length,
    },
  };
};

export const createBroadcast = async (tenantId, payload, actor) => {
  const audience = normalizeAudience(payload.audience);
  const preview = await previewBroadcastAudience(tenantId, payload);
  const channels = Array.from(
    new Set(
      [...(Array.isArray(payload.channels) ? payload.channels : ['in_app'])].filter((channel) =>
        COMMUNICATION_CHANNELS.includes(channel),
      ),
    ),
  );
  const status = payload.status || 'draft';

  const broadcast = await Broadcast.create({
    tenantId,
    type: payload.type || 'announcement',
    title: payload.title,
    subject: payload.subject,
    message: payload.message,
    channels: channels.length ? channels : ['in_app'],
    audience: {
      ...audience,
      estimatedReach: preview.recipientCount,
    },
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    status,
    scheduledAt: payload.scheduledAt || undefined,
    recurring: payload.recurring || { enabled: false },
    createdBy: createActor(actor),
  });

  if (status === 'sent') {
    return dispatchBroadcastDocument(broadcast);
  }

  return broadcast;
};

export const updateBroadcast = async (tenantId, broadcastId, payload) => {
  const broadcast = await Broadcast.findOne({ _id: broadcastId, tenantId });
  if (!broadcast) {
    throw createHttpError(404, 'Broadcast not found.');
  }

  if (payload.title !== undefined) broadcast.title = payload.title;
  if (payload.subject !== undefined) broadcast.subject = payload.subject;
  if (payload.message !== undefined) broadcast.message = payload.message;
  if (Array.isArray(payload.channels)) {
    broadcast.channels = payload.channels.filter((channel) =>
      COMMUNICATION_CHANNELS.includes(channel),
    );
  }
  if (payload.audience) {
    const preview = await previewBroadcastAudience(tenantId, payload);
    broadcast.audience = {
      ...normalizeAudience(payload.audience),
      estimatedReach: preview.recipientCount,
    };
  }
  if (payload.status) broadcast.status = payload.status;
  if (payload.scheduledAt !== undefined) broadcast.scheduledAt = payload.scheduledAt || undefined;
  if (payload.recurring) broadcast.recurring = payload.recurring;
  if (Array.isArray(payload.attachments)) broadcast.attachments = payload.attachments;

  await broadcast.save();

  if (payload.status === 'sent' && !broadcast.sentAt) {
    return dispatchBroadcastDocument(broadcast);
  }

  return broadcast;
};

export const getBroadcasts = async (tenantId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const filter = { tenantId, ...buildAudienceBranchFilter(query.branches || query.branch) };

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: String(query.search), $options: 'i' } },
      { message: { $regex: String(query.search), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Broadcast.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Broadcast.countDocuments(filter),
  ]);

  return {
    items,
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
};

export const getBroadcastById = async (tenantId, broadcastId) => {
  const broadcast = await Broadcast.findOne({ _id: broadcastId, tenantId }).lean();
  if (!broadcast) {
    throw createHttpError(404, 'Broadcast not found.');
  }
  return broadcast;
};

export const getBroadcastLogs = async (tenantId, broadcastId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const filter = { tenantId, broadcastId };

  const [items, total] = await Promise.all([
    MessageLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MessageLog.countDocuments(filter),
  ]);

  return {
    items,
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
};

export const duplicateBroadcast = async (tenantId, broadcastId, actor) => {
  const source = await Broadcast.findOne({ _id: broadcastId, tenantId }).lean();
  if (!source) {
    throw createHttpError(404, 'Broadcast not found.');
  }

  return Broadcast.create({
    tenantId,
    type: source.type,
    title: `${source.title} (Copy)`,
    subject: source.subject,
    message: source.message,
    channels: source.channels,
    audience: source.audience,
    attachments: source.attachments,
    status: 'draft',
    recurring: source.recurring,
    duplicatedFromBroadcastId: source._id.toString(),
    createdBy: createActor(actor),
  });
};

export const cancelBroadcast = async (tenantId, broadcastId) => {
  const broadcast = await Broadcast.findOneAndUpdate(
    { _id: broadcastId, tenantId, status: 'scheduled' },
    { status: 'cancelled', updatedAt: new Date() },
    { new: true },
  );

  if (!broadcast) {
    throw createHttpError(404, 'Scheduled broadcast not found.');
  }

  return broadcast;
};

export const resendFailedBroadcast = async (tenantId, broadcastId) => {
  const broadcast = await Broadcast.findOne({ _id: broadcastId, tenantId });
  if (!broadcast) {
    throw createHttpError(404, 'Broadcast not found.');
  }

  const failedLogs = await MessageLog.find({
    tenantId,
    broadcastId,
    status: { $in: ['failed', 'skipped'] },
  });

  for (const log of failedLogs) {
    log.status = 'sent';
    log.failureReason = undefined;
    log.sentAt = new Date();
    log.deliveredAt = new Date();
    await log.save();
  }

  const allLogs = await MessageLog.find({ tenantId, broadcastId }).lean();
  const recipients = Array.from(
    new Set(allLogs.map((item) => item.recipientMemberId || item.recipientUserId).filter(Boolean)),
  );

  broadcast.stats = summarizeBroadcastStats(
    broadcast.channels || [],
    recipients.map((value) => ({ memberId: value })),
    allLogs,
  );
  await broadcast.save();

  return broadcast;
};

export const deleteBroadcast = async (tenantId, broadcastId) => {
  const broadcast = await Broadcast.findOne({ _id: broadcastId, tenantId });
  if (!broadcast) {
    throw createHttpError(404, 'Broadcast not found.');
  }

  if (broadcast.status !== 'draft') {
    throw createHttpError(400, 'Only draft broadcasts can be deleted.');
  }

  await broadcast.deleteOne();
  return { success: true };
};

export const getTemplates = async (tenantId) => {
  return MessageTemplate.find({ tenantId }).sort({ createdAt: -1 }).lean();
};

export const createTemplate = async (tenantId, payload, actor) => {
  return MessageTemplate.create({
    tenantId,
    name: payload.name,
    category: payload.category || 'general',
    channels: payload.channels || ['in_app'],
    subject: payload.subject,
    body: payload.body,
    createdBy: createActor(actor),
  });
};

export const updateTemplate = async (tenantId, templateId, payload) => {
  const template = await MessageTemplate.findOne({ _id: templateId, tenantId });
  if (!template) {
    throw createHttpError(404, 'Template not found.');
  }

  if (payload.name !== undefined) template.name = payload.name;
  if (payload.category !== undefined) template.category = payload.category;
  if (payload.channels !== undefined) template.channels = payload.channels;
  if (payload.subject !== undefined) template.subject = payload.subject;
  if (payload.body !== undefined) template.body = payload.body;

  await template.save();
  return template;
};

export const deleteTemplate = async (tenantId, templateId) => {
  const template = await MessageTemplate.findOne({ _id: templateId, tenantId });
  if (!template) {
    throw createHttpError(404, 'Template not found.');
  }
  if (template.isDefault) {
    throw createHttpError(400, 'Default templates cannot be deleted.');
  }

  await template.deleteOne();
  return { success: true };
};

export const previewTemplate = async (payload) => ({
  subject: interpolateTemplate(payload.subject || '', payload.variables || {}),
  body: interpolateTemplate(payload.body || '', payload.variables || {}),
});

export const getPrayerRequests = async (tenantId, query = {}, user = {}) => {
  const filter = { tenantId };

  if (!isLeader(user.role)) {
    filter.$or = [{ isPublic: true }];
    if (user.userId) {
      filter.$or.push({ createdByUserId: user.userId });
    }
    if (user.memberId) {
      filter.$or.push({ memberId: user.memberId });
    }
  }

  if (query.filter && query.filter !== 'all') {
    if (query.filter === 'urgent') {
      filter.urgency = { $in: ['urgent', 'critical'] };
    } else {
      filter.status = query.filter;
    }
  }

  const requests = await PrayerRequest.find(filter).sort({ createdAt: -1 }).lean();

  return {
    items: requests.map(serializePrayerRequest),
    stats: {
      open: requests.filter((item) => item.status === 'open').length,
      inPrayer: requests.filter((item) => item.status === 'in_prayer').length,
      answered: requests.filter((item) => item.status === 'answered').length,
      total: requests.length,
    },
  };
};

export const submitPrayerRequest = async (tenantId, payload, user = {}) => {
  const member = user.memberId
    ? await Member.findOne({ tenantId, memberId: user.memberId }).select('firstName lastName').lean()
    : null;

  const memberName =
    user.fullName ||
    fullNameFromParts(member?.firstName, member?.lastName) ||
    user.username ||
    'Member';

  const request = await PrayerRequest.create({
    tenantId,
    memberId: user.memberId,
    createdByUserId: user.userId,
    memberName,
    isAnonymous: payload.isAnonymous === true,
    title: payload.title,
    description: payload.description,
    category: payload.category || 'Other',
    urgency: payload.urgency || 'normal',
    isPublic: payload.isPublic === true,
    status: 'open',
  });

  return serializePrayerRequest(request);
};

export const incrementPrayerCount = async (tenantId, requestId, user = {}) => {
  const request = await PrayerRequest.findOne({ _id: requestId, tenantId });
  if (!request) {
    throw createHttpError(404, 'Prayer request not found.');
  }

  if (!request.prayedByUserIds.includes(user.userId)) {
    request.prayedByUserIds.push(user.userId);
    request.prayerCount += 1;
    if (request.status === 'open') {
      request.status = 'in_prayer';
    }
    await request.save();
  }

  return serializePrayerRequest(request);
};

export const updatePrayerRequestStatus = async (tenantId, requestId, payload, actor = {}) => {
  const request = await PrayerRequest.findOne({ _id: requestId, tenantId });
  if (!request) {
    throw createHttpError(404, 'Prayer request not found.');
  }

  if (payload.status) {
    request.status = payload.status;
  }
  if (payload.testimonial !== undefined) {
    request.testimonial = payload.testimonial || undefined;
  }

  if (payload.assignToMe) {
    request.assignedTo = {
      userId: actor.userId,
      name: actor.fullName || actor.username || 'Leader',
    };
  } else if (payload.assignedToUserId) {
    const assignee = await User.findById(payload.assignedToUserId)
      .select('fullName username')
      .lean();
    request.assignedTo = {
      userId: payload.assignedToUserId,
      name: assignee?.fullName || assignee?.username || payload.assignedToUserId,
    };
  }

  await request.save();
  return serializePrayerRequest(request);
};

export const getPolls = async (tenantId, user = {}, query = {}) => {
  await refreshExpiredPolls(tenantId);
  const polls = await Poll.find({
    tenantId,
    ...buildAudienceBranchFilter(query.branches || query.branch),
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    active: polls
      .filter((poll) => poll.status === 'active')
      .map((poll) => serializePoll(poll, user.userId)),
    closed: polls
      .filter((poll) => poll.status === 'closed')
      .map((poll) => serializePoll(poll, user.userId)),
  };
};

export const createPoll = async (tenantId, payload, actor) => {
  const audience = normalizeAudience(payload.audience || {});
  const preview = await previewBroadcastAudience(tenantId, {
    audience,
    message: payload.question || 'Poll',
  });

  const poll = await Poll.create({
    tenantId,
    question: payload.question,
    options: (payload.options || []).map((option) => ({
      id: option.id || randomUUID(),
      text: option.text,
      votes: 0,
      voterUserIds: [],
    })),
    audience: {
      ...audience,
      estimatedReach: preview.recipientCount,
    },
    isAnonymous: payload.isAnonymous === true,
    expiresAt: payload.expiresAt || undefined,
    status: 'active',
    createdBy: createActor(actor),
  });

  return serializePoll(poll, actor.userId);
};

export const closePoll = async (tenantId, pollId) => {
  const poll = await Poll.findOneAndUpdate(
    { _id: pollId, tenantId },
    { status: 'closed', closedAt: new Date(), updatedAt: new Date() },
    { new: true },
  );

  if (!poll) {
    throw createHttpError(404, 'Poll not found.');
  }

  return serializePoll(poll, null);
};

export const voteOnPoll = async (tenantId, pollId, optionId, user = {}) => {
  const poll = await Poll.findOne({ _id: pollId, tenantId });
  if (!poll) {
    throw createHttpError(404, 'Poll not found.');
  }
  if (poll.status !== 'active') {
    throw createHttpError(400, 'This poll is closed.');
  }
  if (poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now()) {
    poll.status = 'closed';
    poll.closedAt = new Date();
    await poll.save();
    throw createHttpError(400, 'This poll has expired.');
  }

  const hasVoted = poll.options.some((option) => option.voterUserIds.includes(user.userId));
  if (hasVoted) {
    throw createHttpError(400, 'You have already voted on this poll.');
  }

  const option = poll.options.find((item) => item.id === optionId);
  if (!option) {
    throw createHttpError(404, 'Poll option not found.');
  }

  option.votes += 1;
  option.voterUserIds.push(user.userId);
  poll.totalVotes += 1;
  await poll.save();

  return serializePoll(poll, user.userId);
};

export const getInbox = async (tenantId, userId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const filter = {
    tenantId,
    $or: [{ targetUserId: userId }, { targetUserId: null }, { targetUserId: { $exists: false } }],
  };

  const [items, total, unreadCount] = await Promise.all([
    NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationLog.countDocuments(filter),
    NotificationLog.countDocuments({ ...filter, isRead: false }),
  ]);

  return {
    items: items.map(serializeInboxItem),
    unreadCount,
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
};

export const getInboxMessageById = async (tenantId, userId, messageId) => {
  const item = await NotificationLog.findOne({
    _id: messageId,
    tenantId,
    $or: [{ targetUserId: userId }, { targetUserId: null }, { targetUserId: { $exists: false } }],
  }).lean();

  if (!item) {
    throw createHttpError(404, 'Inbox message not found.');
  }

  return serializeInboxItem(item);
};

export const getPlatformCommunicationStats = async () => {
  const [tenants, broadcasts, polls, prayerRequests, messageLogs, totalBroadcasts] = await Promise.all([
    Tenant.find({}).select('tenantId churchName').lean(),
    Broadcast.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    Poll.find({}).lean(),
    PrayerRequest.find({ status: { $in: ['open', 'in_prayer'] } }).lean(),
    MessageLog.find({}).sort({ createdAt: -1 }).lean(),
    Broadcast.countDocuments({}),
  ]);

  const tenantBreakdown = tenants.map((tenant) => {
    const tenantBroadcasts = broadcasts.filter((item) => item.tenantId === tenant.tenantId);
    const tenantLogs = messageLogs.filter((item) => item.tenantId === tenant.tenantId);
    const delivered = tenantLogs.filter((item) =>
      ['delivered', 'read', 'sent'].includes(item.status),
    ).length;
    const total = tenantLogs.length || 1;

    return {
      tenantId: tenant.tenantId,
      churchName: tenant.churchName,
      broadcastsSent: tenantBroadcasts.length,
      messagesSent: tenantLogs.length,
      deliveryRate: Number(((delivered / total) * 100).toFixed(1)),
      lastBroadcastDate: tenantBroadcasts[0]?.createdAt || null,
    };
  });

  const messagesByDayMap = new Map();
  for (const log of messageLogs) {
    const dateKey = new Date(log.createdAt).toISOString().slice(0, 10);
    messagesByDayMap.set(dateKey, (messagesByDayMap.get(dateKey) || 0) + 1);
  }

  const channelMap = new Map();
  for (const log of messageLogs) {
    channelMap.set(log.channel, (channelMap.get(log.channel) || 0) + 1);
  }

  return {
    totalMessagesSent: messageLogs.length,
    totalBroadcasts,
    activePolls: polls.filter((poll) => poll.status === 'active').length,
    openPrayerRequests: prayerRequests.length,
    messagesByDay: Array.from(messagesByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => left.date.localeCompare(right.date)),
    messagesByChannel: Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
    })),
    tenantBreakdown,
    recentBroadcasts: broadcasts,
  };
};
