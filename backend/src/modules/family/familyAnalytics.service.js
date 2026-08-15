import Member from '../members/member.model.js';

const householdRelationships = new Set([
  'spouse',
  'wife',
  'husband',
  'parent',
  'child',
  'father',
  'mother',
  'son',
  'daughter',
]);

const buildFamilyUnits = (members = []) => {
  const memberMap = new Map(
    members
      .filter((member) => member?.memberId)
      .map((member) => [member.memberId, member]),
  );
  const adjacency = new Map(
    [...memberMap.keys()].map((memberId) => [memberId, new Set()]),
  );

  const linkMembers = (leftId, rightId) => {
    if (!leftId || !rightId || leftId === rightId) {
      return;
    }

    if (!adjacency.has(leftId) || !adjacency.has(rightId)) {
      return;
    }

    adjacency.get(leftId).add(rightId);
    adjacency.get(rightId).add(leftId);
  };

  const groupedMemberIds = new Map();

  members.forEach((member) => {
    if (!member?.memberId) {
      return;
    }

    if (member.familyGroupId) {
      const groupedIds = groupedMemberIds.get(member.familyGroupId) || [];
      groupedIds.push(member.memberId);
      groupedMemberIds.set(member.familyGroupId, groupedIds);
    }

    if (member.spouseMemberId) {
      linkMembers(member.memberId, member.spouseMemberId);
    }

    (Array.isArray(member.familyRelationships) ? member.familyRelationships : []).forEach((relationship) => {
      if (householdRelationships.has(String(relationship.relationship || '').trim().toLowerCase())) {
        linkMembers(member.memberId, relationship.memberId);
      }
    });
  });

  groupedMemberIds.forEach((memberIds) => {
    const [firstId, ...restIds] = memberIds;
    restIds.forEach((memberId) => linkMembers(firstId, memberId));
  });

  const visited = new Set();
  const families = [];

  memberMap.forEach((member, memberId) => {
    if (visited.has(memberId)) {
      return;
    }

    const stack = [memberId];
    const familyMembers = [];

    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      const currentMember = memberMap.get(currentId);
      if (currentMember) {
        familyMembers.push(currentMember);
      }

      (adjacency.get(currentId) || new Set()).forEach((linkedId) => {
        if (!visited.has(linkedId)) {
          stack.push(linkedId);
        }
      });
    }

    const familyGroupId =
      familyMembers.find((item) => item.familyGroupId)?.familyGroupId || null;
    const couples = familyMembers.some(
      (item) =>
        item.spouseMemberId &&
        familyMembers.some((candidate) => candidate.memberId === item.spouseMemberId),
    )
      ? 1
      : familyMembers.filter((item) => item.maritalStatus === 'married').length >= 2
        ? 1
        : 0;

    families.push({
      familyGroupId,
      members: familyMembers,
      children: familyMembers.reduce(
        (sum, item) => sum + (Array.isArray(item.children) ? item.children.length : 0),
        0,
      ),
      couples,
      statuses: familyMembers.map((item) => item.healthScore?.status || 'new'),
    });
  });

  return families;
};

export const getFamilyOverview = async (tenantId) => {
  const members = await Member.find({ tenantId, isDeleted: false });
  const families = buildFamilyUnits(members);

  return {
    totalFamilies: families.length,
    totalMembers: members.length,
    familiesWithChildren: families.filter((family) => family.children > 0).length,
    couples: families.filter((family) => family.couples > 0).length,
    singleParentFamilies: families.filter(
      (family) => family.children > 0 && family.members.filter((member) => member.maritalStatus === 'married').length < 2,
    ).length,
    atRiskFamilies: families.filter((family) =>
      family.statuses.some((status) => ['at_risk', 'inactive', 'drifting'].includes(status)),
    ).length,
  };
};

export const getFamilySegments = async (tenantId) => {
  const members = await Member.find({ tenantId, isDeleted: false });
  const families = buildFamilyUnits(members);

  return families.map((family) => ({
    familyGroupId: family.familyGroupId,
    memberCount: family.members.length,
    children: family.children,
    statuses: family.statuses,
    members: family.members.map((member) => ({
      memberId: member.memberId,
      name: `${member.firstName} ${member.lastName}`.trim(),
      healthStatus: member.healthScore?.status || 'new',
    })),
  }));
};

export const getAtRiskFamilies = async (tenantId) => {
  const members = await Member.find({ tenantId, isDeleted: false });
  const families = buildFamilyUnits(members);

  return families
    .filter((family) => family.statuses.some((status) => ['at_risk', 'inactive', 'drifting'].includes(status)))
    .map((family) => ({
      familyGroupId: family.familyGroupId,
      memberCount: family.members.length,
      members: family.members.map((member) => ({
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`.trim(),
        healthStatus: member.healthScore?.status || 'new',
      })),
    }));
};
