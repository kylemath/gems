/**
 * IR / Raman Vibrational Spectrum Renderer
 * Renders FTIR transmittance or Raman intensity spectra for mineral samples.
 */
window.VibrationalRenderer = class VibrationalRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gem = null;
    this.allGems = null;
    this.mode = 'ir';
    this.overlayAll = false;
    this.showAssignments = true;
    this.dpr = 1;
    this._hoverCm = null;
    this._rangeMin = 100;
    this._rangeMax = 1400;
  }

  setGem(gem) { this.gem = gem; }
  setAllGems(gems) { this.allGems = gems; }
  setMode(m) { this.mode = m; }

  _getVibData(gem) {
    const g = gem || this.gem;
    if (!g || !g.vibrational) return null;
    return g.vibrational[this.mode] || null;
  }

  _computeSpectrum(gem) {
    const vib = this._getVibData(gem);
    if (!vib || !vib.peaks || vib.peaks.length === 0) return null;

    const peaks = vib.peaks;
    const ppmMin = this._rangeMin, ppmMax = this._rangeMax;
    const N = 2000;
    const spectrum = new Float32Array(N);
    const dw = (ppmMax - ppmMin) / N;

    if (this.mode === 'ir') {
      spectrum.fill(1.0);
      for (const pk of peaks) {
        const sigma = (pk.width || 15) / 2.355;
        const depth = pk.relIntensity || 0.5;
        for (let i = 0; i < N; i++) {
          const w = ppmMin + i * dw;
          const dp = w - pk.freq;
          const g = depth * Math.exp(-0.5 * (dp / sigma) * (dp / sigma));
          spectrum[i] = Math.max(0, spectrum[i] - g);
        }
      }
    } else {
      for (const pk of peaks) {
        const sigma = (pk.width || 8) / 2.355;
        const amp = pk.relIntensity || 1.0;
        for (let i = 0; i < N; i++) {
          const w = ppmMin + i * dw;
          const dp = w - pk.freq;
          spectrum[i] += amp * Math.exp(-0.5 * (dp / sigma) * (dp / sigma));
        }
      }
    }

    return { data: spectrum, wMin: ppmMin, wMax: ppmMax, N, peaks };
  }

  render() {
    this._resize();
    const ctx = this.ctx, dpr = this.dpr;
    const w = this.canvas.width / dpr, h = this.canvas.height / dpr;
    if (w < 10 || h < 10) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const gemList = this.overlayAll && this.allGems
      ? Object.values(this.allGems).filter(g => this._getVibData(g))
      : (this._getVibData() ? [this.gem] : []);

    if (gemList.length === 0) {
      ctx.fillStyle = '#7d8590';
      ctx.font = '13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = this.mode === 'ir' ? 'IR' : 'Raman';
      const msg = this.gem ? `No ${label} data for ${this.gem.name}` : 'Select a mineral';
      ctx.fillText(msg, w / 2, h / 2);
      ctx.restore();
      return;
    }

    const spectra = gemList.map(g => ({ gem: g, spec: this._computeSpectrum(g) })).filter(s => s.spec);
    if (spectra.length === 0) { ctx.restore(); return; }

    const padR = this.overlayAll ? 140 : 20;
    const pad = { top: 40, bottom: 40, left: 55, right: padR };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    if (cw < 20 || ch < 20) { ctx.restore(); return; }

    const wMin = this._rangeMax, wMax = this._rangeMin;
    const wToX = cm => pad.left + ((wMin - cm) / (wMin - wMax)) * cw;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(pad.left, pad.top, cw, ch);
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, cw, ch);

    let globalMax = 0;
    if (this.mode === 'raman') {
      for (const { spec } of spectra)
        for (let i = 0; i < spec.N; i++) if (spec.data[i] > globalMax) globalMax = spec.data[i];
      if (globalMax <= 0) globalMax = 1;
    }

    const valToY = this.mode === 'ir'
      ? v => pad.top + ch - v * ch
      : v => pad.top + ch - (v / (globalMax * 1.15)) * ch;

    const colors = ['#3fb950','#58a6ff','#f85149','#d29922','#bc8cff','#f778ba',
      '#7ee787','#79c0ff','#ff7b72','#e3b341','#d2a8ff','#ff9bce',
      '#56d364','#a5d6ff','#ffa198','#f0cc56','#e8d4ff','#ffbedd'];

    for (let si = 0; si < spectra.length; si++) {
      const { gem: g, spec } = spectra[si];
      const color = this.overlayAll ? colors[si % colors.length] : (this.mode === 'ir' ? '#3fb950' : '#bc8cff');
      const isActive = !this.overlayAll || g === this.gem;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = isActive ? 1.8 : 1.0;
      ctx.globalAlpha = isActive ? 1.0 : 0.5;
      for (let i = 0; i < spec.N; i++) {
        const cm = spec.wMin + i * (spec.wMax - spec.wMin) / spec.N;
        const x = wToX(cm);
        const y = valToY(spec.data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!this.overlayAll && this.mode === 'raman') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(wToX(spec.wMin), valToY(0));
        for (let i = 0; i < spec.N; i++) {
          const cm = spec.wMin + i * (spec.wMax - spec.wMin) / spec.N;
          ctx.lineTo(wToX(cm), valToY(spec.data[i]));
        }
        ctx.lineTo(wToX(spec.wMax), valToY(0));
        ctx.closePath();
        ctx.fillStyle = 'rgba(188,140,255,0.06)';
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    }

    if (this.showAssignments && !this.overlayAll && spectra.length > 0) {
      const spec = spectra[0].spec;
      ctx.font = '9px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      const sorted = [...spec.peaks].sort((a, b) => b.relIntensity - a.relIntensity);
      let prevLabelX = -999;
      for (const pk of sorted) {
        const x = wToX(pk.freq);
        if (x < pad.left + 5 || x > pad.left + cw - 5) continue;
        if (Math.abs(x - prevLabelX) < 45) continue;
        prevLabelX = x;

        ctx.strokeStyle = 'rgba(248,81,73,0.3)'; ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f85149'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${pk.freq}`, x, pad.top - 2);

        if (pk.assignment) {
          ctx.fillStyle = '#7d8590'; ctx.textBaseline = 'top';
          ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
          const parts = pk.assignment.split(' — ');
          for (let li = 0; li < Math.min(parts.length, 2); li++)
            ctx.fillText(parts[li], x, pad.top + ch + 4 + li * 10);
          ctx.font = '9px "SF Mono","Fira Code",Menlo,monospace';
        }
      }
    }

    if (this.overlayAll) {
      ctx.font = '9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const lx = pad.left + cw + 8;
      let ly = pad.top + 4;
      for (let si = 0; si < spectra.length; si++) {
        const color = colors[si % colors.length];
        const name = spectra[si].gem.name || '?';
        const isActive = spectra[si].gem === this.gem;
        ctx.fillStyle = color;
        ctx.fillRect(lx, ly, 10, 10);
        if (isActive) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(lx, ly, 10, 10); }
        ctx.fillStyle = isActive ? '#e6edf3' : '#7d8590';
        ctx.fillText(name, lx + 14, ly + 5);
        ly += 14;
        if (ly > pad.top + ch) break;
      }
    }

    this._drawAxes(ctx, pad, cw, ch, wToX, valToY, w, h);

    if (this._hoverCm != null) {
      const hx = wToX(this._hoverCm);
      if (hx >= pad.left && hx <= pad.left + cw) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(hx, pad.top); ctx.lineTo(hx, pad.top + ch); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e6edf3'; ctx.font = '10px monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${this._hoverCm.toFixed(0)} cm⁻¹`, hx + 4, pad.top - 2);
      }
    }

    ctx.restore();
  }

  _drawAxes(ctx, pad, cw, ch, wToX, valToY, w, h) {
    const modeLabel = this.mode === 'ir' ? 'FTIR Absorption' : 'Raman';
    const title = this.overlayAll
      ? `${modeLabel} Spectrum — All Minerals`
      : `${modeLabel} Spectrum — ${this.gem ? this.gem.name : ''}`;
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(title, pad.left + cw / 2, 6);

    ctx.fillStyle = '#7d8590';
    ctx.font = '10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    const sub = this.mode === 'ir' ? 'Mid-IR region — dips = absorption bands' : 'Stokes shift — peaks = active vibrational modes';
    ctx.fillText(sub, pad.left + cw / 2, 22);

    ctx.fillStyle = '#7d8590';
    ctx.font = '11px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Wavenumber (cm⁻¹)', pad.left + cw / 2, h - 10);

    const tickStep = 100;
    ctx.font = '9px "SF Mono","Fira Code",Menlo,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 0.5;
    for (let cm = 200; cm <= 1400; cm += tickStep) {
      const x = wToX(cm);
      if (x < pad.left + 5 || x > pad.left + cw - 5) continue;
      ctx.fillStyle = '#484f58';
      ctx.fillText(cm.toString(), x, pad.top + ch + 3);
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
    }

    ctx.save();
    ctx.translate(12, pad.top + ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.mode === 'ir' ? 'Transmittance (%)' : 'Intensity', 0, 0);
    ctx.restore();

    if (this.mode === 'ir') {
      ctx.font = '8px monospace'; ctx.fillStyle = '#484f58';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('100%', pad.left - 4, pad.top + 2);
      ctx.fillText('0%', pad.left - 4, pad.top + ch - 2);
    }
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (cw > 0 && ch > 0) {
      this.canvas.width = cw * dpr;
      this.canvas.height = ch * dpr;
    }
    this.dpr = dpr;
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ww = rect.width;
      const padL = 55, padR = this.overlayAll ? 140 : 20;
      const cw = ww - padL - padR;
      const frac = (x - padL) / cw;
      this._hoverCm = this._rangeMax - frac * (this._rangeMax - this._rangeMin);
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this._hoverCm = null;
      this.render();
    });
  }
};
