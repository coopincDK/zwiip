/**
 * Find exact duplicate photos.
 * Only matches when fileSize is known (>0) and identical + same dimensions.
 * This is very accurate since two different photos almost never have
 * the exact same byte-count.
 */
export function findDuplicateGroups(photos) {
  const groups = new Map();

  for (const photo of photos) {
    // Skip photos without known file size — can't reliably compare
    if (!photo.fileSize || photo.fileSize === 0) continue;

    // Key: exact file size in bytes (very strong signal)
    // Two different photos with same byte-count is extremely rare
    const key = `${photo.fileSize}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(photo);
  }

  const duplicateGroups = [];
  for (const [key, group] of groups) {
    if (group.length >= 2) {
      // Extra verification: dimensions must also match
      const subGroups = new Map();
      for (const photo of group) {
        const dimKey = `${photo.width}x${photo.height}`;
        if (!subGroups.has(dimKey)) subGroups.set(dimKey, []);
        subGroups.get(dimKey).push(photo);
      }

      for (const [dimKey, subGroup] of subGroups) {
        if (subGroup.length >= 2) {
          duplicateGroups.push({
            key: `dup_${key}_${dimKey}`,
            photos: subGroup.sort((a, b) => (a.creationTime || 0) - (b.creationTime || 0)),
            count: subGroup.length,
            type: 'duplicate',
          });
        }
      }
    }
  }

  return duplicateGroups.sort((a, b) => b.count - a.count);
}

/**
 * Find burst photos: taken within 1.5 seconds of each other
 * with identical dimensions (same camera, rapid fire).
 */
export function findBurstGroups(photos, timeWindowMs = 1500) {
  if (photos.length < 2) return [];

  // Only photos with valid timestamps
  const valid = photos.filter(p => p.creationTime && p.creationTime > 0);
  const sorted = valid.sort((a, b) => a.creationTime - b.creationTime);

  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = sorted[i].creationTime - sorted[i - 1].creationTime;
    const sameDimensions =
      sorted[i].width === sorted[i - 1].width &&
      sorted[i].height === sorted[i - 1].height;

    if (timeDiff > 0 && timeDiff <= timeWindowMs && sameDimensions) {
      currentGroup.push(sorted[i]);
    } else {
      if (currentGroup.length >= 3) {
        // Require 3+ for burst (2 could just be coincidence)
        groups.push({
          key: `burst_${currentGroup[0].id}`,
          photos: currentGroup,
          count: currentGroup.length,
          type: 'burst',
        });
      }
      currentGroup = [sorted[i]];
    }
  }

  if (currentGroup.length >= 3) {
    groups.push({
      key: `burst_${currentGroup[0].id}`,
      photos: currentGroup,
      count: currentGroup.length,
      type: 'burst',
    });
  }

  return groups;
}

/**
 * Find photos with identical filenames (copied/shared duplicates).
 */
export function findFilenameDuplicates(photos) {
  const groups = new Map();

  for (const photo of photos) {
    if (!photo.filename) continue;
    // Normalize: lowercase, trim
    const name = photo.filename.toLowerCase().trim();
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(photo);
  }

  const duplicateGroups = [];
  for (const [name, group] of groups) {
    if (group.length >= 2) {
      duplicateGroups.push({
        key: `fname_${name}`,
        photos: group.sort((a, b) => (a.creationTime || 0) - (b.creationTime || 0)),
        count: group.length,
        type: 'filename',
      });
    }
  }

  return duplicateGroups;
}
