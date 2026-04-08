// Absorption Spectra Chart Renderer — zero-dependency Canvas 2D
// Renders gemstone absorption spectra with visible spectrum background,
// Catmull-Rom spline interpolation, crosshair cursor, and high-DPI support.

function wavelengthToRGB(wavelength) {
  let r, g, b;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0; b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0; g = (wavelength - 440) / (490 - 440); b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0; g = 1; b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510); g = 1; b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1; g = -(wavelength - 645) / (645 - 580); b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1; g = 0; b = 0;
  } else {
    r = 0; g = 0; b = 0;
  }
  let factor;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
    factor = 1.0;
  } else if (wavelength > 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else {
    factor = 0;
  }
  return [r * factor, g * factor, b * factor];
}

function lightenColor(hex, threshold) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance >= threshold) return hex;
  const boost = threshold / Math.max(luminance, 0.01);
  const clamp = v => Math.min(255, Math.round(v * boost));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function niceNumber(range, round) {
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

function niceAxisTicks(min, max, targetTicks) {
  const range = niceNumber(max - min, false);
  const spacing = niceNumber(range / (targetTicks - 1), true);
  const niceMin = Math.floor(min / spacing) * spacing;
  const niceMax = Math.ceil(max / spacing) * spacing;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + spacing * 0.5; v += spacing) {
    const rounded = Math.round(v * 1e10) / 1e10;
    if (rounded >= min && rounded <= max) ticks.push(rounded);
  }
  return { ticks, spacing };
}

// Catmull-Rom spline: evaluate at parameter t ∈ [0,1] between p1 and p2
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

