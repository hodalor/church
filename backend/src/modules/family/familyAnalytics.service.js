import Member from '../members/member.model.js';

const buildFamilyUnits = (members = []) => {
  const families = new Map();

  members.forEach((member) => {
    const familyKey = member.familyGroupId || `member:${member.memberId}`;
    const entry = families.get(familyKey) || {
      familyGroupId: member.familyGroupId || null,
      members: [],
      children: 0,
      couples: 0,
      statuses: [],
    };

    entry.members.push(member);
    entry.children += Array.isArray(member.children) ? member.children.length : 0;
    entry.statuses.push(member.healthScore?.status || 'new');
    families.set(familyKey, entry);
  });

  families.forEach((family) => {
    family.couples = family.members.filter((member) => member.maritalStatus === 'married').length >= 2 ? 1 : 0;
  });

  return [...families.values()];
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
