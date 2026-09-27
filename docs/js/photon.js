/**
 * Photon Simulation Engine
 *
 * Simulates photon paths through a grid of gemstones using real absorption
 * spectra, refractive indices, and Fresnel/Snell/Beer-Lambert optics from
 * window.GEMSTONES and window.GemUtils.  Zero external dependencies.
 */

window.PhotonEngine = class PhotonEngine {
  constructor() {
    this.photons = [];
    this.completedPaths = [];
    this.grid = null;
    this._layout = null;
    this.electrodes = [];

    this.config = {
      wavelength: 550,
      gridCols: 4,
      gridRows: 4,
      gemSize: 8,
      occluderThickness: 2,
      gemThickness: 5,
      gridZ: 50,
      sourceZ: 0,
      reflectionScreenZ: 35,
      transmissionScreenZ: 65,
      photonSpeed: 2.0,
      coneAngle: 5,
      referenceThickness: 2,
      screenResolution: 640,
      lightMode: 'mono',
      lightSource: 'sun',
      magneticField: {
        enabled: false,
        strength: 1.0,
        direction: 'down',
      },
      ambientTemp: 293.15,
      photonEnergyScale: 1e15,
      thermalEnabled: true,
      xrayEnergy: 50,
      gammaEnergy: 662,
      thzFrequency: 1.0,
      xrdMode: false,
      xrdLaue: false,
      bariteThickness: 5,
      uraniniteCollimation: 0.0,
      uraniniteXRD: false,
      backscatterShield: false,
      hebrewLetter: null,
      hebrewDepth: 0.7,
      hebrewBold: 0.5,
      hebrewSize: 0.66,
      physicalModulation: false,
      radioSource: {
        enabled: false,
        isotope: 'Co60',
        activity: 1e6,
        distance: 0.1,
        type: 'gamma',
      },
    };

    this._transmissionScreen = null;
    this._reflectionScreen = null;
    this._initScreens();

    this._pathDensity = null;
    this._pdXBins = 80;
    this._pdZBins = 60;

    this._uranEmissionMap = null;
    this._uranEmissionSize = 32;
  }

  _generateEmissionMap() {
    const n = this._uranEmissionSize;
    const raw = new Float32Array(n * n);
    // Extreme multi-scale noise: major veins, dead zones, and intense hot spots
    const seed = Math.random() * 100;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        // Large dead/rich zones
        const v1 = Math.sin(x * 0.3 + seed) * Math.cos(y * 0.25 + seed * 1.3) * 3.0;
        // Crossing veins
        const v2 = Math.sin(x * 0.9 + y * 0.7 + seed * 2.1) * Math.cos(x * 0.5 - y * 1.1 + seed * 0.7) * 2.5;
        // Medium clumps
        const v3 = Math.sin(x * 2.1 - y * 1.8 + seed * 3.3) * 1.5;
        // Heavy fine grain
        const v4 = (Math.random() - 0.5) * 4.0;
        raw[y * n + x] = v1 + v2 + v3 + v4;
      }
    }
    // Spatial blur for correlation (3×3 box)
    const blurred = new Float32Array(n * n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let sum = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx2 = x + dx, ny2 = y + dy;
            if (nx2 >= 0 && nx2 < n && ny2 >= 0 && ny2 < n) {
              sum += raw[ny2 * n + nx2]; cnt++;
            }
          }
        }
        blurred[y * n + x] = sum / cnt;
      }
    }
    // 5-10 hot spots of wildly varying intensity (pitchblende nodules)
    const nSpots = 5 + Math.floor(Math.random() * 6);
    for (let s = 0; s < nSpots; s++) {
      const sx = Math.random() * n, sy = Math.random() * n;
      const sr = 0.8 + Math.random() * 3;
      const si = 2 + Math.random() * 8;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const d2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
          blurred[y * n + x] += si * Math.exp(-d2 / (2 * sr * sr));
        }
      }
    }
    // 2-5 dead zones (gangue mineral inclusions — nearly zero emission)
    const nDead = 2 + Math.floor(Math.random() * 4);
    for (let s = 0; s < nDead; s++) {
      const sx = Math.random() * n, sy = Math.random() * n;
      const sr = 1 + Math.random() * 3;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const d2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
          blurred[y * n + x] *= 1 - 0.95 * Math.exp(-d2 / (2 * sr * sr));
        }
      }
    }
    // Normalize to [0.005, 1.0] — some areas nearly dead
    let minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < n * n; i++) {
      if (blurred[i] < minV) minV = blurred[i];
      if (blurred[i] > maxV) maxV = blurred[i];
    }
    const range = maxV - minV || 1;
    for (let i = 0; i < n * n; i++) {
      blurred[i] = 0.005 + 0.995 * (blurred[i] - minV) / range;
    }
    this._uranEmissionMap = { width: n, height: n, data: blurred };
  }

  getEmissionMap() { return this._uranEmissionMap; }

  // ── public API ──────────────────────────────────────────────────────

  setGrid(gemIds, cols, rows) {
    this.config.gridCols = cols;
    this.config.gridRows = rows;
    this.grid = { gemIds, cols, rows };
    this._computeLayout();
  }

  setWavelength(nm) {
    this.config.wavelength = nm;
  }

  setOccluderThickness(mm) {
    this.config.occluderThickness = mm;
    if (this.grid) this._computeLayout();
  }

  setGemThickness(mm) {
    this.config.gemThickness = mm;
  }

  setLightMode(mode) {
    this.config.lightMode = mode;
  }

  setLightSource(sourceId) {
    this.config.lightSource = sourceId;
  }

  setMagneticField(enabled, strength, direction) {
    this.config.magneticField = { enabled, strength, direction };
  }

  setAmbientTemp(kelvin) {
    this.config.ambientTemp = kelvin;
  }

  setPhotonEnergyScale(scale) {
    this.config.photonEnergyScale = scale;
  }

  setThermalEnabled(enabled) {
    this.config.thermalEnabled = enabled;
  }

  setXrayEnergy(keV) { this.config.xrayEnergy = keV; }
  setGammaEnergy(keV) { this.config.gammaEnergy = keV; }
  setThzFrequency(thz) { this.config.thzFrequency = thz; }

  setBariteThickness(mm) { this.config.bariteThickness = mm; }
  setBackscatterShield(enabled) { this.config.backscatterShield = enabled; }
  setPhysicalModulation(enabled) { this.config.physicalModulation = enabled; }

  setHebrewLetter(letter) {
    this.config.hebrewLetter = letter || null;
    this._rebuildHebrewMasks();
  }

  setHebrewDepth(v) { this.config.hebrewDepth = Math.max(0.05, Math.min(1, v)); }

  setHebrewBold(v) {
    this.config.hebrewBold = Math.max(0, Math.min(1, v));
    this._rebuildHebrewMasks();
  }

  setHebrewSize(v) {
    this.config.hebrewSize = Math.max(0.2, Math.min(1, v));
    this._rebuildHebrewMasks();
  }

  getHebrewMask(cellIdx) {
    if (!this._hebrewMasks || !this._hebrewMasks.length) return null;
    if (cellIdx == null) return this._hebrewMasks[0] || null;
    return this._hebrewMasks[cellIdx % this._hebrewMasks.length] || null;
  }

  _rebuildHebrewMasks() {
    const ALEPH = 'אבגדהוזחטיכלמנסעפצקרשת';
    const letter = this.config.hebrewLetter;
    if (!letter) { this._hebrewMasks = []; return; }
    const startIdx = ALEPH.indexOf(letter);
    const n = this.grid ? this.grid.cols * this.grid.rows : 1;
    this._hebrewMasks = [];
    for (let i = 0; i < n; i++) {
      const li = (startIdx >= 0 ? startIdx + i : i) % ALEPH.length;
      this._hebrewMasks.push(this._generateHebrewMask(ALEPH[li]));
    }
  }

  _generateHebrewMask(letter) {
    const size = 48;
    const bold = this.config.hebrewBold || 0.5;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const weight = bold < 0.3 ? '300' : bold < 0.6 ? 'bold' : '900';
    const fontSize = size * (0.55 + bold * 0.35);
    const fontList = '"Frank Ruehl CLM","David CLM","David","Frank Ruehl","Noto Serif Hebrew","Times New Roman",serif';
    ctx.font = `${weight} ${fontSize}px ${fontList}`;
    ctx.fillText(letter, size / 2, size / 2 + size * 0.03);

    // Extra stroke for high boldness to thicken the letter
    if (bold > 0.5) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = (bold - 0.5) * 6;
      ctx.lineJoin = 'round';
      ctx.strokeText(letter, size / 2, size / 2 + size * 0.03);
    }

    const imgData = ctx.getImageData(0, 0, size, size);
    const mask = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      mask[i] = imgData.data[i * 4] > 80 ? 1 : 0;
    }
    return { width: size, height: size, data: mask, letter };
  }
  setUraniniteCollimation(v) { this.config.uraniniteCollimation = Math.max(0, Math.min(1, v)); }
  setUraniniteXRD(enabled) {
    this.config.uraniniteXRD = enabled;
    if (enabled) this._precomputeXRDData();
  }

  setSourceZ(z) {
    this.config.sourceZ = z;
    // Place reflection screen halfway between source and gem grid
    this.config.reflectionScreenZ = (z + this.config.gridZ) / 2;
  }

  getPathDensity() {
    if (!this._pathDensity || !this._layout) return null;
    const layout = this._layout;
    const halfW = layout.screenHalfW || 30;
    return {
      data: this._pathDensity,
      xBins: this._pdXBins,
      zBins: this._pdZBins,
      xMin: -halfW,
      xMax: halfW,
      zMin: this.config.sourceZ,
      zMax: this.config.transmissionScreenZ + 8 + this.config.bariteThickness,
    };
  }

  _initPathDensity() {
    this._pathDensity = new Float32Array(this._pdXBins * this._pdZBins);
  }

  _recordPathDensity(p) {
    if (!this._pathDensity || !this._layout) return;
    const layout = this._layout;
    const halfW = layout.screenHalfW || 30;
    const zMin = this.config.sourceZ;
    const zMax = this.config.transmissionScreenZ + 8 + this.config.bariteThickness;
    const xi = Math.floor(((p.x + halfW) / (2 * halfW)) * this._pdXBins);
    const zi = Math.floor(((p.z - zMin) / (zMax - zMin)) * this._pdZBins);
    if (xi >= 0 && xi < this._pdXBins && zi >= 0 && zi < this._pdZBins) {
      this._pathDensity[zi * this._pdXBins + xi] += p.intensity;
    }
  }

  setXRDMode(enabled) {
    this.config.xrdMode = enabled;
    if (enabled) this._precomputeXRDData();
  }

  setXRDLaue(enabled) {
    this.config.xrdLaue = enabled;
  }

  setRadioSource(enabled, isotope, activity, distance) {
    this.config.radioSource = { enabled, isotope, activity, distance,
      type: this._isotopeData(isotope).type };
  }

  _isotopeData(isotope) {
    const db = {
      Co60:  { name: '⁶⁰Co',  halfLife: 5.27,  unit: 'yr', type: 'gamma', energies: [1173, 1332], avgE: 1252 },
      Cs137: { name: '¹³⁷Cs', halfLife: 30.17, unit: 'yr', type: 'gamma', energies: [662],        avgE: 662 },
      Am241: { name: '²⁴¹Am', halfLife: 432.2, unit: 'yr', type: 'alpha', energies: [59.5],       avgE: 59.5, alphaE: 5486 },
      Ra226: { name: '²²⁶Ra', halfLife: 1600,  unit: 'yr', type: 'alpha', energies: [186],        avgE: 186, alphaE: 4784 },
      Sr90:  { name: '⁹⁰Sr',  halfLife: 28.8,  unit: 'yr', type: 'beta',  energies: [],           avgE: 546, betaMax: 546 },
      I131:  { name: '¹³¹I',  halfLife: 8.02,  unit: 'day', type: 'beta',  energies: [364],        avgE: 364, betaMax: 606 },
      Ir192: { name: '¹⁹²Ir', halfLife: 73.83, unit: 'day', type: 'gamma', energies: [316, 468],   avgE: 370 },
      Cf252: { name: '²⁵²Cf', halfLife: 2.645, unit: 'yr', type: 'neutron', energies: [],          avgE: 2100 },
    };
    return db[isotope] || db.Co60;
  }

  getCellRadiation() {
    if (!this.cellRad) return null;
    return this.cellRad.map(cr => ({
      gemId: cr.gemId,
      dose: cr.dose,
      doseRate: cr.doseRate,
      colorCenterDensity: cr.colorCenterDensity,
      damageLevel: cr.damageLevel,
      radiolumRate: cr.radiolumRate,
      conductivityBoost: cr.conductivityBoost,
      xrfEmitting: cr.xrfEmitting,
    }));
  }

  getCellTemperatures() {
    if (!this.cellTemps) return null;
    return this.cellTemps.map(ct => ({
      gemId: ct.gemId,
      temperature: ct.temperature,
      deltaT: ct.temperature - this.config.ambientTemp,
      absorbedPower: ct.absorbedPowerAvg,
      coolingPower: ct.coolingPower,
      riShift: ct.riShift,
      bandGapShift: ct.bandGapShift,
      expansionStrain: ct.expansionStrain,
      fluorQuench: ct.fluorQuench,
      pyroVoltage: ct.pyroVoltage,
      thermalEmission: ct.thermalEmissionRate,
    }));
  }

  emitBurst(count) {
    const c = this.config;
    const layout = this._layout;
    if (!layout) return;

    const n = c.screenResolution;
    this._lastTransmission = this._makeScreen(n);
    this._lastReflection = this._makeScreen(n);

    const halfW = layout.totalWidth / 2;
    const halfH = layout.totalHeight / 2;
    const coneRad = c.coneAngle * Math.PI / 180;

    for (let i = 0; i < count; i++) {
      let wl, energy_keV = 0, radType = 'photon';
      if (c.lightMode === 'white') {
        wl = window.GemUtils.sampleWavelength(c.lightSource || 'sun');
      } else if (c.lightMode === 'uv') {
        wl = 200 + Math.random() * 180;
      } else if (c.lightMode === 'nir') {
        wl = 780 + Math.random() * 620;
      } else if (c.lightMode === 'fir') {
        wl = 1400 + Math.random() * 600;
      } else if (c.lightMode === 'xray') {
        if (c.xrdMode && c.xrdLaue) {
          energy_keV = c.xrayEnergy * (0.4 + Math.random() * 1.2);
        } else if (c.xrdMode) {
          energy_keV = c.xrayEnergy * (0.999 + Math.random() * 0.002);
        } else {
          energy_keV = c.xrayEnergy * (0.8 + Math.random() * 0.4);
        }
        wl = 1.2398 / energy_keV;
        radType = 'xray';
      } else if (c.lightMode === 'gamma') {
        energy_keV = c.gammaEnergy * (0.95 + Math.random() * 0.1);
        wl = 1.2398 / energy_keV;
        radType = 'gamma';
      } else if (c.lightMode === 'uraninite') {
        // Uraninite X-ray emission: U Lα (~13.6 keV), U Lβ (~17.2 keV),
        // U Kα (~98.4 keV), plus bremsstrahlung continuum from beta decay
        const r = Math.random();
        if (r < 0.35) energy_keV = 13.6 * (0.98 + Math.random() * 0.04);
        else if (r < 0.55) energy_keV = 17.2 * (0.98 + Math.random() * 0.04);
        else if (r < 0.65) energy_keV = 98.4 * (0.98 + Math.random() * 0.04);
        else energy_keV = 5 + Math.random() * 100;
        wl = 1.2398 / energy_keV;
        radType = 'xray';
      } else if (c.lightMode === 'thz') {
        const freq = c.thzFrequency * (0.9 + Math.random() * 0.2);
        wl = 299792.458 / (freq * 1000);
        energy_keV = freq * 4.136e-3;
        radType = 'thz';
      } else {
        wl = c.wavelength;
      }

      let rgb, color;
      if (c.lightMode === 'uraninite' && radType === 'xray') {
        const eNorm = Math.min(1, energy_keV / 100);
        rgb = [0.3 + eNorm * 0.4, 0.9 - eNorm * 0.5, 0.2 + eNorm * 0.6];
        color = `rgba(${Math.round(rgb[0]*255)},${Math.round(rgb[1]*255)},${Math.round(rgb[2]*255)},1)`;
      } else if (radType === 'xray') {
        rgb = [0.5, 0.2, 0.9];
        color = 'rgba(128,50,230,1)';
      } else if (radType === 'gamma') {
        rgb = [0.9, 0.9, 0.2];
        color = 'rgba(230,230,50,1)';
      } else if (radType === 'thz') {
        rgb = [0.4, 0.0, 0.0];
        color = 'rgba(100,0,0,1)';
      } else {
        rgb = window.GemUtils.wavelengthToRGB(wl);
        color = `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},1)`;
      }

      let x, y;
      if (c.lightMode === 'uraninite') {
        // Uraninite block matches the gem grid size — emits uniformly across the full area
        const gridW = layout.totalWidth;
        const gridH = layout.totalHeight;
        x = (Math.random() - 0.5) * gridW;
        y = (Math.random() - 0.5) * gridH;
      } else if (c.xrdMode && radType === 'xray') {
        const wins = layout.windows;
        let bi = 0, bd = Infinity;
        for (let wi = 0; wi < wins.length; wi++) {
          if (!wins[wi].gemId) continue;
          const mx = (wins[wi].xMin + wins[wi].xMax) / 2;
          const my = (wins[wi].yMin + wins[wi].yMax) / 2;
          const dd = mx * mx + my * my;
          if (dd < bd) { bd = dd; bi = wi; }
        }
        const tw = wins[bi];
        const tcx = (tw.xMin + tw.xMax) / 2;
        const tcy = (tw.yMin + tw.yMax) / 2;
        const beamR = 0.35;
        const bA = Math.random() * Math.PI * 2;
        const bR = Math.sqrt(Math.random()) * beamR;
        x = tcx + bR * Math.cos(bA);
        y = tcy + bR * Math.sin(bA);
      } else {
        x = (Math.random() - 0.5) * layout.totalWidth;
        y = (Math.random() - 0.5) * layout.totalHeight;
      }

      let dx, dy, dz;
      if (c.lightMode === 'uraninite') {
        // Cone narrows from 15° (uncollimated) to 0.2° (fully collimated)
        const col = c.uraniniteCollimation || 0;
        const uranCone = (15 * (1 - col) + 0.2 * col) * Math.PI / 180;
        const theta = Math.random() * uranCone;
        const phi = Math.random() * Math.PI * 2;
        const sinT = Math.sin(theta);
        dx = sinT * Math.cos(phi);
        dy = sinT * Math.sin(phi);
        dz = Math.cos(theta);
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx /= len; dy /= len; dz /= len;
      } else if (c.xrdMode && radType === 'xray') {
        dx = 0; dy = 0; dz = 1;
      } else {
        const theta = Math.random() * coneRad;
        const phi = Math.random() * Math.PI * 2;
        const sinT = Math.sin(theta);
        dx = sinT * Math.cos(phi);
        dy = sinT * Math.sin(phi);
        dz = Math.cos(theta);
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx /= len; dy /= len; dz /= len;
      }

      // Uraninite emission map: spatially varying intensity from heterogeneous ore
      let emitIntensity = 1.0;
      if (c.lightMode === 'uraninite' && this._uranEmissionMap) {
        const em = this._uranEmissionMap;
        const gridW = layout.totalWidth, gridH = layout.totalHeight;
        const ex = Math.floor(((x / gridW + 0.5)) * em.width);
        const ey = Math.floor(((y / gridH + 0.5)) * em.height);
        const ei = Math.max(0, Math.min(em.width - 1, ex));
        const ej = Math.max(0, Math.min(em.height - 1, ey));
        emitIntensity = em.data[ej * em.width + ei];
      }

      this.photons.push({
        x, y, z: c.sourceZ,
        dx, dy, dz,
        wavelength: wl,
        energy_keV,
        radType,
        intensity: emitIntensity,
        color,
        colorRGB: rgb,
        path: [[x, y, c.sourceZ]],
        state: 'traveling',
        gemId: null,
        _pathAccum: 0,
        _enteredGem: false,
        _exitedGem: false,
        _diffracted: false,
        _bariteHit: false,
        _screenRecorded: false,
        _shieldHit: false,
      });
    }
  }

  step(dt) {
    const c = this.config;
    const speed = c.photonSpeed;
    const gridZMin = c.gridZ - c.gemThickness / 2;
    const gridZMax = c.gridZ + c.gemThickness / 2;
    const res = c.screenResolution;

    for (let i = this.photons.length - 1; i >= 0; i--) {
      const p = this.photons[i];
      if (p.state !== 'traveling') continue;

      const stepDist = speed * dt;
      p.x += p.dx * stepDist;
      p.y += p.dy * stepDist;
      p.z += p.dz * stepDist;

      p._pathAccum += stepDist;
      if (p._pathAccum >= 2) {
        p.path.push([p.x, p.y, p.z]);
        p._pathAccum = 0;
      }

      if (c.lightMode === 'uraninite' && this._pathDensity) {
        this._recordPathDensity(p);
      }

      // Photon traveling toward grid (+Z direction)
      if (p.dz > 0 && !p._enteredGem && p.z >= gridZMin) {
        this._handleGridEntry(p, gridZMin, gridZMax);
        if (p.state !== 'traveling') {
          this._finishPhoton(p, i);
          continue;
        }
      }

      // Photon exiting gem slab
      if (p.dz > 0 && p._enteredGem && !p._exitedGem && p.z >= gridZMax) {
        this._handleGemExit(p);
        p._exitedGem = true;
      }

      // Transmission screen — always records at transmissionScreenZ regardless of barite
      if (p.dz > 0 && !p._screenRecorded && p.z >= c.transmissionScreenZ) {
        if (c.lightMode === 'uraninite') {
          // Record but let photon continue to barite block behind the screen
          p._screenRecorded = true;
          if (!c.xrdMode || p._diffracted) {
            this._recordOnScreen(this._transmissionScreen, p);
            this._recordOnScreen(this._lastTransmission, p);
          }
        } else {
          p.state = 'transmitted';
          p.path.push([p.x, p.y, p.z]);
          if (!c.xrdMode || p._diffracted) {
            this._recordOnScreen(this._transmissionScreen, p);
            this._recordOnScreen(this._lastTransmission, p);
          }
          this._finishPhoton(p, i);
          continue;
        }
      }

      // Barite absorber (uraninite mode): replaces transmission screen
      const bariteZ = c.transmissionScreenZ;
      if (c.lightMode === 'uraninite' && c.bariteThickness > 0 && p.dz > 0 && p._screenRecorded && !p._bariteHit && p.z >= bariteZ + 1) {
        p._bariteHit = true;
        const bariteThick_cm = c.bariteThickness * 0.1;
        const bariteDensity = 4.48;
        // Ba (Z=56) mass attenuation: μ/ρ ≈ 3.5 cm²/g at 50 keV, scales as E^-2.5
        const muRho_ba = 3.5 * Math.pow(50 / Math.max(1, p.energy_keV || 50), 2.5);
        const tau = muRho_ba * bariteDensity * bariteThick_cm;
        const T_barite = Math.exp(-tau);
        p.intensity *= T_barite;
        p.state = p.intensity < 0.01 ? 'absorbed' : 'transmitted';
        p.path.push([p.x, p.y, p.z]);
        this._finishPhoton(p, i);
        continue;
      }

      // Uraninite photons: finish after passing barite zone (or immediately if no barite)
      if (c.lightMode === 'uraninite' && p.dz > 0 && p._screenRecorded &&
          p.z >= bariteZ + 3) {
        p.state = 'transmitted';
        p.path.push([p.x, p.y, p.z]);
        this._finishPhoton(p, i);
        continue;
      }

      // Backscatter shield (uraninite mode): barite slab behind source catches returning X-rays
      if (c.backscatterShield && c.lightMode === 'uraninite' && p.dz < 0 && !p._shieldHit) {
        const shieldZ = c.sourceZ - 2;
        if (p.z <= shieldZ) {
          p._shieldHit = true;
          // Same barite absorption as the rear block, 5mm thick
          const shieldThick_cm = 0.5;
          const bariteDensity = 4.48;
          const muRho = 3.5 * Math.pow(50 / Math.max(1, p.energy_keV || 50), 2.5);
          const tau = muRho * bariteDensity * shieldThick_cm;
          const T = Math.exp(-tau);
          p.intensity *= T;
          if (p.intensity < 0.01) {
            p.state = 'absorbed';
            p.path.push([p.x, p.y, p.z]);
            this._finishPhoton(p, i);
            continue;
          }
        }
      }

      // Reflection screen (photon traveling in -Z after reflection)
      if (p.dz < 0 && p.z <= c.reflectionScreenZ) {
        p.state = 'reflected';
        p.path.push([p.x, p.y, p.z]);
        this._recordOnScreen(this._reflectionScreen, p);
        this._recordOnScreen(this._lastReflection, p);
        this._finishPhoton(p, i);
        continue;
      }

      // Cull photons that have drifted far out of bounds
      if (p.z < c.sourceZ - 20 || p.z > c.transmissionScreenZ + 40 ||
          Math.abs(p.x) > 200 || Math.abs(p.y) > 200) {
        p.state = 'absorbed';
        this._finishPhoton(p, i);
      }
    }

    // Electrode charge decay (RC model)
    for (const electrode of this.electrodes) {
      const prevCharge = electrode.charge;
      electrode.charge *= 0.995;
      electrode.voltage = electrode.charge * 10;
      electrode.current = electrode.charge - prevCharge;
      electrode.chargeHistory.push(electrode.charge);
      if (electrode.chargeHistory.length > 200) electrode.chargeHistory.shift();
    }

    // Thermal physics update (per-cell temperature evolution)
    if (c.thermalEnabled && this.cellTemps && this._layout) {
      this._stepThermal(dt);
    }

    // Radioactive source: ambient radiation field
    if (c.radioSource && c.radioSource.enabled && this.cellRad && this._layout) {
      this._stepRadioSource(dt);
    }

    // Radiation state update: dose rate smoothing, color center annealing
    if (this.cellRad) {
      for (const cr of this.cellRad) {
        cr.doseRate = cr._doseThisFrame * 60;
        cr._doseThisFrame = 0;
        // Slow color center annealing at room temperature
        cr.colorCenterDensity *= 0.9999;
        // Damage very slowly heals
        cr.damageLevel *= 0.99999;
        // Conductivity boost decays
        cr.conductivityBoost = 1 + (cr.conductivityBoost - 1) * 0.95;
        cr.xrfEmitting = false;
      }
    }

    // Cap completed paths to prevent memory issues
    if (this.completedPaths.length > 500) {
      this.completedPaths.splice(0, this.completedPaths.length - 500);
    }
  }

  _stepThermal(dt) {
    const c = this.config;
    const dt_sec = dt / 60;
    const layout = this._layout;
    const SIGMA = 5.6704e-8;
    const H_CONV = 10;

    for (let i = 0; i < this.cellTemps.length; i++) {
      const ct = this.cellTemps[i];
      if (!ct.gemId) continue;
      const gem = window.GEMSTONES[ct.gemId];
      if (!gem || !gem.thermal) continue;

      const th = gem.thermal;
      const props = gem.properties;
      const win = layout.windows[i];
      const cellW = (win.xMax - win.xMin) * 1e-3;
      const cellH = (win.yMax - win.yMin) * 1e-3;
      const thick = c.gemThickness * 1e-3;
      const density = (props.sg || 2.65) * 1000;
      const volume = cellW * cellH * thick;
      const mass = density * volume;

      if (mass <= 0) continue;

      // Debye model correction: Cp(T) = Cp_ref × D(T_D/T) / D(T_D/T_ref)
      // Simplified: for T > T_D, Cp ≈ Cp_ref; for T < T_D, Cp drops
      const Td = th.debyeTemp || 500;
      const xT = Td / ct.temperature;
      const debyeFrac = xT < 0.1 ? 1.0 : xT > 20 ? 0.05 : (3 / (xT * xT * xT)) * this._debyeD3(xT);
      const cp = th.specificHeat * Math.max(0.05, debyeFrac);

      // Surface area for cooling (top + bottom + sides)
      const surfaceArea = 2 * cellW * cellH + 2 * (cellW + cellH) * thick;

      // Energy deposited by absorbed photons this frame
      ct._prevTemp = ct.temperature;
      if (ct.absorbedEnergy > 0) {
        ct.temperature += ct.absorbedEnergy / (mass * cp);
      }

      // Track power input (exponential moving average)
      ct._energyHistory.push(ct.absorbedEnergy);
      if (ct._energyHistory.length > 30) ct._energyHistory.shift();
      const totalE = ct._energyHistory.reduce((s, e) => s + e, 0);
      ct.absorbedPowerAvg = totalE / (ct._energyHistory.length * dt_sec);
      ct.absorbedEnergy = 0;

      const deltaT = ct.temperature - c.ambientTemp;

      // Newton's law of cooling: convection
      const Q_conv = H_CONV * surfaceArea * deltaT;

      // Stefan-Boltzmann radiation loss
      const T4 = ct.temperature * ct.temperature * ct.temperature * ct.temperature;
      const Ta4 = c.ambientTemp * c.ambientTemp * c.ambientTemp * c.ambientTemp;
      const emissivity = 0.92;
      const Q_rad = emissivity * SIGMA * surfaceArea * (T4 - Ta4);

      // Thermal conduction to occluder frame
      const Q_cond = th.thermalConductivity * (2 * (cellW + cellH) * thick) * deltaT / (c.occluderThickness * 1e-3 + 1e-6);

      const Q_total = Q_conv + Q_rad + Q_cond;
      ct.coolingPower = Q_total;
      ct.temperature -= (Q_total * dt_sec) / (mass * cp);
      ct.temperature = Math.max(1, ct.temperature);

      // Thermo-optic effect: Δn = (dn/dT) × ΔT
      ct.riShift = (th.thermoOpticCoeff || 0) * deltaT;

      // Varshni band-gap narrowing: ΔEg ≈ −α_V × T² / (T + β)
      // α_V ~ 5e-4 eV/K, β ~ 300 K (typical for wide-gap insulators)
      const alpha_V = 5e-4;
      const beta_V = 300;
      ct.bandGapShift = -alpha_V * ct.temperature * ct.temperature / (ct.temperature + beta_V)
                       + alpha_V * c.ambientTemp * c.ambientTemp / (c.ambientTemp + beta_V);

      // Thermal expansion strain: ε = α × ΔT
      ct.expansionStrain = (th.linearExpansion || 0) * deltaT;

      // Fluorescence thermal quenching: η(T) = 1 / (1 + A × exp(−ΔE/(k_B × T)))
      // ΔE ~ 0.1 eV activation, A ~ 10⁷ (Mott-Seitz model)
      const k_B = 8.617e-5;
      const deltaE_act = 0.10;
      const A_mott = 1e7;
      ct.fluorQuench = 1.0 / (1.0 + A_mott * Math.exp(-deltaE_act / (k_B * ct.temperature)));

      // Pyroelectric voltage: V = p × ΔT × d / (ε₀ × εᵣ × A)
      // p ~ 4 μC/(m²·K) for beryl; only for pyroelectric gems
      if (props.pyroelectric) {
        const p_pyro = 4e-6;
        const eps0 = 8.854e-12;
        const epsR = 6.5;
        const dT_frame = ct.temperature - ct._prevTemp;
        ct.pyroVoltage += (p_pyro * dT_frame * thick) / (eps0 * epsR * cellW * cellH);
        ct.pyroVoltage *= 0.98;
      } else {
        ct.pyroVoltage = 0;
      }

      // Thermal (blackbody) emission rate: photons/s ~ A × ∫ B(λ,T) dλ over visible range
      // Wien approximation for visible-range emission at moderate T
      const h_planck = 6.626e-34;
      const c_light = 3e8;
      if (ct.temperature > 500) {
        const peakWl = 2.898e-3 / ct.temperature;
        const visMin = 380e-9, visMax = 780e-9;
        const overlap = Math.max(0, Math.min(visMax, peakWl * 3) - Math.max(visMin, peakWl * 0.5));
        const totalWidth = peakWl * 2.5;
        const visFrac = totalWidth > 0 ? overlap / totalWidth : 0;
        const totalPower = SIGMA * T4 * surfaceArea * emissivity;
        ct.thermalEmissionRate = visFrac * totalPower / (h_planck * c_light / (peakWl || 1e-6));
      } else {
        ct.thermalEmissionRate = 0;
      }
    }
  }

  // Debye D₃ function approximation: D₃(x) = 3∫₀ˣ (t³/(eᵗ-1)) dt / x³
  _debyeD3(x) {
    if (x < 0.01) return 1.0;
    if (x > 25) return (Math.PI * Math.PI * Math.PI * Math.PI / 5) / (x * x * x);
    const N = 50;
    const dx = x / N;
    let sum = 0;
    for (let i = 1; i <= N; i++) {
      const t = i * dx;
      const et = Math.exp(t);
      if (et > 1) sum += (t * t * t / (et - 1)) * dx;
    }
    return (3 / (x * x * x)) * sum;
  }

  _stepRadioSource(dt) {
    const src = this.config.radioSource;
    if (!src || !src.enabled) return;
    const iso = this._isotopeData(src.isotope);
    const activity = src.activity;
    const dist = Math.max(0.01, src.distance);
    const dt_sec = dt / 60;

    // Flux at distance: Φ = A / (4π r²)  [particles / (m² · s)]
    const flux = activity / (4 * Math.PI * dist * dist);
    const layout = this._layout;

    for (let i = 0; i < this.cellRad.length; i++) {
      const cr = this.cellRad[i];
      if (!cr.gemId) continue;
      const gem = window.GEMSTONES[cr.gemId];
      if (!gem) continue;
      const rad = gem.radiation;
      const props = gem.properties;

      const win = layout.windows[i];
      const cellArea_m2 = (win.xMax - win.xMin) * 1e-3 * (win.yMax - win.yMin) * 1e-3;
      const thick_cm = this.config.gemThickness * 0.1;
      const density = (rad && rad.densityCGS) || (props.sg || 2.65);
      const mass_kg = density * 1e3 * (thick_cm * 0.01) * cellArea_m2;

      // Particles hitting this cell per second
      const particlesPerSec = flux * cellArea_m2;
      const particlesThisFrame = particlesPerSec * dt_sec;

      let energyDeposited_keV = 0;

      if (iso.type === 'gamma') {
        const muRho = (rad && rad.massAttenGamma) || 0.064;
        const absorbFrac = 1 - Math.exp(-muRho * density * thick_cm);
        energyDeposited_keV = particlesThisFrame * iso.avgE * absorbFrac;
      } else if (iso.type === 'beta') {
        // Beta particles: range in matter ~ E^1.75 / (density × 412)
        // Most betas stop within a few mm of mineral
        const betaE = iso.betaMax || 500;
        const range_cm = Math.pow(betaE / 1000, 1.75) / (density * 0.412);
        const absorbFrac = Math.min(1, thick_cm / range_cm);
        energyDeposited_keV = particlesThisFrame * betaE * 0.33 * absorbFrac;
      } else if (iso.type === 'alpha') {
        // Alphas: very short range (< 50 μm in minerals), deposit all energy locally
        const alphaE = iso.alphaE || 5000;
        const range_um = 3.3 * Math.pow(alphaE / 1000, 1.67) / density;
        const absorbFrac = Math.min(1, (thick_cm * 1e4) / range_um);
        energyDeposited_keV = particlesThisFrame * alphaE * absorbFrac;
        // Alpha damage is very localized and intense
        const hardness = (rad && rad.radiationHardness) || 5;
        cr.damageLevel += particlesThisFrame * 1e-10 / hardness;
        cr.damageLevel = Math.min(cr.damageLevel, 1.0);
      } else if (iso.type === 'neutron') {
        // Neutron: nuclear interactions, displacement damage
        // Neutron mass attenuation ~ 0.05 cm²/g for fast neutrons in light elements
        const absorbFrac = 1 - Math.exp(-0.05 * density * thick_cm);
        energyDeposited_keV = particlesThisFrame * iso.avgE * absorbFrac * 0.1;
        const hardness = (rad && rad.radiationHardness) || 5;
        cr.damageLevel += particlesThisFrame * absorbFrac * 1e-8 / hardness;
        cr.damageLevel = Math.min(cr.damageLevel, 1.0);
      }

      if (energyDeposited_keV > 0) {
        const eV_J = 1.602e-19;
        const doseJ = energyDeposited_keV * 1e3 * eV_J;
        const dose_Gy = mass_kg > 0 ? doseJ / mass_kg : 0;
        cr._doseThisFrame += dose_Gy;
        cr.dose += dose_Gy;

        const ccYield = (rad && rad.colorCenterYield) || 0.1;
        cr.colorCenterDensity += dose_Gy * ccYield * 0.0002;
        cr.colorCenterDensity = Math.min(cr.colorCenterDensity, 1.0);

        // Heat deposition from radioactive source
        const ct = this.cellTemps[i];
        if (ct && this.config.thermalEnabled) {
          ct.absorbedEnergy += doseJ;
        }

        // Radioluminescence from ambient radiation
        if (rad && rad.radioluminescence && rad.radioluminescence.emission && rad.radioluminescence.yield > 0) {
          cr.radiolumRate = dose_Gy * rad.radioluminescence.yield * 1000;
        }

        // Radiation-induced conductivity
        cr.conductivityBoost = Math.max(cr.conductivityBoost,
          1 + Math.pow(dose_Gy * 60, 0.8) * 20);
      }
    }
  }

  reset() {
    this.photons = [];
    this.completedPaths = [];
    this._initScreens();
    if (this.cellStats) {
      for (const cs of this.cellStats) {
        cs.transmitted = 0; cs.reflected = 0; cs.absorbed = 0; cs.blocked = 0;
        cs.totalIntensityT = 0; cs.totalIntensityR = 0; cs.totalIntensityI = 0;
        cs.wavelengthSumT = 0; cs.wavelengthSumR = 0;
        cs.spectraT.fill(0); cs.spectraR.fill(0); cs.spectraI.fill(0);
        cs.colorSumT[0] = 0; cs.colorSumT[1] = 0; cs.colorSumT[2] = 0;
        cs.colorSumR[0] = 0; cs.colorSumR[1] = 0; cs.colorSumR[2] = 0;
        cs.colorSumI[0] = 0; cs.colorSumI[1] = 0; cs.colorSumI[2] = 0;
      }
    }
    if (this.cellTemps) {
      for (const ct of this.cellTemps) {
        ct.temperature = this.config.ambientTemp;
        ct.absorbedEnergy = 0;
        ct.absorbedPowerAvg = 0;
        ct.coolingPower = 0;
        ct.riShift = 0;
        ct.bandGapShift = 0;
        ct.expansionStrain = 0;
        ct.fluorQuench = 1.0;
        ct.pyroVoltage = 0;
        ct.thermalEmissionRate = 0;
        ct._prevTemp = this.config.ambientTemp;
        ct._energyHistory = [];
      }
    }
    if (this.cellRad) {
      for (const cr of this.cellRad) {
        cr.dose = 0;
        cr.doseRate = 0;
        cr.colorCenterDensity = 0;
        cr.damageLevel = 0;
        cr.radiolumRate = 0;
        cr.conductivityBoost = 1.0;
        cr.xrfEmitting = false;
        cr._doseThisFrame = 0;
      }
    }
    if (this.config.xrdMode || this.config.uraniniteXRD) this._precomputeXRDData();
    if (this._pathDensity) this._pathDensity.fill(0);
  }

  getTransmissionPattern() {
    return this._exportScreen(this._transmissionScreen);
  }

  getReflectionPattern() {
    return this._exportScreen(this._reflectionScreen);
  }

  getLastTransmissionPattern() {
    return this._exportScreen(this._lastTransmission);
  }

  getLastReflectionPattern() {
    return this._exportScreen(this._lastReflection);
  }

  fireBB(gemIndex) {
    const electrode = this.electrodes[gemIndex];
    if (!electrode) return;
    const gem = window.GEMSTONES[electrode.gemId];
    if (!gem || !gem.properties || !gem.properties.piezoelectric) return;

    const d33 = 2.3e-12;   // C/N (quartz typical)
    const force = 10;       // Newtons (BB impact)
    const area = 1e-6;      // m² (1mm²)
    const voltage = d33 * force / area * 1e-6;

    electrode.charge += voltage * 100;
    electrode.voltage = electrode.charge * 10;
  }

  fireBBAll() {
    for (let i = 0; i < this.electrodes.length; i++) {
      this.fireBB(i);
    }
  }

  getStats() {
    let active = 0, transmitted = 0, reflected = 0, absorbed = 0, blocked = 0;
    for (const p of this.photons) {
      if (p.state === 'traveling') active++;
    }
    for (const p of this.completedPaths) {
      if (p.state === 'transmitted') transmitted++;
      else if (p.state === 'reflected') reflected++;
      else if (p.state === 'absorbed') absorbed++;
      else if (p.state === 'blocked') blocked++;
    }
    return { active, transmitted, reflected, absorbed, blocked };
  }

  // ── internal: layout ────────────────────────────────────────────────

  _computeLayout() {
    const c = this.config;
    const cols = this.grid.cols;
    const rows = this.grid.rows;
    const tw = cols * c.gemSize + (cols + 1) * c.occluderThickness;
    const th = rows * c.gemSize + (rows + 1) * c.occluderThickness;

    const windows = [];
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const idx = r * cols + col;
        const wx = -tw / 2 + c.occluderThickness + col * (c.gemSize + c.occluderThickness);
        const wy = -th / 2 + c.occluderThickness + r * (c.gemSize + c.occluderThickness);
        windows.push({
          xMin: wx,
          xMax: wx + c.gemSize,
          yMin: wy,
          yMax: wy + c.gemSize,
          gemId: this.grid.gemIds[idx] || null,
        });
      }
    }
    // Mirror the screen-size formula used by ExperimentRenderer._cfg() so that
    // _recordOnScreen and the 3D rendering share the exact same coordinate space.
    //   screenWidth  = max(tw, 30) * 1.8  →  screenHalfW = max(tw, 30) * 0.9
    //   screenHeight = max(th, 20) * 1.6  →  screenHalfH = max(th, 20) * 0.8
    const screenHalfW = Math.max(tw, 30) * 0.9;
    const screenHalfH = Math.max(th, 20) * 0.8;

    this._layout = { totalWidth: tw, totalHeight: th, windows, screenHalfW, screenHalfH };

    // Reset accumulated screen patterns whenever the grid layout (and therefore
    // the coordinate mapping) changes so stale data doesn't corrupt the display.
    this._initScreens();

    this.cellStats = [];
    for (let idx = 0; idx < windows.length; idx++) {
      this.cellStats.push(this._makeCellStat(windows[idx].gemId));
    }

    this.electrodes = [];
    for (let idx = 0; idx < windows.length; idx++) {
      const win = windows[idx];
      this.electrodes.push({
        gemId: win.gemId || null,
        gemIndex: idx,
        charge: 0,
        voltage: 0,
        current: 0,
        chargeHistory: [],
      });
    }

    this.cellTemps = [];
    for (let idx = 0; idx < windows.length; idx++) {
      this.cellTemps.push(this._makeCellTemp(windows[idx].gemId));
    }

    this.cellRad = [];
    for (let idx = 0; idx < windows.length; idx++) {
      this.cellRad.push(this._makeCellRad(windows[idx].gemId));
    }

    if (this.config.xrdMode || this.config.uraniniteXRD) this._precomputeXRDData();
    this._initPathDensity();
    if (this.config.hebrewLetter) this._rebuildHebrewMasks();
    if (!this._uranEmissionMap) this._generateEmissionMap();
  }

  _makeCellRad(gemId) {
    return {
      gemId: gemId || null,
      dose: 0,
      doseRate: 0,
      colorCenterDensity: 0,
      damageLevel: 0,
      radiolumRate: 0,
      conductivityBoost: 1.0,
      xrfEmitting: false,
      _doseThisFrame: 0,
    };
  }

  _makeCellTemp(gemId) {
    return {
      gemId: gemId || null,
      temperature: this.config.ambientTemp,
      absorbedEnergy: 0,
      absorbedPowerAvg: 0,
      coolingPower: 0,
      riShift: 0,
      bandGapShift: 0,
      expansionStrain: 0,
      fluorQuench: 1.0,
      pyroVoltage: 0,
      thermalEmissionRate: 0,
      _prevTemp: this.config.ambientTemp,
      _energyHistory: [],
    };
  }

  // ── internal: grid interaction ──────────────────────────────────────

  _handleGridEntry(p, gridZMin, gridZMax) {
    const layout = this._layout;
    if (!layout) { p.state = 'blocked'; return; }

    let hitWindow = null;
    let hitIdx = -1;
    for (let wi = 0; wi < layout.windows.length; wi++) {
      const win = layout.windows[wi];
      if (p.x >= win.xMin && p.x <= win.xMax &&
          p.y >= win.yMin && p.y <= win.yMax) {
        hitWindow = win;
        hitIdx = wi;
        break;
      }
    }

    // Check if photon is within the overall grid rectangle
    const halfW = layout.totalWidth / 2;
    const halfH = layout.totalHeight / 2;
    const inGrid = p.x >= -halfW && p.x <= halfW && p.y >= -halfH && p.y <= halfH;

    if (!hitWindow) {
      if (inGrid) {
        p.state = 'blocked';
        p.path.push([p.x, p.y, p.z]);
      }
      return;
    }

    if (!hitWindow.gemId) {
      p.state = 'blocked';
      p.path.push([p.x, p.y, p.z]);
      return;
    }

    const gem = window.GEMSTONES[hitWindow.gemId];
    if (!gem) {
      p.state = 'blocked';
      p.path.push([p.x, p.y, p.z]);
      return;
    }

    p.gemId = hitWindow.gemId;
    p._cellIdx = hitIdx;
    const props = gem.properties;
    const rad = gem.radiation;

    // Hebrew letter occluder: wavelength-dependent scattering from carved surface
    if (this._hebrewMasks && this._hebrewMasks.length && this.config.hebrewLetter) {
      const mask = this._hebrewMasks[hitIdx % this._hebrewMasks.length];
      const letterSize = this.config.hebrewSize || 0.66;
      const depth = this.config.hebrewDepth || 0.7;
      const rx = (p.x - hitWindow.xMin) / (hitWindow.xMax - hitWindow.xMin);
      const ry = (p.y - hitWindow.yMin) / (hitWindow.yMax - hitWindow.yMin);
      const margin = (1 - letterSize) / 2;
      const lx = (rx - margin) / (1 - 2 * margin);
      const ly = (ry - margin) / (1 - 2 * margin);
      if (lx >= 0 && lx < 1 && ly >= 0 && ly < 1) {
        const mx = Math.floor(lx * mask.width);
        const my = Math.floor(ly * mask.height);
        if (mask.data[my * mask.width + mx]) {
          const featureSize = 50000;  // 50 μm carving in nm
          const wl = p.wavelength;    // nm
          // Ratio of wavelength to feature size determines interaction regime
          const ratio = wl / featureSize;

          let scatterProb, scatterAngle, intensityLoss, leakIntensity;

          if (p.radType === 'gamma') {
            scatterProb = 0.02;
            scatterAngle = 0.01;
            intensityLoss = 0.98;
            leakIntensity = 0.99;
          } else if (p.radType === 'xray') {
            const depthEffect = Math.min(0.9, 0.3 + 0.8 * (1 / Math.max(0.1, p.energy_keV / 20)));
            scatterProb = depthEffect;
            scatterAngle = 0.2 + depthEffect * 0.5;
            intensityLoss = 0.3;
            leakIntensity = 1 - depthEffect * 0.5;
          } else if (p.radType === 'thz') {
            scatterProb = 0.05;
            scatterAngle = Math.PI * 0.8;
            intensityLoss = 0.9;
            leakIntensity = 0.95;
          } else if (wl < 380) {
            scatterProb = 0.92;
            scatterAngle = 0.6;
            intensityLoss = 0.2;
            leakIntensity = 0.25;
          } else if (wl <= 780) {
            scatterProb = 0.88;
            scatterAngle = 0.5;
            intensityLoss = 0.25;
            leakIntensity = 0.3;
          } else if (wl <= 1400) {
            scatterProb = 0.75;
            scatterAngle = 0.7;
            intensityLoss = 0.35;
            leakIntensity = 0.45;
          } else {
            scatterProb = 0.5;
            scatterAngle = Math.PI * 0.5;
            intensityLoss = 0.5;
            leakIntensity = 0.7;
          }

          // Physical modulation: gem-dependent letter interaction
          if (this.config.physicalModulation && (p.radType === 'xray' || p.radType === 'gamma')) {
            const effZ = (rad && rad.effectiveZ) || 12;
            const sg = (props.sg) || 2.65;
            const mf = this.config.magneticField;
            const ct = (this.cellTemps && this.cellTemps[hitIdx]) ? this.cellTemps[hitIdx] : null;
            const cr = (this.cellRad && this.cellRad[hitIdx]) ? this.cellRad[hitIdx] : null;

            // 1) Z-dependent groove wall opacity: heavier elements block more
            //    Photoelectric cross-section ∝ Z^4 / E^3
            const zFactor = Math.pow(effZ / 14, 3) * Math.pow(30 / Math.max(1, p.energy_keV), 2);
            const zMod = Math.min(2.5, 0.3 + zFactor);

            // 2) Density: denser gem = more material in groove walls
            const densMod = sg / 2.65;

            // 3) Absorption edge boost: near element K-edges, absorption spikes
            let edgeBoost = 1.0;
            if (rad && rad.xrfLines) {
              for (const line of rad.xrfLines) {
                const edgeDist = Math.abs(p.energy_keV - line.energy) / line.energy;
                if (edgeDist < 0.15) edgeBoost = Math.max(edgeBoost, 2.5 - edgeDist * 10);
              }
            }

            // 4) Magnetic dichroism (XMCD): magnetic ions create polarization-dependent absorption
            let magMod = 1.0;
            if (mf && mf.enabled && mf.strength > 0) {
              const chromIon = (gem.chromophore && gem.chromophore.ion) || '';
              const hasFe = chromIon.indexOf('Fe') >= 0 || (gem.formula && gem.formula.indexOf('Fe') >= 0);
              const hasMn = chromIon.indexOf('Mn') >= 0;
              const hasCr = chromIon.indexOf('Cr') >= 0;
              if (hasFe) magMod = 1 + 0.15 * mf.strength;
              else if (hasMn) magMod = 1 + 0.10 * mf.strength;
              else if (hasCr) magMod = 1 + 0.08 * mf.strength;
            }

            // 5) Debye-Waller thermal factor: heat reduces coherent scattering
            let thermalMod = 1.0;
            if (ct && gem.thermal && gem.thermal.debyeTemp) {
              const Td = gem.thermal.debyeTemp;
              const T = ct.temperature;
              // B_iso ∝ T/Td², higher T = more vibration = changed scattering
              thermalMod = 1 + 0.3 * Math.max(0, (T - 293) / Td);
            }

            // 6) Radiation damage: color centers add absorption
            let radDmgMod = 1.0;
            if (cr && cr.colorCenterDensity > 0.01) {
              radDmgMod = 1 + cr.colorCenterDensity * 1.5;
            }

            // 7) Piezoelectric strain: lattice distortion modifies channeling
            let piezoMod = 1.0;
            if (props.piezoelectric && this.electrodes && this.electrodes[hitIdx]) {
              const voltage = Math.abs(this.electrodes[hitIdx].voltage || 0);
              if (voltage > 0.1) piezoMod = 1 + Math.min(0.3, voltage * 0.02);
            }

            // Combined modulation factor
            const totalMod = zMod * densMod * edgeBoost * magMod * thermalMod * radDmgMod * piezoMod;
            scatterProb = Math.min(0.98, scatterProb * totalMod);
            intensityLoss = Math.min(0.95, intensityLoss * totalMod);
            leakIntensity = Math.max(0.02, leakIntensity / totalMod);
          }

          // Scale by carving depth: deeper = more blocking
          scatterProb = 1 - (1 - scatterProb) * (1 - depth);
          intensityLoss *= depth;
          leakIntensity = 1 - (1 - leakIntensity) * depth;

          if (Math.random() < scatterProb) {
            const theta = (0.2 + Math.random() * 0.8) * scatterAngle * Math.PI;
            const phi = Math.random() * Math.PI * 2;
            p.dx = Math.sin(theta) * Math.cos(phi);
            p.dy = Math.sin(theta) * Math.sin(phi);
            p.dz = Math.cos(theta) * (Math.random() > 0.5 ? 1 : -1);
            this._normalizeDir(p);
            p.intensity *= intensityLoss;
            if (p.intensity < 0.01) {
              p.state = 'absorbed';
              p.path.push([p.x, p.y, p.z]);
              return;
            }
            p._enteredGem = true;
            p.path.push([p.x, p.y, p.z]);
            return;
          }
          p.intensity *= leakIntensity;
        }
      }
    }

    // Branch for high-energy and THz radiation
    if (p.radType === 'xray' || p.radType === 'gamma' || p.radType === 'thz') {
      this._handleRadiationInteraction(p, gem, hitIdx, hitWindow);
      return;
    }

    let riAvg = (props.ri[0] + props.ri[1]) / 2;

    // Temperature-dependent RI shift (thermo-optic effect)
    const ct = (this.cellTemps && this.cellTemps[hitIdx]) ? this.cellTemps[hitIdx] : null;
    if (ct && ct.riShift) {
      riAvg += ct.riShift;
    }

    // Angle of incidence from the Z-axis
    const cosI = Math.abs(p.dz);
    const thetaI = Math.acos(Math.min(cosI, 1));

    // Fresnel reflectance
    const R = this._fresnelReflectance(1.0, riAvg, thetaI);

    if (Math.random() < R) {
      p.dz = -Math.abs(p.dz);
      const scatter = (Math.random() - 0.5) * 2 * (2 * Math.PI / 180);
      p.dx += scatter * 0.5;
      p.dy += scatter * 0.5;
      this._normalizeDir(p);
      p.path.push([p.x, p.y, p.z]);
      return;
    }

    // Refraction at entry (air → gem)
    const thetaR = window.GemUtils.snellRefract(thetaI, 1.0, riAvg);
    if (thetaR === null) {
      p.dz = -Math.abs(p.dz);
      p.path.push([p.x, p.y, p.z]);
      return;
    }
    this._applyRefraction(p, thetaI, thetaR);

    // Absorption through the gem (Beer-Lambert)
    // Temperature broadens absorption lines via Boltzmann population of phonon states
    let absorbance = window.GemUtils.interpolateSpectra(
      gem.spectra.data, p.wavelength
    );
    if (ct && ct.temperature > this.config.ambientTemp + 1) {
      const Tgem = ct.temperature;
      const Tamb = this.config.ambientTemp;
      // Line broadening factor: absorption increases as ~sqrt(T/T0) from
      // Boltzmann-populated phonon sidebands (Debye-Waller factor analog)
      const broadenFactor = Math.sqrt(Tgem / Tamb);
      absorbance *= broadenFactor;
    }
    const aEff = absorbance * (this.config.gemThickness / this.config.referenceThickness);
    const T = Math.pow(10, -aEff);
    const absorbedFraction = 1 - T;
    p.intensity *= T;

    // Deposit absorbed photon energy as heat
    if (ct && this.config.thermalEnabled && absorbedFraction > 0) {
      const h_p = 6.626e-34;
      const c_l = 3e8;
      const photonEnergy = h_p * c_l / (p.wavelength * 1e-9);
      ct.absorbedEnergy += photonEnergy * this.config.photonEnergyScale * absorbedFraction;
    }

    const mf = this.config.magneticField;

    // Faraday effect: polarization rotation → intensity modulation
    // θ = V × B × L where V is Verdet constant estimated from RI and dispersion
    // Becquerel approximation: V ≈ K × n² × dispersion (calibrated to quartz ≈ 4.5 rad/(T·m))
    if (mf && mf.enabled && mf.strength > 0) {
      const n = riAvg;
      const disp = props.dispersion || 0;
      const verdet = 144 * n * n * disp;
      const pathLength = this.config.gemThickness * 1e-3;
      const theta = verdet * mf.strength * pathLength;
      const faradayT = Math.cos(theta) * Math.cos(theta);
      p.intensity *= faradayT;
    }

    // Photoelectric charging: if photon energy exceeds band gap
    const h = 6.626e-34;
    const cLight = 3e8;
    const eV_J = 1.602e-19;
    const photonEnergy = h * cLight / (p.wavelength * 1e-9);
    let bandGap = (props.bandGap != null) ? props.bandGap : Infinity;
    if (ct && ct.bandGapShift) {
      bandGap = Math.max(0.1, bandGap + ct.bandGapShift);
    }
    const bandGapJ = bandGap * eV_J;

    // Hall effect: B-field enhances charge separation via Lorentz force on carriers
    // Factor scales as 1 + (μ × B)² where μ ≈ 0.1 m²/(V·s) typical carrier mobility
    const carrierMobility = 0.1;
    const hallFactor = (mf && mf.enabled)
      ? 1 + (carrierMobility * mf.strength) * (carrierMobility * mf.strength)
      : 1;

    if (photonEnergy > bandGapJ && bandGap < Infinity) {
      const efficiency = 0.1;
      const chargeGen = eV_J * (photonEnergy - bandGapJ) / bandGapJ * efficiency * hallFactor;
      const winIdx = layout.windows.indexOf(hitWindow);
      if (winIdx >= 0 && this.electrodes[winIdx]) {
        this.electrodes[winIdx].charge += chargeGen;
        this.electrodes[winIdx].current = chargeGen;
      }
    }

    if (p.intensity < 0.01) {
      p.state = 'absorbed';
      p.path.push([p.x, p.y, p.z]);
      return;
    }

    // UV fluorescence: UV photons may trigger visible emission
    // B-field modulates fluorescence yield via spin-state mixing:
    //   Cr³⁺ gems: B suppresses non-radiative intersystem crossing → enhanced emission
    //   Mn²⁺/other: weaker modulation from Zeeman-shifted level crossings
    if (p.wavelength < 380 && gem.fluorescence && gem.fluorescence.response !== 'Inert') {
      const emStr = gem.fluorescence.emission || '';
      const nmMatch = emStr.match(/(\d+)\s*nm/);
      if (nmMatch) {
        const emissionWl = parseFloat(nmMatch[1]);

        let fluorYield = 0.3;
        // Mott-Seitz thermal quenching of fluorescence
        if (ct && ct.fluorQuench < 1.0) {
          fluorYield *= ct.fluorQuench;
        }
        if (mf && mf.enabled && mf.strength > 0) {
          const chromIon = (gem.chromophore && gem.chromophore.ion) || '';
          const isCr = chromIon.indexOf('Cr') >= 0;
          const alpha = isCr ? 0.02 : 0.008;
          fluorYield *= (1 + alpha * mf.strength);
        }

        const emRgb = window.GemUtils.wavelengthToRGB(emissionWl);
        const emColor = `rgba(${Math.round(emRgb[0] * 255)},${Math.round(emRgb[1] * 255)},${Math.round(emRgb[2] * 255)},1)`;
        this.photons.push({
          x: p.x, y: p.y, z: p.z,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          dz: Math.abs(p.dz),
          wavelength: emissionWl,
          intensity: p.intensity * fluorYield,
          color: emColor,
          colorRGB: emRgb,
          path: [[p.x, p.y, p.z]],
          state: 'traveling',
          gemId: p.gemId,
          _cellIdx: p._cellIdx,
          _pathAccum: 0,
          _enteredGem: true,
          _exitedGem: false,
        });
        this._normalizeDir(this.photons[this.photons.length - 1]);
        p.intensity *= (1 - fluorYield);
      }
    }

    // Birefringence: spawn a second ray if significant
    if (props.birefringence > 0.01) {
      this._spawnExtraordinaryRay(p, gem, riAvg);
    }

    p._enteredGem = true;
    p.path.push([p.x, p.y, p.z]);
  }

  // ── Radiation interaction (X-ray, gamma, THz) ─────────────────────

  _handleRadiationInteraction(p, gem, cellIdx, hitWindow) {
    const rad = gem.radiation;
    const props = gem.properties;
    const ct = (this.cellTemps && this.cellTemps[cellIdx]) ? this.cellTemps[cellIdx] : null;
    const cr = (this.cellRad && this.cellRad[cellIdx]) ? this.cellRad[cellIdx] : null;
    const thick_cm = this.config.gemThickness * 0.1;
    const density = (rad && rad.densityCGS) || (props.sg || 2.65);
    const eV_J = 1.602e-19;
    const layout = this._layout;

    if (p.radType === 'xray') {
      // Photoelectric absorption: I = I₀ × exp(−μ/ρ × ρ × t)
      // μ/ρ ∝ Z⁴/E^n; n≈2.5–3 depending on energy range (NIST XCOM)
      const muRho_ref = (rad && rad.massAttenXray) || 0.37;
      const E_ref = 50;
      const muRho = muRho_ref * Math.pow(E_ref / p.energy_keV, 2.5);
      const tau = muRho * density * thick_cm;
      const T_xray = Math.exp(-tau);
      const absorbedFrac = 1 - T_xray;
      p.intensity *= T_xray;

      if (cr) {
        const doseJ = p.energy_keV * 1e3 * eV_J * absorbedFrac * this.config.photonEnergyScale;
        const mass_kg = density * 1e3 * (thick_cm * 0.01) * (hitWindow.xMax - hitWindow.xMin) * 1e-3 * (hitWindow.yMax - hitWindow.yMin) * 1e-3;
        const dose_Gy = mass_kg > 0 ? doseJ / mass_kg : 0;
        cr._doseThisFrame += dose_Gy;
        cr.dose += dose_Gy;

        const ccYield = (rad && rad.colorCenterYield) || 0.1;
        cr.colorCenterDensity += dose_Gy * ccYield * 0.001;
        cr.colorCenterDensity = Math.min(cr.colorCenterDensity, 1.0);

        const hardness = (rad && rad.radiationHardness) || 5;
        cr.damageLevel += dose_Gy * 0.0001 / hardness;
        cr.damageLevel = Math.min(cr.damageLevel, 1.0);

        cr.xrfEmitting = absorbedFrac > 0.1;

        // Radiation-induced conductivity: σ ∝ dose_rate^0.8
        cr.conductivityBoost = 1 + Math.pow(cr._doseThisFrame * 60, 0.8) * 100;
      }

      if (ct && this.config.thermalEnabled) {
        ct.absorbedEnergy += p.energy_keV * 1e3 * eV_J * this.config.photonEnergyScale * absorbedFrac;
      }

      // Radioluminescence: X-rays excite visible-light emission
      if (rad && rad.radioluminescence && rad.radioluminescence.emission && rad.radioluminescence.yield > 0) {
        const rlYield = rad.radioluminescence.yield * absorbedFrac;
        if (Math.random() < rlYield) {
          const emWl = rad.radioluminescence.emission;
          const emRgb = window.GemUtils.wavelengthToRGB(emWl);
          this.photons.push({
            x: p.x, y: p.y, z: p.z,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            dz: Math.random() > 0.5 ? 0.8 : -0.8,
            wavelength: emWl, energy_keV: 0, radType: 'photon',
            intensity: rlYield * p.intensity * 5,
            color: `rgba(${Math.round(emRgb[0]*255)},${Math.round(emRgb[1]*255)},${Math.round(emRgb[2]*255)},1)`,
            colorRGB: emRgb,
            path: [[p.x, p.y, p.z]], state: 'traveling',
            gemId: p.gemId, _cellIdx: cellIdx,
            _pathAccum: 0, _enteredGem: true, _exitedGem: false,
          });
          this._normalizeDir(this.photons[this.photons.length - 1]);
        }
      }

      // XRF: characteristic X-ray emission (spawn as transmitted photon)
      if (rad && rad.xrfLines && rad.xrfLines.length > 0 && absorbedFrac > 0.05) {
        if (Math.random() < 0.3 * absorbedFrac) {
          const line = rad.xrfLines[Math.floor(Math.random() * rad.xrfLines.length)];
          const xrfRgb = [0.3, 0.1, 0.7];
          this.photons.push({
            x: p.x, y: p.y, z: p.z,
            dx: (Math.random() - 0.5) * 0.6,
            dy: (Math.random() - 0.5) * 0.6,
            dz: Math.random() > 0.5 ? 0.7 : -0.7,
            wavelength: 1.2398 / line.energy,
            energy_keV: line.energy, radType: 'xray',
            intensity: p.intensity * 0.1,
            color: 'rgba(80,30,180,0.8)',
            colorRGB: xrfRgb,
            path: [[p.x, p.y, p.z]], state: 'traveling',
            gemId: p.gemId, _cellIdx: cellIdx,
            _pathAccum: 0, _enteredGem: true, _exitedGem: false,
          });
          this._normalizeDir(this.photons[this.photons.length - 1]);
        }
      }

      // Photoelectric charge generation (X-rays far exceed band gap)
      if (this.electrodes[cellIdx] && absorbedFrac > 0) {
        const chargePerPhoton = p.energy_keV * 1e3 * eV_J * 0.3;
        this.electrodes[cellIdx].charge += chargePerPhoton * this.config.photonEnergyScale * 1e-15;
      }

      if (p.intensity < 0.01) {
        p.state = 'absorbed';
        p.path.push([p.x, p.y, p.z]);
        return;
      }

      if (this.config.xrdMode || (this.config.lightMode === 'uraninite' && this.config.uraniniteXRD)) {
        this._xrdApplyDiffraction(p, gem, cellIdx);
      }

      p._enteredGem = true;
      p._exitedGem = true;
      p.path.push([p.x, p.y, p.z]);

    } else if (p.radType === 'gamma') {
      // Compton scattering dominant at MeV energies
      // Klein-Nishina: total cross-section decreases with energy
      const muRho = (rad && rad.massAttenGamma) || 0.064;
      const tau = muRho * density * thick_cm;
      const T_gamma = Math.exp(-tau);
      const interactProb = 1 - T_gamma;

      if (Math.random() < interactProb) {
        // Compton scattering: photon deflects, deposits partial energy
        // θ_scatter from Klein-Nishina simplified
        const alpha_c = p.energy_keV / 511;
        const cosTheta = 1 - (1 / (1 + alpha_c * (1 - Math.random())));
        const E_scattered = p.energy_keV / (1 + alpha_c * (1 - cosTheta));
        const E_deposited = p.energy_keV - E_scattered;
        const depositFrac = E_deposited / p.energy_keV;

        p.energy_keV = E_scattered;
        p.intensity *= (1 - depositFrac * 0.5);

        // Scatter direction
        const scatAngle = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
        const phi = Math.random() * Math.PI * 2;
        p.dx += Math.sin(scatAngle) * Math.cos(phi) * 0.3;
        p.dy += Math.sin(scatAngle) * Math.sin(phi) * 0.3;
        this._normalizeDir(p);

        if (cr) {
          const doseJ = E_deposited * 1e3 * eV_J * this.config.photonEnergyScale;
          const mass_kg = density * 1e3 * (thick_cm * 0.01) * (hitWindow.xMax - hitWindow.xMin) * 1e-3 * (hitWindow.yMax - hitWindow.yMin) * 1e-3;
          const dose_Gy = mass_kg > 0 ? doseJ / mass_kg : 0;
          cr._doseThisFrame += dose_Gy;
          cr.dose += dose_Gy;

          const ccYield = (rad && rad.colorCenterYield) || 0.1;
          cr.colorCenterDensity += dose_Gy * ccYield * 0.0005;
          cr.colorCenterDensity = Math.min(cr.colorCenterDensity, 1.0);

          const hardness = (rad && rad.radiationHardness) || 5;
          cr.damageLevel += dose_Gy * 0.00005 / hardness;
          cr.damageLevel = Math.min(cr.damageLevel, 1.0);

          cr.conductivityBoost = 1 + Math.pow(cr._doseThisFrame * 60, 0.8) * 50;

          // Pair production (> 1.022 MeV): annihilation photon emission
          if (p.energy_keV > 1022) {
            const ppProb = 0.01 * (p.energy_keV - 1022) / 1000;
            if (Math.random() < ppProb) {
              for (let ap = 0; ap < 2; ap++) {
                const annRgb = [0.9, 0.9, 0.0];
                this.photons.push({
                  x: p.x, y: p.y, z: p.z,
                  dx: (Math.random() - 0.5), dy: (Math.random() - 0.5),
                  dz: ap === 0 ? 0.8 : -0.8,
                  wavelength: 1.2398 / 511, energy_keV: 511, radType: 'gamma',
                  intensity: 0.3, color: 'rgba(230,230,50,0.8)',
                  colorRGB: annRgb,
                  path: [[p.x, p.y, p.z]], state: 'traveling',
                  gemId: p.gemId, _cellIdx: cellIdx,
                  _pathAccum: 0, _enteredGem: true, _exitedGem: false,
                });
                this._normalizeDir(this.photons[this.photons.length - 1]);
              }
            }
          }
        }

        if (ct && this.config.thermalEnabled) {
          ct.absorbedEnergy += E_deposited * 1e3 * eV_J * this.config.photonEnergyScale;
        }

        // Radioluminescence from gamma
        if (rad && rad.radioluminescence && rad.radioluminescence.emission && rad.radioluminescence.yield > 0) {
          if (Math.random() < rad.radioluminescence.yield * depositFrac * 0.5) {
            const emWl = rad.radioluminescence.emission;
            const emRgb = window.GemUtils.wavelengthToRGB(emWl);
            this.photons.push({
              x: p.x, y: p.y, z: p.z,
              dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5,
              dz: Math.random() > 0.5 ? 0.7 : -0.7,
              wavelength: emWl, energy_keV: 0, radType: 'photon',
              intensity: 0.3, color: `rgba(${Math.round(emRgb[0]*255)},${Math.round(emRgb[1]*255)},${Math.round(emRgb[2]*255)},1)`,
              colorRGB: emRgb,
              path: [[p.x, p.y, p.z]], state: 'traveling',
              gemId: p.gemId, _cellIdx: cellIdx,
              _pathAccum: 0, _enteredGem: true, _exitedGem: false,
            });
            this._normalizeDir(this.photons[this.photons.length - 1]);
          }
        }

        if (this.electrodes[cellIdx]) {
          this.electrodes[cellIdx].charge += E_deposited * 1e3 * eV_J * 0.2 * this.config.photonEnergyScale * 1e-15;
        }
      }

      if (p.intensity < 0.01) {
        p.state = 'absorbed';
        p.path.push([p.x, p.y, p.z]);
        return;
      }
      p._enteredGem = true;
      p._exitedGem = true;
      p.path.push([p.x, p.y, p.z]);

    } else if (p.radType === 'thz') {
      // THz: lattice phonon coupling, dielectric absorption
      // α_THz varies strongly with material and frequency
      const alpha_thz = (rad && rad.thzAbsorption) || 20;
      const freq = this.config.thzFrequency || 1.0;
      // Absorption scales roughly as freq² for most dielectrics
      const alpha_eff = alpha_thz * (freq * freq);
      const T_thz = Math.exp(-alpha_eff * thick_cm);
      const absorbedFrac = 1 - T_thz;
      p.intensity *= T_thz;

      // THz energy is very low (~meV) but absorbed efficiently → heating
      if (ct && this.config.thermalEnabled && absorbedFrac > 0) {
        const E_thz_J = freq * 1e12 * 6.626e-34;
        ct.absorbedEnergy += E_thz_J * this.config.photonEnergyScale * absorbedFrac;
      }

      if (cr) {
        cr._doseThisFrame += absorbedFrac * 1e-6;
      }

      if (p.intensity < 0.01) {
        p.state = 'absorbed';
        p.path.push([p.x, p.y, p.z]);
        return;
      }
      p._enteredGem = true;
      p._exitedGem = true;
      p.path.push([p.x, p.y, p.z]);
    }
  }

  // ── X-ray Crystallography (XRD) ─────────────────────────────

  _precomputeXRDData() {
    if (!this._layout || !this.grid) return;
    this._xrdCells = [];
    const GEMS = window.GEMSTONES || {};

    for (let i = 0; i < this.grid.gemIds.length; i++) {
      const gemId = this.grid.gemIds[i];
      const gem = GEMS[gemId];
      if (!gem || !gem.unitCell || !gem.atoms || gem.atoms.length === 0) {
        this._xrdCells.push(null);
        continue;
      }

      const uc = gem.unitCell;
      const rBasis = this._xrdReciprocalBasis(uc);
      const R = this._xrdRandomOrientation();
      const maxHKL = 8;
      const reflections = [];

      for (let h = -maxHKL; h <= maxHKL; h++) {
        for (let k = -maxHKL; k <= maxHKL; k++) {
          for (let l = -maxHKL; l <= maxHKL; l++) {
            if (h === 0 && k === 0 && l === 0) continue;
            if (h < 0 || (h === 0 && k < 0) || (h === 0 && k === 0 && l < 0)) continue;

            const d = this._xrdDSpacing(h, k, l, uc);
            if (d < 0.5 || d > 25) continue;

            const F2 = this._xrdStructureFactor2(h, k, l, gem.atoms);
            if (F2 < 0.5) continue;

            const gCryst = [
              h * rBasis.as[0] + k * rBasis.bs[0] + l * rBasis.cs[0],
              h * rBasis.as[1] + k * rBasis.bs[1] + l * rBasis.cs[1],
              h * rBasis.as[2] + k * rBasis.bs[2] + l * rBasis.cs[2],
            ];
            const gLab = this._xrdMatVec(R, gCryst);
            const phi = Math.atan2(gLab[1], gLab[0]);
            const G2 = gLab[0]*gLab[0] + gLab[1]*gLab[1] + gLab[2]*gLab[2];
            const lambdaReq = G2 > 1e-10 ? -2 * gLab[2] / G2 : -1;

            reflections.push({ h, k, l, d, F2, phi, gx: gLab[0], gy: gLab[1], gz: gLab[2], lambdaReq });
            const gNeg = [-gLab[0], -gLab[1], -gLab[2]];
            const G2n = G2;
            const lambdaReqN = G2n > 1e-10 ? -2 * gNeg[2] / G2n : -1;
            reflections.push({ h: -h, k: -k, l: -l, d, F2,
              phi: phi + Math.PI, gx: gNeg[0], gy: gNeg[1], gz: gNeg[2], lambdaReq: lambdaReqN });
          }
        }
      }

      this._xrdCells.push({ R, reflections });
    }
  }

  _xrdRandomOrientation() {
    const a = Math.random() * 2 * Math.PI;
    const b = Math.acos(2 * Math.random() - 1);
    const g = Math.random() * 2 * Math.PI;
    const ca = Math.cos(a), sa = Math.sin(a);
    const cb = Math.cos(b), sb = Math.sin(b);
    const cg = Math.cos(g), sg = Math.sin(g);
    return [
      [ca*cb*cg - sa*sg, -ca*cb*sg - sa*cg, ca*sb],
      [sa*cb*cg + ca*sg, -sa*cb*sg + ca*cg, sa*sb],
      [-sb*cg, sb*sg, cb]
    ];
  }

  _xrdMatVec(M, v) {
    return [
      M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
      M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
      M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
    ];
  }

  _xrdReciprocalBasis(uc) {
    const { a, b, c, alpha: aDeg, beta: bDeg, gamma: gDeg } = uc;
    const al = aDeg * Math.PI / 180, be = bDeg * Math.PI / 180, ga = gDeg * Math.PI / 180;
    const ax = a, ay = 0, az = 0;
    const bx = b * Math.cos(ga), by = b * Math.sin(ga), bz = 0;
    const cx = c * Math.cos(be);
    const cy = c * (Math.cos(al) - Math.cos(be) * Math.cos(ga)) / Math.sin(ga);
    const sinGa = Math.sin(ga);
    const vol = 1 - Math.cos(al)**2 - Math.cos(be)**2 - Math.cos(ga)**2
      + 2 * Math.cos(al) * Math.cos(be) * Math.cos(ga);
    const cz = c * Math.sqrt(Math.max(0, vol)) / sinGa;
    const V = ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
    if (Math.abs(V) < 1e-10) return { as: [1,0,0], bs: [0,1,0], cs: [0,0,1] };
    return {
      as: [(by*cz - bz*cy)/V, (bz*cx - bx*cz)/V, (bx*cy - by*cx)/V],
      bs: [(cy*az - cz*ay)/V, (cz*ax - cx*az)/V, (cx*ay - cy*ax)/V],
      cs: [(ay*bz - az*by)/V, (az*bx - ax*bz)/V, (ax*by - ay*bx)/V],
    };
  }

  _xrdDSpacing(h, k, l, uc) {
    const { a, b, c, alpha: aDeg, beta: bDeg, gamma: gDeg } = uc;
    const al = aDeg * Math.PI / 180, be = bDeg * Math.PI / 180, ga = gDeg * Math.PI / 180;
    const ca = Math.cos(al), cb = Math.cos(be), cg = Math.cos(ga);
    const sa = Math.sin(al), sb = Math.sin(be), sg = Math.sin(ga);
    const V2 = a*a*b*b*c*c * (1 - ca*ca - cb*cb - cg*cg + 2*ca*cb*cg);
    if (V2 <= 0) return 0;
    const S11 = b*b*c*c*sa*sa, S22 = a*a*c*c*sb*sb, S33 = a*a*b*b*sg*sg;
    const S12 = a*b*c*c*(ca*cb - cg);
    const S23 = a*a*b*c*(cb*cg - ca);
    const S13 = a*b*b*c*(ca*cg - cb);
    const invD2 = (S11*h*h + S22*k*k + S33*l*l + 2*S12*h*k + 2*S23*k*l + 2*S13*h*l) / V2;
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  _xrdStructureFactor2(h, k, l, atoms) {
    const Z = {H:1,He:2,Li:3,Be:4,B:5,C:6,N:7,O:8,F:9,Na:11,Mg:12,Al:13,Si:14,
      P:15,S:16,Cl:17,K:19,Ca:20,Ti:22,V:23,Cr:24,Mn:25,Fe:26,Ni:28,Cu:29,Zn:30,Zr:40,Pb:82,U:92};
    let re = 0, im = 0;
    for (const at of atoms) {
      const f = Z[at.el] || 10;
      const phase = 2 * Math.PI * (h * at.x + k * at.y + l * at.z);
      re += f * Math.cos(phase);
      im += f * Math.sin(phase);
    }
    return re * re + im * im;
  }

  _xrdApplyDiffraction(p, gem, cellIdx) {
    const xrd = this._xrdCells && this._xrdCells[cellIdx];
    if (!xrd || !xrd.reflections || xrd.reflections.length === 0) return;

    const lambda_A = 12.398 / p.energy_keV;
    const isUraniniteXRD = this.config.lightMode === 'uraninite' && this.config.uraniniteXRD;
    const useLaue = this.config.xrdLaue || isUraniniteXRD;
    let totalWeight = 0;
    const active = [];

    if (useLaue) {
      // Uraninite: broad polychromatic spectrum 5–105 keV
      const refEnergy = isUraniniteXRD ? 50 : this.config.xrayEnergy;
      const lambdaMin = 12.398 / (refEnergy * 1.6);
      const lambdaMax = 12.398 / (refEnergy * 0.4);
      for (const refl of xrd.reflections) {
        if (refl.lambdaReq <= 0 || refl.lambdaReq < lambdaMin || refl.lambdaReq > lambdaMax) continue;
        const invL = 1 / refl.lambdaReq;
        const kx = refl.gx, ky = refl.gy, kz = invL + refl.gz;
        const kLen = Math.sqrt(kx*kx + ky*ky + kz*kz);
        if (kLen < 0.01) continue;
        const cosA = kz / kLen;
        if (cosA < -0.99) continue;
        const sin2t = Math.sqrt(1 - cosA*cosA);
        const LP = sin2t > 0.01 ? 1 / sin2t : 100;
        const weight = refl.F2 * Math.min(Math.abs(LP), 50);
        active.push({ dx: kx/kLen, dy: ky/kLen, dz: kz/kLen, weight });
        totalWeight += weight;
      }
    } else {
      for (const refl of xrd.reflections) {
        const sinTheta = lambda_A / (2 * refl.d);
        if (Math.abs(sinTheta) >= 0.99) continue;
        const theta = Math.asin(sinTheta);
        const sin2t = Math.sin(2 * theta);
        const LP = sin2t > 0.01 ? 1 / sin2t : 100;
        const weight = refl.F2 * Math.min(Math.abs(LP), 50);
        active.push({ theta, phi: refl.phi, weight });
        totalWeight += weight;
      }
    }

    if (active.length === 0 || totalWeight <= 0) return;

    const thick_mm = this.config.gemThickness;
    const diffractProb = Math.min(0.35, 0.2 * Math.pow(Math.max(thick_mm, 0.01), 0.3));
    if (Math.random() >= diffractProb) return;

    let r = Math.random() * totalWeight;
    let sel = active[0];
    for (const a of active) {
      r -= a.weight;
      if (r <= 0) { sel = a; break; }
    }

    const mosaic = 0.4 * Math.PI / 180;
    const gm = () => (Math.random() + Math.random() - 1.0) * mosaic;

    if (sel.dx !== undefined) {
      p.dx = sel.dx + gm();
      p.dy = sel.dy + gm();
      p.dz = sel.dz;
    } else {
      const twoTheta = 2 * sel.theta;
      p.dx = Math.sin(twoTheta) * Math.cos(sel.phi) + gm();
      p.dy = Math.sin(twoTheta) * Math.sin(sel.phi) + gm();
      p.dz = Math.cos(twoTheta);
    }
    this._normalizeDir(p);
    p._diffracted = true;
  }

  _handleGemExit(p) {
    const gem = window.GEMSTONES[p.gemId];
    if (!gem) return;

    const props = gem.properties;
    let riAvg = (props.ri[0] + props.ri[1]) / 2;
    const dispersion = props.dispersion || 0;

    // Temperature-dependent RI shift at exit surface
    const ct = (p._cellIdx >= 0 && this.cellTemps && this.cellTemps[p._cellIdx])
      ? this.cellTemps[p._cellIdx] : null;
    if (ct && ct.riShift) {
      riAvg += ct.riShift;
    }

    // Wavelength-dependent RI (dispersion / fire)
    const riEff = riAvg + dispersion * (550 - p.wavelength) / 200;

    const cosI = Math.abs(p.dz);
    const thetaI = Math.acos(Math.min(cosI, 1));
    const thetaR = window.GemUtils.snellRefract(thetaI, riEff, 1.0);

    if (thetaR === null) {
      // Total internal reflection — bounce back
      p.dz = -Math.abs(p.dz);
      p._exitedGem = false;
      p._enteredGem = false;
      return;
    }

    this._applyRefraction(p, thetaI, thetaR);
    p.path.push([p.x, p.y, p.z]);
  }

  // ── internal: Fresnel for arbitrary incidence ───────────────────────

  _fresnelReflectance(n1, n2, thetaI) {
    if (thetaI < 0.001) return window.GemUtils.fresnelNormal(n1, n2);

    const sinI = Math.sin(thetaI);
    const sinT = (n1 / n2) * sinI;
    if (Math.abs(sinT) > 1) return 1.0; // TIR

    const cosI = Math.cos(thetaI);
    const cosT = Math.sqrt(1 - sinT * sinT);

    const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
    const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
    return 0.5 * (rs * rs + rp * rp);
  }

  // ── internal: direction helpers ─────────────────────────────────────

  _normalizeDir(p) {
    const len = Math.sqrt(p.dx * p.dx + p.dy * p.dy + p.dz * p.dz);
    if (len > 0) { p.dx /= len; p.dy /= len; p.dz /= len; }
  }

  _applyRefraction(p, thetaI, thetaR) {
    if (thetaI < 0.001) return;

    const ratio = Math.sin(thetaR) / Math.sin(thetaI);
    const signZ = p.dz > 0 ? 1 : -1;

    // Lateral components scale by the ratio, Z adjusts to maintain unit length
    const latLen = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
    if (latLen > 1e-9) {
      const newLat = latLen * ratio;
      const scale = newLat / latLen;
      p.dx *= scale;
      p.dy *= scale;
    }
    p.dz = signZ * Math.sqrt(Math.max(0, 1 - p.dx * p.dx - p.dy * p.dy));
    this._normalizeDir(p);
  }

  _spawnExtraordinaryRay(p, gem, riAvg) {
    const bire = gem.properties.birefringence;
    const riE = riAvg + bire / 2;
    const angleOffset = bire * 0.5;

    const clone = {
      x: p.x, y: p.y, z: p.z,
      dx: p.dx + (Math.random() - 0.5) * angleOffset,
      dy: p.dy + (Math.random() - 0.5) * angleOffset,
      dz: p.dz,
      wavelength: p.wavelength,
      intensity: p.intensity * 0.5,
      color: p.color,
      colorRGB: p.colorRGB,
      path: [[p.x, p.y, p.z]],
      state: 'traveling',
      gemId: p.gemId,
      _cellIdx: p._cellIdx,
      _pathAccum: 0,
      _enteredGem: true,
      _exitedGem: false,
    };
    this._normalizeDir(clone);

    p.intensity *= 0.5;
    this.photons.push(clone);
  }

  // ── internal: screen recording ──────────────────────────────────────

  _initScreens() {
    const n = this.config.screenResolution;
    this._transmissionScreen = this._makeScreen(n);
    this._reflectionScreen = this._makeScreen(n);
    this._lastTransmission = this._makeScreen(n);
    this._lastReflection = this._makeScreen(n);
  }

  _makeScreen(n) {
    return { width: n, height: n, data: new Float32Array(n * n * 4), _peakA: 0 };
  }

  _recordOnScreen(screen, p) {
    const layout = this._layout;
    if (!layout) return;

    // Use the same half-extents as the rendered screen so the pattern fills it exactly.
    const halfW = layout.screenHalfW || layout.totalWidth * 0.65;
    const halfH = layout.screenHalfH || layout.totalHeight * 0.55;
    const n = screen.width;

    const px = Math.floor(((p.x + halfW) / (2 * halfW)) * n);
    const py = Math.floor(((p.y + halfH) / (2 * halfH)) * n);

    if (px < 0 || px >= n || py < 0 || py >= n) return;

    const idx = (py * n + px) * 4;
    const rgb = p.colorRGB;
    const I = p.intensity;
    screen.data[idx]     += rgb[0] * I;
    screen.data[idx + 1] += rgb[1] * I;
    screen.data[idx + 2] += rgb[2] * I;
    screen.data[idx + 3] += I;
  }

  _exportScreen(screen) {
    const n = screen.width;
    const out = new Float32Array(n * n * 4);
    const src = screen.data;

    let maxA = 0;
    for (let i = 3; i < src.length; i += 4) {
      if (src[i] > maxA) maxA = src[i];
    }

    if (!screen._peakA || maxA > screen._peakA) screen._peakA = maxA;
    const refA = screen._peakA || 1;
    const norm = refA > 0 ? 1 / refA : 1;

    for (let i = 0; i < src.length; i += 4) {
      const a = src[i + 3];
      if (a > 0) {
        const sa = Math.sqrt(Math.min(1, a * norm));
        out[i]     = Math.min(1, (src[i] / a) * sa);
        out[i + 1] = Math.min(1, (src[i + 1] / a) * sa);
        out[i + 2] = Math.min(1, (src[i + 2] / a) * sa);
        out[i + 3] = sa;
      }
    }
    return { width: n, height: n, data: out };
  }

  _finishPhoton(p, idx) {
    p.path.push([p.x, p.y, p.z]);
    this.completedPaths.push({
      path: p.path,
      state: p.state,
      color: p.color,
      intensity: p.intensity,
      gemId: p.gemId,
      wavelength: p.wavelength,
    });

    // Fully absorbed photons deposit remaining energy as heat
    const cellIdx = p._cellIdx >= 0 ? p._cellIdx : this._findCellIndex(p);
    if (p.state === 'absorbed' && cellIdx >= 0 && this.cellTemps && this.cellTemps[cellIdx]
        && this.config.thermalEnabled) {
      const h_p = 6.626e-34;
      const c_l = 3e8;
      const photonE = h_p * c_l / (p.wavelength * 1e-9);
      this.cellTemps[cellIdx].absorbedEnergy += photonE * this.config.photonEnergyScale * p.intensity;
    }
    if (cellIdx >= 0 && this.cellStats[cellIdx]) {
      const cs = this.cellStats[cellIdx];
      const binIdx = Math.floor((p.wavelength - cs.spectraBinMin) / (cs.spectraBinMax - cs.spectraBinMin) * cs.spectraBins);
      const bi = Math.max(0, Math.min(cs.spectraBins - 1, binIdx));
      const rgb = p.colorRGB || [0, 0, 0];

      // Track incident spectrum (every photon that interacted with this cell)
      cs.totalIntensityI += 1;
      cs.spectraI[bi] += 1;
      cs.colorSumI[0] += rgb[0];
      cs.colorSumI[1] += rgb[1];
      cs.colorSumI[2] += rgb[2];

      if (p.state === 'transmitted') {
        cs.transmitted++;
        cs.totalIntensityT += p.intensity;
        cs.wavelengthSumT += p.wavelength * p.intensity;
        cs.spectraT[bi] += p.intensity;
        cs.colorSumT[0] += rgb[0] * p.intensity;
        cs.colorSumT[1] += rgb[1] * p.intensity;
        cs.colorSumT[2] += rgb[2] * p.intensity;
      } else if (p.state === 'reflected') {
        cs.reflected++;
        cs.totalIntensityR += p.intensity;
        cs.wavelengthSumR += p.wavelength * p.intensity;
        cs.spectraR[bi] += p.intensity;
        cs.colorSumR[0] += rgb[0] * p.intensity;
        cs.colorSumR[1] += rgb[1] * p.intensity;
        cs.colorSumR[2] += rgb[2] * p.intensity;
      } else if (p.state === 'absorbed') {
        cs.absorbed++;
      } else if (p.state === 'blocked') {
        cs.blocked++;
      }
    }

    this.photons.splice(idx, 1);
  }

  _makeCellStat(gemId) {
    const NBINS = 400;
    return {
      gemId: gemId || null,
      transmitted: 0, reflected: 0, absorbed: 0, blocked: 0,
      totalIntensityT: 0, totalIntensityR: 0, totalIntensityI: 0,
      wavelengthSumT: 0, wavelengthSumR: 0,
      spectraBinMin: 200, spectraBinMax: 2000,
      spectraBins: NBINS,
      spectraT: new Float32Array(NBINS),
      spectraR: new Float32Array(NBINS),
      spectraI: new Float32Array(NBINS),
      colorSumT: [0, 0, 0],
      colorSumR: [0, 0, 0],
      colorSumI: [0, 0, 0],
    };
  }

  _findCellIndex(p) {
    const layout = this._layout;
    if (!layout) return -1;
    for (let i = 0; i < layout.windows.length; i++) {
      const w = layout.windows[i];
      if (p.x >= w.xMin && p.x <= w.xMax && p.y >= w.yMin && p.y <= w.yMax) return i;
    }
    return -1;
  }

  getCellStats() {
    if (!this.cellStats || !this._layout) return null;
    const cols = this.grid ? this.grid.cols : 0;
    const rows = this.grid ? this.grid.rows : 0;
    return {
      cols, rows,
      cells: this.cellStats.map(cs => {
        const avgWlT = cs.totalIntensityT > 0 ? cs.wavelengthSumT / cs.totalIntensityT : 0;
        const avgWlR = cs.totalIntensityR > 0 ? cs.wavelengthSumR / cs.totalIntensityR : 0;
        const total = cs.transmitted + cs.reflected + cs.absorbed + cs.blocked;
        const transmittance = total > 0 ? cs.transmitted / total : 0;
        const reflectance = total > 0 ? cs.reflected / total : 0;

        const clampC = v => Math.max(0, Math.min(255, Math.round(v * 255)));
        const tI = cs.totalIntensityT || 1;
        const rI = cs.totalIntensityR || 1;
        const iI = cs.totalIntensityI || 1;
        const colorT = cs.totalIntensityT > 0
          ? `rgb(${clampC(cs.colorSumT[0]/tI)},${clampC(cs.colorSumT[1]/tI)},${clampC(cs.colorSumT[2]/tI)})`
          : '#222';
        const colorR = cs.totalIntensityR > 0
          ? `rgb(${clampC(cs.colorSumR[0]/rI)},${clampC(cs.colorSumR[1]/rI)},${clampC(cs.colorSumR[2]/rI)})`
          : '#222';

        // Absorption color = incident color - transmitted color - reflected color
        const absR = cs.colorSumI[0] / iI - cs.colorSumT[0] / iI - cs.colorSumR[0] / iI;
        const absG = cs.colorSumI[1] / iI - cs.colorSumT[1] / iI - cs.colorSumR[1] / iI;
        const absB = cs.colorSumI[2] / iI - cs.colorSumT[2] / iI - cs.colorSumR[2] / iI;
        const absMax = Math.max(absR, absG, absB, 0.001);
        const colorA = total > 0
          ? `rgb(${clampC(absR / absMax)},${clampC(absG / absMax)},${clampC(absB / absMax)})`
          : '#222';

        return {
          gemId: cs.gemId,
          transmitted: cs.transmitted, reflected: cs.reflected,
          absorbed: cs.absorbed, blocked: cs.blocked, total,
          transmittance, reflectance,
          avgWavelengthT: Math.round(avgWlT),
          avgWavelengthR: Math.round(avgWlR),
          avgIntensityT: cs.transmitted > 0 ? cs.totalIntensityT / cs.transmitted : 0,
          avgIntensityR: cs.reflected > 0 ? cs.totalIntensityR / cs.reflected : 0,
          spectraT: Array.from(cs.spectraT),
          spectraR: Array.from(cs.spectraR),
          spectraI: Array.from(cs.spectraI),
          spectraBinMin: cs.spectraBinMin,
          spectraBinMax: cs.spectraBinMax,
          spectraBins: cs.spectraBins,
          colorT, colorR, colorA,
        };
      }),
    };
  }
};
