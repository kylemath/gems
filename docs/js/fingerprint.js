/**
 * Structural Fingerprint Renderer
 *
 * Visualizes predicted XRD reflections alongside Raman/IR vibrational peaks,
 * connected through structural motifs to show how crystal structure determines
 * both diffraction pattern geometry and vibrational mode frequencies.
 *
 * Layout (top to bottom):
 *   - XRD predicted stick pattern (large d left → small d right)
 *   - Connection zone with colored motif bands (Lattice / Framework / Bond)
 *   - Vibrational mirror plot: Raman sticks up, IR sticks down (low cm⁻¹ left → high right)
 *
 * The axis orientations are chosen so LEFT = lattice/long-range and
 * RIGHT = bond/short-range across all three tracks, making the structural
 * correspondence visually immediate.
 */
window.StructuralFingerprintRenderer = class StructuralFingerprintRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gem = null;
    this.dpr = 1;
  }

  setGem(gem) { this.gem = gem; }

  render() {
    this._resize();
    const ctx = this.ctx, dpr = this.dpr;
    const w = this.canvas.width / dpr, h = this.canvas.height / dpr;
    if (w < 200 || h < 120) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const gem = this.gem;
    if (!gem) {
      this._placeholder(ctx, w, h, 'Select a mineral to see structural fingerprint');
      ctx.restore(); return;
    }

    const xrd = this._computeXRD(gem);
    const raman = (gem.vibrational && gem.vibrational.raman && gem.vibrational.raman.peaks) || [];
    const ir = (gem.vibrational && gem.vibrational.ir && gem.vibrational.ir.peaks) || [];

    if (!xrd.length && !raman.length && !ir.length) {
      this._placeholder(ctx, w, h, 'No structural data for ' + gem.name);
      ctx.restore(); return;
    }

    const L = 48, R = 12, titleH = 30, botPad = 16;
    const cw = w - L - R;
    const bodyH = h - titleH - botPad;
    const xrdH = Math.round(bodyH * 0.30);
    const connH = Math.round(bodyH * 0.14);
    const vibH = bodyH - xrdH - connH;

    const xrdY = titleH;
    const connY = xrdY + xrdH;
    const vibY = connY + connH;

    const dMin = 0.8, dMax = 6.0;
    const fMin = 100, fMax = 1400;
    const dToX = d => L + (dMax - d) / (dMax - dMin) * cw;
    const fToX = f => L + (f - fMin) / (fMax - fMin) * cw;

    this._drawTitle(ctx, w, gem);
    this._drawLegend(ctx, w);
    this._drawXRDTrack(ctx, L, xrdY, cw, xrdH, xrd, dToX);
    this._drawConnections(ctx, L, cw, connY, connH, xrd, raman, ir, dToX, fToX, dMin, dMax, fMin, fMax);
    this._drawVibTrack(ctx, L, vibY, cw, vibH, raman, ir, fToX);

    ctx.fillStyle = '#484f58';
    ctx.font = '9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Wavenumber (cm\u207B\u00B9) \u2192', L + cw / 2, vibY + vibH + 3);

    ctx.restore();
  }

  // ── Title + Legend ─────────────────────────────────────────────

  _drawTitle(ctx, w, gem) {
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Structural Fingerprint \u2014 ' + gem.name, 8, 5);
    ctx.fillStyle = '#7d8590';
    ctx.font = '10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    const info = [gem.formula, gem.crystalSystem, gem.spaceGroup].filter(Boolean).join('  \u00B7  ');
    ctx.fillText(info, 8, 18);
  }

  _drawLegend(ctx, w) {
    const items = [
      { label: 'Lattice', color: '#bc8cff' },
      { label: 'Framework', color: '#58a6ff' },
      { label: 'Bond', color: '#3fb950' },
    ];
    ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textBaseline = 'middle';
    let x = w - 12;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const tw = ctx.measureText(it.label).width;
      x -= tw;
      ctx.fillStyle = it.color;
      ctx.textAlign = 'left';
      ctx.fillText(it.label, x, 12);
      x -= 14;
      ctx.fillRect(x, 9, 8, 6);
      x -= 10;
    }
  }

  // ── XRD Track ──────────────────────────────────────────────────

  _drawXRDTrack(ctx, x0, y0, cw, th, refl, dToX) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(x0, y0, cw, th);
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 0.5;
    ctx.strokeRect(x0, y0, cw, th);

    ctx.save();
    ctx.translate(x0 - 3, y0 + th / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#484f58';
    ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('XRD (pred)', 0, 0);
    ctx.restore();

    ctx.font = '8px monospace'; ctx.fillStyle = '#484f58';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (let d = 1; d <= 5; d++) {
      const x = dToX(d);
      if (x > x0 + 5 && x < x0 + cw - 5) {
        ctx.fillText(d + '\u00C5', x, y0 + th - 1);
        ctx.strokeStyle = '#161b22'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + th - 11); ctx.stroke();
      }
    }

    ctx.fillStyle = '#484f58';
    ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('\u2190 d (\u00C5)', x0 + cw - 2, y0 + 2);

    if (!refl.length) {
      ctx.fillStyle = '#484f58';
      ctx.font = '9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('No unit cell data', x0 + cw / 2, y0 + th / 2);
      return;
    }

    let maxF2 = 0;
    for (const r of refl) if (r.F2 > maxF2) maxF2 = r.F2;
    if (maxF2 <= 0) return;

    const base = y0 + th - 12;
    const maxH = th - 22;
    const labeled = [];

    for (const r of refl) {
      const x = dToX(r.d);
      if (x < x0 || x > x0 + cw) continue;
      const sh = (r.F2 / maxF2) * maxH;
      const color = this._motifColor(r.motif);

      ctx.strokeStyle = color;
      ctx.lineWidth = r.strong ? 2.5 : 1.5;
      ctx.globalAlpha = r.strong ? 0.9 : 0.45;
      ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - sh); ctx.stroke();
      ctx.globalAlpha = 1;

      if (r.strong && !labeled.some(lx => Math.abs(lx - x) < 52)) {
        labeled.push(x);
        ctx.fillStyle = color;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(r.label, x, base - sh - 8);
        ctx.fillStyle = '#484f58';
        ctx.fillText(r.d.toFixed(2) + '\u00C5', x, base - sh - 1);
      }
    }
  }

  // ── Connection Zone ────────────────────────────────────────────

  _drawConnections(ctx, x0, cw, cy, ch, xrd, raman, ir, dToX, fToX, dMin, dMax, fMin, fMax) {
    const motifs = [
      { id: 'lattice', label: 'Lattice', bg: 'rgba(188,140,255,0.10)', dRange: [3.5, 10], fRange: [50, 280] },
      { id: 'framework', label: 'Framework', bg: 'rgba(88,166,255,0.10)', dRange: [1.8, 3.5], fRange: [280, 700] },
      { id: 'bond', label: 'Bond stretch', bg: 'rgba(63,185,80,0.10)', dRange: [0.5, 1.8], fRange: [700, 1500] },
    ];

    for (const m of motifs) {
      const hasX = xrd.some(r => r.d >= m.dRange[0] && r.d <= m.dRange[1]);
      const allVib = raman.concat(ir);
      const hasV = allVib.some(p => p.freq >= m.fRange[0] && p.freq <= m.fRange[1]);
      if (!hasX && !hasV) continue;

      const xL = dToX(Math.min(m.dRange[1], dMax));
      const xR = dToX(Math.max(m.dRange[0], dMin));
      const vL = fToX(Math.max(m.fRange[0], fMin));
      const vR = fToX(Math.min(m.fRange[1], fMax));

      ctx.beginPath();
      ctx.moveTo(xL, cy); ctx.lineTo(xR, cy);
      ctx.lineTo(vR, cy + ch); ctx.lineTo(vL, cy + ch);
      ctx.closePath();
      ctx.fillStyle = m.bg;
      ctx.fill();

      ctx.strokeStyle = this._motifColor(m.id);
      ctx.lineWidth = 0.5; ctx.globalAlpha = 0.25;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      const cx = (xL + xR + vL + vR) / 4;
      ctx.fillStyle = this._motifColor(m.id);
      ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.7;
      ctx.fillText(m.label, cx, cy + ch / 2);
      ctx.globalAlpha = 1;
    }
  }

  // ── Vibrational Mirror Track ───────────────────────────────────

  _drawVibTrack(ctx, x0, y0, cw, th, raman, ir, fToX) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(x0, y0, cw, th);
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 0.5;
    ctx.strokeRect(x0, y0, cw, th);

    const midY = y0 + th / 2;

    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, midY); ctx.lineTo(x0 + cw, midY); ctx.stroke();

    ctx.save();
    ctx.translate(x0 - 3, y0 + th * 0.25);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#bc8cff';
    ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Raman \u2191', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(x0 - 3, y0 + th * 0.75);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#3fb950';
    ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('IR \u2193', 0, 0);
    ctx.restore();

    ctx.font = '8px monospace'; ctx.fillStyle = '#484f58';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let f = 200; f <= 1400; f += 200) {
      const x = fToX(f);
      if (x > x0 + 5 && x < x0 + cw - 5) {
        ctx.fillText(f.toString(), x, y0 + th + 1);
        ctx.strokeStyle = '#161b22'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + th); ctx.stroke();
      }
    }

    const halfH = th / 2 - 6;

    if (!raman.length) {
      ctx.fillStyle = '#484f58'; ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('No Raman data', x0 + cw / 2, midY - 4);
    }

    const labeledR = [];
    const sortedRaman = [...raman].sort((a, b) => (b.relIntensity || 0) - (a.relIntensity || 0));
    for (const pk of raman) {
      const x = fToX(pk.freq);
      if (x < x0 || x > x0 + cw) continue;
      const sh = (pk.relIntensity || 0.5) * halfH;
      const motif = this._classifyVib(pk);

      ctx.strokeStyle = this._motifColor(motif);
      ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(x, midY - 1); ctx.lineTo(x, midY - sh); ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath(); ctx.arc(x, midY - sh, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#bc8cff'; ctx.fill();
    }
    for (const pk of sortedRaman) {
      const x = fToX(pk.freq);
      if (x < x0 || x > x0 + cw) continue;
      const sh = (pk.relIntensity || 0.5) * halfH;
      if (labeledR.some(lx => Math.abs(lx - x) < 40)) continue;
      labeledR.push(x);
      ctx.fillStyle = '#7d8590'; ctx.font = '7px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(pk.freq.toString(), x, midY - sh - 4);
      if (pk.assignment) {
        ctx.font = '6px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
        const short = pk.assignment.length > 18 ? pk.assignment.slice(0, 16) + '\u2026' : pk.assignment;
        ctx.fillText(short, x, midY - sh - 12);
      }
    }

    if (!ir.length) {
      ctx.fillStyle = '#484f58'; ctx.font = '8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('No IR data', x0 + cw / 2, midY + 4);
    }

    const labeledI = [];
    const sortedIR = [...ir].sort((a, b) => (b.relIntensity || 0) - (a.relIntensity || 0));
    for (const pk of ir) {
      const x = fToX(pk.freq);
      if (x < x0 || x > x0 + cw) continue;
      const sh = (pk.relIntensity || 0.5) * halfH;
      const motif = this._classifyVib(pk);

      ctx.strokeStyle = this._motifColor(motif);
      ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(x, midY + 1); ctx.lineTo(x, midY + sh); ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath(); ctx.arc(x, midY + sh, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3fb950'; ctx.fill();
    }
    for (const pk of sortedIR) {
      const x = fToX(pk.freq);
      if (x < x0 || x > x0 + cw) continue;
      const sh = (pk.relIntensity || 0.5) * halfH;
      if (labeledI.some(lx => Math.abs(lx - x) < 40)) continue;
      labeledI.push(x);
      ctx.fillStyle = '#7d8590'; ctx.font = '7px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(pk.freq.toString(), x, midY + sh + 4);
    }
  }

  // ── XRD Computation ────────────────────────────────────────────

  _computeXRD(gem) {
    if (!gem.unitCell || !gem.atoms || !gem.atoms.length) return [];
    const uc = gem.unitCell;
    const maxHKL = 6;
    const raw = [];

    for (let h = 0; h <= maxHKL; h++) {
      for (let k = -maxHKL; k <= maxHKL; k++) {
        for (let l = -maxHKL; l <= maxHKL; l++) {
          if (h === 0 && k <= 0) continue;
          if (h === 0 && k === 0 && l <= 0) continue;
          const d = this._dSpacing(h, k, l, uc);
          if (d < 0.5 || d > 10) continue;
          const F2 = this._sf2(h, k, l, gem.atoms);
          if (F2 < 1) continue;
          raw.push({ h, k, l, d, F2 });
        }
      }
    }

    raw.sort((a, b) => b.d - a.d);
    const groups = [];
    for (const r of raw) {
      const g = groups.find(g => Math.abs(g.d - r.d) < 0.03);
      if (g) { g.F2 += r.F2; if (g.hkls.length < 2) g.hkls.push([r.h, r.k, r.l]); }
      else groups.push({ d: r.d, F2: r.F2, hkls: [[r.h, r.k, r.l]] });
    }

    let maxF2 = 0;
    for (const g of groups) if (g.F2 > maxF2) maxF2 = g.F2;
    if (maxF2 <= 0) return [];

    return groups
      .filter(g => g.F2 > maxF2 * 0.03 && g.d >= 0.8 && g.d <= 6.0)
      .sort((a, b) => b.d - a.d)
      .slice(0, 25)
      .map(g => {
        const hkl = g.hkls[0];
        return {
          d: g.d, F2: g.F2,
          strong: g.F2 > maxF2 * 0.25,
          label: '(' + hkl[0] + hkl[1] + hkl[2] + ')',
          motif: g.d > 3.5 ? 'lattice' : g.d > 1.8 ? 'framework' : 'bond',
        };
      });
  }

  _dSpacing(h, k, l, uc) {
    var a = uc.a, b = uc.b, c = uc.c;
    var al = uc.alpha * Math.PI / 180, be = uc.beta * Math.PI / 180, ga = uc.gamma * Math.PI / 180;
    var ca = Math.cos(al), cb = Math.cos(be), cg = Math.cos(ga);
    var sa = Math.sin(al), sb = Math.sin(be), sg = Math.sin(ga);
    var V2 = a*a*b*b*c*c * (1 - ca*ca - cb*cb - cg*cg + 2*ca*cb*cg);
    if (V2 <= 0) return 0;
    var S11 = b*b*c*c*sa*sa, S22 = a*a*c*c*sb*sb, S33 = a*a*b*b*sg*sg;
    var S12 = a*b*c*c*(ca*cb - cg);
    var S23 = a*a*b*c*(cb*cg - ca);
    var S13 = a*b*b*c*(ca*cg - cb);
    var invD2 = (S11*h*h + S22*k*k + S33*l*l + 2*S12*h*k + 2*S23*k*l + 2*S13*h*l) / V2;
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  _sf2(h, k, l, atoms) {
    var Z = {H:1,He:2,Li:3,Be:4,B:5,C:6,N:7,O:8,F:9,Na:11,Mg:12,Al:13,Si:14,
      P:15,S:16,Cl:17,K:19,Ca:20,Ti:22,V:23,Cr:24,Mn:25,Fe:26,Ni:28,Cu:29,Zn:30,Zr:40,Pb:82,U:92};
    var re = 0, im = 0;
    for (var i = 0; i < atoms.length; i++) {
      var f = Z[atoms[i].el] || 10;
      var phase = 2 * Math.PI * (h * atoms[i].x + k * atoms[i].y + l * atoms[i].z);
      re += f * Math.cos(phase);
      im += f * Math.sin(phase);
    }
    return re * re + im * im;
  }

  // ── Classification ─────────────────────────────────────────────

  _classifyVib(pk) {
    var a = (pk.assignment || '').toLowerCase();
    if (a.includes('lattice') || a.includes('translation') || a.includes('libration')) return 'lattice';
    if (pk.freq > 700) return 'bond';
    if (pk.freq < 280) return 'lattice';
    return 'framework';
  }

  _motifColor(m) {
    return m === 'lattice' ? '#bc8cff' : m === 'framework' ? '#58a6ff' : m === 'bond' ? '#3fb950' : '#7d8590';
  }

  _placeholder(ctx, w, h, msg) {
    ctx.fillStyle = '#7d8590';
    ctx.font = '13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(msg, w / 2, h / 2);
  }

  _resize() {
    var dpr = window.devicePixelRatio || 1;
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (cw > 0 && ch > 0) {
      this.canvas.width = cw * dpr;
      this.canvas.height = ch * dpr;
    }
    this.dpr = dpr;
  }
};
