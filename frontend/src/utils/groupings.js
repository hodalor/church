const normalizeId = (value) => String(value || '').trim();

export const normalizeGroupings = (groupings = []) =>
  (Array.isArray(groupings) ? groupings : [])
    .map((grouping) => ({
      ...grouping,
      id: normalizeId(grouping?.id),
      name: String(grouping?.name || '').trim(),
      parentId: normalizeId(grouping?.parentId) || null,
      kind: String(grouping?.kind || 'group').trim() || 'group',
      description: String(grouping?.description || '').trim(),
    }))
    .filter((grouping) => grouping.id && grouping.name);

export const getChildGroupings = (groupings = [], parentId = null) => {
  const normalizedParentId = normalizeId(parentId) || null;

  return normalizeGroupings(groupings).filter((grouping) =>
    normalizedParentId ? grouping.parentId === normalizedParentId : !grouping.parentId,
  );
};

export const getTopLevelGroupings = (groupings = []) => getChildGroupings(groupings, null);

export const sanitizeGroupingPath = (groupings = [], selectedIds = []) => {
  const normalizedGroupings = normalizeGroupings(groupings);
  const requestedPath = Array.isArray(selectedIds) ? selectedIds.map(normalizeId).filter(Boolean) : [];
  const safePath = [];
  let parentId = null;

  for (const selectedId of requestedPath) {
    const levelOptions = getChildGroupings(normalizedGroupings, parentId);
    const nextSelection = levelOptions.find((option) => option.id === selectedId);

    if (!nextSelection) {
      break;
    }

    safePath.push(nextSelection.id);
    parentId = nextSelection.id;
  }

  return safePath;
};

export const buildGroupingLevels = (groupings = [], selectedIds = []) => {
  const normalizedGroupings = normalizeGroupings(groupings);
  const safePath = sanitizeGroupingPath(normalizedGroupings, selectedIds);
  const levels = [];
  let parentId = null;
  let depth = 0;

  while (true) {
    const options = getChildGroupings(normalizedGroupings, parentId);
    if (!options.length) {
      break;
    }

    const selectedId = safePath[depth] || '';
    levels.push({
      depth,
      parentId,
      options,
      selectedId,
    });

    if (!selectedId) {
      break;
    }

    parentId = selectedId;
    depth += 1;
  }

  return levels;
};

export const buildGroupingPathLabels = (groupings = [], selectedIds = []) => {
  const normalizedGroupings = normalizeGroupings(groupings);
  const safePath = sanitizeGroupingPath(normalizedGroupings, selectedIds);
  const lookup = new Map(normalizedGroupings.map((grouping) => [grouping.id, grouping]));

  return safePath.map((id) => lookup.get(id)?.name).filter(Boolean);
};

export const getGroupingTreeRows = (groupings = []) => {
  const normalizedGroupings = normalizeGroupings(groupings);
  const rows = [];

  const walk = (parentId = null, depth = 0, lineage = []) => {
    getChildGroupings(normalizedGroupings, parentId).forEach((grouping) => {
      const nextLineage = [...lineage, grouping.name];
      rows.push({
        ...grouping,
        depth,
        lineage: nextLineage,
      });
      walk(grouping.id, depth + 1, nextLineage);
    });
  };

  walk();
  return rows;
};

export const getDescendantGroupingIds = (groupings = [], groupingId) => {
  const normalizedGroupings = normalizeGroupings(groupings);
  const rootId = normalizeId(groupingId);

  if (!rootId) {
    return [];
  }

  const descendants = [];
  const visit = (parentId) => {
    getChildGroupings(normalizedGroupings, parentId).forEach((child) => {
      descendants.push(child.id);
      visit(child.id);
    });
  };

  visit(rootId);
  return descendants;
};
