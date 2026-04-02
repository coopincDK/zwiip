import { useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';

// Cache album references to avoid repeated lookups
const albumCache = new Map();

export function useAlbumManager() {
  // Get or create an album by name
  const getOrCreateAlbum = useCallback(async (albumName) => {
    if (!albumName) return null;

    // Check cache first
    if (albumCache.has(albumName)) {
      return albumCache.get(albumName);
    }

    try {
      // Try to find existing album
      let album = await MediaLibrary.getAlbumAsync(albumName);

      if (!album) {
        // We need a temp asset to create the album
        // On iOS, albums are created when adding an asset to them
        // So we just return null and create on first add
        return null;
      }

      albumCache.set(albumName, album);
      return album;
    } catch (error) {
      console.error('Error getting album:', error);
      return null;
    }
  }, []);

  // Add a photo to an album (creates album if needed)
  const addToAlbum = useCallback(async (photoId, albumName) => {
    if (!albumName || !photoId) return false;

    try {
      let album = await MediaLibrary.getAlbumAsync(albumName);

      if (album) {
        // Album exists, add the asset
        await MediaLibrary.addAssetsToAlbumAsync([photoId], album, false);
      } else {
        // Create album with this asset
        await MediaLibrary.createAlbumAsync(albumName, photoId, false);
      }

      // Refresh cache
      album = await MediaLibrary.getAlbumAsync(albumName);
      if (album) albumCache.set(albumName, album);

      return true;
    } catch (error) {
      console.error('Error adding to album:', error);
      return false;
    }
  }, []);

  return {
    getOrCreateAlbum,
    addToAlbum,
  };
}
