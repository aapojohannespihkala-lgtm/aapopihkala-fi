// View-only screen layout. Source anchors and their 13px cues never move.
export const p186eCaptionFontPx = 14;
const gap = 4;
const intersects = (a, b) => a.x < b.x + b.width + gap &&
  b.x < a.x + a.width + gap && a.y < b.y + b.height + gap &&
  b.y < a.y + a.height + gap;

// Enrich the existing verified source-attached Sprite. Reuse its canvas and
// parent; the seed raster in ReviewPresentation may evolve independently.
function prepareReadableCaption(THREE, sprite) {
  const source = sprite.parent, data = source.userData;
  const group = data.representationKind === 'electricalGroupSourceLabelAnchor';
  const text = (group ? 'Ryhmä ' + String(data.sourceGroupKey ?? '') : String(data.sourceText ?? ''))
    .trim().replace(/\s+/g, ' ');
  const canvas = sprite.material?.map?.image, context = canvas?.getContext?.('2d');
  if (!context || !text || text.length > 512 || !source.geometry?.attributes?.position)
    throw Error('P186E_CAPTION_INPUT');
  const font = `bold ${p186eCaptionFontPx * 2}px system-ui, sans-serif`;
  context.font = font;
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? line + ' ' + word : word;
    if (line && context.measureText(next).width > 536) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  canvas.width = Math.ceil(Math.max(...lines.map(t => context.measureText(t).width)) + 24);
  canvas.height = lines.length * 36 + 16;
  context.fillStyle = 'rgba(24,32,43,0.96)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffe4a3'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = font;
  lines.forEach((t, i) => context.fillText(t, canvas.width / 2, 26 + i * 36));
  const previous = sprite.material.map;
  sprite.material.map = new THREE.CanvasTexture(canvas);
  sprite.material.map.colorSpace = THREE.SRGBColorSpace;
  sprite.material.needsUpdate = true;
  previous.dispose();
  source.geometry.computeBoundingBox();
  const center = source.geometry.boundingBox.getCenter(new THREE.Vector3());
  Object.assign(sprite.userData, {sourceCaptionDisplayText: text, sourceCaptionLines: lines,
    sourceCaptionWidthPx: canvas.width / 2, sourceCaptionHeightPx: canvas.height / 2,
    sourceCaptionAnchor: center.toArray(), sourceCaptionKey: group ? data.annotationStableKey : data.sourceLabelId});
  let leader = sprite.children.find(c => c.userData?.p186eCaptionLeader === true);
  if (!leader) {
    leader = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(),
    ]), new THREE.LineBasicMaterial({color: 0xffd34d, transparent: true, opacity: 0.85,
      depthTest: false, depthWrite: false, toneMapped: false}));
    leader.name = 'P186E_VIEW_ONLY_CAPTION_LEADER';
    leader.userData = {p186eCaptionLeader: true, viewerDerived: true, physicalPlacementClaim: false};
    leader.renderOrder = 35; leader.frustumCulled = false;
    sprite.add(leader);
  }
  leader.visible = true;
}

export function layoutP186ECaptions(items, width, height) {
  const placed = [];
  const anchors = items.map(t => ({x: t.x - 8, y: t.y - 8, width: 16, height: 16}));
  // Reserve wide multiline notes first; small group labels can use the gaps.
  for (const item of [...items].sort((a, b) => b.height - a.height || b.width - a.width ||
      a.y - b.y || a.x - b.x || a.key.localeCompare(b.key))) {
    const candidates = [];
    for (let row = 0; row <= items.length; row++) {
      for (const side of [-1, 1]) {
        const y = side < 0 ? item.y - 12 - item.height - row * (item.height + gap)
          : item.y + 12 + row * (item.height + gap);
        for (const offset of [0, -item.width / 2 - 12, item.width / 2 + 12]) {
          const x = Math.max(gap, Math.min(width - gap - item.width, item.x - item.width / 2 + offset));
          const rect = {x, y, width: item.width, height: item.height};
          if (x < gap || y < gap || x + item.width > width - gap || y + item.height > height - gap ||
              anchors.some(a => intersects(rect, a)) || placed.some(a => intersects(rect, a))) continue;
          candidates.push({...rect, cost: Math.hypot(x + item.width / 2 - item.x,
            y + item.height / 2 - item.y)});
        }
      }
      if (candidates.length) break;
    }
    if (!candidates.length) return {state: 'NO_SPACE', placements: []};
    candidates.sort((a, b) => a.cost - b.cost || a.y - b.y || a.x - b.x);
    const {cost, ...rect} = candidates[0];
    placed.push({...item, ...rect, anchor: {x: item.x, y: item.y}});
  }
  return {state: 'READABLE', placements: placed};
}

