import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';

const PAGE_SIZE = 20;

export function usePhotoLibrary() {
  const [photos, setPhotos] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Request permissions
  const requestPermission = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  // Load a page of photos
  const loadPhotos = useCallback(async (reset = false) => {
    if (isLoading) return;
    if (!reset && !hasMore) return;

    setIsLoading(true);
    try {
      const options = {
        first: PAGE_SIZE,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      };

      if (!reset && endCursor) {
        options.after = endCursor;
      }

      const result = await MediaLibrary.getAssetsAsync(options);
      
      // Fetch fileSize for each asset (getAssetsAsync doesn't include it)
      const newPhotos = await Promise.all(result.assets.map(async asset => {
        let fileSize = 0;
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset.id);
          fileSize = info.fileSize || 0;
        } catch (e) {}
        return {
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          width: asset.width,
          height: asset.height,
          fileSize,
          creationTime: asset.creationTime,
          duration: asset.duration,
          mediaType: asset.mediaType,
        };
      }));

      if (reset) {
        setPhotos(newPhotos);
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
      }

      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, endCursor]);

  // Delete photos (batch)
  const deletePhotos = useCallback(async (photoIds) => {
    try {
      const result = await MediaLibrary.deleteAssetsAsync(photoIds);
      return result;
    } catch (error) {
      console.error('Error deleting photos:', error);
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (granted) {
        await loadPhotos(true);
      }
    })();
  }, []);

  return {
    photos,
    hasPermission,
    isLoading,
    hasMore,
    totalCount,
    loadPhotos,
    loadMore: () => loadPhotos(false),
    refresh: () => loadPhotos(true),
    deletePhotos,
    requestPermission,
  };
}
