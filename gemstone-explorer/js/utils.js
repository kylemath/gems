/**
 * Shared utilities for Gemstone Explorer
 * Color conversion, math helpers, wavelength-to-RGB, canvas DPI handling
 */

window.GemUtils = {

  /**
   * Convert wavelength to RGB, extended with false-color for UV and IR:
   *   100-380nm  → UV false color (magenta/purple, brighter near 380)
   *   380-780nm  → true visible spectrum
   *   780-2000nm → IR false color (dark red/maroon, dimmer with distance)
   */
  wavelengthToRGB(wavelength) {
    let r, g, b, factor;

    if (wavelength >= 380 && wavelength <= 780) {
      if (wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380); g = 0; b = 1;
      } else if (wavelength < 490) {
        r = 0; g = (wavelength - 440) / (490 - 440); b = 1;
      } else if (wavelength < 510) {
        r = 0; g = 1; b = -(wavelength - 510) / (510 - 490);
      } else if (wavelength < 580) {
        r = (wavelength - 510) / (580 - 510); g = 1; b = 0;
      } else if (wavelength < 645) {
        r = 1; g = -(wavelength - 645) / (645 - 580); b = 0;
      } else {
        r = 1; g = 0; b = 0;
      }
      if (wavelength < 420) factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
      else if (wavelength <= 700) factor = 1.0;
      else factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    } else if (wavelength < 380 && wavelength >= 100) {
      const t = (wavelength - 100) / (380 - 100);
      r = 0.4 + 0.3 * t;
      g = 0;
      b = 0.5 + 0.4 * t;
      factor = 0.3 + 0.5 * t;
    } else if (wavelength > 780 && wavelength <= 2000) {
      const t = 1 - (wavelength - 780) / (2000 - 780);
      r = 0.6 + 0.3 * t;
      g = 0;
      b = 0;
      factor = 0.2 + 0.5 * t;
    } else {
      r = 0; g = 0; b = 0; factor = 0;
    }

    return [r * factor, g * factor, b * factor];
  },

  wavelengthToCSS(wavelength, alpha) {
    const [r, g, b] = this.wavelengthToRGB(wavelength);
    const a = alpha !== undefined ? alpha : 1;
    return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
  },

  hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  },

  rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
  },

  lightenColor(hex, threshold) {
    const { r, g, b } = this.hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance >= threshold) return hex;
    const boost = threshold / Math.max(luminance, 0.01);
    return this.rgbToHex(r * boost, g * boost, b * boost);
  },

  setupHiDPICanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    return dpr;
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  /**
   * Interpolate absorbance from spectra data at a given wavelength
   * Uses linear interpolation between nearest data points
   */
  interpolateSpectra(data, wavelength) {
    if (!data || data.length === 0) return 0;
    if (wavelength <= data[0][0]) return data[0][1];
    if (wavelength >= data[data.length - 1][0]) return data[data.length - 1][1];
    let lo = 0, hi = data.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (data[mid][0] <= wavelength) lo = mid; else hi = mid;
    }
    const t = (wavelength - data[lo][0]) / (data[hi][0] - data[lo][0]);
    return data[lo][1] + t * (data[hi][1] - data[lo][1]);
  },

  /**
   * Compute transmittance from absorbance: T = 10^(-A)
   * where A is the absorbance at the given wavelength
   */
  transmittance(absorbance) {
    return Math.pow(10, -absorbance);
  },

  /**
   * Fresnel reflectance at normal incidence: R = ((n1-n2)/(n1+n2))^2
   */
  fresnelNormal(n1, n2) {
    const ratio = (n1 - n2) / (n1 + n2);
    return ratio * ratio;
  },

  /**
   * Snell's law: n1*sin(theta1) = n2*sin(theta2)
   * Returns refracted angle in radians, or null for total internal reflection
   */
  snellRefract(theta1, n1, n2) {
    const sinTheta2 = (n1 / n2) * Math.sin(theta1);
    if (Math.abs(sinTheta2) > 1) return null;
    return Math.asin(sinTheta2);
  },

  /**
   * Light source spectral power distributions (SPDs).
   * Each is an array of [wavelength_nm, relative_power] sampled at 10nm intervals.
   * Relative power is normalized so max ≈ 1.
   *
   * Sources:
   *   Sun (D65) — CIE standard daylight illuminant, ~5500K correlated color temp
   *   Candle    — Planckian ~1850K, strong red/IR bias
   *   Incandescent (tungsten bulb) — Planckian ~2856K (CIE illuminant A)
   *   Cool LED  — Blue-pump phosphor LED, ~6500K with blue spike + phosphor hump
   *   Warm LED  — ~3000K phosphor LED
   */
  lightSources: {
    sun: {
      name: 'Sunlight (D65)',
      colorTemp: 5500,
      cssColor: '#fff5e6',
      spd: [
        [380,0.50],[390,0.55],[400,0.83],[410,0.91],[420,0.93],[430,0.86],[440,0.96],
        [450,1.00],[460,0.96],[470,0.94],[480,0.97],[490,0.93],[500,0.94],[510,0.94],
        [520,0.96],[530,0.96],[540,0.95],[550,0.96],[560,0.95],[570,0.96],[580,0.93],
        [590,0.91],[600,0.90],[610,0.88],[620,0.87],[630,0.85],[640,0.83],[650,0.82],
        [660,0.80],[670,0.78],[680,0.76],[690,0.74],[700,0.72],[710,0.68],[720,0.65],
        [730,0.63],[740,0.62],[750,0.55],[760,0.44],[770,0.47],[780,0.40]
      ]
    },
    candle: {
      name: 'Candle (~1850K)',
      colorTemp: 1850,
      cssColor: '#ff8c28',
      spd: [
        [380,0.01],[390,0.01],[400,0.02],[410,0.03],[420,0.04],[430,0.05],[440,0.07],
        [450,0.08],[460,0.10],[470,0.13],[480,0.15],[490,0.18],[500,0.21],[510,0.25],
        [520,0.29],[530,0.33],[540,0.37],[550,0.42],[560,0.47],[570,0.52],[580,0.57],
        [590,0.62],[600,0.67],[610,0.72],[620,0.77],[630,0.81],[640,0.85],[650,0.88],
        [660,0.91],[670,0.93],[680,0.95],[690,0.97],[700,0.98],[710,0.99],[720,1.00],
        [730,1.00],[740,1.00],[750,0.99],[760,0.99],[770,0.98],[780,0.97]
      ]
    },
    bulb: {
      name: 'Incandescent (2856K)',
      colorTemp: 2856,
      cssColor: '#ffc878',
      spd: [
        [380,0.06],[390,0.07],[400,0.09],[410,0.11],[420,0.14],[430,0.16],[440,0.19],
        [450,0.22],[460,0.26],[470,0.29],[480,0.33],[490,0.37],[500,0.41],[510,0.45],
        [520,0.49],[530,0.53],[540,0.57],[550,0.61],[560,0.65],[570,0.69],[580,0.73],
        [590,0.76],[600,0.79],[610,0.82],[620,0.85],[630,0.87],[640,0.90],[650,0.92],
        [660,0.93],[670,0.95],[680,0.96],[690,0.97],[700,0.98],[710,0.99],[720,0.99],
        [730,1.00],[740,1.00],[750,1.00],[760,1.00],[770,0.99],[780,0.99]
      ]
    },
    cool_led: {
      name: 'Cool LED (6500K)',
      colorTemp: 6500,
      cssColor: '#e8eeff',
      spd: [
        [380,0.05],[390,0.10],[400,0.20],[410,0.35],[420,0.55],[430,0.75],[440,0.92],
        [450,1.00],[460,0.95],[470,0.60],[480,0.35],[490,0.28],[500,0.30],[510,0.35],
        [520,0.42],[530,0.52],[540,0.62],[550,0.72],[560,0.78],[570,0.80],[580,0.78],
        [590,0.74],[600,0.68],[610,0.62],[620,0.55],[630,0.48],[640,0.42],[650,0.36],
        [660,0.30],[670,0.25],[680,0.20],[690,0.16],[700,0.12],[710,0.09],[720,0.07],
        [730,0.05],[740,0.04],[750,0.03],[760,0.02],[770,0.01],[780,0.01]
      ]
    },
    warm_led: {
      name: 'Warm LED (3000K)',
      colorTemp: 3000,
      cssColor: '#ffe0b0',
      spd: [
        [380,0.02],[390,0.04],[400,0.08],[410,0.15],[420,0.30],[430,0.50],[440,0.70],
        [450,0.82],[460,0.72],[470,0.45],[480,0.32],[490,0.30],[500,0.32],[510,0.38],
        [520,0.46],[530,0.56],[540,0.66],[550,0.76],[560,0.84],[570,0.90],[580,0.94],
        [590,0.97],[600,1.00],[610,0.99],[620,0.96],[630,0.91],[640,0.85],[650,0.78],
        [660,0.70],[670,0.62],[680,0.54],[690,0.46],[700,0.39],[710,0.32],[720,0.26],
        [730,0.21],[740,0.17],[750,0.13],[760,0.10],[770,0.08],[780,0.06]
      ]
    }
  },

  /**
   * Sample a wavelength from a light source SPD using inverse CDF sampling.
   * Returns a wavelength in nm distributed according to the source's spectral power.
   */
  sampleWavelength(sourceId) {
    const src = this.lightSources[sourceId];
    if (!src) return 380 + Math.random() * 400;
    const spd = src.spd;

    if (!src._cdf) {
      let total = 0;
      const cumulative = [];
      for (let i = 0; i < spd.length; i++) {
        total += spd[i][1];
        cumulative.push(total);
      }
      src._cdf = cumulative.map(v => v / total);
    }

    const r = Math.random();
    const cdf = src._cdf;
    let idx = 0;
    for (let i = 0; i < cdf.length; i++) {
      if (cdf[i] >= r) { idx = i; break; }
      idx = i;
    }

    const wlBase = spd[idx][0];
    const step = idx < spd.length - 1 ? spd[idx + 1][0] - spd[idx][0] : 10;
    return wlBase + Math.random() * step;
  }
};
