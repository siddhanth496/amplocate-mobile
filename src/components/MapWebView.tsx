import React, { useMemo, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Charger } from '../api/types';
import { relColor } from '../theme/tokens';

// react-native-webview's types clash with React 19's — cast once, use safely.
const RNWebView = WebView as unknown as React.ComponentType<any>;

type Marker = { lat: number; lng: number; color: string; label?: string };

type Props = {
  center: [number, number];
  zoom?: number;
  chargers?: Charger[];
  markers?: Marker[];
  routePoints?: [number, number][] | null;
  userLocation?: [number, number] | null;
  onChargerPress?: (id: string) => void;
  onMapPress?: (lat: number, lng: number) => void;
  style?: StyleProp<ViewStyle>;
};

/** Leaflet map inside a WebView — same dark Carto tiles + volt pins as the web app.
 *  No native map modules, so it runs in Expo Go out of the box. */
export default function MapWebView({
  center, zoom = 12, chargers = [], markers = [], routePoints, userLocation,
  onChargerPress, onMapPress, style,
}: Props) {
  const webref = useRef<any>(null);

  const html = useMemo(() => buildHtml(center, zoom), []); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = useMemo(() => JSON.stringify({
    center, zoom,
    chargers: chargers.map((c) => ({
      id: c.id, lat: c.lat, lng: c.lng, name: c.name,
      color: relColor(c.reliability_score ?? 0.5),
      pct: Math.round((c.reliability_score ?? 0.5) * 100),
    })),
    markers, routePoints: routePoints || [], userLocation,
  }), [center, zoom, chargers, markers, routePoints, userLocation]);

  return (
    <RNWebView
      ref={webref}
      source={{ html }}
      style={[{ backgroundColor: '#101317' }, style]}
      originWhitelist={['*']}
      injectedJavaScript={`window.__update(${payload}); true;`}
      key={payload /* re-inject state on change without full bridge plumbing */}
      onMessage={(e: { nativeEvent: { data: string } }) => {
        try {
          const msg = JSON.parse(e.nativeEvent.data);
          if (msg.type === 'charger' && onChargerPress) onChargerPress(msg.id);
          if (msg.type === 'map' && onMapPress) onMapPress(msg.lat, msg.lng);
        } catch { /* ignore */ }
      }}
      javaScriptEnabled
      domStorageEnabled={false}
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
    />
  );
}

function buildHtml(center: [number, number], zoom: number): string {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;background:#101317}
  .amp-marker{background:transparent;border:none}
</style></head><body><div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([${center[0]}, ${center[1]}], ${zoom});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
  var layer = L.layerGroup().addTo(map);
  var post = function(o){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  map.on('click', function(e){ post({ type:'map', lat: e.latlng.lat, lng: e.latlng.lng }); });

  function chargerIcon(color, pct){
    var s = 32;
    return L.divIcon({ className:'amp-marker', iconSize:[s,s], iconAnchor:[s/2,s], html:
      '<div style="width:'+s+'px;height:'+s+'px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);'+
      'display:flex;align-items:center;justify-content:center;background:'+color+';border:3px solid #0c0e10;'+
      'box-shadow:0 3px 12px rgba(0,0,0,0.6)">'+
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="#10150a" style="transform:rotate(45deg)">'+
      '<path d="M13 2 L5 13 h5 l-2 9 L17 10 h-5 z"/></svg></div>' });
  }
  function dotIcon(color, label){
    return L.divIcon({ className:'amp-marker', iconSize:[70,34], iconAnchor:[35,8], html:
      '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'+
      '<div style="width:16px;height:16px;border-radius:50%;background:'+color+';border:3px solid #0c0e10;'+
      'box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>'+
      (label ? '<span style="font:600 10px sans-serif;color:#f2f5ee;background:rgba(18,21,25,0.9);padding:1px 6px;border-radius:6px">'+label+'</span>' : '')+
      '</div>' });
  }

  window.__update = function(state){
    layer.clearLayers();
    if (state.routePoints && state.routePoints.length > 1) {
      L.polyline(state.routePoints, { color:'#a3e635', weight:5, opacity:0.85, lineCap:'round' }).addTo(layer);
    }
    (state.chargers || []).forEach(function(c){
      L.marker([c.lat, c.lng], { icon: chargerIcon(c.color, c.pct) })
        .on('click', function(){ post({ type:'charger', id: c.id }); })
        .addTo(layer);
    });
    (state.markers || []).forEach(function(m){
      L.marker([m.lat, m.lng], { icon: dotIcon(m.color, m.label) }).addTo(layer);
    });
    if (state.userLocation) {
      L.marker(state.userLocation, { icon: dotIcon('#a3e635', 'You') }).addTo(layer);
    }
    if (state.center) map.setView(state.center, state.zoom || map.getZoom());
  };
</script></body></html>`;
}