window.SpectraRenderer = class SpectraRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = null;
    this.gemstone = null;
    this.minWl = null;
    this.maxWl = null;
    this.customRange = false;
    this.cursorEnabled = true;
    this.cursorX = null;
    this.cursorY = null;
    this.dirty = true;
    this.prevWidth = 0;
    this.prevHeight = 0;
    this.spectrumCache = null;
    this.spectrumCacheKey = null;

    this.padding = { left: 70, bottom: 50, top: 30, right: 30 };

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._rafTick = this._rafTick.bind(this);

    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseleave', this._onMouseLeave);

    this._cursorDirty = false;
    this._rafId = null;
  }

  setData(gemstone) {
    this.gemstone = gemstone;
    this.data = gemstone && gemstone.spectra ? gemstone.spectra.data : null;
    if (!this.customRange) this._computeDataRange();
    this.spectrumCache = null;
    this.dirty = true;
  }

  setRange(minWl, maxWl) {
    this.minWl = minWl;
    this.maxWl = maxWl;
    this.customRange = true;
    this.spectrumCache = null;
    this.dirty = true;
  }

  resetRange() {
    this.customRange = false;
    this._computeDataRange();
    this.spectrumCache = null;
    this.dirty = true;
  }

  showCursor(enabled) {
    this.cursorEnabled = enabled;
    if (!enabled) {
      this.cursorX = null;
      this.cursorY = null;
    }
    this.dirty = true;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === this.prevWidth && h === this.prevHeight) return;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.prevWidth = w;
    this.prevHeight = h;
    this.spectrumCache = null;
    this.dirty = true;
  }

  render() {
    this.resize();
    const dpr = window.devicePixelRatio || 1;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    if (!this.data || this.data.length === 0) {
      ctx.fillStyle = '#7d8590';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No spectral data available', w / 2, h / 2);
      ctx.restore();
      return;
    }

    const p = this.padding;
    const plotX = p.left;
    const plotY = p.top;
    const plotW = w - p.left - p.right;
    const plotH = h - p.top - p.bottom;

    if (plotW <= 0 || plotH <= 0) { ctx.restore(); return; }

    const wlMin = this.minWl;
    const wlMax = this.maxWl;
    const absMax = this._absMax();
    const absMin = 0;

    const toX = wl => plotX + (wl - wlMin) / (wlMax - wlMin) * plotW;
    const toY = a => plotY + plotH - (a - absMin) / (absMax - absMin) * plotH;
    const fromX = px => wlMin + (px - plotX) / plotW * (wlMax - wlMin);

    // Visible spectrum background
    this._drawSpectrumBackground(ctx, plotX, plotY, plotW, plotH, wlMin, wlMax);

    // Grid and axes
    this._drawGrid(ctx, plotX, plotY, plotW, plotH, wlMin, wlMax, absMin, absMax, toX, toY);

    // Plot border
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(plotX) + 0.5, Math.round(plotY) + 0.5, Math.round(plotW), Math.round(plotH));

    // Spectrum fill + line
    this._drawSpectrum(ctx, plotX, plotY, plotW, plotH, toX, toY);

    // Header
    this._drawHeader(ctx, plotX, plotY, plotW, plotH);

    // Source attribution
    this._drawSource(ctx, plotX, plotY, plotW, plotH);

    // Crosshair cursor
    if (this.cursorEnabled && this.cursorX !== null && this.cursorY !== null) {
      this._drawCursor(ctx, plotX, plotY, plotW, plotH, toX, toY, fromX, w, h);
    }

    ctx.restore();
    this.dirty = false;
  }

  // --- Private ---

  _computeDataRange() {
    if (!this.data || this.data.length === 0) return;
    let lo = Infinity, hi = -Infinity;
    for (const [wl] of this.data) {
      if (wl < lo) lo = wl;
      if (wl > hi) hi = wl;
    }
    this.minWl = lo;
    this.maxWl = hi;
  }

  _absMax() {
    if (!this.data || this.data.length === 0) return 1;
    let mx = 0;
    for (const [, a] of this.data) {
      if (a > mx) mx = a;
    }
    return mx * 1.1 || 1;
  }

  _drawSpectrumBackground(ctx, plotX, plotY, plotW, plotH, wlMin, wlMax) {
    const cacheKey = `${plotW}|${plotH}|${wlMin}|${wlMax}`;
    if (this.spectrumCache && this.spectrumCacheKey === cacheKey) {
      ctx.drawImage(this.spectrumCache, plotX, plotY);
      return;
    }

    const offscreen = document.createElement('canvas');
    const dpr = 1;
    offscreen.width = Math.ceil(plotW);
    offscreen.height = Math.ceil(plotH);
    const oc = offscreen.getContext('2d');

    for (let px = 0; px < plotW; px++) {
      const wl = wlMin + (px / plotW) * (wlMax - wlMin);
      if (wl < 380 || wl > 780) continue;
      const [r, g, b] = wavelengthToRGB(wl);
      oc.fillStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.15)`;
      oc.fillRect(px, 0, 1, plotH);
    }

    this.spectrumCache = offscreen;
    this.spectrumCacheKey = cacheKey;
    ctx.drawImage(offscreen, plotX, plotY);
  }

  _drawGrid(ctx, plotX, plotY, plotW, plotH, wlMin, wlMax, absMin, absMax, toX, toY) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // X-axis: major every 100nm, minor every 50nm
    const xMajorStep = 100;
    const xMinorStep = 50;
    const xStart = Math.ceil(wlMin / xMinorStep) * xMinorStep;

    for (let wl = xStart; wl <= wlMax; wl += xMinorStep) {
      const x = Math.round(toX(wl)) + 0.5;
      const isMajor = wl % xMajorStep === 0;

      ctx.strokeStyle = isMajor ? '#30363d' : '#1c2129';
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, plotY);
      ctx.lineTo(x, plotY + plotH);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = '#7d8590';
        ctx.font = '11px "SF Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace';
        ctx.fillText(wl.toString(), x, plotY + plotH + 6);
      }
    }

    // X-axis label
    ctx.fillStyle = '#b1bac4';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Wavelength (nm)', plotX + plotW / 2, plotY + plotH + 28);

    // Y-axis
    const yTicks = niceAxisTicks(absMin, absMax, 6);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (const val of yTicks.ticks) {
      const y = Math.round(toY(val)) + 0.5;

      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#7d8590';
      ctx.font = '11px "SF Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace';
      ctx.fillText(val.toFixed(1), plotX - 8, y);
    }

    // Minor y gridlines (half spacing)
    const yMinorSpacing = yTicks.spacing / 2;
    const yMinorStart = Math.ceil(absMin / yMinorSpacing) * yMinorSpacing;
    for (let val = yMinorStart; val <= absMax; val += yMinorSpacing) {
      if (yTicks.ticks.includes(val)) continue;
      const y = Math.round(toY(val)) + 0.5;
      ctx.strokeStyle = '#1c2129';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();
    }

    // Y-axis label (rotated)
    ctx.save();
    ctx.fillStyle = '#b1bac4';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.translate(16, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Absorbance', 0, 0);
    ctx.restore();
  }

  _drawSpectrum(ctx, plotX, plotY, plotW, plotH, toX, toY) {
    const data = this.data;
    if (!data || data.length < 2) return;

    const lineColor = this._lineColor();
    const pts = [];
    for (const [wl, a] of data) {
      pts.push([toX(wl), toY(a)]);
    }

    // Generate spline points via Catmull-Rom
    const splinePts = this._catmullRomPath(pts, 8);

    // Fill under curve
    const grad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
    grad.addColorStop(0, this._colorWithAlpha(lineColor, 0.4));
    grad.addColorStop(1, this._colorWithAlpha(lineColor, 0));

    ctx.beginPath();
    ctx.moveTo(splinePts[0][0], plotY + plotH);
    for (const [sx, sy] of splinePts) {
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(splinePts[splinePts.length - 1][0], plotY + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke the curve
    ctx.beginPath();
    ctx.moveTo(splinePts[0][0], splinePts[0][1]);
    for (let i = 1; i < splinePts.length; i++) {
      ctx.lineTo(splinePts[i][0], splinePts[i][1]);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  _catmullRomPath(pts, segments) {
    if (pts.length < 2) return pts;
    const result = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (let s = 0; s < segments; s++) {
        const t = s / segments;
        result.push([
          catmullRom(p0[0], p1[0], p2[0], p3[0], t),
          catmullRom(p0[1], p1[1], p2[1], p3[1], t),
        ]);
      }
    }
    result.push(pts[pts.length - 1]);
    return result;
  }

  _lineColor() {
    const fallback = '#58a6ff';
    if (!this.gemstone || !this.gemstone.color) return fallback;
    return lightenColor(this.gemstone.color, 0.35);
  }

  _colorWithAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _drawHeader(ctx, plotX, plotY, plotW, plotH) {
    if (!this.gemstone) return;
    const name = this.gemstone.name || '';
    const label = (this.gemstone.spectra && this.gemstone.spectra.label) || '';

    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(name, plotX + 10, plotY + 8);

    if (label) {
      ctx.fillStyle = '#7d8590';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.fillText(label, plotX + 10, plotY + 26);
    }
  }

  _drawSource(ctx, plotX, plotY, plotW, plotH) {
    const src = this.gemstone && this.gemstone.spectra && this.gemstone.spectra.source;
    if (!src) return;

    ctx.fillStyle = '#484f58';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Source: ${src}`, plotX + plotW - 8, plotY + plotH - 6);
  }

  _drawCursor(ctx, plotX, plotY, plotW, plotH, toX, toY, fromX, canvasW, canvasH) {
    const mx = this.cursorX;
    const my = this.cursorY;

    if (mx < plotX || mx > plotX + plotW || my < plotY || my > plotY + plotH) return;

    const wl = fromX(mx);
    const abs = this._interpolateAbsorbance(wl);
    if (abs === null) return;

    const dotX = mx;
    const dotY = toY(abs);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#484f58';
    ctx.lineWidth = 1;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(Math.round(dotX) + 0.5, plotY);
    ctx.lineTo(Math.round(dotX) + 0.5, plotY + plotH);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(plotX, Math.round(dotY) + 0.5);
    ctx.lineTo(plotX + plotW, Math.round(dotY) + 0.5);
    ctx.stroke();

    ctx.setLineDash([]);

    // Dot on curve
    const lineColor = this._lineColor();
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tooltip
    const tooltipText = `${wl.toFixed(1)} nm  |  ${abs.toFixed(3)}`;
    ctx.font = '11px "SF Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace';
    const tm = ctx.measureText(tooltipText);
    const tipW = tm.width + 16;
    const tipH = 26;
    let tipX = dotX + 12;
    let tipY = dotY - tipH - 8;

    if (tipX + tipW > plotX + plotW) tipX = dotX - tipW - 12;
    if (tipY < plotY) tipY = dotY + 12;

    ctx.fillStyle = '#1c2129';
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    this._roundRect(ctx, tipX, tipY, tipW, tipH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tooltipText, tipX + 8, tipY + tipH / 2);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _interpolateAbsorbance(wl) {
    const data = this.data;
    if (!data || data.length === 0) return null;
    if (wl <= data[0][0]) return data[0][1];
    if (wl >= data[data.length - 1][0]) return data[data.length - 1][1];

    // Binary search for the bracketing interval
    let lo = 0, hi = data.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (data[mid][0] <= wl) lo = mid;
      else hi = mid;
    }

    // Catmull-Rom interpolation using surrounding 4 points
    const i0 = Math.max(lo - 1, 0);
    const i1 = lo;
    const i2 = hi;
    const i3 = Math.min(hi + 1, data.length - 1);

    const t = (wl - data[i1][0]) / (data[i2][0] - data[i1][0]);
    return catmullRom(data[i0][1], data[i1][1], data[i2][1], data[i3][1], t);
  }

  _onMouseMove(e) {
    if (!this.cursorEnabled) return;
    const rect = this.canvas.getBoundingClientRect();
    this.cursorX = e.clientX - rect.left;
    this.cursorY = e.clientY - rect.top;
    this._scheduleCursorRedraw();
  }

  _onMouseLeave() {
    this.cursorX = null;
    this.cursorY = null;
    this._scheduleCursorRedraw();
  }

  _scheduleCursorRedraw() {
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(this._rafTick);
  }

  _rafTick() {
    this._rafId = null;
    this.render();
  }
};
