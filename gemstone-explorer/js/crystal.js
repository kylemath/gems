// Crystal Structure Renderer — zero-dependency 3D→2D orthographic projection on Canvas 2D
window.CrystalRenderer = class CrystalRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.structure = null;
    this.cartesianAtoms = [];
    this.cellVertices = [];
    this.cellEdges = [];
    this.innerVertices = [];
    this.innerEdges = [];
    this.bonds = [];

    this.supercellDims = [2, 2, 2];

    this.rotX = -0.4;
    this.rotY = 0.6;
    this.zoom = 1.0;
    this.autoRotate = true;
    this.autoRotateSpeed = 0.003;
    this.dirty = true;
    this.animFrameId = null;
    this.center = [0, 0, 0];
    this.panX = 0;
    this.panY = 0;
    this.fitScale = 1;
    this.fov = 600;

    this._projected = [];
    this._sortedIndices = [];

    this._bindEvents();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
  }

  // ── Public API ──────────────────────────────────────────────

  setStructure(gemstone) {
    this.structure = gemstone;
    this._buildGeometry();
    this.resetView();
    this.dirty = true;
  }

  render() {
    if (!this.structure) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);

    const rot = (p) => {
      let x = p[0] - this.center[0];
      let y = p[1] - this.center[1];
      let z = p[2] - this.center[2];
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x1 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;
      return [x1, y1, z2];
    };

    const scale = this.fitScale * this.zoom * this.dpr;
    const cx = w / 2;
    const cy = h / 2;

    const px = this.panX * this.dpr;
    const py = this.panY * this.dpr;
    const project = (xyz) => {
      return [cx + xyz[0] * scale + px, cy + xyz[1] * scale + py, xyz[2], 1];
    };

    const projVerts = this.cellVertices.map(v => { const r = rot(v); return project(r); });

    // Unit cell wireframe — color-code edges from origin to match axis labels
    const axisEdgeStyle = {
      '0,1': 'rgba(88, 166, 255, 0.6)',
      '0,2': 'rgba(63, 185, 80, 0.6)',
      '0,3': 'rgba(248, 81, 73, 0.6)',
    };
    ctx.lineWidth = 1 * this.dpr;
    for (const [i, j] of this.cellEdges) {
      const a = projVerts[i];
      const b = projVerts[j];
      const key = `${i},${j}`;
      ctx.strokeStyle = axisEdgeStyle[key] || 'rgba(48, 54, 61, 0.5)';
      if (axisEdgeStyle[key]) ctx.lineWidth = 1.5 * this.dpr;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      if (axisEdgeStyle[key]) ctx.lineWidth = 1 * this.dpr;
    }

    // Inner cell grid
    ctx.lineWidth = 0.5 * this.dpr;
    const projInnerVerts = this.innerVertices.map(v => { const r = rot(v); return project(r); });
    for (const [i, j] of this.innerEdges) {
      const a = projInnerVerts[i];
      const b = projInnerVerts[j];
      ctx.strokeStyle = 'rgba(48, 54, 61, 0.25)';
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }

    // Axis labels
    this._drawAxisLabels(ctx, projVerts);

    // Project atoms
    const projAtoms = this.cartesianAtoms.map(a => {
      const r = rot(a.pos);
      const p = project(r);
      return { ...a, proj: p, rz: r[2] };
    });

    // Sort back-to-front
    projAtoms.sort((a, b) => b.rz - a.rz);

    // Draw bonds (behind atoms)
    this._drawBonds(ctx, rot, project, scale);

    // Draw atoms
    for (const atom of projAtoms) {
      this._drawAtom(ctx, atom, scale);
    }

    // Info overlay & legend
    this._drawOverlay(ctx, w, h);
    this._drawLegend(ctx, w, h);

    this.dirty = false;
  }

  startAnimation() {
    if (this.animFrameId) return;
    const loop = () => {
      if (this.autoRotate) {
        this.rotY += this.autoRotateSpeed;
        this.dirty = true;
      }
      if (this.dirty) this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resetView() {
    this.rotX = -0.4;
    this.rotY = 0.6;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this._computeFitScale();
    this.dirty = true;
  }

  setRotation(rx, ry) {
    this.rotX = rx;
    this.rotY = ry;
    this.dirty = true;
  }

  // ── Geometry Construction ───────────────────────────────────

  _buildGeometry() {
    const uc = this.structure.unitCell;
    const deg = Math.PI / 180;
    const alpha = uc.alpha * deg;
    const beta = uc.beta * deg;
    const gamma = uc.gamma * deg;

    const cosA = Math.cos(alpha), cosB = Math.cos(beta), cosG = Math.cos(gamma);
    const sinG = Math.sin(gamma);

    const ax = uc.a, ay = 0, az = 0;
    const bx = uc.b * cosG, by = uc.b * sinG, bz = 0;
    const cx = uc.c * cosB;
    const cy = uc.c * (cosA - cosB * cosG) / sinG;
    const cz = uc.c * Math.sqrt(
      1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG
    ) / sinG;

    this.basis = [[ax, ay, az], [bx, by, bz], [cx, cy, cz]];

    const toCart = (fx, fy, fz) => [
      fx * ax + fy * bx + fz * cx,
      fx * ay + fy * by + fz * cy,
      fx * az + fy * bz + fz * cz,
    ];

    const [nx, ny, nz] = this.supercellDims;

    // Supercell outer vertices (8 corners of the full supercell)
    const corners = [
      [0, 0, 0], [nx, 0, 0], [0, ny, 0], [0, 0, nz],
      [nx, ny, 0], [nx, 0, nz], [0, ny, nz], [nx, ny, nz],
    ];
    this.cellVertices = corners.map(c => toCart(c[0], c[1], c[2]));

    this.cellEdges = [
      [0, 1], [0, 2], [0, 3],
      [1, 4], [1, 5],
      [2, 4], [2, 6],
      [3, 5], [3, 6],
      [4, 7], [5, 7], [6, 7],
    ];

    // Internal cell boundary lines
    this.innerVertices = [];
    this.innerEdges = [];
    for (let ix = 1; ix < nx; ix++) {
      const base = this.innerVertices.length;
      this.innerVertices.push(
        toCart(ix, 0, 0), toCart(ix, ny, 0),
        toCart(ix, ny, nz), toCart(ix, 0, nz)
      );
      this.innerEdges.push([base, base+1], [base+1, base+2], [base+2, base+3], [base+3, base]);
    }
    for (let iy = 1; iy < ny; iy++) {
      const base = this.innerVertices.length;
      this.innerVertices.push(
        toCart(0, iy, 0), toCart(nx, iy, 0),
        toCart(nx, iy, nz), toCart(0, iy, nz)
      );
      this.innerEdges.push([base, base+1], [base+1, base+2], [base+2, base+3], [base+3, base]);
    }
    for (let iz = 1; iz < nz; iz++) {
      const base = this.innerVertices.length;
      this.innerVertices.push(
        toCart(0, 0, iz), toCart(nx, 0, iz),
        toCart(nx, ny, iz), toCart(0, ny, iz)
      );
      this.innerEdges.push([base, base+1], [base+1, base+2], [base+2, base+3], [base+3, base]);
    }

    // Replicate atoms across supercell
    const atoms = this.structure.atoms || [];
    const elems = window.ELEMENTS || {};

    this.cartesianAtoms = [];
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          for (const a of atoms) {
            const pos = toCart(a.x + ix, a.y + iy, a.z + iz);
            const info = elems[a.el] || { color: '#888888', radius: 1.0, name: a.el };
            this.cartesianAtoms.push({ el: a.el, pos, color: info.color, radius: info.radius, name: info.name });
          }
        }
      }
    }

    // Remove duplicate atoms at cell boundaries
    const dedupSq = 0.01 * 0.01;
    const unique = [];
    for (const atom of this.cartesianAtoms) {
      let dup = false;
      for (const u of unique) {
        const dx = atom.pos[0] - u.pos[0];
        const dy = atom.pos[1] - u.pos[1];
        const dz = atom.pos[2] - u.pos[2];
        if (dx * dx + dy * dy + dz * dz < dedupSq) { dup = true; break; }
      }
      if (!dup) unique.push(atom);
    }
    this.cartesianAtoms = unique;

    // Center of supercell
    const mid = toCart(nx / 2, ny / 2, nz / 2);
    this.center = mid;

    this._buildBonds(toCart);
  }

  _buildBonds(toCart) {
    const bondThresholds = {
      'Si-O': 1.8, 'O-Si': 1.8,
      'Al-O': 2.0, 'O-Al': 2.0,
      'Be-O': 1.8, 'O-Be': 1.8,
      'Mg-O': 2.5, 'O-Mg': 2.5,
      'Fe-O': 2.5, 'O-Fe': 2.5,
      'Mn-O': 2.5, 'O-Mn': 2.5,
      'Zr-O': 2.4, 'O-Zr': 2.4,
      'K-O': 3.2, 'O-K': 3.2,
      'Na-O': 3.2, 'O-Na': 3.2,
    };
    const dashedPairs = new Set(['K-O', 'O-K', 'Na-O', 'O-Na']);
    const defaultThreshold = 2.2;

    this.bonds = [];
    const atoms = this.cartesianAtoms;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i], b = atoms[j];
        const key = `${a.el}-${b.el}`;
        const thresh = bondThresholds[key] ?? defaultThreshold;
        const dx = a.pos[0] - b.pos[0];
        const dy = a.pos[1] - b.pos[1];
        const dz = a.pos[2] - b.pos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < thresh && dist > 0.3) {
          this.bonds.push({
            i, j,
            dist,
            dashed: dashedPairs.has(key),
            colorA: a.color,
            colorB: b.color,
          });
        }
      }
    }
  }

  // ── Fit / Scale ─────────────────────────────────────────────

  _computeFitScale() {
    if (!this.cellVertices.length) return;
    let maxR = 0;
    for (const v of this.cellVertices) {
      const dx = v[0] - this.center[0];
      const dy = v[1] - this.center[1];
      const dz = v[2] - this.center[2];
      maxR = Math.max(maxR, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
    const canvasMin = Math.min(
      this.canvas.width / this.dpr,
      this.canvas.height / this.dpr
    );
    this.fitScale = (canvasMin * 0.35) / (maxR || 1);
  }

  // ── Drawing Helpers ─────────────────────────────────────────

  _drawAtom(ctx, atom, scale) {
    const [sx, sy, sz, pf] = atom.proj;
    const baseR = Math.min(atom.radius, 2.0) * 0.35 * scale * pf;
    const r = Math.max(baseR, 2 * this.dpr);

    const depthFade = Math.max(0.4, Math.min(1.0, 1.0 - sz * 0.003));

    // Radial gradient for 3D sphere illusion
    const grad = ctx.createRadialGradient(
      sx - r * 0.3, sy - r * 0.3, r * 0.05,
      sx, sy, r
    );

    const base = this._hexToRgb(atom.color);
    const bright = `rgba(${Math.min(255, base.r + 80)}, ${Math.min(255, base.g + 80)}, ${Math.min(255, base.b + 80)}, ${depthFade})`;
    const mid = `rgba(${base.r}, ${base.g}, ${base.b}, ${depthFade})`;
    const dark = `rgba(${Math.max(0, base.r - 50)}, ${Math.max(0, base.g - 50)}, ${Math.max(0, base.b - 50)}, ${depthFade * 0.9})`;

    grad.addColorStop(0, bright);
    grad.addColorStop(0.5, mid);
    grad.addColorStop(1, dark);

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline ring
    ctx.strokeStyle = `rgba(${Math.max(0, base.r - 70)}, ${Math.max(0, base.g - 70)}, ${Math.max(0, base.b - 70)}, ${depthFade * 0.6})`;
    ctx.lineWidth = Math.max(0.5, 0.8 * this.dpr);
    ctx.stroke();

    // Specular highlight
    const hlR = r * 0.3;
    const hlX = sx - r * 0.25;
    const hlY = sy - r * 0.25;
    const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
    hlGrad.addColorStop(0, `rgba(255, 255, 255, ${0.45 * depthFade})`);
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
    ctx.fillStyle = hlGrad;
    ctx.fill();
  }

  _drawBonds(ctx, rot, project, scale) {
    const atoms = this.cartesianAtoms;

    for (const bond of this.bonds) {
      const a = atoms[bond.i], b = atoms[bond.j];
      const ra = rot(a.pos), rb = rot(b.pos);
      const pa = project(ra), pb = project(rb);

      const avgZ = (ra[2] + rb[2]) / 2;
      const depthFade = Math.max(0.2, Math.min(0.7, 0.7 - avgZ * 0.002));

      const grad = ctx.createLinearGradient(pa[0], pa[1], pb[0], pb[1]);
      const cA = this._hexToRgb(bond.colorA);
      const cB = this._hexToRgb(bond.colorB);
      grad.addColorStop(0, `rgba(${cA.r}, ${cA.g}, ${cA.b}, ${depthFade})`);
      grad.addColorStop(1, `rgba(${cB.r}, ${cB.g}, ${cB.b}, ${depthFade})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1, 1.5 * this.dpr * Math.min(pa[3], pb[3]));

      if (bond.dashed) {
        ctx.setLineDash([4 * this.dpr, 3 * this.dpr]);
      }

      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();

      if (bond.dashed) {
        ctx.setLineDash([]);
      }
    }
  }

  _drawAxisLabels(ctx, projVerts) {
    const labels = [
      { idx: 1, text: 'a', color: '#58a6ff' },
      { idx: 2, text: 'b', color: '#3fb950' },
      { idx: 3, text: 'c', color: '#f85149' },
    ];
    const fontSize = 13 * this.dpr;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const l of labels) {
      const p = projVerts[l.idx];
      const o = projVerts[0];
      const dx = p[0] - o[0];
      const dy = p[1] - o[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = 14 * this.dpr;
      const lx = p[0] + (dx / len) * offset;
      const ly = p[1] + (dy / len) * offset;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, lx, ly);
    }
  }

  _drawOverlay(ctx, w, h) {
    const fontSize = 11 * this.dpr;
    ctx.font = `${fontSize}px monospace`;
    const pad = 10 * this.dpr;

    ctx.fillStyle = '#7d8590';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const sys = this.structure.crystalSystem || '';
    const formula = this.structure.formula || '';
    const lines = [];
    if (sys) lines.push(sys);
    if (formula) lines.push(formula);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], pad, pad + i * (fontSize + 4 * this.dpr));
    }

    ctx.textAlign = 'right';
    const count = this.cartesianAtoms.length;
    const [snx, sny, snz] = this.supercellDims;
    ctx.fillText(`${count} atoms (${snx}\u00d7${sny}\u00d7${snz})`, w - pad, pad);
  }

  _drawLegend(ctx, w, h) {
    const seen = new Map();
    for (const atom of this.cartesianAtoms) {
      if (!seen.has(atom.el)) {
        seen.set(atom.el, { color: atom.color, name: atom.name || atom.el });
      }
    }
    const entries = [...seen.entries()];
    if (entries.length === 0) return;

    const fontSize = 10 * this.dpr;
    const pad = 8 * this.dpr;
    const dotR = 4 * this.dpr;
    const lineH = fontSize + 5 * this.dpr;

    ctx.font = `${fontSize}px monospace`;

    let maxTextW = 0;
    for (const [el, info] of entries) {
      const tw = ctx.measureText(`${el}  ${info.name}`).width;
      maxTextW = Math.max(maxTextW, tw);
    }

    const legendW = pad + dotR * 2 + 6 * this.dpr + maxTextW + pad;
    const legendH = pad + entries.length * lineH + pad;
    const x0 = pad;
    const y0 = h - legendH - pad;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    ctx.fillRect(x0, y0, legendW, legendH);
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.5)';
    ctx.lineWidth = 1 * this.dpr;
    ctx.strokeRect(x0, y0, legendW, legendH);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < entries.length; i++) {
      const [el, info] = entries[i];
      const rowY = y0 + pad + i * lineH + lineH / 2;

      ctx.beginPath();
      ctx.arc(x0 + pad + dotR, rowY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = info.color;
      ctx.fill();

      ctx.fillStyle = '#c9d1d9';
      ctx.fillText(`${el}  ${info.name}`, x0 + pad + dotR * 2 + 6 * this.dpr, rowY);
    }
  }

  // ── Event Handling ──────────────────────────────────────────

  _bindEvents() {
    let dragging = false;
    let panning = false;
    let lastX = 0, lastY = 0;

    const onDown = (x, y, isPan) => {
      if (isPan) { panning = true; } else { dragging = true; }
      lastX = x;
      lastY = y;
    };

    const onMove = (x, y) => {
      if (!dragging && !panning) return;
      const dx = x - lastX;
      const dy = y - lastY;
      if (panning) {
        this.panX += dx;
        this.panY += dy;
      } else {
        this.rotY += dx * 0.008;
        this.rotX += dy * 0.008;
        this.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotX));
      }
      lastX = x;
      lastY = y;
      this.dirty = true;
    };

    const onUp = () => { dragging = false; panning = false; };

    this.canvas.addEventListener('mousedown', e => {
      e.preventDefault();
      const isPan = e.button === 2 || e.shiftKey || e.button === 1;
      onDown(e.clientX, e.clientY, isPan);
    });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      this.zoom = Math.max(0.2, Math.min(5, this.zoom * delta));
      this.dirty = true;
    }, { passive: false });

    // Touch support
    let lastTouchDist = 0;
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (e.touches.length === 1) {
        onDown(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        lastTouchDist = this._touchDist(e.touches);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        const d = this._touchDist(e.touches);
        if (lastTouchDist > 0) {
          const ratio = d / lastTouchDist;
          this.zoom = Math.max(0.2, Math.min(5, this.zoom * ratio));
          this.dirty = true;
        }
        lastTouchDist = d;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      onUp();
      lastTouchDist = 0;
    });
  }

  _touchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Resize Handling ─────────────────────────────────────────

  _handleResize() {
    this.dpr = window.devicePixelRatio || 1;
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    const dim = Math.min(cw, ch) || cw || ch || 300;
    this.canvas.width = dim * this.dpr;
    this.canvas.height = dim * this.dpr;
    this._computeFitScale();
    this.dirty = true;
  }

  // ── Utilities ───────────────────────────────────────────────

  _hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }
};