export function createP186ECaptionLayout({THREE, root, canvas, floor}) {
  const captions = [];
  root.traverse(object => {
    if (object.isSprite && object.userData?.p186eViewerSourceCaption === true &&
        object.parent?.userData?.p186eReviewVariant === floor &&
        object.parent?.userData?.p186eReviewRole === 'QUESTION_TARGET_80') captions.push(object);
  });
  for (const sprite of captions) prepareReadableCaption(THREE, sprite);
  let previous = '';
  let suppressed = false;
  const visible = object => {
    for (let p = object; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  return {
    update(camera) {
      // The source isolation proof intentionally hides every caption. Avoid
      // traversing the whole GLB and projecting invisible sprites on each RAF.
      // The first visible frame must still recompute and restore its audit.
      if (captions.length > 0 && captions.every(sprite => sprite.visible === false)) {
        if (!suppressed) {
          suppressed = true;
          previous = '';
          canvas.dataset.p186eCaptionLayout = JSON.stringify({state: 'CAPTIONS_TEMPORARILY_HIDDEN',
            floor, expectedCount: captions.length, laidOutCount: 0, allSourceCaptionsInView: false,
            captions: [], pixelsVerified: false, humanReview: 'NOT_RUN'});
        }
        return;
      }
      suppressed = false;
      const rect = canvas.getBoundingClientRect();
      const width = Math.round(rect.width), height = Math.round(rect.height);
      if (width < 1 || height < 1) return;
      camera.updateMatrixWorld(true);
      root.updateMatrixWorld(true);
      const source = captions.map(sprite => {
        const data = sprite.userData, parent = sprite.parent;
        const point = new THREE.Vector3().fromArray(data.sourceCaptionAnchor).applyMatrix4(parent.matrixWorld);
        const projected = point.clone().project(camera);
        return {sprite, point, projected, key: data.sourceCaptionKey,
          x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2,
          width: data.sourceCaptionWidthPx, height: data.sourceCaptionHeightPx,
          shown: visible(sprite)};
      });
      const fingerprint = JSON.stringify([width, height, camera.matrixWorld.toArray(),
        camera.projectionMatrix.toArray(), source.map(s => [s.key, s.point.toArray(), s.shown])]);
      if (fingerprint === previous) return;
      previous = fingerprint;
      const onscreen = source.filter(s => s.shown && s.projected.z >= -1 && s.projected.z <= 1 &&
        s.x >= 0 && s.x <= width && s.y >= 0 && s.y <= height);
      const result = layoutP186ECaptions(onscreen, width, height);
      const unproject = (x, y, z) => new THREE.Vector3(x / width * 2 - 1, 1 - y / height * 2, z).unproject(camera);
      const audit = [];
      for (const item of result.placements) {
        const {sprite, projected, point, anchor, x, y} = item;
        const cx = x + item.width / 2, cy = y + item.height / 2;
        const center = unproject(cx, cy, projected.z);
        sprite.position.copy(sprite.parent.worldToLocal(center.clone()));
        const parentScale = sprite.parent.getWorldScale(new THREE.Vector3());
        const sx = unproject(cx + item.width / 2, cy, projected.z).distanceTo(unproject(cx - item.width / 2, cy, projected.z));
        const sy = unproject(cx, cy + item.height / 2, projected.z).distanceTo(unproject(cx, cy - item.height / 2, projected.z));
        sprite.scale.set(sx / Math.abs(parentScale.x), sy / Math.abs(parentScale.y), 1);
        sprite.updateWorldMatrix(true, true);
        const edge = unproject(Math.max(x, Math.min(x + item.width, anchor.x)),
          Math.max(y, Math.min(y + item.height, anchor.y)), projected.z);
        const leader = sprite.children.find(c => c.userData?.p186eCaptionLeader === true);
        if (leader) {
          leader.geometry.setFromPoints([sprite.worldToLocal(point.clone()), sprite.worldToLocal(edge)]);
          leader.geometry.computeBoundingSphere();
        }
        audit.push({sourceKey: item.key, text: sprite.userData.sourceCaptionDisplayText,
          lines: sprite.userData.sourceCaptionLines, fontPx: p186eCaptionFontPx,
          rect: {x, y, width: item.width, height: item.height}, anchor});
      }
      // Audit describes layout, not authenticated pixels or human approval.
      canvas.dataset.p186eCaptionLayout = JSON.stringify({state: result.state, floor, width, height,
        expectedCount: captions.length, laidOutCount: audit.length,
        allSourceCaptionsInView: audit.length === captions.length,
        captions: audit, pixelsVerified: false, humanReview: 'NOT_RUN'});
    },
  };
}
