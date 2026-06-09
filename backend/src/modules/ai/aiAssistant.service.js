import Anthropic from '@anthropic-ai/sdk';
import env from '../../config/env.js';
import { createHttpError } from '../../utils/httpError.js';
import Tenant from '../tenants/model.js';
import AiRequest from './models/aiRequest.model.js';

const defaultModel = 'claude-sonnet-4-20250514';

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

const createClient = () => {
  if (!env.ANTHROPIC_API_KEY) {
    throw createHttpError(503, 'AI assistant is not configured. Add ANTHROPIC_API_KEY to enable this feature.');
  }

  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
};

const getChurchName = async (tenantId) => {
  if (!tenantId) {
    return 'the church';
  }

  const tenant = await Tenant.findOne({ tenantId: normalizeTenantId(tenantId) })
    .select('churchName')
    .lean();
  return tenant?.churchName || 'the church';
};

const extractText = (response) =>
  (response?.content || [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();

const extractTokensUsed = (response) =>
  Number(response?.usage?.input_tokens || 0) + Number(response?.usage?.output_tokens || 0);

const runAiRequest = async ({
  tenantId,
  requestedBy,
  feature,
  systemPrompt,
  userPrompt,
  model = defaultModel,
  maxTokens = 3000,
}) => {
  try {
    const client = createClient();
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const text = extractText(response);
    const tokensUsed = extractTokensUsed(response);

    await AiRequest.create({
      tenantId: normalizeTenantId(tenantId),
      requestedBy: requestedBy || '',
      feature,
      prompt: userPrompt,
      response: text,
      tokensUsed,
      model,
    });

    return {
      text,
      tokensUsed,
      model,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createHttpError(502, 'AI request failed. Please try again later.', {
      cause: error.message,
    });
  }
};

export const generateSermonDraft = async ({
  topic,
  scripture,
  sermonType,
  targetAudience,
  duration,
  churchContext,
  tenantId,
  requestedBy,
}) => {
  const churchName = await getChurchName(tenantId);
  return runAiRequest({
    tenantId,
    requestedBy,
    feature: 'sermon_draft',
    systemPrompt: `You are an experienced pastor and sermon writer for a Christian church. The church is called ${churchName}. You write biblically sound, practical, and engaging sermons. Always structure sermons clearly with: Introduction, Main Points (3), Illustrations, Application, and Conclusion. Keep language accessible and relevant to the target audience.`,
    userPrompt: `Write a ${sermonType} sermon on the topic: ${topic}
Key scripture: ${scripture}
Target audience: ${targetAudience}
Approximate duration: ${duration} minutes
Additional context: ${churchContext}

Format the sermon with clear headings for each section.
Include 3 main points with supporting scriptures.
Include a relevant real-life illustration for each point.
End with a clear call to action and closing prayer.`,
    maxTokens: 4000,
  });
};

export const generateAnnouncement = async ({
  eventTitle,
  date,
  venue,
  keyDetails,
  tone,
  channels,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'announcement_draft',
    systemPrompt:
      'You are a church communications specialist. You write clear, warm, and engaging church announcements. Keep announcements concise but compelling. Match the tone requested.',
    userPrompt: `Write a church announcement for:
Event: ${eventTitle}
Date/Time: ${date}
Venue: ${venue}
Key details: ${keyDetails}
Tone: ${tone}
Channel: ${channels}

Provide:
1. A short headline
2. A primary announcement body
3. A concise SMS/WhatsApp version when appropriate
4. A clear call to action.`,
    maxTokens: 1200,
  });

export const generateMeetingSummary = async ({
  meetingTitle,
  meetingNotes,
  attendees,
  desiredTone,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'meeting_summary',
    systemPrompt:
      'You summarize church leadership meetings clearly and accurately. Focus on decisions, action items, owners, and timelines.',
    userPrompt: `Summarize this church meeting.
Title: ${meetingTitle}
Attendees: ${attendees}
Preferred tone: ${desiredTone}
Raw notes:
${meetingNotes}

Format the output with:
1. Summary
2. Key decisions
3. Action items with owners where possible
4. Prayer points if implied by the discussion.`,
    maxTokens: 1800,
  });

export const generateMemberNarrative = async ({
  memberName,
  memberSummary,
  careContext,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'member_report_narrative',
    systemPrompt:
      'You write warm, factual, pastoral narratives for member reports. Be respectful, concise, and action-oriented.',
    userPrompt: `Write a pastoral member report narrative.
Member: ${memberName}
Summary data:
${memberSummary}
Care context:
${careContext}

Produce a short narrative with:
1. Current status
2. Key strengths
3. Areas needing attention
4. Recommended next steps.`,
    maxTokens: 1400,
  });

export const generateGrowthAnalysis = async ({
  analyticsSummary,
  targetPeriod,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'growth_analysis_narrative',
    systemPrompt:
      'You are a church strategy analyst. Turn analytics into practical and balanced growth narratives without exaggeration.',
    userPrompt: `Write a church growth analysis narrative for ${targetPeriod}.
Analytics summary:
${analyticsSummary}

Structure the response with:
1. Executive summary
2. Growth drivers
3. Risks and constraints
4. Recommended strategic actions for the next quarter.`,
    maxTokens: 1800,
  });

export const generatePrayerPoints = async ({
  theme,
  context,
  audience,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'prayer_points',
    systemPrompt:
      'You write biblically grounded church prayer points that are specific, encouraging, and suitable for congregational use.',
    userPrompt: `Generate prayer points for the following:
Theme: ${theme}
Audience: ${audience}
Context: ${context}

Provide 10 prayer points with short supporting scriptures where appropriate.`,
    maxTokens: 1200,
  });

export const generateDevotional = async ({
  theme,
  scripture,
  audience,
  tenantId,
  requestedBy,
}) =>
  runAiRequest({
    tenantId,
    requestedBy,
    feature: 'devotional',
    systemPrompt:
      'You write clear, biblically faithful devotionals for everyday Christian growth. Keep them warm, practical, and encouraging.',
    userPrompt: `Write a devotional on:
Theme: ${theme}
Scripture: ${scripture}
Audience: ${audience}

Include:
1. Title
2. Main devotional reflection
3. Practical application
4. Closing prayer`,
    maxTokens: 1500,
  });

export const getAIRequestHistory = async (tenantId, query = {}) => {
  const items = await AiRequest.find({
    tenantId: normalizeTenantId(tenantId),
    ...(query.feature ? { feature: String(query.feature).trim() } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(query.limit) || 50, 200))
    .lean();

  return {
    items,
    total: items.length,
  };
};
