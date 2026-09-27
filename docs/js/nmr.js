/**
 * Solid-State NMR Spectrum Renderer
 * Simulates MAS-NMR spectra for mineral samples with chemical shift,
 * line broadening, spinning sidebands, and quadrupolar effects.
 */
window.NMRRenderer = class NMRRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gem = null;
    this.allGems = null;
    this.nucleus = 'Si29';
    this.fieldStrength = 9.4;
    this.masFrequency = 10;
    this.lineBoost = 1.0;
    this.showSidebands = true;
    this.showAssignments = true;
    this.overlayAll = false;
    this.dpr = 1;
    this._hoverPpm = null;
  }

  setGem(gem) { this.gem = gem; }
  setAllGems(gems) { this.allGems = gems; }

  setNucleus(nuc) { this.nucleus = nuc; }

  getAvailableNuclei() {
    if (this.overlayAll && this.allGems) {
      const set = new Set();
      for (const gem of Object.values(this.allGems)) {
        if (gem.nmr && gem.nmr.nuclei) Object.keys(gem.nmr.nuclei).forEach(k => set.add(k));
      }
      return Array.from(set);
    }
    if (!this.gem || !this.gem.nmr || !this.gem.nmr.nuclei) return [];
    return Object.keys(this.gem.nmr.nuclei);
  }

  _getNucleusData(gem) {
    const g = gem || this.gem;
    if (!g || !g.nmr || !g.nmr.nuclei) return null;
    return g.nmr.nuclei[this.nucleus] || null;
  }

  _fixedRange() {
    const ranges = {
      Si29: [-130, -40], Al27: [-20, 80], Be9: [-10, 20],
      Na23: [-40, 40], Mg25: [-20, 60], K39: [-80, 20],
    };
    return ranges[this.nucleus] || null;
  }

  _nucleusLabel(key) {
    const labels = {
      Si29: '²⁹Si', Al27: '²⁷Al', Be9: '⁹Be', Na23: '²³Na',
      Mg25: '²⁵Mg', K39: '³⁹K', H1: '¹H', C13: '¹³C', F19: '¹⁹F',
    };
    return labels[key] || key;
  }

  _computeSpectrum(gem) {
    const nuc = this._getNucleusData(gem);
    if (!nuc || !nuc.peaks || nuc.peaks.length === 0) return null;

    const peaks = nuc.peaks;
    const spin = this._parseSpin(nuc.spin);
    const isQuadrupolar = spin > 0.5;

    const fixed = this._fixedRange();
    let ppmMin, ppmMax;
    if (fixed) {
      ppmMin = fixed[0]; ppmMax = fixed[1];
    } else {
      ppmMin = Infinity; ppmMax = -Infinity;
      for (const pk of peaks) {
        const hw = (pk.width || 3) * 3;
        if (pk.shift - hw < ppmMin) ppmMin = pk.shift - hw;
        if (pk.shift + hw > ppmMax) ppmMax = pk.shift + hw;
      }
      const pad = Math.max((ppmMax - ppmMin) * 0.15, 5);
      ppmMin -= pad; ppmMax += pad;
    }

    const N = 2000;
    const spectrum = new Float32Array(N);
    const dppm = (ppmMax - ppmMin) / N;

    const fieldFactor = 9.4 / this.fieldStrength;
    const masNarrow = this.masFrequency > 0 ? Math.max(0.3, 1 - this.masFrequency / 30) : 1.0;

    for (const pk of peaks) {
      let w = (pk.width || 3) * this.lineBoost;
      if (isQuadrupolar) w *= fieldFactor;
      w *= masNarrow;
      w = Math.max(w, 0.2);

      const sigma = w / 2.355;
      const amp = (pk.relIntensity || 1.0);

      for (let i = 0; i < N; i++) {
        const ppm = ppmMin + i * dppm;
        const dp = ppm - pk.shift;

        if (isQuadrupolar && w > 2) {
          const asym = 1 + 0.3 * dp / w;
          const g = amp * Math.max(0, asym) * Math.exp(-0.5 * (dp / sigma) * (dp / sigma));
          spectrum[i] += g;
        } else {
          spectrum[i] += amp * Math.exp(-0.5 * (dp / sigma) * (dp / sigma));
        }
      }

      if (this.showSidebands && this.masFrequency > 0) {
        const freqHz = nuc.frequency * 1e6 * (this.fieldStrength / 9.4);
        const sbSpacingPpm = (this.masFrequency * 1000 / freqHz) * 1e6;
        if (sbSpacingPpm > 0.5) {
          for (let n = 1; n <= 4; n++) {
            const sbAmp = amp * Math.pow(0.15 / (masNarrow + 0.1), n) * 0.3;
            if (sbAmp < 0.001) continue;
            for (const sign of [-1, 1]) {
              const sbShift = pk.shift + sign * n * sbSpacingPpm;
              const sbSigma = sigma * 1.2;
              for (let i = 0; i < N; i++) {
                const ppm = ppmMin + i * dppm;
                const dp2 = ppm - sbShift;
                spectrum[i] += sbAmp * Math.exp(-0.5 * (dp2 / sbSigma) * (dp2 / sbSigma));
              }
            }
          }
        }
      }
    }

    return { data: spectrum, ppmMin, ppmMax, N, peaks, isQuadrupolar };
  }

  _parseSpin(s) {
    if (!s) return 0.5;
    if (s === '1/2') return 0.5;
    if (s === '3/2') return 1.5;
    if (s === '5/2') return 2.5;
    if (s === '7/2') return 3.5;
    return parseFloat(s) || 0.5;
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
      ? Object.values(this.allGems).filter(g => this._getNucleusData(g))
      : (this._getNucleusData() ? [this.gem] : []);

    if (gemList.length === 0) {
      ctx.fillStyle = '#7d8590';
      ctx.font = '13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const msg = this.gem ? `No ${this._nucleusLabel(this.nucleus)} NMR data for ${this.gem.name}` : 'Select a mineral';
      ctx.fillText(msg, w / 2, h / 2);
      ctx.restore();
      return;
    }

    const spectra = gemList.map(g => ({ gem: g, spec: this._computeSpectrum(g) })).filter(s => s.spec);
    if (spectra.length === 0) { ctx.restore(); return; }

    const pad = { top: 40, bottom: 45, left: 55, right: this.overlayAll ? 140 : 20 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    if (cw < 20 || ch < 20) { ctx.restore(); return; }

    const ppmMin = spectra[0].spec.ppmMin, ppmMax = spectra[0].spec.ppmMax;

    let maxY = 0;
    for (const { spec } of spectra) {
      for (let i = 0; i < spec.N; i++) if (spec.data[i] > maxY) maxY = spec.data[i];
    }
    if (maxY <= 0) maxY = 1;

    const ppmToX = ppm => pad.left + cw - ((ppm - ppmMin) / (ppmMax - ppmMin)) * cw;
    const valToY = v => pad.top + ch - (v / (maxY * 1.15)) * ch;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(pad.left, pad.top, cw, ch);
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, cw, ch);

    const colors = ['#58a6ff','#3fb950','#f85149','#d29922','#bc8cff','#f778ba',
      '#79c0ff','#56d364','#ff7b72','#e3b341','#d2a8ff','#ff9bce',
      '#a5d6ff','#7ee787','#ffa198','#f0cc56','#e8d4ff','#ffbedd'];

    for (let si = 0; si < spectra.length; si++) {
      const { gem: g, spec } = spectra[si];
      const color = this.overlayAll ? colors[si % colors.length] : '#58a6ff';
      const isActive = !this.overlayAll || g === this.gem;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = isActive ? 1.8 : 1.0;
      ctx.globalAlpha = isActive ? 1.0 : 0.5;
      for (let i = 0; i < spec.N; i++) {
        const ppm = ppmMin + i * (ppmMax - ppmMin) / spec.N;
        const x = ppmToX(ppm);
        const y = valToY(spec.data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!this.overlayAll) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(ppmToX(ppmMin), valToY(0));
        for (let i = 0; i < spec.N; i++) {
          const ppm = ppmMin + i * (ppmMax - ppmMin) / spec.N;
          ctx.lineTo(ppmToX(ppm), valToY(spec.data[i]));
        }
        ctx.lineTo(ppmToX(ppmMax), valToY(0));
        ctx.closePath();
        ctx.fillStyle = 'rgba(88,166,255,0.08)';
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    }

    if (this.showAssignments && !this.overlayAll) {
      const spec = spectra[0].spec;
      ctx.font = '10px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      for (const pk of spec.peaks) {
        const x = ppmToX(pk.shift);
        if (x < pad.left || x > pad.left + cw) continue;
        ctx.strokeStyle = 'rgba(248,81,73,0.4)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f85149'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${pk.shift.toFixed(1)} ppm`, x, pad.top - 3);
        if (pk.assignment) {
          ctx.fillStyle = '#7d8590'; ctx.textBaseline = 'top';
          ctx.font = '9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
          const lines = pk.assignment.split(' — ');
          for (let li = 0; li < lines.length; li++) ctx.fillText(lines[li], x, pad.top + ch + 18 + li * 12);
          ctx.font = '10px "SF Mono","Fira Code",Menlo,monospace';
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

    this._drawAxes(ctx, spectra[0].spec, pad, cw, ch, ppmToX, valToY, w, h);

    if (this._hoverPpm != null) {
      const hx = ppmToX(this._hoverPpm);
      if (hx >= pad.left && hx <= pad.left + cw) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(hx, pad.top); ctx.lineTo(hx, pad.top + ch); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e6edf3'; ctx.font = '10px monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${this._hoverPpm.toFixed(1)} ppm`, hx + 4, pad.top - 2);
      }
    }

    ctx.restore();
  }

  _drawAxes(ctx, spec, pad, cw, ch, ppmToX, valToY, w, h) {
    const nuc = this._getNucleusData();
    const title = this.overlayAll
      ? `${this._nucleusLabel(this.nucleus)} MAS-NMR — All Minerals`
      : `${this._nucleusLabel(this.nucleus)} MAS-NMR — ${this.gem ? this.gem.name : ''}`;
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(title, pad.left + cw / 2, 6);

    const freq = nuc ? (nuc.frequency * this.fieldStrength / 9.4).toFixed(1) : '?';
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.fillText(`B₀ = ${this.fieldStrength.toFixed(1)} T    MAS = ${this.masFrequency.toFixed(0)} kHz    ν₀ = ${freq} MHz`, pad.left + cw / 2, 22);

    ctx.fillStyle = '#7d8590';
    ctx.font = '11px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Chemical Shift (ppm)', pad.left + cw / 2, h - 10);

    const range = spec.ppmMax - spec.ppmMin;
    let tickStep = 5;
    if (range > 200) tickStep = 50;
    else if (range > 100) tickStep = 20;
    else if (range > 50) tickStep = 10;

    ctx.font = '9px "SF Mono","Fira Code",Menlo,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 0.5;

    const firstTick = Math.ceil(spec.ppmMin / tickStep) * tickStep;
    for (let ppm = firstTick; ppm <= spec.ppmMax; ppm += tickStep) {
      const x = ppmToX(ppm);
      if (x < pad.left + 5 || x > pad.left + cw - 5) continue;
      ctx.fillStyle = '#484f58';
      ctx.fillText(ppm.toString(), x, pad.top + ch + 3);
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
    }

    ctx.save();
    ctx.translate(12, pad.top + ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Intensity', 0, 0);
    ctx.restore();
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
      const w = rect.width;
      const spec = this._computeSpectrum();
      if (!spec) return;
      const pad = { left: 55, right: 20 };
      const cw = w - pad.left - pad.right;
      const frac = 1 - (x - pad.left) / cw;
      this._hoverPpm = spec.ppmMin + frac * (spec.ppmMax - spec.ppmMin);
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this._hoverPpm = null;
      this.render();
    });
  }
};
