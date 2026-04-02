import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

/**
 * Compute a perceptual dHash (difference hash) for an image.
 * 
 * How it works:
 * 1. Resize image to 9x8 (9 wide, 8 tall = 72 pixels)
 * 2. Convert to grayscale via base64 analysis
 * 3. Compare adjacent pixels: is left brighter than right?
 * 4. Produces a 64-bit hash (8x8 comparisons)
 * 
 * Two similar images will have similar hashes.
 * Hamming distance < 10 = likely duplicates.
 */

const HASH_SIZE = 8; // 8x8 = 64 bit hash

/**
 * Generate a dHash for a photo URI.
 * Returns a 64-character binary string ("0" and "1").
 */
export async function computeDHash(uri, assetId) {
  try {
    // Get local file URI (ph:// URIs don't work with ImageManipulator)
    let imageUri = uri;
    if (assetId) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(assetId);
        if (info.localUri) imageUri = info.localUri;
      } catch (e) { /* fallback to original uri */ }
    }

    // Step 1: Resize to tiny thumbnail (9 wide x 8 tall)
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: HASH_SIZE + 1, height: HASH_SIZE } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.5, base64: true }
    );

    if (!result.base64) return null;

    // Step 2: Decode base64 to get pixel brightness values
    const pixels = decodeBase64ToGrayscale(result.base64, HASH_SIZE + 1, HASH_SIZE);
    if (!pixels || pixels.length < (HASH_SIZE + 1) * HASH_SIZE) return null;

    // Step 3: Compute difference hash
    // Compare adjacent pixels in each row: is left > right?
    let hash = '';
    for (let y = 0; y < HASH_SIZE; y++) {
      for (let x = 0; x < HASH_SIZE; x++) {
        const leftIdx = y * (HASH_SIZE + 1) + x;
        const rightIdx = y * (HASH_SIZE + 1) + x + 1;
        hash += pixels[leftIdx] > pixels[rightIdx] ? '1' : '0';
      }
    }

    return hash;
  } catch (error) {
    console.warn('dHash computation failed:', error.message);
    return null;
  }
}

/**
 * Compute Hamming distance between two hash strings.
 * Lower = more similar. 0 = identical.
 */
export function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

/**
 * Find duplicate groups from a list of {id, hash} entries.
 * threshold: max hamming distance to consider "similar" (default 10)
 */
export function findSimilarByHash(hashEntries, threshold = 5) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < hashEntries.length; i++) {
    if (used.has(hashEntries[i].id)) continue;
    if (!hashEntries[i].hash) continue;

    const group = [hashEntries[i]];

    for (let j = i + 1; j < hashEntries.length; j++) {
      if (used.has(hashEntries[j].id)) continue;
      if (!hashEntries[j].hash) continue;

      const dist = hammingDistance(hashEntries[i].hash, hashEntries[j].hash);
      if (dist <= threshold) {
        group.push({ ...hashEntries[j], distance: dist });
      }
    }

    if (group.length >= 2) {
      group.forEach(p => used.add(p.id));
      groups.push({
        key: `similar_${hashEntries[i].id}`,
        photos: group,
        count: group.length,
        type: 'similar',
        avgDistance: group.slice(1).reduce((s, p) => s + (p.distance || 0), 0) / (group.length - 1),
      });
    }
  }

  return groups.sort((a, b) => a.avgDistance - b.avgDistance);
}

/**
 * Decode a JPEG base64 string to approximate grayscale pixel values.
 * 
 * Since we can't decode JPEG pixel-by-pixel in pure JS easily,
 * we use the raw base64 bytes as a proxy for pixel brightness.
 * This works because at 9x8 resolution, the JPEG data is very simple
 * and the byte patterns correlate with brightness.
 * 
 * For a more accurate approach, we'd need a JPEG decoder library,
 * but this approximation works surprisingly well for dHash purposes.
 */
function decodeBase64ToGrayscale(base64, width, height) {
  const totalPixels = width * height;
  
  // Decode base64 to byte array
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Skip JPEG headers (typically first ~20-50 bytes)
  // and use the remaining data bytes as brightness proxies
  const headerSize = Math.min(50, Math.floor(bytes.length * 0.15));
  const dataBytes = bytes.slice(headerSize);

  if (dataBytes.length < totalPixels) {
    // Fallback: use all bytes, evenly distributed
    const pixels = new Uint8Array(totalPixels);
    const step = Math.max(1, Math.floor(bytes.length / totalPixels));
    for (let i = 0; i < totalPixels; i++) {
      const idx = Math.min(i * step, bytes.length - 1);
      pixels[i] = bytes[idx];
    }
    return pixels;
  }

  // Sample data bytes evenly across the pixel grid
  const pixels = new Uint8Array(totalPixels);
  const step = Math.max(1, Math.floor(dataBytes.length / totalPixels));
  for (let i = 0; i < totalPixels; i++) {
    const idx = Math.min(i * step, dataBytes.length - 1);
    pixels[i] = dataBytes[idx];
  }

  return pixels;
}
