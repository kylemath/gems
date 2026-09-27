/**
 * Screen Pattern Renderer — draws accumulated or last-burst illumination patterns
 * on a dedicated canvas panel, with full-size view.
 */
window.ScreenRenderer = class ScreenRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pattern = null;
    this.label = '';
    this.dpr = 1;
    this._prevW = 0;
    this._prevH = 0;
    this.symmetryFold = 0;
    this.rings = null;
    this.bariteMode = false;
  }

  setPattern(pattern, label) {
    this.pattern = pattern;
    this.label = label || '';
  }

  render() {
    this._resize();
    const ctx = this.ctx;
    const dpr = this.dpr;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w < 1 || h < 1) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isBM = this.bariteMode;
    ctx.fillStyle = isBM ? '#f0ece8' : '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const pat = this.pattern;
    if (!pat || !pat.data || !pat.width || !pat.height) {
      ctx.fillStyle = isBM ? '#a09890' : '#7d8590';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isBM ? 'Barite detector — no exposure' : 'No data — emit a burst', w / 2, h / 2);
      ctx.restore();
      return;
    }

    const pad = 8;
    const pw = pat.width;
    const ph = pat.height;
    const availW = w - pad * 2;
    const availH = h - pad * 2 - 16;
    const cellW = availW / pw;
    const cellH = availH / ph;
    const cellSz = Math.min(cellW, cellH);
    const ox = pad + (availW - cellSz * pw) / 2;
    const oy = pad + 14 + (availH - cellSz * ph) / 2;

    ctx.save();

    let maxA = 0;
    for (let i = 3; i < pat.data.length; i += 4) {
      if (pat.data[i] > maxA) maxA = pat.data[i];
    }
    if (maxA <= 0) maxA = 1;

    if (isBM) {
      // Barite detector: white surface → dose creates color centers
      // White → pale amber → brown → dark purple with increasing dose
      const logMax = Math.log1p(maxA * 10);
      for (let py = 0; py < ph; py++) {
        for (let px = 0; px < pw; px++) {
          const i = (py * pw + px) * 4;
          const a = pat.data[i + 3] || 0;
          if (a <= 0) continue;
          const dose = Math.log1p(a * 10) / logMax;
          const d = Math.min(1, dose);
          // Color center progression: white(240,236,232) → amber(180,140,100) → brown(100,60,80) → dark purple(80,36,92)
          const r = Math.round(240 - d * 160);
          const g = Math.round(236 - d * 200);
          const b = Math.round(232 - d * 140);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(ox + px * cellSz, oy + py * cellSz, Math.ceil(cellSz), Math.ceil(cellSz));
        }
      }
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const vals = [];
      for (let i = 3; i < pat.data.length; i += 4) {
        const v = pat.data[i]; if (v > 0) vals.push(v);
      }
      vals.sort((a, b) => a - b);
      const p50 = vals.length > 0 ? vals[Math.floor(vals.length * 0.5)] : maxA;
      const p95 = vals.length > 0 ? vals[Math.floor(vals.length * 0.95)] : maxA;
      const dynRange = maxA / Math.max(p50, 0.001);
      const gamma = dynRange > 50 ? 0.25 : dynRange > 10 ? 0.35 : dynRange > 3 ? 0.5 : 0.7;
      const normRef = dynRange > 5 ? p95 : maxA;

      for (let py = 0; py < ph; py++) {
        for (let px = 0; px < pw; px++) {
          const i = (py * pw + px) * 4;
          const a = pat.data[i + 3] || 0;
          if (a <= 0) continue;
          const L = Math.min(a / normRef, 2.0);
          const tone = Math.min(1.0, Math.pow(L, gamma));
          const cr = pat.data[i] || 0, cg = pat.data[i+1] || 0, cb = pat.data[i+2] || 0;
          const r = Math.min(255, Math.round((cr/a)*tone*255));
          const g = Math.min(255, Math.round((cg/a)*tone*255));
          const b = Math.min(255, Math.round((cb/a)*tone*255));
          if (r === 0 && g === 0 && b === 0) continue;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(ox + px*cellSz, oy + py*cellSz, Math.ceil(cellSz), Math.ceil(cellSz));
        }
      }
    }
    ctx.restore();

    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 0.5, oy - 0.5, cellSz * pw + 1, cellSz * ph + 1);

    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.label, pad, pad);

    if (this.rings && this.rings.length > 0) {
      const cx = ox + cellSz * pw / 2;
      const cy = oy + cellSz * ph / 2;
      const maxR = Math.min(cellSz * pw, cellSz * ph) / 2;
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 0.5;
      ctx.font = '8px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textBaseline = 'middle';
      let prevLabelY = -999;
      for (let ri = 0; ri < this.rings.length; ri++) {
        const ring = this.rings[ri];
        const r = ring.normRadius * maxR;
        if (r < 4 || r > maxR * 1.1) continue;
        const bright = ring.strong;
        ctx.strokeStyle = bright ? 'rgba(255,200,50,0.35)' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        const labelY = cy - r;
        if (Math.abs(labelY - prevLabelY) < 10) continue;
        prevLabelY = labelY;
        ctx.fillStyle = bright ? 'rgba(255,220,80,0.7)' : 'rgba(200,200,200,0.45)';
        ctx.textAlign = 'left';
        ctx.fillText(ring.label, cx + r * 0.71 + 3, cy - r * 0.71);
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (this.symmetryFold >= 2) {
      const cx = ox + cellSz * pw / 2;
      const cy = oy + cellSz * ph / 2;
      const r = Math.min(cellSz * pw, cellSz * ph) / 2;
      const n = this.symmetryFold;
      ctx.save();
      ctx.strokeStyle = 'rgba(88,166,255,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(88,166,255,0.5)';
      ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(n + '-fold', ox + cellSz * pw - 2, oy + cellSz * ph - 2);
      ctx.restore();
    }

    ctx.restore();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = this.canvas.clientWidth || 0;
    const ch = this.canvas.clientHeight || 0;
    if (cw !== this._prevW || ch !== this._prevH) {
      if (cw > 0 && ch > 0) {
        this.canvas.width = cw * dpr;
        this.canvas.height = ch * dpr;
      }
      this._prevW = cw;
      this._prevH = ch;
    }
    this.dpr = dpr;
  }
};
