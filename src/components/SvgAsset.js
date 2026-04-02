import React, { useState, useEffect } from 'react';
import { SvgXml } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Cache loaded SVG strings
const cache = {};

export default function SvgAsset({ source, width, height, style }) {
  const [xml, setXml] = useState(null);

  useEffect(() => {
    // Check cache first
    const key = typeof source === 'number' ? source : JSON.stringify(source);
    if (cache[key]) { setXml(cache[key]); return; }

    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        
        if (!asset.localUri) {
          console.warn('SvgAsset: no localUri for asset');
          return;
        }
        
        const content = await FileSystem.readAsStringAsync(asset.localUri);
        cache[key] = content;
        if (!cancelled) setXml(content);
      } catch (e) {
        console.warn('SvgAsset load error:', e.message || e);
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  if (!xml) return null;
  return <SvgXml xml={xml} width={width} height={height} style={style} />;
}
