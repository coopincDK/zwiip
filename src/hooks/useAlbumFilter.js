import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';

// Albums that contain "junk" — should still be shown for sorting
const JUNK_ALBUM_NAMES = [
  'screenshots', 'screen shots', 'skærmbilleder',
  'downloads', 'overførsler',
  'whatsapp', 'telegram', 'messenger',
  'snapchat', 'instagram',
  'recently deleted', 'senest slettet',
  'capcut', 'inshot',
];

export function useAlbumFilter() {
  const [albumPhotoIds, setAlbumPhotoIds] = useState(new Set());
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load all albums and their photo IDs
  const loadAlbumData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const allAlbums = await MediaLibrary.getAlbumsAsync();
      setAlbums(allAlbums);

      // Filter to "real" albums (not junk)
      const realAlbums = allAlbums.filter(album => {
        const name = (album.title || '').toLowerCase().trim();
        return !JUNK_ALBUM_NAMES.some(junk => name.includes(junk));
      });

      // Get photo IDs from real albums
      const ids = new Set();
      for (const album of realAlbums) {
        if (album.assetCount === 0) continue;
        let cursor = null;
        let hasMore = true;
        while (hasMore) {
          const opts = { first: 500, mediaType: MediaLibrary.MediaType.photo, album: album.id };
          if (cursor) opts.after = cursor;
          const result = await MediaLibrary.getAssetsAsync(opts);
          for (const asset of result.assets) ids.add(asset.id);
          cursor = result.endCursor;
          hasMore = result.hasNextPage;
        }
      }

      setAlbumPhotoIds(ids);
      setLoaded(true);
    } catch (e) {
      console.warn('Album filter load error:', e);
    }
    setLoading(false);
  }, [loading]);

  // Get photos from a specific album
  const getAlbumPhotos = useCallback(async (albumTitle) => {
    try {
      const allAlbums = await MediaLibrary.getAlbumsAsync();
      const album = allAlbums.find(a => a.title === albumTitle);
      if (!album) return [];

      const photos = [];
      let cursor = null;
      let hasMore = true;
      while (hasMore) {
        const opts = { first: 200, mediaType: MediaLibrary.MediaType.photo, album: album.id };
        if (cursor) opts.after = cursor;
        const result = await MediaLibrary.getAssetsAsync(opts);
        photos.push(...result.assets.map(a => ({
          id: a.id, uri: a.uri, filename: a.filename,
          width: a.width, height: a.height,
          fileSize: a.fileSize || 0, creationTime: a.creationTime,
        })));
        cursor = result.endCursor;
        hasMore = result.hasNextPage;
      }
      return photos;
    } catch (e) {
      console.warn('Album photos load error:', e);
      return [];
    }
  }, []);

  // Check if a photo is in a "real" album
  const isInAlbum = useCallback((photoId) => albumPhotoIds.has(photoId), [albumPhotoIds]);

  return {
    albumPhotoIds,
    albums,
    loading,
    loaded,
    loadAlbumData,
    getAlbumPhotos,
    isInAlbum,
  };
}
