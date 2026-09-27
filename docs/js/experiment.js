/**
 * Experiment Scene Renderer — true 3D perspective projection on Canvas 2D
 * Light Source (Z=0) → Reflection Screen (Z=10) → Gem Grid (Z=50) → Transmission Screen (Z=90)
 */
window.ExperimentRenderer = class ExperimentRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = null;
    this.animId = null;
    this.time = 0;
    this.rotX = -0.3;
    this.rotY = 0.6;
    this.zoom = 1.0;
    this.fov = 800;
    this.dpr = 1;
    this.screenCx = 0;
    this.screenCy = 0;
    this.scale = 1;
    this._cachedCenter = [0, 0, 45];
    this.chargeHistory = [];
    this._needsResize = true;
    this._handleResize = () => { this._needsResize = true; };
    window.addEventListener('resize', this._handleResize);
    this._bindEvents();
    this.resize();
  }

  setEngine(photonEngine) { this.engine = photonEngine; }

  onFrame = null;

  start() {
    if (this.animId) return;
    const loop = () => {
      if (typeof this.onFrame === 'function') this.onFrame();
      if (this.engine) this.engine.step(1);
      this.time += 1 / 60;
      this._sampleCharges();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = this.canvas.clientWidth || 0, ch = this.canvas.clientHeight || 0;
    if (cw > 0 && ch > 0) { this.canvas.width = cw * dpr; this.canvas.height = ch * dpr; }
    this.dpr = dpr;
    this.screenCx = (this.canvas.width / dpr) / 2;
    this.screenCy = (this.canvas.height / dpr) / 2;
    this._needsResize = false;
  }

  resetView() { this.rotX = -0.3; this.rotY = 0.6; this.zoom = 1.0; }

  // ── 3D Rotation & Projection ──────────────────────────────
  _rotate(x, y, z) {
    const cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
    const cy = Math.cos(this.rotY), sy = Math.sin(this.rotY);
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
    return [x * cy + z1 * sy, y1, -x * sy + z1 * cy];
  }

  _project(x, y, z) {
    const cc = this._cachedCenter;
    const [rx, ry, rz] = this._rotate(x - cc[0], y - cc[1], z - cc[2]);
    const pf = this.fov / (this.fov + rz);
    if (pf <= 0) return [this.screenCx, this.screenCy, rz, 0.001];
    const s = this.scale * this.zoom;
    return [this.screenCx + rx * s * pf, this.screenCy + ry * s * pf, rz, pf];
  }

  _rz(x, y, z) {
    const cc = this._cachedCenter;
    return this._rotate(x - cc[0], y - cc[1], z - cc[2])[2];
  }

  _computeSceneCenter(cfg) {
    const zEnd = cfg.lightMode === 'uraninite'
      ? (cfg.transmissionScreenZ || 65) + 10
      : (cfg.transmissionScreenZ || 90);
    this._cachedCenter = [0, 0, ((cfg.sourceZ || 0) + zEnd) / 2];
  }

  _computeFitScale(cfg) {
    // Use a fixed reference grid (4×4, gemSize=8, occluder=2) so the scale
    // stays constant as occluder thickness changes – making the grid grow
    // visually when the user increases the occluder.
    const REF_OT = 2, gs = cfg.gemSize || 8;
    const cols = cfg.gridCols || 4, rows = cfg.gridRows || 4;
    const refGridW = Math.max(cols, rows) * gs + (Math.max(cols, rows) + 1) * REF_OT;
    // Half-diagonal of the reference grid (worst-case lateral extent)
    const latExt = Math.sqrt(2) * (refGridW / 2);
    const minDim = Math.min(this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    this.scale = (minDim * 0.36) / (latExt || 1);
  }

  _sceneExtent(c) {
    const hw = Math.max(c.screenWidth, c.gridWidth, c.sourceWidth) / 2 + 4;
    const hh = Math.max(c.screenHeight, c.gridHeight, c.sourceHeight) / 2 + 4;
    const zEnd = c.lightMode === 'uraninite'
      ? (c.transmissionScreenZ || 65) + 12 + (c.bariteThickness || 5)
      : (c.transmissionScreenZ || 90) + 2;
    return { minX: -hw, maxX: hw, minY: -hh, maxY: hh,
      minZ: (c.sourceZ || 0) - 2, maxZ: zEnd };
  }

  // ── Config ────────────────────────────────────────────────
  _cfg() {
    const def = {
      wavelength: 550, lightMode: 'mono', gridCols: 4, gridRows: 4, gemIds: null,
      sourceZ: 0, reflectionScreenZ: 35, gridZ: 50, transmissionScreenZ: 65,
      gemThickness: 5, gemSize: 8, occluderThickness: 2,
      screenWidth: 30, screenHeight: 20, gridWidth: 24, gridHeight: 24,
      sourceWidth: 8, sourceHeight: 6,
      magneticField: { enabled: false, strength: 0, direction: 'down' },
    };
    if (!this.engine || !this.engine.config) return def;
    const ec = this.engine.config;
    const m = Object.assign({}, def, ec);
    if (ec.magneticField) m.magneticField = Object.assign({}, def.magneticField, ec.magneticField);
    if (this.engine.grid) m.gemIds = this.engine.grid.gemIds;
    const layout = this.engine._layout;
    if (layout) {
      m.gridWidth = layout.totalWidth || def.gridWidth;
      m.gridHeight = layout.totalHeight || def.gridHeight;
    } else {
      const cols = m.gridCols || 4, rows = m.gridRows || 4;
      const gs = m.gemSize || 8, ot = m.occluderThickness || 2;
      m.gridWidth = cols * gs + (cols + 1) * ot;
      m.gridHeight = rows * gs + (rows + 1) * ot;
    }
    m.screenWidth = Math.max(m.gridWidth, def.screenWidth) * 1.8;
    m.screenHeight = Math.max(m.gridHeight, def.screenHeight) * 1.6;
    if (ec.lightMode === 'uraninite') {
      m.sourceWidth = m.gridWidth;
      m.sourceHeight = m.gridHeight;
    } else if (ec.xrdMode && ec.lightMode === 'xray') {
      m.sourceWidth = 3;
      m.sourceHeight = 3;
    } else {
      m.sourceWidth = m.gridWidth * 0.9;
      m.sourceHeight = m.gridHeight * 0.7;
    }
    m.bariteThickness = ec.bariteThickness || 0;
    m.backscatterShield = ec.backscatterShield || false;
    return m;
  }

  _gemAt(c, r, cl) {
    const cols = c.gridCols || 4;
    if (!c.gemIds) return null;
    const id = Array.isArray(c.gemIds[0])
      ? (c.gemIds[r] && c.gemIds[r][cl]) : c.gemIds[r * cols + cl];
    return id ? (window.GEMSTONES || {})[id] || null : null;
  }

  // ── Main Render ───────────────────────────────────────────
  render() {
    if (this._needsResize) this.resize();
    const ctx = this.ctx, dpr = this.dpr;
    const w = this.canvas.width / dpr, h = this.canvas.height / dpr;
    if (w < 1 || h < 1) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);
    const c = this._cfg();
    this._computeSceneCenter(c);
    this._computeFitScale(c);
    if (!isFinite(this.scale)) { ctx.restore(); return; }
    const isUran = c.lightMode === 'uraninite';
    const objs = [
      { z: this._rz(0, 10, (c.sourceZ + c.transmissionScreenZ) / 2), fn: () => this._drawGroundPlane(ctx, c) },
      { z: this._rz(0, 0, c.gridZ), fn: () => this._drawGemGrid(ctx, c) },
      { z: this._rz(0, 0, c.sourceZ), fn: () => this._drawLightSource(ctx, c) },
    ];
    if (!isUran) {
      objs.push({ z: this._rz(0, 0, c.reflectionScreenZ), fn: () => this._drawReflectionScreen(ctx, c) });
      objs.push({ z: this._rz(0, 0, c.transmissionScreenZ), fn: () => this._drawTransmissionScreen(ctx, c) });
    }
    if (isUran && (c.bariteThickness || 0) > 0) {
      objs.push({ z: this._rz(0, 0, c.transmissionScreenZ), fn: () => this._drawBariteBlock(ctx, c) });
    }
    if (isUran) {
      objs.push({ z: this._rz(0, 0, (c.sourceZ || 0) - 3), fn: () => this._drawBackscatterShield(ctx, c) });
    }
    objs.sort((a, b) => b.z - a.z);
    for (const o of objs) o.fn();
    this._drawPhotons(ctx, c);
    this._drawMagneticField(ctx, c);
    this._drawElectrodes(ctx, c);
    this._drawDistanceMarkers(ctx, c);
    this._drawAxisIndicator(ctx, w, h);
    this._drawInsetViews(ctx, c, w, h);
    this._drawChargeGraph(ctx, c, w, h);
    this._drawInfoOverlay(ctx, c, w, h);
    ctx.restore();
  }

  // ── Ground Plane ──────────────────────────────────────────
  _drawGroundPlane(ctx, c) {
    const yf = (c.screenHeight || 20) / 2 + 2;
    const z0 = c.sourceZ || 0, z1 = c.transmissionScreenZ || 90;
    const hw = (c.screenWidth || 30) / 2 + 6;
    const p = [[-hw,yf,z0],[hw,yf,z0],[hw,yf,z1],[-hw,yf,z1]].map(v => this._project(...v));
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    const gy0 = Math.min(p[0][1], p[3][1]), gy1 = Math.max(p[0][1], p[3][1]) + 30;
    if (!isFinite(gy0) || !isFinite(gy1) || gy0 === gy1) {
      ctx.fillStyle = 'rgba(22,27,34,0.3)';
    } else {
      const g = ctx.createLinearGradient(0, gy0, 0, gy1);
      g.addColorStop(0, 'rgba(22,27,34,0)');
      g.addColorStop(1, 'rgba(22,27,34,0.6)');
      ctx.fillStyle = g;
    }
    ctx.fill();
  }

  // ── Screens ───────────────────────────────────────────────
  _drawTransmissionScreen(ctx, c) {
    this._drawScreen(ctx, c.transmissionScreenZ || 90, c.screenWidth || 30, c.screenHeight || 20,
      'Transmission Screen', () => this.engine && typeof this.engine.getTransmissionPattern === 'function'
        ? this.engine.getTransmissionPattern() : null);
  }
  _drawReflectionScreen(ctx, c) {
    this._drawScreen(ctx, c.reflectionScreenZ || 10, (c.screenWidth || 30) * 0.6,
      (c.screenHeight || 20) * 0.6, 'Reflection Screen',
      () => this.engine && typeof this.engine.getReflectionPattern === 'function'
        ? this.engine.getReflectionPattern() : null);
  }
  _drawScreen(ctx, z, sw, sh, label, getPattern) {
    const p = [[-sw/2,-sh/2,z],[sw/2,-sh/2,z],[sw/2,sh/2,z],[-sw/2,sh/2,z]].map(v => this._project(...v));
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#161b22'; ctx.fill();
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.stroke();
    const pattern = getPattern();
    if (pattern && pattern.data && pattern.width && pattern.height)
      this._drawPatternOnScreen(ctx, z, sw, sh, pattern);
    const lp = this._project(0, sh / 2 + 2, z);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(label, lp[0], lp[1]);
  }
  _drawPatternOnScreen(ctx, z, sw, sh, pat) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cw = sw / pat.width, ch = sh / pat.height;
    let maxA = 0;
    for (let i = 3; i < pat.data.length; i += 4) if (pat.data[i] > maxA) maxA = pat.data[i];
    const boost = maxA > 0 ? Math.min(4, 1 / maxA) : 1;
    for (let py = 0; py < pat.height; py++) {
      for (let px = 0; px < pat.width; px++) {
        const i = (py * pat.width + px) * 4;
        const r = Math.min(255, Math.round((pat.data[i] || 0) * 255 * boost));
        const g = Math.min(255, Math.round((pat.data[i+1] || 0) * 255 * boost));
        const b = Math.min(255, Math.round((pat.data[i+2] || 0) * 255 * boost));
        if (r === 0 && g === 0 && b === 0) continue;
        const s = this._project(-sw/2 + px*cw, -sh/2 + py*ch, z);
        const e = this._project(-sw/2 + (px+1)*cw, -sh/2 + (py+1)*ch, z);
        if (!isFinite(s[0]) || !isFinite(e[0])) continue;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(s[0], s[1], Math.max(e[0]-s[0], 1), Math.max(e[1]-s[1], 1));
      }
    }
    ctx.restore();
  }

  // ── Gem Grid + Occluder ───────────────────────────────────
  _drawGemGrid(ctx, c) {
    const gz = c.gridZ || 50, gw = c.gridWidth || 24, gh = c.gridHeight || 24;
    const gd = c.gemThickness || 5, cols = c.gridCols || 4, rows = c.gridRows || 4;
    // Reset per-cell screen bounds (populated below for cell-stats alignment)
    this.cellScreenBounds = new Array(rows * cols).fill(null);
    const hw = gw / 2, hh = gh / 2;
    const corners = [
      [-hw,-hh,gz],[hw,-hh,gz],[hw,hh,gz],[-hw,hh,gz],
      [-hw,-hh,gz+gd],[hw,-hh,gz+gd],[hw,hh,gz+gd],[-hw,hh,gz+gd],
    ];
    const proj = corners.map(p => this._project(p[0], p[1], p[2]));
    const faces = [
      { idx: [0,1,2,3], n: [0,0,-1], col: '#2d333b', front: true },
      { idx: [5,4,7,6], n: [0,0,1], col: '#2d333b' },
      { idx: [4,0,3,7], n: [-1,0,0], col: '#21262d' },
      { idx: [1,5,6,2], n: [1,0,0], col: '#21262d' },
      { idx: [4,5,1,0], n: [0,-1,0], col: '#3a4149' },
      { idx: [3,2,6,7], n: [0,1,0], col: '#1c2129' },
    ];
    let frontVis = false;
    for (const f of faces) {
      if (this._rotate(f.n[0], f.n[1], f.n[2])[2] >= 0) continue;
      if (f.front) { frontVis = true; continue; }
      const v = f.idx.map(i => proj[i]);
      ctx.beginPath(); ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath(); ctx.fillStyle = f.col; ctx.fill();
      ctx.strokeStyle = '#3a4149'; ctx.lineWidth = 0.5; ctx.stroke();
    }
    const cellW = gw / cols, cellH = gh / rows, ins = 0.5;
    if (frontVis) {
      ctx.fillStyle = '#2d333b'; ctx.beginPath();
      ctx.moveTo(proj[0][0], proj[0][1]); ctx.lineTo(proj[1][0], proj[1][1]);
      ctx.lineTo(proj[2][0], proj[2][1]); ctx.lineTo(proj[3][0], proj[3][1]);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a4149'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(proj[0][0], proj[0][1]); ctx.lineTo(proj[1][0], proj[1][1]);
      ctx.moveTo(proj[0][0], proj[0][1]); ctx.lineTo(proj[3][0], proj[3][1]);
      ctx.stroke();
      ctx.strokeStyle = '#1c2129'; ctx.beginPath();
      ctx.moveTo(proj[2][0], proj[2][1]); ctx.lineTo(proj[1][0], proj[1][1]);
      ctx.moveTo(proj[2][0], proj[2][1]); ctx.lineTo(proj[3][0], proj[3][1]);
      ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      for (let r = 0; r < rows; r++) for (let cl = 0; cl < cols; cl++) {
        const x0 = -hw + cl*cellW + ins, y0 = -hh + r*cellH + ins;
        const w2 = cellW - ins*2, h2 = cellH - ins*2;
        const wp = [[x0,y0,gz],[x0+w2,y0,gz],[x0+w2,y0+h2,gz],[x0,y0+h2,gz]].map(v => this._project(...v));
        ctx.beginPath(); ctx.moveTo(wp[0][0], wp[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(wp[i][0], wp[i][1]);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    for (let r = 0; r < rows; r++) for (let cl = 0; cl < cols; cl++) {
      const x0 = -hw + cl*cellW + ins, y0 = -hh + r*cellH + ins;
      const w2 = cellW - ins*2, h2 = cellH - ins*2;
      const gem = this._gemAt(c, r, cl);
      const gc = gem ? gem.color : '#445566';
      const wp = [[x0,y0,gz],[x0+w2,y0,gz],[x0+w2,y0+h2,gz],[x0,y0+h2,gz]].map(v => this._project(...v));
      // Record screen-space bounding box of this cell for stats-panel alignment
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const [px, py] of wp) {
        if (isFinite(px) && isFinite(py)) {
          if (px < bx0) bx0 = px; if (px > bx1) bx1 = px;
          if (py < by0) by0 = py; if (py > by1) by1 = py;
        }
      }
      this.cellScreenBounds[r * cols + cl] = { top: by0, bottom: by1, left: bx0, right: bx1 };
      ctx.beginPath(); ctx.moveTo(wp[0][0], wp[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(wp[i][0], wp[i][1]);
      ctx.closePath(); ctx.fillStyle = this._colorAlpha(gc, 0.7); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const mx = (wp[0][0]+wp[2][0])/2, my = (wp[0][1]+wp[2][1])/2;
      const gr = Math.max(Math.abs(wp[1][0]-wp[0][0]), Math.abs(wp[2][1]-wp[0][1])) / 2;
      if (gr > 2) {
        const ig = ctx.createRadialGradient(mx, my, 0, mx, my, gr);
        ig.addColorStop(0, this._colorAlpha(gc, 0.2));
        ig.addColorStop(1, this._colorAlpha(gc, 0));
        ctx.fillStyle = ig; ctx.fill();
      }
      ctx.restore();
      if (gem && Math.abs(wp[1][0]-wp[0][0]) > 30) {
        const lp = this._project(x0+w2/2, y0+h2/2, gz);
        ctx.fillStyle = '#e6edf3';
        ctx.font = '8px "SF Mono","Fira Code",Menlo,Consolas,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(gem.name, lp[0], lp[1]);
      }

      // Hebrew letter occluder — inset carving into gem face (per-cell letter)
      const cellLetterIdx = r * cols + cl;
      if (this.engine && this.engine.config.hebrewLetter && this.engine.getHebrewMask) {
        const mask = this.engine.getHebrewMask(cellLetterIdx);
        if (mask) {
          const cellPxW = Math.abs(wp[1][0] - wp[0][0]);
          const cellPxH = Math.abs(wp[2][1] - wp[0][1]);
          if (cellPxW > 8 && cellPxH > 8) {
            const letterSz = this.engine.config.hebrewSize || 0.66;
            const margin = (1 - letterSz) / 2;
            const lx0 = wp[0][0] + (wp[1][0] - wp[0][0]) * margin;
            const ly0 = wp[0][1] + (wp[2][1] - wp[0][1]) * margin;
            const lw = (wp[1][0] - wp[0][0]) * (1 - 2 * margin);
            const lh = (wp[2][1] - wp[0][1]) * (1 - 2 * margin);
            const stepX = lw / mask.width;
            const stepY = lh / mask.height;
            const csz = Math.max(1, Math.ceil(stepX));
            const cszY = Math.max(1, Math.ceil(stepY));

            // Inset shadow layer (dark groove) — depth controls darkness
            const carvingDepth = this.engine.config.hebrewDepth || 0.7;
            ctx.save();
            ctx.fillStyle = `rgba(0,0,0,${0.2 + carvingDepth * 0.5})`;
            for (let my = 0; my < mask.height; my++) {
              for (let mx2 = 0; mx2 < mask.width; mx2++) {
                if (!mask.data[my * mask.width + mx2]) continue;
                ctx.fillRect(lx0 + mx2 * stepX + 0.5, ly0 + my * stepY + 0.5, csz, cszY);
              }
            }
            ctx.restore();

            // Carved groove fill (slightly lighter than shadow, gem-tinted)
            ctx.save();
            ctx.fillStyle = this._colorAlpha(gc, 0.35);
            for (let my = 0; my < mask.height; my++) {
              for (let mx2 = 0; mx2 < mask.width; mx2++) {
                if (!mask.data[my * mask.width + mx2]) continue;
                ctx.fillRect(lx0 + mx2 * stepX, ly0 + my * stepY, csz, cszY);
              }
            }
            ctx.restore();

            // Top-left highlight edge (light catching the rim of the groove)
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (let my = 1; my < mask.height; my++) {
              for (let mx2 = 1; mx2 < mask.width; mx2++) {
                if (!mask.data[my * mask.width + mx2]) continue;
                const above = my > 0 ? mask.data[(my-1) * mask.width + mx2] : 0;
                const left = mx2 > 0 ? mask.data[my * mask.width + (mx2-1)] : 0;
                if (!above || !left) {
                  ctx.fillRect(lx0 + mx2 * stepX, ly0 + my * stepY, csz, 1);
                  ctx.fillRect(lx0 + mx2 * stepX, ly0 + my * stepY, 1, cszY);
                }
              }
            }
            ctx.restore();
          }
        }
      }

      // Temperature overlay: glow color from blue→white→yellow→orange→red
      const cellIdx = r * cols + cl;
      if (this.engine && this.engine.cellTemps && this.engine.cellTemps[cellIdx]) {
        const ct = this.engine.cellTemps[cellIdx];
        const dT = ct.temperature - (this.engine.config.ambientTemp || 293.15);
        if (dT > 0.5) {
          const tNorm = Math.min(1, dT / 500);
          const glow = this._tempToColor(ct.temperature);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath(); ctx.moveTo(wp[0][0], wp[0][1]);
          for (let vi = 1; vi < 4; vi++) ctx.lineTo(wp[vi][0], wp[vi][1]);
          ctx.closePath();
          ctx.fillStyle = `rgba(${glow[0]},${glow[1]},${glow[2]},${Math.min(0.6, tNorm * 0.8)})`;
          ctx.fill();
          ctx.restore();

          // Temperature readout
          if (Math.abs(wp[1][0]-wp[0][0]) > 25) {
            const tp = this._project(x0+w2/2, y0+h2-0.5, gz);
            ctx.fillStyle = dT > 100 ? '#ffcc00' : '#e6edf3';
            ctx.font = 'bold 7px "SF Mono","Fira Code",Menlo,Consolas,monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            const tempC = (ct.temperature - 273.15).toFixed(dT > 10 ? 0 : 1);
            ctx.fillText(`${tempC}°C`, tp[0], tp[1]);
          }
        }
      }

      // Radiation damage overlay: darkening + desaturation from lattice damage
      if (this.engine && this.engine.cellRad && this.engine.cellRad[cellIdx]) {
        const cr = this.engine.cellRad[cellIdx];
        if (cr.damageLevel > 0.001) {
          ctx.save();
          ctx.beginPath(); ctx.moveTo(wp[0][0], wp[0][1]);
          for (let vi = 1; vi < 4; vi++) ctx.lineTo(wp[vi][0], wp[vi][1]);
          ctx.closePath();
          ctx.fillStyle = `rgba(40,20,60,${Math.min(0.5, cr.damageLevel * 0.8)})`;
          ctx.fill();
          ctx.restore();
        }
        // Radioluminescence glow
        if (cr.radiolumRate > 0.01) {
          const rlGem = gem ? (window.GEMSTONES[gem.id] || gem) : null;
          const rlRad = rlGem && rlGem.radiation;
          if (rlRad && rlRad.radioluminescence && rlRad.radioluminescence.emission) {
            const rlWl = rlRad.radioluminescence.emission;
            const rlRgb = window.GemUtils ? window.GemUtils.wavelengthToRGB(rlWl) : [0.3,0.3,1];
            const alpha = Math.min(0.6, cr.radiolumRate * 0.1);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath(); ctx.moveTo(wp[0][0], wp[0][1]);
            for (let vi = 1; vi < 4; vi++) ctx.lineTo(wp[vi][0], wp[vi][1]);
            ctx.closePath();
            ctx.fillStyle = `rgba(${Math.round(rlRgb[0]*255)},${Math.round(rlRgb[1]*255)},${Math.round(rlRgb[2]*255)},${alpha})`;
            ctx.fill();
            ctx.restore();
          }
        }
        // Color center density indicator
        if (cr.colorCenterDensity > 0.01 && Math.abs(wp[1][0]-wp[0][0]) > 25) {
          const cp2 = this._project(x0+w2/2, y0+1, gz);
          ctx.fillStyle = cr.colorCenterDensity > 0.3 ? '#bc8cff' : '#7d8590';
          ctx.font = '6px "SF Mono","Fira Code",Menlo,Consolas,monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(`CC:${(cr.colorCenterDensity*100).toFixed(0)}%`, cp2[0], cp2[1]);
        }
      }
    }

    // Aggregate per-row screen bounds (used to align cell-stats panel)
    this.rowScreenBounds = [];
    for (let r = 0; r < rows; r++) {
      let top = Infinity, bottom = -Infinity;
      for (let cl = 0; cl < cols; cl++) {
        const b = this.cellScreenBounds[r * cols + cl];
        if (b) { if (b.top < top) top = b.top; if (b.bottom > bottom) bottom = b.bottom; }
      }
      this.rowScreenBounds.push({
        top: isFinite(top) ? top : 0,
        bottom: isFinite(bottom) ? bottom : 0,
      });
    }
  }

  // ── Light Source ──────────────────────────────────────────
  _drawLightSource(ctx, c) {
    const z = c.sourceZ || 0, mode = c.lightMode || 'mono', GU = window.GemUtils;
    const wl = c.wavelength || 550;
    const srcId = c.lightSource || 'sun';
    const srcInfo = GU && GU.lightSources ? GU.lightSources[srcId] : null;

    if (mode === 'uraninite') {
      this._drawUraniniteBlock(ctx, c);
      return;
    }

    const sw = c.sourceWidth || 8, sh = c.sourceHeight || 6;
    let baseColor, glowFn;
    if (mode === 'white' && srcInfo) {
      const sc = srcInfo.cssColor || '#f0f0f0';
      baseColor = this._colorAlpha(sc, 0.8);
      glowFn = a => this._colorAlpha(sc, a);
    } else if (mode === 'white') { baseColor = 'rgba(240,240,240,0.8)'; glowFn = a => `rgba(240,240,240,${a})`;
    } else if (mode === 'uv') { baseColor = 'rgba(136,0,255,0.8)'; glowFn = a => `rgba(136,0,255,${a})`;
    } else if (mode === 'nir') { baseColor = 'rgba(153,0,0,0.8)'; glowFn = a => `rgba(153,0,0,${a})`;
    } else if (mode === 'fir') { baseColor = 'rgba(80,0,0,0.8)'; glowFn = a => `rgba(80,0,0,${a})`;
    } else if (mode === 'xray') { baseColor = 'rgba(128,50,230,0.8)'; glowFn = a => `rgba(128,50,230,${a})`;
    } else if (mode === 'gamma') { baseColor = 'rgba(230,230,50,0.8)'; glowFn = a => `rgba(230,230,50,${a})`;
    } else if (mode === 'thz') { baseColor = 'rgba(100,0,0,0.8)'; glowFn = a => `rgba(100,0,0,${a})`;
    } else { baseColor = GU ? GU.wavelengthToCSS(wl, 0.8) : 'rgba(200,200,100,0.8)';
      glowFn = a => GU ? GU.wavelengthToCSS(wl, a) : `rgba(200,200,100,${a})`; }
    const pts = [[-sw/2,-sh/2,z],[sw/2,-sh/2,z],[sw/2,sh/2,z],[-sw/2,sh/2,z]].map(v => this._project(...v));
    const mx = (pts[0][0]+pts[2][0])/2, my = (pts[0][1]+pts[2][1])/2;
    const glowR = Math.max(Math.abs(pts[1][0]-pts[0][0]), Math.abs(pts[2][1]-pts[0][1])) * 1.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 3);
    const grd = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
    grd.addColorStop(0, glowFn(0.15 * pulse)); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(mx, my, glowR, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fillStyle = baseColor; ctx.fill();
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1; ctx.stroke();
    const lp = this._project(0, sh/2+2, z);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const modeNames = { mono: 'Light Source', white: 'White Light', uv: 'UV Light', nir: 'Near-IR Light', fir: 'Far-IR Light', xray: 'X-ray Source', gamma: 'Gamma Source', thz: 'THz Source' };
    let srcName = (mode === 'white' && srcInfo) ? srcInfo.name : (modeNames[mode] || 'Light');
    if (mode === 'xray' && this.engine && this.engine.config && this.engine.config.xrdMode) srcName = 'X-ray Tube (collimated)';
    ctx.fillText(srcName, lp[0], lp[1]);
    const wlp = this._project(0, sh/2+4.5, z);
    ctx.fillStyle = '#e6edf3';
    const xE = (c.xrayEnergy || 50), gE = (c.gammaEnergy || 662), tF = (c.thzFrequency || 1.0);
    const rangeLabels = { mono: `${wl} nm`, uv: '200\u2013380 nm', nir: '780\u20131400 nm', fir: '1400\u20132000 nm',
      xray: `${xE} keV`, gamma: `${gE} keV`, thz: `${tF} THz` };
    const rangeLabel = rangeLabels[mode] || (srcInfo ? `${srcInfo.colorTemp}K` : '380\u2013780 nm');
    ctx.fillText(rangeLabel, wlp[0], wlp[1]);
  }

  // ── Uraninite Block (X-ray source) ─────────────────────────
  _drawUraniniteBlock(ctx, c) {
    const z = c.sourceZ || 0;
    // Match the gem grid dimensions so the source covers all cells
    const bw = c.gridWidth || 8, bh = c.gridHeight || 8, bd = 4;
    const hw = bw / 2, hh = bh / 2;
    const corners = [
      [-hw,-hh,z],     [hw,-hh,z],     [hw,hh,z],     [-hw,hh,z],
      [-hw,-hh,z+bd],  [hw,-hh,z+bd],  [hw,hh,z+bd],  [-hw,hh,z+bd],
    ];
    const proj = corners.map(p => this._project(p[0], p[1], p[2]));
    const faces = [
      { idx: [0,1,2,3], col: '#1a1a1a' },
      { idx: [4,5,6,7], col: '#222211' },
      { idx: [0,4,7,3], col: '#151510' },
      { idx: [1,5,6,2], col: '#151510' },
      { idx: [0,1,5,4], col: '#1c1c14' },
      { idx: [3,2,6,7], col: '#111110' },
    ];
    for (const f of faces) {
      const v = f.idx.map(i => proj[i]);
      const nx = (v[1][1]-v[0][1])*(v[2][0]-v[1][0]) - (v[1][0]-v[0][0])*(v[2][1]-v[1][1]);
      if (nx > 0) continue;
      ctx.beginPath(); ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath(); ctx.fillStyle = f.col; ctx.fill();
      ctx.strokeStyle = '#333320'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Radioactive glow on the emitting face (+Z side)
    const emitFace = [4,5,6,7].map(i => proj[i]);
    const emx = (emitFace[0][0]+emitFace[2][0])/2, emy = (emitFace[0][1]+emitFace[2][1])/2;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = Math.max(Math.abs(emitFace[1][0]-emitFace[0][0]), Math.abs(emitFace[2][1]-emitFace[0][1])) * 0.8;
    if (gr > 2) {
      const grd = ctx.createRadialGradient(emx, emy, 0, emx, emy, gr);
      grd.addColorStop(0, `rgba(80,180,50,${0.2 * pulse})`);
      grd.addColorStop(0.5, `rgba(60,120,40,${0.1 * pulse})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(emx, emy, gr, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // Emission topology: spatially varying radioactivity rendered on the front face
    const frontFace = [0,1,2,3].map(i => proj[i]);
    const fx0 = frontFace[0][0], fy0 = frontFace[0][1];
    const fdx = frontFace[1][0]-frontFace[0][0], fdy = frontFace[2][1]-frontFace[0][1];
    const emMap = this.engine && this.engine.getEmissionMap ? this.engine.getEmissionMap() : null;
    if (emMap && Math.abs(fdx) > 10 && Math.abs(fdy) > 10) {
      const en = emMap.width;
      const stepX = fdx / en, stepY = fdy / en;
      ctx.save();
      for (let ey = 0; ey < en; ey++) {
        for (let ex = 0; ex < en; ex++) {
          const v = emMap.data[ey * en + ex];
          // Hot spots glow green-yellow; cold spots stay dark
          const g = Math.round(40 + v * 140 * pulse);
          const r = Math.round(20 + v * 60);
          const b = Math.round(10 + v * 20);
          const a = 0.08 + v * 0.25 * pulse;
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(fx0 + ex * stepX, fy0 + ey * stepY,
            Math.max(1, Math.ceil(Math.abs(stepX))), Math.max(1, Math.ceil(Math.abs(stepY))));
        }
      }
      ctx.restore();
    }

    // Label — offset +X and slightly +Z so text clears the backscatter slab (same row, z−3)
    const labelX = Math.min(hw * 0.55, 10);
    const labelZ = z + Math.max(bd * 0.15, 0.35);
    const lp = this._project(labelX, hh + 2, labelZ);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Uraninite (UO\u2082)', lp[0], lp[1]);
    const lp2 = this._project(labelX, hh + 4.5, labelZ);
    ctx.fillStyle = '#b4cc28';
    ctx.fillText('X-ray Source', lp2[0], lp2[1]);
  }

  // ── Barite Block (X-ray detector) ────────────────────────────
  _drawBariteBlock(ctx, c) {
    if (!c.lightMode || c.lightMode !== 'uraninite') return;
    const bariteZ = (c.transmissionScreenZ || 65);
    const bt = c.bariteThickness || 5;
    const bw = c.gridWidth || 10, bh = c.gridHeight || 10;
    const hw = bw / 2, hh = bh / 2;
    const bd = Math.max(3, bt * 0.5);
    const corners = [
      [-hw,-hh,bariteZ],       [hw,-hh,bariteZ],       [hw,hh,bariteZ],       [-hw,hh,bariteZ],
      [-hw,-hh,bariteZ+bd],    [hw,-hh,bariteZ+bd],    [hw,hh,bariteZ+bd],    [-hw,hh,bariteZ+bd],
    ];
    const proj = corners.map(p => this._project(p[0], p[1], p[2]));

    // Draw side/back faces first (white/cream barite)
    const sideFaces = [
      { idx: [4,5,6,7], col: '#e8e4e0' },
      { idx: [0,4,7,3], col: '#d8d4d0' },
      { idx: [1,5,6,2], col: '#d8d4d0' },
      { idx: [0,1,5,4], col: '#ece8e4' },
      { idx: [3,2,6,7], col: '#c8c4c0' },
    ];
    for (const f of sideFaces) {
      const v = f.idx.map(i => proj[i]);
      const nx = (v[1][1]-v[0][1])*(v[2][0]-v[1][0]) - (v[1][0]-v[0][0])*(v[2][1]-v[1][1]);
      if (nx > 0) continue;
      ctx.beginPath(); ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath(); ctx.fillStyle = f.col; ctx.fill();
      ctx.strokeStyle = '#a09890'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Front face: white barite surface with X-ray dose pattern imprinted
    const ff = [0,1,2,3].map(i => proj[i]);
    const fnx = (ff[1][1]-ff[0][1])*(ff[2][0]-ff[1][0]) - (ff[1][0]-ff[0][0])*(ff[2][1]-ff[1][1]);
    if (fnx <= 0) {
      // Draw white base
      ctx.beginPath(); ctx.moveTo(ff[0][0], ff[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(ff[i][0], ff[i][1]);
      ctx.closePath(); ctx.fillStyle = '#f0ece8'; ctx.fill();
      ctx.strokeStyle = '#a09890'; ctx.lineWidth = 0.5; ctx.stroke();

      // Overlay the X-ray dose pattern as color center darkening
      const pat = this.engine && typeof this.engine.getTransmissionPattern === 'function'
        ? this.engine.getTransmissionPattern() : null;
      if (pat && pat.data && pat.width && pat.height) {
        const pw = pat.width, ph = pat.height;
        const ffw = ff[1][0] - ff[0][0], ffh = ff[2][1] - ff[0][1];
        const cW = ffw / pw, cH = ffh / ph;
        let maxA = 0;
        for (let i = 3; i < pat.data.length; i += 4) if (pat.data[i] > maxA) maxA = pat.data[i];
        if (maxA > 0) {
          const logMax = Math.log1p(maxA * 10);
          for (let py = 0; py < ph; py++) {
            for (let px = 0; px < pw; px++) {
              const i = (py * pw + px) * 4;
              const a = pat.data[i + 3] || 0;
              if (a <= 0) continue;
              // Dose → color center formation: white → amber → brown → dark purple
              const dose = Math.log1p(a * 10) / logMax;
              const d = Math.min(1, dose);
              const r = Math.round(240 - d * 160);
              const g = Math.round(236 - d * 200);
              const b = Math.round(232 - d * 140);
              ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + d * 0.7})`;
              ctx.fillRect(ff[0][0] + px * cW, ff[0][1] + py * cH,
                Math.max(Math.ceil(cW), 1), Math.max(Math.ceil(cH), 1));
            }
          }
        }
      }
    }

    // Labels above the plate (−Y) so they sit away from grid readouts and other bottom labels
    const lp = this._project(0, -hh - 4.5, bariteZ + bd / 2);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Barite Detector', lp[0], lp[1]);
    const lp2 = this._project(0, -hh - 2, bariteZ + bd / 2);
    ctx.fillStyle = '#a0a8b0';
    ctx.fillText(`${bt}mm BaSO\u2084`, lp2[0], lp2[1]);
  }

  // ── Backscatter Shield (barite slab near source, shows reflection pattern) ──
  _drawBackscatterShield(ctx, c) {
    const z = (c.sourceZ || 0) - 3;
    const bw = c.gridWidth || 9, bh = c.gridHeight || 9, bd = 1.5;
    const hw = bw / 2, hh = bh / 2;
    const corners = [
      [-hw,-hh,z],     [hw,-hh,z],     [hw,hh,z],     [-hw,hh,z],
      [-hw,-hh,z+bd],  [hw,-hh,z+bd],  [hw,hh,z+bd],  [-hw,hh,z+bd],
    ];
    const proj = corners.map(p => this._project(p[0], p[1], p[2]));

    // Side/back faces (white barite)
    const sideFaces = [
      { idx: [0,1,2,3], col: '#d8d4d0' },
      { idx: [0,4,7,3], col: '#c8c4c0' },
      { idx: [1,5,6,2], col: '#c8c4c0' },
      { idx: [0,1,5,4], col: '#e0dcd8' },
      { idx: [3,2,6,7], col: '#b8b4b0' },
    ];
    for (const f of sideFaces) {
      const v = f.idx.map(i => proj[i]);
      const nx = (v[1][1]-v[0][1])*(v[2][0]-v[1][0]) - (v[1][0]-v[0][0])*(v[2][1]-v[1][1]);
      if (nx > 0) continue;
      ctx.beginPath(); ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath(); ctx.fillStyle = f.col; ctx.fill();
      ctx.strokeStyle = '#a09890'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Back face (+Z side, facing the gems): shows reflection/backscatter pattern
    const bf = [4,5,6,7].map(i => proj[i]);
    const bnx = (bf[1][1]-bf[0][1])*(bf[2][0]-bf[1][0]) - (bf[1][0]-bf[0][0])*(bf[2][1]-bf[1][1]);
    if (bnx <= 0) {
      ctx.beginPath(); ctx.moveTo(bf[0][0], bf[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(bf[i][0], bf[i][1]);
      ctx.closePath(); ctx.fillStyle = '#f0ece8'; ctx.fill();
      ctx.strokeStyle = '#a09890'; ctx.lineWidth = 0.5; ctx.stroke();

      const pat = this.engine && typeof this.engine.getReflectionPattern === 'function'
        ? this.engine.getReflectionPattern() : null;
      if (pat && pat.data && pat.width && pat.height) {
        const pw = pat.width, ph = pat.height;
        const ffw = bf[1][0] - bf[0][0], ffh = bf[2][1] - bf[0][1];
        const cW = ffw / pw, cH = ffh / ph;
        let maxA = 0;
        for (let i = 3; i < pat.data.length; i += 4) if (pat.data[i] > maxA) maxA = pat.data[i];
        if (maxA > 0) {
          const logMax = Math.log1p(maxA * 10);
          for (let py = 0; py < ph; py++) {
            for (let px = 0; px < pw; px++) {
              const i = (py * pw + px) * 4;
              const a = pat.data[i + 3] || 0;
              if (a <= 0) continue;
              const dose = Math.log1p(a * 10) / logMax;
              const d = Math.min(1, dose);
              const r = Math.round(240 - d * 160);
              const g = Math.round(236 - d * 200);
              const b = Math.round(232 - d * 140);
              ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + d * 0.7})`;
              ctx.fillRect(bf[0][0] + px * cW, bf[0][1] + py * cH,
                Math.max(Math.ceil(cW), 1), Math.max(Math.ceil(cH), 1));
            }
          }
        }
      }
    }

    // Label above the slab (−Y), slight −X to mirror uraninite (+X) and reduce crowding
    const labelX = -Math.min(hw * 0.55, 10);
    const lp = this._project(labelX, -hh - 2, z + bd / 2);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Backscatter Shield', lp[0], lp[1]);
  }

  // ── Path Density Heatmap ───────────────────────────────────
  _drawPathDensity(ctx, c) {
    if (!this.engine || !this.engine.getPathDensity) return;
    const pd = this.engine.getPathDensity();
    if (!pd || !pd.data) return;

    let maxVal = 0;
    for (let i = 0; i < pd.data.length; i++) {
      if (pd.data[i] > maxVal) maxVal = pd.data[i];
    }
    if (maxVal < 1) return;

    const invMax = 1 / maxVal;
    const cellW = (pd.xMax - pd.xMin) / pd.xBins;
    const cellZ = (pd.zMax - pd.zMin) / pd.zBins;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Render density as a thin slab at Y=0 (beam centerline)
    for (let zi = 0; zi < pd.zBins; zi++) {
      for (let xi = 0; xi < pd.xBins; xi++) {
        const val = pd.data[zi * pd.xBins + xi];
        if (val < maxVal * 0.03) continue;

        const norm = val * invMax;
        const x0 = pd.xMin + xi * cellW;
        const z0 = pd.zMin + zi * cellZ;
        const yHalf = 1.5;
        const [sx0, sy0] = this._project(x0, -yHalf, z0);
        const [sx1, sy1] = this._project(x0 + cellW, yHalf, z0 + cellZ);

        if (!isFinite(sx0) || !isFinite(sy0) || !isFinite(sx1) || !isFinite(sy1)) continue;

        const sqNorm = Math.sqrt(norm);
        const r = Math.round(50 + sqNorm * 160);
        const g = Math.round(180 * sqNorm * (1 - sqNorm * 0.4));
        const b = Math.round(40 + sqNorm * 190);
        const a = Math.min(0.25, sqNorm * 0.3);

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(
          Math.min(sx0, sx1), Math.min(sy0, sy1),
          Math.max(1, Math.abs(sx1 - sx0)), Math.max(1, Math.abs(sy1 - sy0))
        );
      }
    }

    // Legend label for the heatmap
    const legendZ = (pd.zMin + pd.zMax) / 2;
    const hh = (c.gridHeight || 24) / 2 + 4;
    const [lx, ly] = this._project(pd.xMin + 2, hh, legendZ);
    if (isFinite(lx) && isFinite(ly)) {
      ctx.fillStyle = 'rgba(180,120,220,0.7)';
      ctx.font = '9px "SF Mono","Fira Code",Menlo,Consolas,monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('X-ray path density', lx, ly);
    }

    ctx.restore();
  }

  // ── Photon Trails & Particles ─────────────────────────────
  _drawPhotons(ctx, c) {
    if (!this.engine || !this.engine.photons) return;
    ctx.save(); ctx.lineCap = 'round';
    for (const ph of this.engine.photons) {
      const color = ph.color || '#ffffff';
      const inten = ph.intensity != null ? ph.intensity : 1;
      if (ph.path && ph.path.length >= 2) {
        const path = ph.path.length > 20 ? ph.path.slice(-20) : ph.path;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const pt = path[i];
          const [sx, sy] = this._project(pt.x ?? pt[0], pt.y ?? pt[1], pt.z ?? pt[2]);
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = this._colorAlpha(color, Math.max(0.1, inten * 0.7));
        ctx.lineWidth = 0.75; ctx.stroke();
      }
      const px = ph.x ?? 0, py = ph.y ?? 0, pz = ph.z ?? 0;
      const [sx, sy] = this._project(px, py, pz);
      const alpha = Math.max(0.15, inten);
      const dx = ph.dx || 0, dy = ph.dy || 0;
      const dz = ph.dz != null ? ph.dz : (ph.state === 'reflected' ? -1 : 1);
      const [tsx, tsy] = this._project(px - dx*2, py - dy*2, pz - dz*2);
      ctx.beginPath(); ctx.moveTo(tsx, tsy); ctx.lineTo(sx, sy);
      ctx.strokeStyle = this._colorAlpha(color, alpha * 0.4);
      ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI*2);
      ctx.fillStyle = this._colorAlpha(color, alpha); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3);
      pg.addColorStop(0, this._colorAlpha(color, alpha * 0.4));
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ── Magnetic Field ────────────────────────────────────────
  _drawMagneticField(ctx, c) {
    const mf = c.magneticField;
    if (!mf || !mf.enabled) return;
    const gz = c.gridZ || 50, hw = (c.gridWidth || 24)/2, hh = (c.gridHeight || 24)/2;
    const dir = mf.direction || 'down', sp = 6;
    ctx.save(); ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#bc8cff'; ctx.fillStyle = '#bc8cff'; ctx.lineWidth = 1.5;
    for (let x = -hw + sp; x < hw; x += sp) {
      for (let y = -hh + sp; y < hh; y += sp) {
        const [sx, sy] = this._project(x, y, gz);
        if (dir === 'into') { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI*2); ctx.fill(); }
        else if (dir === 'out') {
          ctx.beginPath(); ctx.moveTo(sx-3, sy-3); ctx.lineTo(sx+3, sy+3);
          ctx.moveTo(sx+3, sy-3); ctx.lineTo(sx-3, sy+3); ctx.stroke();
        } else {
          let a = 0;
          if (dir === 'down') a = Math.PI/2; else if (dir === 'up') a = -Math.PI/2;
          else if (dir === 'left') a = Math.PI;
          this._drawArrow(ctx, sx, sy, a);
        }
      }
    }
    ctx.restore();
  }

  // ── Electrode Indicators ──────────────────────────────────
  _drawElectrodes(ctx, c) {
    if (!this.engine || !this.engine.electrodes) return;
    const gz = c.gridZ || 50, gw = c.gridWidth || 24, gh = c.gridHeight || 24;
    const cols = c.gridCols || 4, rows = c.gridRows || 4;
    const hw = gw/2, hh = gh/2, cW = gw/cols, cH = gh/rows;
    ctx.save(); ctx.strokeStyle = '#d29922'; ctx.fillStyle = '#d29922'; ctx.lineWidth = 1;
    ctx.font = '7px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (let r = 0; r < rows; r++) for (let cl = 0; cl < cols; cl++) {
      const idx = r * cols + cl;
      if (idx >= this.engine.electrodes.length) break;
      const elec = this.engine.electrodes[idx];
      const mx = -hw + cl*cW + cW/2;
      const [sx, sy] = this._project(mx, -hh + r*cH + 0.5, gz);
      ctx.beginPath();
      ctx.moveTo(sx-4, sy); ctx.lineTo(sx-4, sy-5);
      ctx.moveTo(sx+4, sy); ctx.lineTo(sx+4, sy-5); ctx.stroke();
      if (elec.voltage != null) ctx.fillText(`${elec.voltage.toFixed(1)}V`, sx, sy - 6);
    }
    ctx.restore();
  }

  // ── Inset Screen Views ────────────────────────────────────
  _drawInsetViews(ctx, c, w, h) {
    const isUran = c.lightMode === 'uraninite';
    const getR = () => this.engine && typeof this.engine.getReflectionPattern === 'function'
      ? this.engine.getReflectionPattern() : null;
    const getT = () => this.engine && typeof this.engine.getTransmissionPattern === 'function'
      ? this.engine.getTransmissionPattern() : null;
    this._drawPatternInset(ctx, 10, h - 104, 120, 90, getR(),
      isUran ? 'Backscatter' : 'Reflection', isUran);
    this._drawPatternInset(ctx, w - 130, h - 104, 120, 90, getT(),
      isUran ? 'Barite Detector' : 'Transmission', isUran);
  }
  _drawPatternInset(ctx, x, y, w, h, pattern, label, bariteMode) {
    // Background: white for barite detector, dark for normal screens
    ctx.fillStyle = bariteMode ? '#f0ece8' : '#0d1117';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = bariteMode ? '#a09890' : '#30363d';
    ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#7d8590';
    ctx.font = '9px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, x + w/2, y - 2);
    if (!pattern || !pattern.data || !pattern.width || !pattern.height) return;
    const pw = pattern.width, ph = pattern.height, cW = w/pw, cH = h/ph;

    if (bariteMode) {
      // Barite detector: white surface darkens where X-rays hit (color centers)
      let maxA = 0;
      for (let i = 3; i < pattern.data.length; i += 4) if (pattern.data[i] > maxA) maxA = pattern.data[i];
      if (maxA <= 0) return;
      const logMax = Math.log1p(maxA * 10);
      for (let py2 = 0; py2 < ph; py2++) for (let px2 = 0; px2 < pw; px2++) {
        const i = (py2*pw + px2) * 4;
        const a = pattern.data[i + 3] || 0;
        if (a <= 0) continue;
        const dose = Math.log1p(a * 10) / logMax;
        const d = Math.min(1, dose);
        const r = Math.round(240 - d * 160);
        const g = Math.round(236 - d * 200);
        const b = Math.round(232 - d * 140);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + px2*cW, y + py2*cH, Math.max(cW, 1), Math.max(cH, 1));
      }
    } else {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let py2 = 0; py2 < ph; py2++) for (let px2 = 0; px2 < pw; px2++) {
        const i = (py2*pw + px2) * 4;
        const r = Math.min(255, Math.round((pattern.data[i]||0)*255));
        const g = Math.min(255, Math.round((pattern.data[i+1]||0)*255));
        const b = Math.min(255, Math.round((pattern.data[i+2]||0)*255));
        if (r === 0 && g === 0 && b === 0) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},1)`;
        ctx.fillRect(x + px2*cW, y + py2*cH, Math.max(cW, 1), Math.max(cH, 1));
      }
      ctx.restore();
    }
  }

  // ── Charge Graph ──────────────────────────────────────────
  _sampleCharges() {
    if (!this.engine || !this.engine.electrodes) return;
    const frame = [];
    for (let i = 0; i < this.engine.electrodes.length; i++) frame.push(this.engine.electrodes[i].charge || 0);
    this.chargeHistory.push(frame);
    if (this.chargeHistory.length > 200) this.chargeHistory.shift();
  }
  _drawChargeGraph(ctx, c, canvasW, canvasH) {
    if (this.chargeHistory.length < 2) return;
    const numG = Math.min(this.chargeHistory[0].length, (c.gridCols||4)*(c.gridRows||4), 6);
    if (numG === 0) return;
    const gw = 200, gh = 100, gx = canvasW - gw - 12, gy = 12, cols = c.gridCols || 4;
    ctx.fillStyle = 'rgba(13,17,23,0.8)'; ctx.fillRect(gx, gy, gw, gh + 20);
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh + 20);
    ctx.fillStyle = '#7d8590';
    ctx.font = '9px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Crystal Charge (pC)', gx + 4, gy + 2);
    let minC = Infinity, maxC = -Infinity;
    for (const fr of this.chargeHistory) for (let i = 0; i < numG; i++) {
      const v = fr[i] || 0; if (v < minC) minC = v; if (v > maxC) maxC = v;
    }
    if (!isFinite(minC) || !isFinite(maxC) || minC === maxC) { minC = -1; maxC = 1; }
    const range = maxC - minC, pX = gx+4, pY = gy+14, pW = gw-8, pH = gh;
    for (let gi = 0; gi < numG; gi++) {
      const gem = this._gemAt(c, Math.floor(gi / cols), gi % cols);
      const color = gem ? gem.color : '#445566';
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1;
      for (let f = 0; f < this.chargeHistory.length; f++) {
        const v = this.chargeHistory[f][gi] || 0;
        const fx = pX + (f / (this.chargeHistory.length - 1)) * pW;
        const fy = pY + pH - ((v - minC) / range) * pH;
        if (f === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
      }
      ctx.stroke();
      const lx = gx + 4 + gi * 30, ly = gy + gh + 16;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2); ctx.fill();
      if (gem) {
        ctx.fillStyle = '#7d8590'; ctx.font = '7px monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(gem.name.slice(0, 4), lx + 5, ly);
      }
    }
  }

  // ── Info Overlay ──────────────────────────────────────────
  _drawInfoOverlay(ctx, c, w, h) {
    const pad = 12, lineH = 16, wl = c.wavelength || 550, mode = c.lightMode || 'mono';
    const n = (this.engine && this.engine.photons) ? this.engine.photons.length : 0;
    ctx.font = '11px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const lines = [
      { l: 'Mode: ', v: mode === 'uraninite' ? 'Uraninite X-ray' : mode },
      { l: mode === 'uraninite' ? 'Source: ' : 'Wavelength: ',
        v: mode === 'uraninite' ? 'UO\u2082 \u2192 BaSO\u2084' : `${wl} nm` },
      { l: 'Photons: ', v: `${n} active` },
      { l: 'Grid: ', v: `${c.gridCols||4}\u00d7${c.gridRows||4}` },
    ];
    const mf = c.magneticField;
    if (mf && mf.enabled) lines.push({ l: 'B = ', v: `${mf.strength||0} T` });
    if (c.thermalEnabled && this.engine && this.engine.cellTemps) {
      let maxT = 0;
      for (const ct of this.engine.cellTemps) if (ct.temperature > maxT) maxT = ct.temperature;
      const maxTC = (maxT - 273.15).toFixed(1);
      lines.push({ l: 'T_max = ', v: `${maxTC}°C` });
    }
    for (let i = 0; i < lines.length; i++) {
      const y = pad + i * lineH;
      ctx.fillStyle = '#7d8590'; ctx.fillText(lines[i].l, pad, y);
      ctx.fillStyle = '#e6edf3'; ctx.fillText(lines[i].v, pad + ctx.measureText(lines[i].l).width, y);
    }
    const GU = window.GemUtils, swSz = 18, sx = w - pad - swSz, sy = pad;
    const srcId2 = c.lightSource || 'sun';
    const srcInfo2 = GU && GU.lightSources ? GU.lightSources[srcId2] : null;
    let swCol = mode === 'white' ? (srcInfo2 ? srcInfo2.cssColor : '#f0f0f0')
      : mode === 'uv' ? '#8800ff' : mode === 'nir' ? '#990000' : mode === 'fir' ? '#500000'
      : mode === 'xray' ? '#8032e6' : mode === 'uraninite' ? '#50b432'
      : mode === 'gamma' ? '#e6e632' : mode === 'thz' ? '#640000'
      : GU ? GU.wavelengthToCSS(wl, 1) : '#aabb44';
    ctx.fillStyle = swCol; ctx.beginPath();
    ctx.arc(sx + swSz/2, sy + swSz/2, swSz/2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#7d8590';
    ctx.font = '9px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(`${wl} nm`, sx - 4, sy + 4);
  }

  // ── Axis Indicator ────────────────────────────────────────
  _drawAxisIndicator(ctx, w, h) {
    const ox = 50, oy = h - 40, len = 25;
    ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.font = '10px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    const axes = [
      { v: [1,0,0], label: 'X', color: '#58a6ff' },
      { v: [0,1,0], label: 'Y', color: '#3fb950' },
      { v: [0,0,1], label: 'Z', color: '#f85149' },
    ];
    for (const a of axes) {
      const [rx, ry] = this._rotate(...a.v);
      const ex = ox + rx*len, ey = oy + ry*len;
      ctx.strokeStyle = a.color; ctx.fillStyle = a.color;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
      const ang = Math.atan2(ey - oy, ex - ox);
      this._drawArrow(ctx, ex, ey, ang);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.label, ex + Math.cos(ang)*10, ey + Math.sin(ang)*10);
    }
  }

  // ── Distance Markers ──────────────────────────────────────
  _drawDistanceMarkers(ctx, c) {
    const srcZ = c.sourceZ || 0;
    const reflZ = Math.round(c.reflectionScreenZ || 10);
    const markers = [
      { z: srcZ, label: `Z=${srcZ}` },
      { z: c.reflectionScreenZ, label: `Z=${reflZ}` },
      { z: c.gridZ || 50, label: `Z=${c.gridZ||50}` },
      { z: c.transmissionScreenZ || 90, label: `Z=${c.transmissionScreenZ||90}` },
    ];
    const yB = (c.screenHeight||20)/2 + 5, yT = -(c.screenHeight||20)/2 - 3;
    ctx.font = '9px "SF Mono","Fira Code",Menlo,Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const m of markers) {
      const [sx, sy] = this._project(0, yB+2, m.z);
      ctx.fillStyle = '#484f58'; ctx.fillText(m.label, sx, sy);
      const [tx, ty] = this._project(0, yB, m.z);
      const [bx, by] = this._project(0, yT, m.z);
      ctx.strokeStyle = '#30363d'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── Temperature Color Map ─────────────────────────────────
  // Maps absolute temperature to incandescence color (blackbody approximation)
  _tempToColor(T) {
    if (T < 400) {
      // Below visible glow: dark red tint proportional to warming
      const t = Math.max(0, (T - 293) / 107);
      return [Math.round(80 * t), 0, 0];
    }
    // Blackbody RGB approximation (Tanner Helland algorithm)
    const t100 = T / 100;
    let r, g, b;
    if (t100 <= 66) {
      r = 255;
      g = Math.max(0, Math.min(255, 99.47 * Math.log(t100) - 161.12));
      b = t100 <= 19 ? 0 : Math.max(0, Math.min(255, 138.52 * Math.log(t100 - 10) - 305.04));
    } else {
      r = Math.max(0, Math.min(255, 329.70 * Math.pow(t100 - 60, -0.133)));
      g = Math.max(0, Math.min(255, 288.12 * Math.pow(t100 - 60, -0.0755)));
      b = 255;
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  // ── Helpers ───────────────────────────────────────────────
  _drawArrow(ctx, x, y, angle) {
    const s = 5;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s/2); ctx.lineTo(-s, s/2);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  _colorAlpha(color, alpha) {
    if (!color || typeof color !== 'string') return `rgba(128,128,128,${alpha})`;
    if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${alpha})`);
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
    if (color.startsWith('#') && color.length >= 7) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(128,128,128,${alpha})`;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  // ── Event Binding ─────────────────────────────────────────
  _bindEvents() {
    let dragging = false, lastX = 0, lastY = 0;
    const onDown = (x, y) => { dragging = true; lastX = x; lastY = y; };
    const onMove = (x, y) => {
      if (!dragging) return;
      this.rotY += (x - lastX) * 0.008;
      this.rotX += (y - lastY) * 0.008;
      this.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotX));
      lastX = x; lastY = y;
    };
    const onUp = () => { dragging = false; };
    this.canvas.addEventListener('mousedown', e => { e.preventDefault(); onDown(e.clientX, e.clientY); });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = Math.max(0.2, Math.min(5, this.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    }, { passive: false });
    let lastTouchDist = 0;
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) lastTouchDist = this._touchDist(e.touches);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) {
        const d = this._touchDist(e.touches);
        if (lastTouchDist > 0) this.zoom = Math.max(0.2, Math.min(5, this.zoom * (d / lastTouchDist)));
        lastTouchDist = d;
      }
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => { onUp(); lastTouchDist = 0; });
  }
  _touchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
};
