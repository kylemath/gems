/**
 * Gemstone Explorer — Master Data File
 *
 * Sources:
 *   Crystallography  — Crystallography Open Database (COD), AMCSD
 *   Spectroscopy     — Caltech Mineral Spectroscopy Server (G. Rossman)
 *                      http://minerals.gps.caltech.edu/
 *   Gemological data — Gemological Institute of America (GIA)
 *   Element radii    — Shannon (1976) effective ionic radii / CPK colors
 */

/* ───────── Element rendering properties ───────── */

window.ELEMENTS = {
  Si: { color: "#f0c040", radius: 1.17, name: "Silicon" },
  O:  { color: "#ff3030", radius: 0.73, name: "Oxygen" },
  Be: { color: "#c2ff00", radius: 0.45, name: "Beryllium" },
  Al: { color: "#bfa6a6", radius: 0.53, name: "Aluminum" },
  Fe: { color: "#e06633", radius: 0.78, name: "Iron" },
  Mg: { color: "#8aff00", radius: 0.72, name: "Magnesium" },
  Mn: { color: "#9c7ac7", radius: 0.67, name: "Manganese" },
  Zr: { color: "#94e0e0", radius: 0.72, name: "Zirconium" },
  K:  { color: "#8f40d4", radius: 1.38, name: "Potassium" },
  Na: { color: "#ab5cf2", radius: 1.02, name: "Sodium" },
  Ca: { color: "#3dff00", radius: 1.00, name: "Calcium" },
  S:  { color: "#ffff30", radius: 1.04, name: "Sulfur" },
  Cr: { color: "#8a99c7", radius: 0.62, name: "Chromium" },
  U:  { color: "#00ab77", radius: 0.89, name: "Uranium" },
  Pb: { color: "#575961", radius: 1.19, name: "Lead" },
  C:  { color: "#505050", radius: 0.77, name: "Carbon" },
  Cl: { color: "#1ff01f", radius: 0.99, name: "Chlorine" },
  V:  { color: "#a6a6ab", radius: 0.64, name: "Vanadium" },
  Ni: { color: "#50d050", radius: 0.69, name: "Nickel" },
  Ti: { color: "#bfc2c7", radius: 0.60, name: "Titanium" }
};

/* ───────── Gemstone database ───────── */

window.GEMSTONES = {

  /* ================================================================
     1. QUARTZ — SiO₂
     COD 9005017, α-quartz
     ================================================================ */
  quartz: {
    id: "quartz",
    name: "Quartz",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate",
    crystalSystem: "Trigonal",
    spaceGroup: "P3₂21",
    color: "#c8c8d0",
    images: {
      rawArticle: "Quartz",
      polishedSearch: "faceted clear quartz gemstone",
      rawCaption: "Natural quartz crystal cluster",
      polishedCaption: "Faceted clear quartz"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.544, 1.553],
      birefringence: 0.009,
      dispersion: 0.013,
      hardness: 7,
      sg: 2.65,
      opticalChar: "Uniaxial (+)",
      luster: "Vitreous",
      bandGap: 8.9,
      resistivity: "10¹⁶–10¹⁸ Ω·cm",
      piezoelectric: true,
      pyroelectric: false,
      dielectric: "ε₁₁=4.42, ε₃₃=4.63"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 6.5,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 11.8,
      densityCGS: 2.65,
      massAttenXray: 0.37,
      massAttenGamma: 0.064,
      thzAbsorption: 12,
      colorCenterYield: 0.15,
      radioluminescence: { emission: 470, yield: 0.005 },
      radiationHardness: 8,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }],
    },

    chromophore: { ion: "None", mechanism: "Pure SiO₂ — no d-electron transitions" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Colorless rock crystal quartz",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [350,0.04],[355,0.04],[360,0.04],[365,0.03],[370,0.03],[375,0.03],[380,0.03],
        [385,0.03],[390,0.03],[395,0.03],[400,0.02],[405,0.02],[410,0.02],[415,0.02],
        [420,0.02],[425,0.02],[430,0.02],[435,0.02],[440,0.02],[445,0.02],[450,0.02],
        [455,0.02],[460,0.02],[465,0.02],[470,0.02],[475,0.02],[480,0.02],[485,0.02],
        [490,0.02],[495,0.02],[500,0.02],[505,0.02],[510,0.02],[515,0.02],[520,0.02],
        [525,0.02],[530,0.02],[535,0.02],[540,0.02],[545,0.02],[550,0.02],[555,0.02],
        [560,0.02],[565,0.02],[570,0.02],[575,0.02],[580,0.02],[585,0.02],[590,0.02],
        [595,0.02],[600,0.02],[605,0.02],[610,0.02],[615,0.02],[620,0.02],[625,0.02],
        [630,0.02],[635,0.02],[640,0.02],[645,0.02],[650,0.02],[655,0.02],[660,0.02],
        [665,0.02],[670,0.02],[675,0.02],[680,0.02],[685,0.02],[690,0.02],[695,0.02],
        [700,0.02],[710,0.02],[720,0.02],[730,0.02],[740,0.02],[750,0.02],[760,0.02],
        [770,0.02],[780,0.02],[790,0.02],[800,0.02]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.4, width: 1.5, relIntensity: 1.0, assignment: 'Q4 — framework Si, 4 bridging O' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 30, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 15, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 12, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 15, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 464, width: 20, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 12, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 8, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 10, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 8, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 6, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 5, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "COD 9005017"]
  },

  /* ================================================================
     2. AMETHYST — SiO₂ + Fe⁴⁺ color center
     Same crystal structure as α-quartz; color from irradiated Fe³⁺
     Spectra: Caltech — Anahí Mine, Bolivia
     ================================================================ */
  amethyst: {
    id: "amethyst",
    name: "Amethyst",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate",
    crystalSystem: "Trigonal",
    spaceGroup: "P3₂21",
    color: "#9966cc",
    images: {
      rawArticle: "Amethyst",
      polishedSearch: "faceted amethyst gemstone",
      rawCaption: "Amethyst crystal cluster",
      polishedCaption: "Faceted amethyst"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.544, 1.553],
      birefringence: 0.009,
      dispersion: 0.013,
      hardness: 7,
      sg: 2.65,
      opticalChar: "Uniaxial (+)",
      luster: "Vitreous",
      bandGap: 8.9,
      resistivity: "10¹⁶–10¹⁸ Ω·cm",
      piezoelectric: true,
      pyroelectric: false,
      dielectric: "ε₁₁=4.42, ε₃₃=4.63"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 6.5,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 12.1,
      densityCGS: 2.65,
      massAttenXray: 0.39,
      massAttenGamma: 0.064,
      thzAbsorption: 14,
      colorCenterYield: 0.45,
      radioluminescence: { emission: 560, yield: 0.008 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe⁴⁺", mechanism: "Color center from irradiation of Fe³⁺; absorption at 545 nm and 357 nm" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Amethyst, Anahí Mine, Bolivia",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [348,0.711],[352,0.599],[355,0.541],[358,0.477],[360,0.434],[363,0.384],
        [366,0.351],[369,0.320],[373,0.291],[376,0.269],[379,0.255],[382,0.239],
        [386,0.226],[389,0.218],[391,0.218],[394,0.216],[397,0.213],[400,0.215],
        [404,0.206],[406,0.184],[408,0.174],[410,0.167],[414,0.158],[417,0.149],
        [422,0.142],[427,0.133],[433,0.127],[437,0.124],[442,0.118],[445,0.118],
        [447,0.121],[450,0.123],[453,0.121],[456,0.114],[461,0.107],[465,0.101],
        [473,0.087],[479,0.077],[485,0.071],[489,0.070],[491,0.069],[493,0.069],
        [495,0.069],[497,0.059],[499,0.051],[501,0.051],[506,0.046],[510,0.044],
        [516,0.040],[521,0.035],[527,0.030],[533,0.024],[539,0.019],[545,0.015],
        [553,0.013],[562,0.011],[568,0.011],[576,0.012],[585,0.015],[591,0.019],
        [598,0.022],[604,0.026],[609,0.032],[613,0.036],[618,0.042],[623,0.047],
        [627,0.052],[632,0.057],[635,0.057],[639,0.058],[644,0.057],[648,0.055],
        [655,0.053],[661,0.051],[668,0.050],[675,0.051],[680,0.053],[684,0.056],
        [688,0.059],[692,0.062],[698,0.069],[700,0.072],[704,0.079],[719,0.100],
        [731,0.124],[742,0.153],[756,0.191],[766,0.227],[779,0.276],[797,0.347],
        [811,0.404],[827,0.457],[840,0.492],[849,0.515],[858,0.531],[870,0.538],
        [882,0.541],[899,0.538],[920,0.539],[939,0.555],[957,0.591],[972,0.639],
        [986,0.685],[1002,0.719],[1010,0.768]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.4, width: 3.0, relIntensity: 1.0, assignment: 'Q4 — framework Si (Fe³⁺ broadened)' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 36, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 18, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 14.4, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 18, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 464, width: 24, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 14.4, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 9.6, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 12, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 9.6, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 7.2, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 6, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "COD 9005017"]
  },

  /* ================================================================
     3. CHALCEDONY — cryptocrystalline SiO₂
     Microcrystalline quartz aggregate
     ================================================================ */
  chalcedony: {
    id: "chalcedony",
    name: "Chalcedony",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate (cryptocrystalline)",
    crystalSystem: "Trigonal (microcrystalline)",
    spaceGroup: "P3₂21",
    color: "#b0c4de",
    images: {
      rawArticle: "Chalcedony",
      polishedSearch: "polished chalcedony cabochon",
      rawCaption: "Natural chalcedony specimen",
      polishedCaption: "Polished chalcedony cabochon"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.530, 1.543],
      birefringence: 0.004,
      dispersion: 0.013,
      hardness: 6.75,
      sg: 2.62,
      opticalChar: "Uniaxial (+), aggregate",
      luster: "Waxy to vitreous",
      bandGap: 8.9,
      resistivity: "10¹⁶–10¹⁸ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "~4.5 (aggregate)"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 3.0,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 11.8,
      densityCGS: 2.62,
      massAttenXray: 0.37,
      massAttenGamma: 0.064,
      thzAbsorption: 18,
      colorCenterYield: 0.12,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 8,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }],
    },

    chromophore: { ion: "Variable", mechanism: "Trace Fe, Ni, or other impurities; depends on variety" },
    fluorescence: { response: "Variable, usually inert", emission: null, color: null },

    spectra: {
      label: "Blue chalcedony, near-colorless variety",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [350,0.08],[355,0.08],[360,0.07],[365,0.07],[370,0.07],[375,0.06],[380,0.06],
        [385,0.06],[390,0.06],[395,0.05],[400,0.05],[405,0.05],[410,0.05],[415,0.05],
        [420,0.05],[425,0.04],[430,0.04],[435,0.04],[440,0.04],[445,0.04],[450,0.04],
        [455,0.04],[460,0.04],[465,0.04],[470,0.04],[475,0.04],[480,0.03],[485,0.03],
        [490,0.03],[495,0.03],[500,0.03],[505,0.03],[510,0.03],[515,0.03],[520,0.03],
        [525,0.03],[530,0.03],[535,0.03],[540,0.03],[545,0.03],[550,0.03],[555,0.03],
        [560,0.03],[565,0.03],[570,0.03],[575,0.03],[580,0.03],[585,0.03],[590,0.03],
        [595,0.03],[600,0.03],[605,0.03],[610,0.03],[615,0.03],[620,0.03],[625,0.03],
        [630,0.03],[635,0.03],[640,0.03],[645,0.03],[650,0.03],[655,0.03],[660,0.03],
        [665,0.03],[670,0.03],[675,0.03],[680,0.03],[685,0.03],[690,0.03],[695,0.03],
        [700,0.03],[710,0.03],[720,0.03],[730,0.03],[740,0.03],[750,0.03],[760,0.03],
        [770,0.03],[780,0.03],[790,0.03],[800,0.03]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.1, width: 4.0, relIntensity: 1.0, assignment: 'Q4 — microcrystalline framework' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 45, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 22.5, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 18, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 22.5, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 464, width: 30, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 18, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 12, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 15, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 12, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 9, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 7.5, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "COD 9005017"]
  },

  /* ================================================================
     4. AGATE — banded chalcedony SiO₂
     Fe/Mn oxide banding produces color
     ================================================================ */
  agate: {
    id: "agate",
    name: "Agate",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate (cryptocrystalline)",
    crystalSystem: "Trigonal (microcrystalline)",
    spaceGroup: "P3₂21",
    color: "#cd853f",
    images: {
      rawArticle: "Agate",
      polishedSearch: "polished agate slice",
      rawCaption: "Banded agate specimen",
      polishedCaption: "Polished agate slice"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.530, 1.543],
      birefringence: 0.004,
      dispersion: 0.013,
      hardness: 6.75,
      sg: 2.62,
      opticalChar: "Uniaxial (+), aggregate",
      luster: "Waxy to vitreous",
      bandGap: 8.9,
      resistivity: "10¹⁶–10¹⁸ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "~4.5 (aggregate)"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 3.0,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 12.0,
      densityCGS: 2.62,
      massAttenXray: 0.38,
      massAttenGamma: 0.064,
      thzAbsorption: 20,
      colorCenterYield: 0.18,
      radioluminescence: { emission: 530, yield: 0.003 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe³⁺, Mn²⁺", mechanism: "Fe₂O₃ and MnO₂ particulate inclusions in rhythmic bands" },
    fluorescence: { response: "Variable, usually inert", emission: null, color: null },

    spectra: {
      label: "Brown banded agate — Fe oxide coloration",
      source: "Synthetic curve based on Fe³⁺ oxide absorption literature",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [350,0.52],[355,0.50],[360,0.48],[365,0.46],[370,0.44],[375,0.42],[380,0.41],
        [385,0.39],[390,0.38],[395,0.37],[400,0.36],[405,0.35],[410,0.34],[415,0.33],
        [420,0.32],[425,0.31],[430,0.30],[435,0.30],[440,0.29],[445,0.28],[450,0.28],
        [455,0.27],[460,0.27],[465,0.26],[470,0.26],[475,0.25],[480,0.25],[485,0.24],
        [490,0.24],[495,0.23],[500,0.23],[505,0.22],[510,0.22],[515,0.21],[520,0.21],
        [525,0.20],[530,0.20],[535,0.19],[540,0.19],[545,0.18],[550,0.18],[555,0.17],
        [560,0.17],[565,0.16],[570,0.16],[575,0.15],[580,0.15],[585,0.14],[590,0.14],
        [595,0.13],[600,0.13],[605,0.12],[610,0.12],[615,0.12],[620,0.11],[625,0.11],
        [630,0.11],[635,0.10],[640,0.10],[645,0.10],[650,0.10],[655,0.09],[660,0.09],
        [665,0.09],[670,0.09],[675,0.09],[680,0.09],[685,0.09],[690,0.08],[695,0.08],
        [700,0.08],[710,0.08],[720,0.08],[730,0.08],[740,0.07],[750,0.07],[760,0.07],
        [770,0.07],[780,0.07],[790,0.07],[800,0.07]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.1, width: 4.5, relIntensity: 1.0, assignment: 'Q4 — banded microcrystalline' },
            { shift: -101.5, width: 3.0, relIntensity: 0.05, assignment: 'Q3 — surface/defect silanols' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 45, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 22.5, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 18, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 22.5, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 464, width: 30, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 18, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 12, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 15, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 12, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 9, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 7.5, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "COD 9005017"]
  },

  /* ================================================================
     5. CARNELIAN — SiO₂ + Fe₂O₃ submicroscopic inclusions
     Spectra: Caltech Mineral Spectroscopy
     ================================================================ */
  carnelian: {
    id: "carnelian",
    name: "Carnelian",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate (cryptocrystalline)",
    crystalSystem: "Trigonal (microcrystalline)",
    spaceGroup: "P3₂21",
    color: "#b5651d",
    images: {
      rawArticle: "Carnelian",
      polishedSearch: "polished carnelian gemstone",
      rawCaption: "Raw carnelian specimen",
      polishedCaption: "Polished carnelian"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.530, 1.543],
      birefringence: 0.004,
      dispersion: 0.013,
      hardness: 6.75,
      sg: 2.62,
      opticalChar: "Uniaxial (+), aggregate",
      luster: "Waxy to vitreous",
      bandGap: 8.9,
      resistivity: "10¹⁶–10¹⁸ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "~4.5 (aggregate)"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 3.0,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 13.2,
      densityCGS: 2.62,
      massAttenXray: 0.45,
      massAttenGamma: 0.064,
      thzAbsorption: 22,
      colorCenterYield: 0.10,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe³⁺", mechanism: "Submicroscopic Fe₂O₃ (hematite) inclusions; broad absorption below ~550 nm" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Carnelian — Fe₂O₃ coloration",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [349,2.12],[355,1.90],[361,1.92],[367,1.87],[374,1.94],[379,1.87],[386,1.91],
        [393,1.91],[397,1.90],[400,1.87],[404,1.88],[407,1.87],[410,1.86],[414,1.88],
        [418,1.88],[422,1.88],[426,1.86],[430,1.87],[433,1.86],[436,1.86],[440,1.86],
        [444,1.85],[448,1.85],[452,1.85],[455,1.84],[459,1.84],[463,1.83],[467,1.83],
        [471,1.82],[476,1.81],[480,1.81],[485,1.80],[490,1.80],[495,1.79],[500,1.79],
        [506,1.78],[511,1.77],[515,1.77],[520,1.76],[525,1.76],[530,1.76],[536,1.75],
        [541,1.75],[546,1.75],[551,1.75],[555,1.74],[560,1.74],[565,1.73],[570,1.71],
        [576,1.70],[581,1.68],[586,1.66],[591,1.64],[596,1.62],[601,1.60],[605,1.59],
        [609,1.58],[614,1.57],[619,1.56],[624,1.55],[630,1.53],[635,1.52],[640,1.50],
        [645,1.49],[651,1.48],[656,1.47],[662,1.45],[668,1.44],[674,1.43],[680,1.42],
        [686,1.40],[692,1.39],[698,1.38],[704,1.37],[711,1.36],[719,1.35],[726,1.33],
        [732,1.33],[739,1.31],[746,1.30],[753,1.29],[761,1.28],[769,1.27],[776,1.26],
        [784,1.25],[792,1.23],[800,1.22]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.0, width: 5.0, relIntensity: 1.0, assignment: 'Q4 — Fe-broadened microcrystalline' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 48, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 24, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 19.2, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 24, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 540, width: 30, relIntensity: 0.10, assignment: 'Fe-O vibration' },
          { freq: 464, width: 32, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 19.2, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 12.8, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 16, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 12.8, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 9.6, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 8, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "COD 9005017"]
  },

  /* ================================================================
     6. JASPER — SiO₂ + up to 20% impurities (mainly Fe₂O₃)
     Opaque microcrystalline quartz with hematite inclusions
     ================================================================ */
  jasper: {
    id: "jasper",
    name: "Jasper",
    formula: "SiO₂ + Fe₂O₃",
    formulaPlain: "SiO2 + Fe2O3",
    category: "Tectosilicate (cryptocrystalline)",
    crystalSystem: "Trigonal (microcrystalline)",
    spaceGroup: "P3₂21",
    color: "#bf2233",
    images: {
      rawArticle: "Jasper",
      polishedSearch: "polished red jasper cabochon",
      rawCaption: "Red jasper outcrop",
      polishedCaption: "Polished red jasper cabochon"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.530, 1.543],
      birefringence: 0.004,
      dispersion: 0.013,
      hardness: 6.75,
      sg: 2.62,
      opticalChar: "Uniaxial (+), aggregate",
      luster: "Waxy",
      bandGap: 8.9,
      resistivity: "10¹²–10¹⁶ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "~4.5 (aggregate)"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 3.0,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 14.5,
      densityCGS: 2.62,
      massAttenXray: 0.55,
      massAttenGamma: 0.065,
      thzAbsorption: 35,
      colorCenterYield: 0.05,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 6,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe³⁺", mechanism: "Particulate Fe₂O₃ (hematite) inclusions; strong broad absorption below ~600 nm transmitting red" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Red jasper — hematite inclusion coloration (reflectance-derived)",
      source: "Synthetic curve based on hematite/jasper reflectance literature",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [350,3.10],[355,3.05],[360,3.00],[365,2.96],[370,2.92],[375,2.88],[380,2.85],
        [385,2.82],[390,2.80],[395,2.77],[400,2.75],[405,2.73],[410,2.71],[415,2.69],
        [420,2.68],[425,2.66],[430,2.65],[435,2.64],[440,2.63],[445,2.62],[450,2.61],
        [455,2.60],[460,2.59],[465,2.58],[470,2.57],[475,2.55],[480,2.53],[485,2.51],
        [490,2.48],[495,2.45],[500,2.42],[505,2.38],[510,2.34],[515,2.30],[520,2.25],
        [525,2.20],[530,2.14],[535,2.08],[540,2.01],[545,1.94],[550,1.87],[555,1.80],
        [560,1.72],[565,1.65],[570,1.58],[575,1.51],[580,1.44],[585,1.38],[590,1.32],
        [595,1.27],[600,1.22],[605,1.18],[610,1.14],[615,1.11],[620,1.08],[625,1.06],
        [630,1.04],[635,1.02],[640,1.01],[645,1.00],[650,0.99],[655,0.98],[660,0.97],
        [665,0.97],[670,0.96],[675,0.96],[680,0.95],[685,0.95],[690,0.95],[695,0.94],
        [700,0.94],[710,0.94],[720,0.93],[730,0.93],[740,0.93],[750,0.92],[760,0.92],
        [770,0.92],[780,0.92],        [790,0.91],[800,0.91]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.0, width: 8.0, relIntensity: 1.0, assignment: 'Q4 — heavy Fe paramagnetic broadening' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 60, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 30, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 24, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 30, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 540, width: 40, relIntensity: 0.20, assignment: 'Fe-O vibration' },
          { freq: 470, width: 25, relIntensity: 0.15, assignment: 'Fe₂O₃ mode' },
          { freq: 464, width: 40, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 24, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 16, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 20, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 16, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 12, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 10, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "COD 9005017"]
  },

  /* ================================================================
     7. ONYX — banded chalcedony, black variety
     Carbon and Fe-oxide inclusions; nearly opaque
     ================================================================ */
  onyx: {
    id: "onyx",
    name: "Onyx",
    formula: "SiO₂",
    formulaPlain: "SiO2",
    category: "Tectosilicate (cryptocrystalline)",
    crystalSystem: "Trigonal (microcrystalline)",
    spaceGroup: "P3₂21",
    color: "#353839",
    images: {
      rawArticle: "Onyx",
      polishedSearch: "polished black onyx gemstone",
      rawCaption: "Natural onyx specimen",
      polishedCaption: "Polished black onyx"
    },

    unitCell: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.4697, y: 0.0000, z: 0.0000 },
      { el: "Si", x: 0.0000, y: 0.4697, z: 0.3333 },
      { el: "Si", x: 0.5303, y: 0.5303, z: 0.6667 },
      { el: "O",  x: 0.4135, y: 0.2669, z: 0.1191 },
      { el: "O",  x: 0.7331, y: 0.1466, z: 0.4524 },
      { el: "O",  x: 0.8534, y: 0.5866, z: 0.7858 },
      { el: "O",  x: 0.2669, y: 0.4135, z: -0.1191 },
      { el: "O",  x: 0.1466, y: 0.7331, z: 0.2143 },
      { el: "O",  x: 0.5866, y: 0.8534, z: 0.5476 }
    ],

    properties: {
      ri: [1.530, 1.543],
      birefringence: 0.004,
      dispersion: 0.013,
      hardness: 6.75,
      sg: 2.62,
      opticalChar: "Uniaxial (+), aggregate",
      luster: "Waxy to vitreous",
      bandGap: 8.9,
      resistivity: "10¹²–10¹⁵ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "~4.5 (aggregate)"
    },

    thermal: {
      specificHeat: 740,
      thermalConductivity: 3.0,
      thermoOpticCoeff: -6.0e-6,
      linearExpansion: 13.3e-6,
      debyeTemp: 470,
    },

    radiation: {
      effectiveZ: 12.5,
      densityCGS: 2.62,
      massAttenXray: 0.40,
      massAttenGamma: 0.064,
      thzAbsorption: 30,
      colorCenterYield: 0.08,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }],
    },

    chromophore: { ion: "C, Fe³⁺", mechanism: "Carbon and iron oxide inclusions; broad absorption across entire visible spectrum" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Black onyx — nearly opaque, broad absorption",
      source: "Synthetic curve based on carbon+Fe-oxide opaque absorption",
      url: "http://minerals.gps.caltech.edu/files/visible/quartz/",
      data: [
        [350,2.80],[355,2.78],[360,2.76],[365,2.74],[370,2.72],[375,2.70],[380,2.68],
        [385,2.67],[390,2.65],[395,2.64],[400,2.62],[405,2.61],[410,2.60],[415,2.58],
        [420,2.57],[425,2.56],[430,2.55],[435,2.54],[440,2.53],[445,2.52],[450,2.51],
        [455,2.50],[460,2.49],[465,2.48],[470,2.47],[475,2.46],[480,2.46],[485,2.45],
        [490,2.44],[495,2.43],[500,2.43],[505,2.42],[510,2.41],[515,2.41],[520,2.40],
        [525,2.39],[530,2.39],[535,2.38],[540,2.38],[545,2.37],[550,2.37],[555,2.36],
        [560,2.36],[565,2.35],[570,2.35],[575,2.34],[580,2.34],[585,2.33],[590,2.33],
        [595,2.32],[600,2.32],[605,2.31],[610,2.31],[615,2.30],[620,2.30],[625,2.29],
        [630,2.29],[635,2.28],[640,2.28],[645,2.27],[650,2.27],[655,2.26],[660,2.26],
        [665,2.25],[670,2.25],[675,2.24],[680,2.24],[685,2.23],[690,2.23],[695,2.22],
        [700,2.22],[710,2.21],[720,2.20],[730,2.19],[740,2.18],[750,2.17],[760,2.16],
        [770,2.15],[780,2.14],        [790,2.13],[800,2.12]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -107.2, width: 4.0, relIntensity: 1.0, assignment: 'Q4 — banded chalcedony' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1084, width: 45, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 797, width: 22.5, relIntensity: 0.55, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 780, width: 18, relIntensity: 0.50, assignment: 'Si-O sym stretch' },
          { freq: 694, width: 22.5, relIntensity: 0.25, assignment: 'Si-O-Si bend' },
          { freq: 464, width: 30, relIntensity: 0.70, assignment: 'Si-O-Si bend (ν₄)' },
          { freq: 394, width: 18, relIntensity: 0.15, assignment: 'Si-O rock' }
        ]
      },
      raman: {
        peaks: [
          { freq: 464, width: 12, relIntensity: 1.0, assignment: 'A₁ symmetric stretch' },
          { freq: 354, width: 15, relIntensity: 0.12, assignment: 'Si-O-Si bend' },
          { freq: 265, width: 12, relIntensity: 0.08, assignment: 'Lattice mode' },
          { freq: 206, width: 9, relIntensity: 0.45, assignment: 'Lattice vibration' },
          { freq: 128, width: 7.5, relIntensity: 0.55, assignment: 'Lattice vibration' }
        ]
      }
    },

    sources: ["GIA", "COD 9005017"]
  },

  /* ================================================================
     8. EMERALD — Be₃Al₂Si₆O₁₈ + Cr³⁺ (beryl group)
     AMCSD beryl structure; Cr³⁺ crystal-field absorption
     ================================================================ */
  emerald: {
    id: "emerald",
    name: "Emerald",
    formula: "Be₃Al₂(Si₆O₁₈) + Cr³⁺",
    formulaPlain: "Be3Al2Si6O18",
    category: "Cyclosilicate (Beryl group)",
    crystalSystem: "Hexagonal",
    spaceGroup: "P6/mcc",
    color: "#50c878",
    images: {
      rawArticle: "Emerald",
      polishedSearch: "faceted emerald gemstone cut",
      rawCaption: "Emerald crystal in matrix, Muzo Mine",
      polishedCaption: "Faceted emerald"
    },

    unitCell: { a: 9.215, b: 9.215, c: 9.192, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.3883, y: 0.1159, z: 0.0000 },
      { el: "Si", x: 0.8841, y: 0.2724, z: 0.0000 },
      { el: "Si", x: 0.7276, y: 0.6117, z: 0.0000 },
      { el: "Si", x: 0.6117, y: 0.8841, z: 0.5000 },
      { el: "Si", x: 0.1159, y: 0.7276, z: 0.5000 },
      { el: "Si", x: 0.2724, y: 0.3883, z: 0.5000 },
      { el: "Be", x: 0.5000, y: 0.0000, z: 0.2500 },
      { el: "Be", x: 0.0000, y: 0.5000, z: 0.2500 },
      { el: "Be", x: 0.5000, y: 0.5000, z: 0.2500 },
      { el: "Al", x: 0.6667, y: 0.3333, z: 0.2500 },
      { el: "Al", x: 0.3333, y: 0.6667, z: 0.2500 },
      { el: "O",  x: 0.3099, y: 0.2360, z: 0.0000 },
      { el: "O",  x: 0.7640, y: 0.0739, z: 0.0000 },
      { el: "O",  x: 0.9261, y: 0.6901, z: 0.0000 },
      { el: "O",  x: 0.4989, y: 0.1459, z: 0.1449 },
      { el: "O",  x: 0.8541, y: 0.3530, z: 0.1449 },
      { el: "O",  x: 0.6470, y: 0.5011, z: 0.1449 },
      { el: "O",  x: 0.5011, y: 0.8541, z: 0.3551 },
      { el: "O",  x: 0.1459, y: 0.6470, z: 0.3551 },
      { el: "O",  x: 0.3530, y: 0.4989, z: 0.3551 }
    ],

    properties: {
      ri: [1.565, 1.602],
      birefringence: 0.007,
      dispersion: 0.014,
      hardness: 7.75,
      sg: 2.71,
      opticalChar: "Uniaxial (−)",
      luster: "Vitreous",
      bandGap: 7.5,
      resistivity: "10¹⁴–10¹⁶ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε₁₁≈6.0, ε₃₃≈6.3"
    },

    thermal: {
      specificHeat: 1050,
      thermalConductivity: 3.5,
      thermoOpticCoeff: -5.0e-6,
      linearExpansion: 3.4e-6,
      debyeTemp: 820,
    },

    radiation: {
      effectiveZ: 10.4,
      densityCGS: 2.71,
      massAttenXray: 0.32,
      massAttenGamma: 0.060,
      thzAbsorption: 25,
      colorCenterYield: 0.20,
      radioluminescence: { emission: 683, yield: 0.05 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 5.41, element: 'Cr', label: 'Cr Kα' }],
    },

    chromophore: { ion: "Cr³⁺, V³⁺", mechanism: "Crystal field d-d transitions in octahedral Al site; ⁴A₂→⁴T₂ (~600 nm) and ⁴A₂→⁴T₁ (~430 nm)" },
    fluorescence: { response: "Red", emission: "R₁=683 nm, R₂=680 nm, broad ~715 nm", color: "Red (Cr³⁺ ²E→⁴A₂)" },

    spectra: {
      label: "Emerald — Cr³⁺ absorption, Colombian type",
      source: "Representative data based on Cr³⁺ crystal-field absorption in beryl",
      url: "http://minerals.gps.caltech.edu/files/visible/beryl/",
      data: [
        [350,1.20],[355,1.14],[360,1.08],[365,1.01],[370,0.95],[375,0.90],[380,0.85],
        [385,0.80],[390,0.75],[395,0.70],[400,0.65],[405,0.60],[410,0.55],[415,0.50],
        [420,0.45],[425,0.41],[430,0.38],[435,0.35],[440,0.32],[445,0.30],[450,0.28],
        [455,0.26],[460,0.25],[465,0.23],[470,0.22],[475,0.20],[480,0.19],[485,0.18],
        [490,0.17],[495,0.16],[500,0.15],[505,0.14],[510,0.14],[515,0.13],[520,0.13],
        [525,0.12],[530,0.12],[535,0.11],[540,0.11],[545,0.10],[550,0.10],[555,0.10],
        [560,0.10],[565,0.10],[570,0.11],[575,0.12],[580,0.13],[585,0.14],[590,0.16],
        [594,0.18],[598,0.20],[600,0.22],[603,0.25],[606,0.28],[608,0.30],[610,0.33],
        [613,0.36],[615,0.38],[618,0.41],[620,0.44],[623,0.47],[625,0.50],[628,0.53],
        [630,0.56],[633,0.59],[635,0.61],[637,0.63],[640,0.66],[643,0.68],[646,0.71],
        [648,0.72],[650,0.74],[653,0.76],[655,0.77],[658,0.79],[660,0.80],[663,0.82],
        [665,0.83],[668,0.84],[670,0.85],[673,0.86],[675,0.87],[678,0.88],[680,0.89],
        [683,0.91],[686,0.90],[690,0.88],[695,0.85],[700,0.82],[705,0.78],[710,0.75],
        [715,0.71],[720,0.68],[725,0.65],[730,0.62],[735,0.59],[740,0.57],[745,0.55],
        [750,0.53],[755,0.51],[760,0.50],[765,0.49],        [770,0.48],[775,0.47],[780,0.46]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -102.1, width: 2.0, relIntensity: 1.0, assignment: 'Q4 — ring silicate Si₆O₁₈' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 8.5, width: 6.0, relIntensity: 1.0, assignment: 'Al(VI) — octahedral Al' }
          ]
        },
        'Be9': {
          spin: '3/2',
          naturalAbundance: 100,
          frequency: 56.2,
          peaks: [
            { shift: 2.5, width: 3.0, relIntensity: 1.0, assignment: 'Be(IV) — tetrahedral Be' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1020, width: 35, relIntensity: 1.0, assignment: 'Si-O stretch (ring)' },
          { freq: 964, width: 25, relIntensity: 0.65, assignment: 'Si-O stretch' },
          { freq: 810, width: 20, relIntensity: 0.40, assignment: 'Si-O-Si bend' },
          { freq: 745, width: 18, relIntensity: 0.35, assignment: 'Be-O stretch' },
          { freq: 680, width: 15, relIntensity: 0.25, assignment: 'Al-O stretch' },
          { freq: 525, width: 20, relIntensity: 0.50, assignment: 'Si-O-Si ring bend' },
          { freq: 420, width: 15, relIntensity: 0.30, assignment: 'Ring deformation' }
        ]
      },
      raman: {
        peaks: [
          { freq: 1070, width: 12, relIntensity: 0.70, assignment: 'Si-O stretch' },
          { freq: 686, width: 10, relIntensity: 1.0, assignment: 'Ring breathing mode' },
          { freq: 592, width: 8, relIntensity: 0.20, assignment: 'Be-O stretch' },
          { freq: 396, width: 8, relIntensity: 0.55, assignment: 'Ring deformation' },
          { freq: 324, width: 6, relIntensity: 0.15, assignment: 'Lattice mode' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD beryl"]
  },

  /* ================================================================
     9. AQUAMARINE — Be₃Al₂Si₆O₁₈ + Fe²⁺ (beryl group)
     Same beryl structure; Fe²⁺→Fe³⁺ IVCT coloration
     Spectra: Caltech GRR 1488, Lajes Pintada, Brazil
     ================================================================ */
  aquamarine: {
    id: "aquamarine",
    name: "Aquamarine",
    formula: "Be₃Al₂(Si₆O₁₈) + Fe²⁺",
    formulaPlain: "Be3Al2Si6O18",
    category: "Cyclosilicate (Beryl group)",
    crystalSystem: "Hexagonal",
    spaceGroup: "P6/mcc",
    color: "#7fffd4",
    images: {
      rawArticle: "Aquamarine_(gemstone)",
      polishedSearch: "faceted aquamarine gemstone",
      rawCaption: "Aquamarine crystal specimen",
      polishedCaption: "Faceted aquamarine"
    },

    unitCell: { a: 9.215, b: 9.215, c: 9.192, alpha: 90, beta: 90, gamma: 120 },

    atoms: [
      { el: "Si", x: 0.3883, y: 0.1159, z: 0.0000 },
      { el: "Si", x: 0.8841, y: 0.2724, z: 0.0000 },
      { el: "Si", x: 0.7276, y: 0.6117, z: 0.0000 },
      { el: "Si", x: 0.6117, y: 0.8841, z: 0.5000 },
      { el: "Si", x: 0.1159, y: 0.7276, z: 0.5000 },
      { el: "Si", x: 0.2724, y: 0.3883, z: 0.5000 },
      { el: "Be", x: 0.5000, y: 0.0000, z: 0.2500 },
      { el: "Be", x: 0.0000, y: 0.5000, z: 0.2500 },
      { el: "Be", x: 0.5000, y: 0.5000, z: 0.2500 },
      { el: "Al", x: 0.6667, y: 0.3333, z: 0.2500 },
      { el: "Al", x: 0.3333, y: 0.6667, z: 0.2500 },
      { el: "O",  x: 0.3099, y: 0.2360, z: 0.0000 },
      { el: "O",  x: 0.7640, y: 0.0739, z: 0.0000 },
      { el: "O",  x: 0.9261, y: 0.6901, z: 0.0000 },
      { el: "O",  x: 0.4989, y: 0.1459, z: 0.1449 },
      { el: "O",  x: 0.8541, y: 0.3530, z: 0.1449 },
      { el: "O",  x: 0.6470, y: 0.5011, z: 0.1449 },
      { el: "O",  x: 0.5011, y: 0.8541, z: 0.3551 },
      { el: "O",  x: 0.1459, y: 0.6470, z: 0.3551 },
      { el: "O",  x: 0.3530, y: 0.4989, z: 0.3551 }
    ],

    properties: {
      ri: [1.577, 1.583],
      birefringence: 0.006,
      dispersion: 0.014,
      hardness: 7.75,
      sg: 2.72,
      opticalChar: "Uniaxial (−)",
      luster: "Vitreous",
      bandGap: 7.5,
      resistivity: "10¹⁴–10¹⁶ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε₁₁≈6.0, ε₃₃≈6.3"
    },

    thermal: {
      specificHeat: 1050,
      thermalConductivity: 3.5,
      thermoOpticCoeff: -5.0e-6,
      linearExpansion: 3.4e-6,
      debyeTemp: 820,
    },

    radiation: {
      effectiveZ: 10.6,
      densityCGS: 2.72,
      massAttenXray: 0.33,
      massAttenGamma: 0.060,
      thzAbsorption: 22,
      colorCenterYield: 0.18,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe²⁺", mechanism: "Fe²⁺→Fe³⁺ intervalence charge transfer; broad absorption band ~810 nm" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Aquamarine GRR 1488, Lajes Pintada, Brazil",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/beryl/",
      data: [
        [350,0.71],[355,0.69],[360,0.66],[365,0.62],[370,0.58],[375,0.54],[380,0.49],
        [385,0.46],[390,0.42],[395,0.39],[400,0.36],[405,0.34],[410,0.31],[415,0.29],
        [420,0.27],[425,0.25],[430,0.24],[435,0.22],[440,0.21],[445,0.20],[450,0.19],
        [455,0.18],[460,0.17],[465,0.16],[470,0.15],[475,0.14],[480,0.13],[485,0.13],
        [490,0.12],[495,0.11],[500,0.11],[505,0.10],[510,0.10],[515,0.10],[520,0.09],
        [525,0.09],[530,0.09],[535,0.08],[540,0.08],[545,0.08],[550,0.08],[555,0.07],
        [560,0.07],[565,0.07],[570,0.07],[575,0.07],[580,0.07],[585,0.07],[590,0.07],
        [595,0.07],[600,0.08],[605,0.08],[610,0.09],[615,0.09],[620,0.10],[625,0.11],
        [630,0.12],[635,0.13],[640,0.14],[645,0.15],[650,0.17],[655,0.18],[660,0.20],
        [665,0.22],[670,0.24],[675,0.26],[680,0.28],[685,0.30],[690,0.32],[695,0.35],
        [700,0.37],[705,0.39],[710,0.41],[715,0.44],[720,0.46],[725,0.48],[730,0.50],
        [735,0.52],[740,0.54],[745,0.56],[750,0.58],[755,0.60],[760,0.61],[765,0.63],
        [770,0.64],[775,0.66],[780,0.67],[785,0.69],[790,0.70],[795,0.71],[800,0.72],
        [805,0.73],[810,0.73],[815,0.74],[820,0.74],[825,0.74],[830,0.74],[835,0.74],
        [840,0.73]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -102.3, width: 1.8, relIntensity: 1.0, assignment: 'Q4 — ring silicate Si₆O₁₈' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 8.3, width: 5.5, relIntensity: 1.0, assignment: 'Al(VI) — octahedral Al' }
          ]
        },
        'Be9': {
          spin: '3/2',
          naturalAbundance: 100,
          frequency: 56.2,
          peaks: [
            { shift: 2.3, width: 2.5, relIntensity: 1.0, assignment: 'Be(IV) — tetrahedral Be' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1020, width: 35, relIntensity: 1.0, assignment: 'Si-O stretch (ring)' },
          { freq: 964, width: 25, relIntensity: 0.65, assignment: 'Si-O stretch' },
          { freq: 810, width: 20, relIntensity: 0.40, assignment: 'Si-O-Si bend' },
          { freq: 745, width: 18, relIntensity: 0.35, assignment: 'Be-O stretch' },
          { freq: 680, width: 15, relIntensity: 0.25, assignment: 'Al-O stretch' },
          { freq: 525, width: 20, relIntensity: 0.50, assignment: 'Si-O-Si ring bend' },
          { freq: 420, width: 15, relIntensity: 0.30, assignment: 'Ring deformation' }
        ]
      },
      raman: {
        peaks: [
          { freq: 1070, width: 12, relIntensity: 0.70, assignment: 'Si-O stretch' },
          { freq: 686, width: 10, relIntensity: 1.0, assignment: 'Ring breathing mode' },
          { freq: 592, width: 8, relIntensity: 0.20, assignment: 'Be-O stretch' },
          { freq: 396, width: 8, relIntensity: 0.55, assignment: 'Ring deformation' },
          { freq: 324, width: 6, relIntensity: 0.15, assignment: 'Lattice mode' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD beryl"]
  },

  /* ================================================================
     10. GARNET — ALMANDINE  Fe₃Al₂(SiO₄)₃
     Cubic garnet, Ia3̄d, a=11.526 Å
     AMCSD almandine structure
     ================================================================ */
  almandine: {
    id: "almandine",
    name: "Almandine Garnet",
    formula: "Fe₃Al₂(SiO₄)₃",
    formulaPlain: "Fe3Al2(SiO4)3",
    category: "Nesosilicate (Garnet group)",
    crystalSystem: "Cubic",
    spaceGroup: "Ia3̄d",
    color: "#733635",
    images: {
      rawArticle: "Almandine",
      polishedSearch: "faceted almandine garnet gemstone",
      rawCaption: "Almandine garnet crystal in schist",
      polishedCaption: "Faceted almandine garnet"
    },

    unitCell: { a: 11.526, b: 11.526, c: 11.526, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Fe", x: 0.1250, y: 0.0000, z: 0.2500 },
      { el: "Fe", x: 0.8750, y: 0.0000, z: 0.7500 },
      { el: "Fe", x: 0.0000, y: 0.2500, z: 0.1250 },
      { el: "Fe", x: 0.0000, y: 0.7500, z: 0.8750 },
      { el: "Fe", x: 0.2500, y: 0.1250, z: 0.0000 },
      { el: "Fe", x: 0.7500, y: 0.8750, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.5000, y: 0.5000, z: 0.5000 },
      { el: "Al", x: 0.5000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.5000, z: 0.0000 },
      { el: "Si", x: 0.3750, y: 0.0000, z: 0.2500 },
      { el: "Si", x: 0.6250, y: 0.0000, z: 0.7500 },
      { el: "Si", x: 0.0000, y: 0.2500, z: 0.3750 },
      { el: "Si", x: 0.0000, y: 0.7500, z: 0.6250 },
      { el: "O",  x: 0.0327, y: 0.0505, z: 0.6533 },
      { el: "O",  x: 0.9673, y: 0.9495, z: 0.3467 },
      { el: "O",  x: 0.6533, y: 0.0327, z: 0.0505 },
      { el: "O",  x: 0.3467, y: 0.9673, z: 0.9495 },
      { el: "O",  x: 0.0505, y: 0.6533, z: 0.0327 },
      { el: "O",  x: 0.9495, y: 0.3467, z: 0.9673 },
      { el: "O",  x: 0.5327, y: 0.5505, z: 0.8467 },
      { el: "O",  x: 0.4673, y: 0.4495, z: 0.1533 },
      { el: "O",  x: 0.1533, y: 0.5327, z: 0.5505 },
      { el: "O",  x: 0.8467, y: 0.4673, z: 0.4495 }
    ],

    properties: {
      ri: [1.770, 1.830],
      birefringence: 0,
      dispersion: 0.024,
      hardness: 7.25,
      sg: 4.32,
      opticalChar: "Isotropic",
      luster: "Vitreous to resinous",
      bandGap: 3.5,
      resistivity: "10⁸–10¹² Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈11.3"
    },

    thermal: {
      specificHeat: 700,
      thermalConductivity: 5.5,
      thermoOpticCoeff: 10.0e-6,
      linearExpansion: 7.5e-6,
      debyeTemp: 750,
    },

    radiation: {
      effectiveZ: 16.8,
      densityCGS: 4.32,
      massAttenXray: 0.85,
      massAttenGamma: 0.062,
      thzAbsorption: 40,
      colorCenterYield: 0.08,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 8,
      xrfLines: [{ energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe²⁺", mechanism: "Fe²⁺ in 8-fold dodecahedral coordination; absorption bands at 505, 520, 576 nm" },
    fluorescence: { response: "Inert", emission: null, color: "Fe²⁺ quenches luminescence" },

    spectra: {
      label: "Almandine garnet — Fe²⁺ absorption",
      source: "Based on Caltech almandine/spessartine data and literature",
      url: "http://minerals.gps.caltech.edu/files/visible/garnet/",
      data: [
        [350,2.50],[355,2.42],[360,2.35],[365,2.27],[370,2.20],[375,2.10],[380,2.00],
        [385,1.92],[390,1.80],[395,1.65],[400,1.50],[405,1.40],[410,1.30],[415,1.25],
        [420,1.20],[425,1.15],[430,1.10],[435,1.05],[440,1.00],[445,0.96],[450,0.92],
        [455,0.89],[460,0.85],[465,0.82],[470,0.80],[475,0.78],[480,0.76],[485,0.75],
        [490,0.77],[495,0.82],[500,0.90],[505,1.02],[510,1.10],[515,1.15],[520,1.18],
        [525,1.15],[530,1.08],[535,0.98],[540,0.88],[545,0.80],[550,0.73],[555,0.68],
        [560,0.65],[565,0.64],[570,0.66],[575,0.72],[580,0.80],[585,0.70],[590,0.62],
        [595,0.57],[600,0.52],[605,0.48],[610,0.45],[615,0.42],[620,0.40],[625,0.38],
        [630,0.36],[635,0.35],[640,0.33],[645,0.32],[650,0.31],[655,0.30],[660,0.30],
        [665,0.29],[670,0.29],[675,0.28],[680,0.28],[685,0.28],[690,0.28],[695,0.28],
        [700,0.28],[705,0.28],[710,0.29],[715,0.29],[720,0.29],[725,0.30],[730,0.30],
        [735,0.31],[740,0.31],[745,0.32],[750,0.33],[755,0.33],[760,0.34],[765,0.35],
        [770,0.36],[775,0.37],[780,0.38],[785,0.39],[790,0.40],[795,0.42],[800,0.44],
        [805,0.46],[810,0.48],        [815,0.50],[820,0.52]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -72.1, width: 4.0, relIntensity: 1.0, assignment: 'Q0 — isolated nesosilicate SiO₄' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 0.2, width: 8.0, relIntensity: 1.0, assignment: 'Al(VI) — octahedral Al' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1030, width: 35, relIntensity: 0.65, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 930, width: 30, relIntensity: 1.0, assignment: 'Si-O stretch' },
          { freq: 870, width: 25, relIntensity: 0.80, assignment: 'Si-O stretch' },
          { freq: 640, width: 20, relIntensity: 0.45, assignment: 'Si-O bend (ν₄)' },
          { freq: 570, width: 18, relIntensity: 0.30, assignment: 'Al-O stretch' },
          { freq: 480, width: 20, relIntensity: 0.55, assignment: 'Si-O bend' },
          { freq: 350, width: 15, relIntensity: 0.20, assignment: 'Fe-O stretch' }
        ]
      },
      raman: {
        peaks: [
          { freq: 920, width: 12, relIntensity: 0.85, assignment: 'Si-O stretch (ν₁)' },
          { freq: 870, width: 10, relIntensity: 1.0, assignment: 'Si-O stretch (ν₃)' },
          { freq: 630, width: 10, relIntensity: 0.15, assignment: 'Si-O bend' },
          { freq: 560, width: 12, relIntensity: 0.30, assignment: 'Si-O bend (ν₂)' },
          { freq: 350, width: 10, relIntensity: 0.55, assignment: 'Rotation (R)' },
          { freq: 215, width: 8, relIntensity: 0.20, assignment: 'Translation (T)' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD almandine"]
  },

  /* ================================================================
     11. GARNET — PYROPE  Mg₃Al₂(SiO₄)₃
     Cubic garnet, Ia3̄d, a=11.459 Å
     Same structure type as almandine, Mg in X site
     ================================================================ */
  pyrope: {
    id: "pyrope",
    name: "Pyrope Garnet",
    formula: "Mg₃Al₂(SiO₄)₃",
    formulaPlain: "Mg3Al2(SiO4)3",
    category: "Nesosilicate (Garnet group)",
    crystalSystem: "Cubic",
    spaceGroup: "Ia3̄d",
    color: "#cc3333",
    images: {
      rawArticle: "Pyrope",
      polishedSearch: "faceted pyrope garnet",
      rawCaption: "Pyrope garnet crystal",
      polishedCaption: "Faceted pyrope garnet"
    },

    unitCell: { a: 11.459, b: 11.459, c: 11.459, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Mg", x: 0.1250, y: 0.0000, z: 0.2500 },
      { el: "Mg", x: 0.8750, y: 0.0000, z: 0.7500 },
      { el: "Mg", x: 0.0000, y: 0.2500, z: 0.1250 },
      { el: "Mg", x: 0.0000, y: 0.7500, z: 0.8750 },
      { el: "Mg", x: 0.2500, y: 0.1250, z: 0.0000 },
      { el: "Mg", x: 0.7500, y: 0.8750, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.5000, y: 0.5000, z: 0.5000 },
      { el: "Al", x: 0.5000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.5000, z: 0.0000 },
      { el: "Si", x: 0.3750, y: 0.0000, z: 0.2500 },
      { el: "Si", x: 0.6250, y: 0.0000, z: 0.7500 },
      { el: "Si", x: 0.0000, y: 0.2500, z: 0.3750 },
      { el: "Si", x: 0.0000, y: 0.7500, z: 0.6250 },
      { el: "O",  x: 0.0339, y: 0.0522, z: 0.6536 },
      { el: "O",  x: 0.9661, y: 0.9478, z: 0.3464 },
      { el: "O",  x: 0.6536, y: 0.0339, z: 0.0522 },
      { el: "O",  x: 0.3464, y: 0.9661, z: 0.9478 },
      { el: "O",  x: 0.0522, y: 0.6536, z: 0.0339 },
      { el: "O",  x: 0.9478, y: 0.3464, z: 0.9661 },
      { el: "O",  x: 0.5339, y: 0.5522, z: 0.8464 },
      { el: "O",  x: 0.4661, y: 0.4478, z: 0.1536 },
      { el: "O",  x: 0.1536, y: 0.5339, z: 0.5522 },
      { el: "O",  x: 0.8464, y: 0.4661, z: 0.4478 }
    ],

    properties: {
      ri: [1.720, 1.770],
      birefringence: 0,
      dispersion: 0.022,
      hardness: 7.25,
      sg: 3.58,
      opticalChar: "Isotropic",
      luster: "Vitreous",
      bandGap: 5.5,
      resistivity: "10¹⁰–10¹⁴ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈10.1"
    },

    thermal: {
      specificHeat: 725,
      thermalConductivity: 7.0,
      thermoOpticCoeff: 9.0e-6,
      linearExpansion: 6.5e-6,
      debyeTemp: 830,
    },

    radiation: {
      effectiveZ: 12.5,
      densityCGS: 3.58,
      massAttenXray: 0.42,
      massAttenGamma: 0.062,
      thzAbsorption: 35,
      colorCenterYield: 0.10,
      radioluminescence: { emission: 688, yield: 0.01 },
      radiationHardness: 8,
      xrfLines: [{ energy: 1.25, element: 'Mg', label: 'Mg Kα' }, { energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }],
    },

    chromophore: { ion: "Cr³⁺, Fe²⁺", mechanism: "Cr³⁺ in octahedral site gives red; minor Fe²⁺ contributes; ⁴A₂→⁴T₂ (~570 nm), ⁴A₂→⁴T₁ (~405 nm)" },
    fluorescence: { response: "Weak red", emission: "~688 nm (Cr³⁺ ²E→⁴A₂)", color: "Red" },

    spectra: {
      label: "Pyrope garnet — Cr³⁺ + Fe²⁺ absorption",
      source: "Synthetic curve based on pyrope absorption literature (Geiger 2013)",
      url: "http://minerals.gps.caltech.edu/files/visible/garnet/",
      data: [
        [350,1.85],[355,1.78],[360,1.72],[365,1.65],[370,1.58],[375,1.52],[380,1.46],
        [385,1.41],[390,1.36],[395,1.32],[400,1.29],[405,1.28],[410,1.26],[415,1.22],
        [420,1.16],[425,1.10],[430,1.04],[435,0.98],[440,0.92],[445,0.87],[450,0.82],
        [455,0.78],[460,0.74],[465,0.71],[470,0.68],[475,0.66],[480,0.64],[485,0.63],
        [490,0.63],[495,0.65],[500,0.68],[505,0.73],[510,0.78],[515,0.82],[520,0.84],
        [525,0.83],[530,0.80],[535,0.75],[540,0.70],[545,0.66],[550,0.62],[555,0.59],
        [560,0.57],[565,0.56],[570,0.58],[575,0.62],[580,0.68],[585,0.62],[590,0.55],
        [595,0.48],[600,0.43],[605,0.39],[610,0.36],[615,0.34],[620,0.32],[625,0.30],
        [630,0.29],[635,0.28],[640,0.27],[645,0.27],[650,0.26],[655,0.26],[660,0.26],
        [665,0.26],[670,0.26],[675,0.27],[680,0.27],[685,0.28],[690,0.29],[695,0.30],
        [700,0.31],[710,0.33],[720,0.36],[730,0.39],[740,0.43],[750,0.47],[760,0.51],
        [770,0.55],[780,0.59],        [790,0.62],[800,0.65]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -72.3, width: 2.5, relIntensity: 1.0, assignment: 'Q0 — isolated nesosilicate SiO₄' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 0.5, width: 7.0, relIntensity: 1.0, assignment: 'Al(VI) — octahedral Al' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1060, width: 30, relIntensity: 0.55, assignment: 'Si-O asym stretch' },
          { freq: 940, width: 30, relIntensity: 1.0, assignment: 'Si-O stretch (ν₃)' },
          { freq: 875, width: 25, relIntensity: 0.75, assignment: 'Si-O stretch' },
          { freq: 640, width: 18, relIntensity: 0.40, assignment: 'Si-O bend (ν₄)' },
          { freq: 565, width: 18, relIntensity: 0.35, assignment: 'Al-O stretch' },
          { freq: 482, width: 20, relIntensity: 0.50, assignment: 'Si-O bend' },
          { freq: 368, width: 15, relIntensity: 0.15, assignment: 'Mg-O stretch' }
        ]
      },
      raman: {
        peaks: [
          { freq: 925, width: 10, relIntensity: 0.90, assignment: 'Si-O stretch (ν₁)' },
          { freq: 863, width: 10, relIntensity: 1.0, assignment: 'Si-O stretch (ν₃)' },
          { freq: 560, width: 10, relIntensity: 0.25, assignment: 'Si-O bend (ν₂)' },
          { freq: 364, width: 10, relIntensity: 0.60, assignment: 'Rotation (R)' },
          { freq: 210, width: 8, relIntensity: 0.15, assignment: 'Translation (T)' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD pyrope"]
  },

  /* ================================================================
     12. GARNET — SPESSARTINE  Mn₃Al₂(SiO₄)₃
     Cubic garnet, Ia3̄d, a=11.621 Å
     ================================================================ */
  spessartine: {
    id: "spessartine",
    name: "Spessartine Garnet",
    formula: "Mn₃Al₂(SiO₄)₃",
    formulaPlain: "Mn3Al2(SiO4)3",
    category: "Nesosilicate (Garnet group)",
    crystalSystem: "Cubic",
    spaceGroup: "Ia3̄d",
    color: "#ff7f00",
    images: {
      rawArticle: "Spessartine",
      polishedSearch: "faceted spessartine garnet orange",
      rawCaption: "Spessartine garnet crystals",
      polishedCaption: "Faceted spessartine garnet"
    },

    unitCell: { a: 11.621, b: 11.621, c: 11.621, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Mn", x: 0.1250, y: 0.0000, z: 0.2500 },
      { el: "Mn", x: 0.8750, y: 0.0000, z: 0.7500 },
      { el: "Mn", x: 0.0000, y: 0.2500, z: 0.1250 },
      { el: "Mn", x: 0.0000, y: 0.7500, z: 0.8750 },
      { el: "Mn", x: 0.2500, y: 0.1250, z: 0.0000 },
      { el: "Mn", x: 0.7500, y: 0.8750, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.5000, y: 0.5000, z: 0.5000 },
      { el: "Al", x: 0.5000, y: 0.0000, z: 0.0000 },
      { el: "Al", x: 0.0000, y: 0.5000, z: 0.0000 },
      { el: "Si", x: 0.3750, y: 0.0000, z: 0.2500 },
      { el: "Si", x: 0.6250, y: 0.0000, z: 0.7500 },
      { el: "Si", x: 0.0000, y: 0.2500, z: 0.3750 },
      { el: "Si", x: 0.0000, y: 0.7500, z: 0.6250 },
      { el: "O",  x: 0.0330, y: 0.0510, z: 0.6540 },
      { el: "O",  x: 0.9670, y: 0.9490, z: 0.3460 },
      { el: "O",  x: 0.6540, y: 0.0330, z: 0.0510 },
      { el: "O",  x: 0.3460, y: 0.9670, z: 0.9490 },
      { el: "O",  x: 0.0510, y: 0.6540, z: 0.0330 },
      { el: "O",  x: 0.9490, y: 0.3460, z: 0.9670 },
      { el: "O",  x: 0.5330, y: 0.5510, z: 0.8460 },
      { el: "O",  x: 0.4670, y: 0.4490, z: 0.1540 },
      { el: "O",  x: 0.1540, y: 0.5330, z: 0.5510 },
      { el: "O",  x: 0.8460, y: 0.4670, z: 0.4490 }
    ],

    properties: {
      ri: [1.790, 1.814],
      birefringence: 0,
      dispersion: 0.027,
      hardness: 7.25,
      sg: 4.19,
      opticalChar: "Isotropic",
      luster: "Vitreous to resinous",
      bandGap: 3.8,
      resistivity: "10⁸–10¹² Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈11.0"
    },

    thermal: {
      specificHeat: 710,
      thermalConductivity: 4.5,
      thermoOpticCoeff: 10.5e-6,
      linearExpansion: 8.0e-6,
      debyeTemp: 700,
    },

    radiation: {
      effectiveZ: 16.0,
      densityCGS: 4.19,
      massAttenXray: 0.78,
      massAttenGamma: 0.062,
      thzAbsorption: 38,
      colorCenterYield: 0.12,
      radioluminescence: { emission: 590, yield: 0.015 },
      radiationHardness: 7,
      xrfLines: [{ energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 5.89, element: 'Mn', label: 'Mn Kα' }],
    },

    chromophore: { ion: "Mn²⁺", mechanism: "Mn²⁺ d-d spin-forbidden transitions in 8-fold site; sharp bands at 410, 422, 432, 460, 482 nm" },
    fluorescence: { response: "Weak orange", emission: "~590 nm broad", color: "Orange (Mn²⁺ ⁴T₁→⁶A₁)" },

    spectra: {
      label: "Spessartine garnet — Mn²⁺ absorption (GRR 43 type)",
      source: "Synthetic curve based on Caltech GRR 43 spessartine Mn²⁺ data",
      url: "http://minerals.gps.caltech.edu/files/visible/garnet/",
      data: [
        [350,1.60],[355,1.52],[360,1.44],[365,1.37],[370,1.30],[375,1.24],[380,1.18],
        [385,1.12],[390,1.07],[395,1.04],[400,1.02],[403,1.05],[406,1.12],[409,1.22],
        [410,1.28],[412,1.35],[415,1.30],[418,1.38],[420,1.45],[422,1.52],[424,1.48],
        [426,1.42],[428,1.36],[430,1.38],[432,1.46],[434,1.42],[436,1.35],[438,1.28],
        [440,1.20],[445,1.08],[450,0.96],[455,0.88],[458,0.86],[460,0.92],[462,0.98],
        [465,0.90],[470,0.82],[475,0.78],[478,0.80],[480,0.86],[482,0.92],[484,0.88],
        [486,0.82],[490,0.74],[495,0.66],[500,0.59],[505,0.53],[510,0.48],[515,0.44],
        [520,0.40],[525,0.37],[530,0.34],[535,0.32],[540,0.30],[545,0.28],[550,0.27],
        [555,0.26],[560,0.25],[565,0.24],[570,0.23],[575,0.23],[580,0.22],[585,0.22],
        [590,0.21],[595,0.21],[600,0.20],[610,0.19],[620,0.19],[630,0.18],[640,0.18],
        [650,0.17],[660,0.17],[670,0.17],[680,0.16],[690,0.16],[700,0.16],[720,0.16],
        [740,0.17],[760,0.18],        [780,0.19],[800,0.21]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -71.8, width: 5.0, relIntensity: 1.0, assignment: 'Q0 — Mn-broadened nesosilicate' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 0.3, width: 9.0, relIntensity: 1.0, assignment: 'Al(VI) — Mn-broadened octahedral' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1035, width: 35, relIntensity: 0.60, assignment: 'Si-O asym stretch' },
          { freq: 930, width: 30, relIntensity: 1.0, assignment: 'Si-O stretch (ν₃)' },
          { freq: 870, width: 28, relIntensity: 0.78, assignment: 'Si-O stretch' },
          { freq: 630, width: 20, relIntensity: 0.42, assignment: 'Si-O bend (ν₄)' },
          { freq: 560, width: 18, relIntensity: 0.32, assignment: 'Al-O stretch' },
          { freq: 475, width: 22, relIntensity: 0.52, assignment: 'Si-O bend' },
          { freq: 340, width: 15, relIntensity: 0.18, assignment: 'Mn-O stretch' }
        ]
      },
      raman: {
        peaks: [
          { freq: 910, width: 12, relIntensity: 0.88, assignment: 'Si-O stretch (ν₁)' },
          { freq: 860, width: 11, relIntensity: 1.0, assignment: 'Si-O stretch (ν₃)' },
          { freq: 550, width: 11, relIntensity: 0.28, assignment: 'Si-O bend (ν₂)' },
          { freq: 348, width: 10, relIntensity: 0.58, assignment: 'Rotation (R)' },
          { freq: 205, width: 8, relIntensity: 0.18, assignment: 'Translation (T)' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD spessartine"]
  },

  /* ================================================================
     13. PERIDOT / OLIVINE — (Mg,Fe)₂SiO₄
     Orthorhombic, Pbnm (forsterite end-member)
     Spectra: Caltech GRR 418, San Carlos, AZ — alpha polarization
     (visible range filtered from full NIR-Vis spectrum)
     ================================================================ */
  peridot: {
    id: "peridot",
    name: "Peridot (Olivine)",
    formula: "(Mg,Fe)₂SiO₄",
    formulaPlain: "(Mg,Fe)2SiO4",
    category: "Nesosilicate (Olivine group)",
    crystalSystem: "Orthorhombic",
    spaceGroup: "Pbnm",
    color: "#b4c424",
    images: {
      rawArticle: "Olivine",
      polishedSearch: "faceted peridot gemstone",
      rawCaption: "Olivine crystal specimen",
      polishedCaption: "Faceted peridot"
    },

    unitCell: { a: 4.756, b: 10.195, c: 5.981, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Mg", x: 0.0000, y: 0.0000, z: 0.0000 },
      { el: "Mg", x: 0.5000, y: 0.5000, z: 0.5000 },
      { el: "Mg", x: 0.9914, y: 0.2773, z: 0.2500 },
      { el: "Mg", x: 0.0086, y: 0.7227, z: 0.7500 },
      { el: "Mg", x: 0.5086, y: 0.2227, z: 0.7500 },
      { el: "Mg", x: 0.4914, y: 0.7773, z: 0.2500 },
      { el: "Si", x: 0.4263, y: 0.0940, z: 0.2500 },
      { el: "Si", x: 0.5737, y: 0.9060, z: 0.7500 },
      { el: "Si", x: 0.9263, y: 0.4060, z: 0.7500 },
      { el: "Si", x: 0.0737, y: 0.5940, z: 0.2500 },
      { el: "O",  x: 0.7657, y: 0.0916, z: 0.2500 },
      { el: "O",  x: 0.2343, y: 0.9084, z: 0.7500 },
      { el: "O",  x: 0.2215, y: 0.4475, z: 0.2500 },
      { el: "O",  x: 0.7785, y: 0.5525, z: 0.7500 },
      { el: "O",  x: 0.2776, y: 0.1628, z: 0.0332 },
      { el: "O",  x: 0.7224, y: 0.8372, z: 0.9668 },
      { el: "O",  x: 0.7224, y: 0.8372, z: 0.5332 },
      { el: "O",  x: 0.2776, y: 0.1628, z: 0.4668 },
      { el: "O",  x: 0.7776, y: 0.3372, z: 0.9668 },
      { el: "O",  x: 0.2224, y: 0.6628, z: 0.0332 }
    ],

    properties: {
      ri: [1.650, 1.690],
      birefringence: 0.038,
      dispersion: 0.020,
      hardness: 6.75,
      sg: 3.32,
      opticalChar: "Biaxial (+)",
      luster: "Vitreous to oily",
      bandGap: 7.8,
      resistivity: "10⁸–10¹² Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈7.4"
    },

    thermal: {
      specificHeat: 840,
      thermalConductivity: 4.5,
      thermoOpticCoeff: -10.0e-6,
      linearExpansion: 9.0e-6,
      debyeTemp: 750,
    },

    radiation: {
      effectiveZ: 13.8,
      densityCGS: 3.32,
      massAttenXray: 0.50,
      massAttenGamma: 0.063,
      thzAbsorption: 30,
      colorCenterYield: 0.15,
      radioluminescence: { emission: null, yield: 0 },
      radiationHardness: 6,
      xrfLines: [{ energy: 1.25, element: 'Mg', label: 'Mg Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 6.40, element: 'Fe', label: 'Fe Kα' }],
    },

    chromophore: { ion: "Fe²⁺", mechanism: "Fe²⁺ in M1 (centrosymmetric) and M2 (non-centrosymmetric) octahedral sites; bands at 453, 493, 529, 653 nm" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Forsterite GRR 418, San Carlos AZ — α polarization (visible range)",
      source: "Caltech Mineral Spectroscopy, G. Rossman",
      url: "http://minerals.gps.caltech.edu/files/visible/olivine/",
      data: [
        [348,0.711],[350,0.656],[352,0.599],[355,0.541],[358,0.477],[360,0.434],
        [363,0.384],[366,0.351],[369,0.320],[373,0.291],[376,0.269],[378,0.255],
        [383,0.239],[385,0.231],[387,0.226],[389,0.221],[390,0.218],[391,0.218],
        [394,0.218],[395,0.216],[396,0.213],[397,0.213],[399,0.215],[400,0.215],
        [402,0.215],[403,0.212],[404,0.206],[405,0.193],[406,0.184],[408,0.174],
        [410,0.167],[414,0.158],[417,0.149],[422,0.142],[427,0.133],[433,0.127],
        [436,0.124],[440,0.118],[442,0.117],[445,0.118],[447,0.120],[449,0.122],
        [453,0.121],[456,0.114],[461,0.107],[465,0.101],[473,0.087],[479,0.077],
        [485,0.071],[489,0.070],[491,0.069],[493,0.069],[495,0.069],[498,0.059],
        [501,0.051],[506,0.046],[510,0.044],[516,0.040],[521,0.035],[527,0.030],
        [533,0.024],[539,0.019],[546,0.015],[553,0.013],[562,0.011],[568,0.011],
        [576,0.012],[585,0.015],[591,0.019],[598,0.022],[604,0.026],[609,0.032],
        [613,0.036],[618,0.042],[623,0.047],[627,0.052],[631,0.055],[635,0.057],
        [640,0.058],[644,0.057],[648,0.055],[655,0.053],[661,0.051],[668,0.051],
        [675,0.051],[680,0.053],[684,0.056],[688,0.059],[692,0.062],[698,0.069],
        [705,0.079],[719,0.100],[731,0.124],[742,0.153],[756,0.191],[766,0.227],
        [779,0.276],[797,0.347],[811,0.404],[827,0.457],        [840,0.492],[849,0.515]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -61.9, width: 2.0, relIntensity: 0.7, assignment: 'Q0 — M1 site forsterite' },
            { shift: -63.5, width: 2.0, relIntensity: 0.3, assignment: 'Q0 — M2 site forsterite' }
          ]
        },
        'Mg25': {
          spin: '5/2',
          naturalAbundance: 10.0,
          frequency: 24.5,
          peaks: [
            { shift: 25.0, width: 15.0, relIntensity: 0.6, assignment: 'Mg(VI) — M1 octahedral' },
            { shift: 12.0, width: 12.0, relIntensity: 0.4, assignment: 'Mg(VI) — M2 octahedral' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 988, width: 25, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 950, width: 22, relIntensity: 0.85, assignment: 'Si-O stretch' },
          { freq: 885, width: 18, relIntensity: 0.60, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 840, width: 20, relIntensity: 0.55, assignment: 'Si-O stretch' },
          { freq: 610, width: 18, relIntensity: 0.35, assignment: 'Si-O bend (ν₄)' },
          { freq: 505, width: 15, relIntensity: 0.40, assignment: 'Si-O bend' },
          { freq: 420, width: 12, relIntensity: 0.20, assignment: 'Mg-O stretch' }
        ]
      },
      raman: {
        peaks: [
          { freq: 856, width: 10, relIntensity: 1.0, assignment: 'Si-O sym stretch (ν₁) — M1' },
          { freq: 824, width: 10, relIntensity: 0.85, assignment: 'Si-O sym stretch (ν₁) — M2' },
          { freq: 590, width: 10, relIntensity: 0.20, assignment: 'Si-O bend (ν₂)' },
          { freq: 545, width: 8, relIntensity: 0.12, assignment: 'Si-O bend' },
          { freq: 420, width: 8, relIntensity: 0.30, assignment: 'Mg-O stretch' },
          { freq: 305, width: 6, relIntensity: 0.15, assignment: 'Lattice mode' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD forsterite"]
  },

  /* ================================================================
     14. ZIRCON — ZrSiO₄
     Tetragonal, I4₁/amd, a=6.607 Å, c=5.982 Å
     Spectra: U⁴⁺ sharp-line spectrum
     ================================================================ */
  zircon: {
    id: "zircon",
    name: "Zircon",
    formula: "ZrSiO₄",
    formulaPlain: "ZrSiO4",
    category: "Nesosilicate",
    crystalSystem: "Tetragonal",
    spaceGroup: "I4₁/amd",
    color: "#87ceeb",
    images: {
      rawArticle: "Zircon",
      polishedSearch: "faceted blue zircon gemstone",
      rawCaption: "Zircon crystal specimen",
      polishedCaption: "Faceted blue zircon"
    },

    unitCell: { a: 6.607, b: 6.607, c: 5.982, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Zr", x: 0.0000, y: 0.7500, z: 0.1250 },
      { el: "Zr", x: 0.0000, y: 0.2500, z: 0.3750 },
      { el: "Zr", x: 0.5000, y: 0.7500, z: 0.6250 },
      { el: "Zr", x: 0.5000, y: 0.2500, z: 0.8750 },
      { el: "Si", x: 0.0000, y: 0.2500, z: 0.8750 },
      { el: "Si", x: 0.0000, y: 0.7500, z: 0.6250 },
      { el: "Si", x: 0.5000, y: 0.2500, z: 0.3750 },
      { el: "Si", x: 0.5000, y: 0.7500, z: 0.1250 },
      { el: "O",  x: 0.0000, y: 0.0660, z: 0.1950 },
      { el: "O",  x: 0.0000, y: 0.9340, z: 0.8050 },
      { el: "O",  x: 0.0000, y: 0.4340, z: 0.3050 },
      { el: "O",  x: 0.0000, y: 0.5660, z: 0.6950 },
      { el: "O",  x: 0.5000, y: 0.5660, z: 0.6950 },
      { el: "O",  x: 0.5000, y: 0.4340, z: 0.3050 },
      { el: "O",  x: 0.5000, y: 0.0660, z: 0.1950 },
      { el: "O",  x: 0.5000, y: 0.9340, z: 0.8050 }
    ],

    properties: {
      ri: [1.925, 2.015],
      birefringence: 0.052,
      dispersion: 0.039,
      hardness: 7.5,
      sg: 4.65,
      opticalChar: "Uniaxial (+)",
      luster: "Adamantine to vitreous",
      bandGap: 4.7,
      resistivity: "10¹²–10¹⁶ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε₁₁=10.4, ε₃₃=8.8"
    },

    thermal: {
      specificHeat: 610,
      thermalConductivity: 4.6,
      thermoOpticCoeff: -4.0e-6,
      linearExpansion: 4.4e-6,
      debyeTemp: 650,
    },

    radiation: {
      effectiveZ: 24.8,
      densityCGS: 4.65,
      massAttenXray: 2.20,
      massAttenGamma: 0.060,
      thzAbsorption: 28,
      colorCenterYield: 0.55,
      radioluminescence: { emission: 590, yield: 0.03 },
      radiationHardness: 3,
      xrfLines: [{ energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 15.77, element: 'Zr', label: 'Zr Kα' }, { energy: 2.04, element: 'Zr', label: 'Zr Lα' }],
    },

    chromophore: { ion: "U⁴⁺", mechanism: "U⁴⁺ 5f² transitions; diagnostic sharp line at 653.5 nm; radiation-damage color centers" },
    fluorescence: { response: "Yellow-orange", emission: "~580–620 nm broad", color: "Yellow-orange" },

    spectra: {
      label: "Green zircon — U⁴⁺ sharp-line spectrum",
      source: "Based on Caltech zircon spectra and Vance & Mackey (1978)",
      url: "http://minerals.gps.caltech.edu/files/visible/zircon/",
      data: [
        [350,0.58],[355,0.55],[360,0.52],[365,0.48],[370,0.45],[375,0.42],[380,0.39],
        [385,0.37],[390,0.34],[395,0.32],[400,0.30],[405,0.28],[410,0.26],[415,0.25],
        [420,0.24],[425,0.23],[430,0.22],[435,0.21],[440,0.20],[445,0.19],[450,0.19],
        [455,0.18],[460,0.17],[465,0.17],[470,0.16],[475,0.16],[480,0.15],[485,0.15],
        [490,0.15],[495,0.14],[500,0.14],[505,0.14],[510,0.13],[515,0.13],[520,0.13],
        [525,0.13],[530,0.12],[535,0.12],[540,0.12],[545,0.12],[550,0.12],[555,0.11],
        [560,0.11],[565,0.11],[570,0.11],[575,0.11],[580,0.11],[585,0.11],[590,0.11],
        [595,0.11],[600,0.12],[605,0.12],[610,0.13],[615,0.13],[620,0.14],[625,0.15],
        [630,0.16],[635,0.18],[640,0.20],[643,0.22],[646,0.24],[649,0.27],[651,0.30],
        [652,0.35],[653,0.42],[653.5,0.48],[654,0.42],[655,0.36],[656,0.30],[658,0.26],
        [660,0.23],[662,0.20],[665,0.18],[670,0.17],[675,0.16],[680,0.15],[685,0.15],
        [690,0.14],[695,0.14],[700,0.14],[710,0.14],[720,0.14],[730,0.14],[740,0.15],
        [750,0.15],[760,0.15],[770,0.16],[780,0.16],        [790,0.17],[800,0.17]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -81.7, width: 1.2, relIntensity: 1.0, assignment: 'Q0 — isolated SiO₄ in zircon' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1020, width: 30, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 885, width: 20, relIntensity: 0.50, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 610, width: 18, relIntensity: 0.35, assignment: 'Si-O bend (ν₄)' },
          { freq: 430, width: 15, relIntensity: 0.25, assignment: 'Si-O bend (ν₂)' },
          { freq: 350, width: 12, relIntensity: 0.15, assignment: 'Zr-O stretch' }
        ]
      },
      raman: {
        peaks: [
          { freq: 1008, width: 8, relIntensity: 1.0, assignment: 'Si-O asym stretch (ν₃)' },
          { freq: 974, width: 8, relIntensity: 0.45, assignment: 'Si-O sym stretch (ν₁)' },
          { freq: 440, width: 8, relIntensity: 0.35, assignment: 'Si-O bend (ν₂)' },
          { freq: 356, width: 7, relIntensity: 0.50, assignment: 'Zr-O stretch' },
          { freq: 225, width: 6, relIntensity: 0.25, assignment: 'Lattice mode' },
          { freq: 202, width: 5, relIntensity: 0.15, assignment: 'Lattice mode' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD zircon"]
  },

  /* ================================================================
     15. AMAZONITE — KAlSi₃O₈ + Pb (microcline feldspar)
     Triclinic, C1̄, a=8.564 Å, b=12.964 Å, c=7.222 Å
     ================================================================ */
  amazonite: {
    id: "amazonite",
    name: "Amazonite",
    formula: "KAlSi₃O₈",
    formulaPlain: "KAlSi3O8",
    category: "Tectosilicate (Feldspar group)",
    crystalSystem: "Triclinic",
    spaceGroup: "C1̄",
    color: "#00c4b0",
    images: {
      rawArticle: "Amazonite",
      polishedSearch: "polished amazonite cabochon",
      rawCaption: "Amazonite crystal specimen",
      polishedCaption: "Polished amazonite"
    },

    unitCell: { a: 8.564, b: 12.964, c: 7.222, alpha: 90.62, beta: 115.97, gamma: 87.68 },

    atoms: [
      { el: "K",  x: 0.2820, y: 0.0000, z: 0.1340 },
      { el: "K",  x: 0.7180, y: 0.5000, z: 0.8660 },
      { el: "Al", x: 0.0090, y: 0.1850, z: 0.2230 },
      { el: "Si", x: 0.0090, y: 0.8150, z: 0.2230 },
      { el: "Si", x: 0.7100, y: 0.1180, z: 0.3430 },
      { el: "Si", x: 0.7100, y: 0.8820, z: 0.3430 },
      { el: "Al", x: 0.0090, y: 0.3150, z: 0.2230 },
      { el: "Si", x: 0.7100, y: 0.3820, z: 0.3430 },
      { el: "O",  x: 0.0000, y: 0.1450, z: 0.0000 },
      { el: "O",  x: 0.6330, y: 0.0000, z: 0.2850 },
      { el: "O",  x: 0.8270, y: 0.1470, z: 0.2260 },
      { el: "O",  x: 0.0350, y: 0.3090, z: 0.2580 },
      { el: "O",  x: 0.1800, y: 0.1260, z: 0.4050 },
      { el: "O",  x: 0.5000, y: 0.1450, z: 0.5000 },
      { el: "O",  x: 0.1330, y: 0.5000, z: 0.7850 },
      { el: "O",  x: 0.3270, y: 0.3530, z: 0.7260 },
      { el: "O",  x: 0.5350, y: 0.1910, z: 0.7580 },
      { el: "O",  x: 0.6800, y: 0.3740, z: 0.9050 }
    ],

    properties: {
      ri: [1.522, 1.530],
      birefringence: 0.008,
      dispersion: 0.012,
      hardness: 6.25,
      sg: 2.56,
      opticalChar: "Biaxial (−)",
      luster: "Vitreous",
      bandGap: 7.0,
      resistivity: "10¹²–10¹⁶ Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈6.4"
    },

    thermal: {
      specificHeat: 730,
      thermalConductivity: 2.3,
      thermoOpticCoeff: -10.0e-6,
      linearExpansion: 5.0e-6,
      debyeTemp: 600,
    },

    radiation: {
      effectiveZ: 13.5,
      densityCGS: 2.56,
      massAttenXray: 0.48,
      massAttenGamma: 0.063,
      thzAbsorption: 18,
      colorCenterYield: 0.35,
      radioluminescence: { emission: 530, yield: 0.01 },
      radiationHardness: 6,
      xrfLines: [{ energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 3.31, element: 'K', label: 'K Kα' }, { energy: 10.55, element: 'Pb', label: 'Pb Lα' }],
    },

    chromophore: { ion: "Pb⁺, Pb³⁺", mechanism: "Pb⁺ and Pb³⁺ substituting for K⁺; broad absorption 690–775 nm transmitting blue-green" },
    fluorescence: { response: "Weak green-yellow", emission: "~500–570 nm broad", color: "Green-yellow" },

    spectra: {
      label: "Amazonite — Pb color-center absorption",
      source: "Synthetic curve based on Hofmeister & Rossman (1985) amazonite data",
      url: "http://minerals.gps.caltech.edu/files/visible/feldspar/",
      data: [
        [350,0.42],[355,0.40],[360,0.38],[365,0.36],[370,0.34],[375,0.32],[380,0.30],
        [385,0.28],[390,0.27],[395,0.25],[400,0.24],[405,0.23],[410,0.22],[415,0.21],
        [420,0.20],[425,0.19],[430,0.18],[435,0.17],[440,0.17],[445,0.16],[450,0.15],
        [455,0.15],[460,0.14],[465,0.14],[470,0.13],[475,0.13],[480,0.12],[485,0.12],
        [490,0.11],[495,0.11],[500,0.11],[505,0.10],[510,0.10],[515,0.10],[520,0.10],
        [525,0.09],[530,0.09],[535,0.09],[540,0.09],[545,0.09],[550,0.09],[555,0.09],
        [560,0.09],[565,0.09],[570,0.09],[575,0.10],[580,0.10],[585,0.10],[590,0.11],
        [595,0.11],[600,0.12],[605,0.12],[610,0.13],[615,0.14],[620,0.15],[625,0.16],
        [630,0.17],[635,0.19],[640,0.20],[645,0.22],[650,0.24],[655,0.26],[660,0.28],
        [665,0.31],[670,0.34],[675,0.37],[680,0.40],[685,0.44],[690,0.48],[695,0.52],
        [700,0.56],[705,0.60],[710,0.64],[715,0.67],[720,0.70],[725,0.73],[730,0.75],
        [735,0.77],[740,0.78],[745,0.79],[750,0.79],[755,0.78],[760,0.77],[765,0.75],
        [770,0.73],[775,0.70],[780,0.67],[785,0.64],[790,0.61],        [795,0.58],[800,0.55]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -94.2, width: 3.0, relIntensity: 0.5, assignment: 'Q4(1Al) — T1 site' },
            { shift: -100.5, width: 3.0, relIntensity: 0.5, assignment: 'Q4(0Al) — T2 site' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 58.5, width: 8.0, relIntensity: 1.0, assignment: 'Al(IV) — tetrahedral framework' }
          ]
        },
        'K39': {
          spin: '3/2',
          naturalAbundance: 93.3,
          frequency: 18.7,
          peaks: [
            { shift: -50.0, width: 20.0, relIntensity: 1.0, assignment: 'K⁺ — channel cation' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1050, width: 35, relIntensity: 1.0, assignment: 'Si-O asym stretch' },
          { freq: 1020, width: 30, relIntensity: 0.80, assignment: 'Si-O stretch' },
          { freq: 770, width: 20, relIntensity: 0.45, assignment: 'Al-O-Si stretch' },
          { freq: 720, width: 18, relIntensity: 0.35, assignment: 'Si-O-Si bend' },
          { freq: 650, width: 15, relIntensity: 0.30, assignment: 'Al-O stretch' },
          { freq: 540, width: 18, relIntensity: 0.40, assignment: 'Si-O-Al bend' },
          { freq: 460, width: 20, relIntensity: 0.50, assignment: 'Si-O-Si bend' }
        ]
      },
      raman: {
        peaks: [
          { freq: 513, width: 10, relIntensity: 1.0, assignment: 'O-Si-O bend' },
          { freq: 475, width: 10, relIntensity: 0.60, assignment: 'Si-O-Si stretch' },
          { freq: 285, width: 8, relIntensity: 0.40, assignment: 'Lattice mode' },
          { freq: 180, width: 6, relIntensity: 0.20, assignment: 'Lattice mode' }
        ]
      }
    },

    sources: ["GIA", "Caltech Mineral Spectroscopy", "AMCSD microcline"]
  },

  /* ================================================================
     16. LAZURITE — (Na,Ca)₈(AlSiO₄)₆(S,SO₄,Cl)₁₋₂
     Cubic sodalite framework, P4̄3n, a=9.08 Å
     S₃⁻ trisulfur radical chromophore
     ================================================================ */
  lazurite: {
    id: "lazurite",
    name: "Lazurite (Lapis Lazuli)",
    formula: "(Na,Ca)₈(AlSiO₄)₆(S,SO₄,Cl)₁₋₂",
    formulaPlain: "(Na,Ca)8(AlSiO4)6(S,SO4,Cl)",
    category: "Tectosilicate (Sodalite group)",
    crystalSystem: "Cubic",
    spaceGroup: "P4̄3n",
    color: "#2a52be",
    images: {
      rawArticle: "Lazurite",
      polishedSearch: "polished lapis lazuli",
      rawCaption: "Lazurite mineral specimen",
      polishedCaption: "Polished lapis lazuli"
    },

    unitCell: { a: 9.08, b: 9.08, c: 9.08, alpha: 90, beta: 90, gamma: 90 },

    atoms: [
      { el: "Na", x: 0.178, y: 0.178, z: 0.178 },
      { el: "Na", x: 0.822, y: 0.822, z: 0.178 },
      { el: "Na", x: 0.822, y: 0.178, z: 0.822 },
      { el: "Na", x: 0.178, y: 0.822, z: 0.822 },
      { el: "Na", x: 0.678, y: 0.678, z: 0.678 },
      { el: "Na", x: 0.322, y: 0.322, z: 0.678 },
      { el: "Na", x: 0.322, y: 0.678, z: 0.322 },
      { el: "Na", x: 0.678, y: 0.322, z: 0.322 },
      { el: "Si", x: 0.250, y: 0.500, z: 0.000 },
      { el: "Si", x: 0.000, y: 0.250, z: 0.500 },
      { el: "Si", x: 0.500, y: 0.000, z: 0.250 },
      { el: "Al", x: 0.250, y: 0.000, z: 0.500 },
      { el: "Al", x: 0.500, y: 0.250, z: 0.000 },
      { el: "Al", x: 0.000, y: 0.500, z: 0.250 },
      { el: "O",  x: 0.135, y: 0.150, z: 0.439 },
      { el: "O",  x: 0.865, y: 0.850, z: 0.561 },
      { el: "O",  x: 0.439, y: 0.135, z: 0.150 },
      { el: "O",  x: 0.561, y: 0.865, z: 0.850 },
      { el: "O",  x: 0.150, y: 0.439, z: 0.135 },
      { el: "O",  x: 0.850, y: 0.561, z: 0.865 },
      { el: "O",  x: 0.635, y: 0.650, z: 0.939 },
      { el: "O",  x: 0.365, y: 0.350, z: 0.061 },
      { el: "S",  x: 0.000, y: 0.000, z: 0.000 },
      { el: "S",  x: 0.500, y: 0.500, z: 0.500 }
    ],

    properties: {
      ri: [1.500, 1.500],
      birefringence: 0,
      dispersion: 0.018,
      hardness: 5.25,
      sg: 2.42,
      opticalChar: "Isotropic",
      luster: "Vitreous to greasy",
      bandGap: 5.0,
      resistivity: "10⁸–10¹² Ω·cm",
      piezoelectric: false,
      pyroelectric: false,
      dielectric: "ε≈5.5"
    },

    thermal: {
      specificHeat: 700,
      thermalConductivity: 1.5,
      thermoOpticCoeff: -5.0e-6,
      linearExpansion: 8.0e-6,
      debyeTemp: 500,
    },

    radiation: {
      effectiveZ: 13.0,
      densityCGS: 2.42,
      massAttenXray: 0.43,
      massAttenGamma: 0.063,
      thzAbsorption: 45,
      colorCenterYield: 0.25,
      radioluminescence: { emission: 480, yield: 0.008 },
      radiationHardness: 5,
      xrfLines: [{ energy: 1.04, element: 'Na', label: 'Na Kα' }, { energy: 1.49, element: 'Al', label: 'Al Kα' }, { energy: 1.74, element: 'Si', label: 'Si Kα' }, { energy: 2.31, element: 'S', label: 'S Kα' }],
    },

    chromophore: { ion: "S₃⁻", mechanism: "Trisulfur radical anion S₃⁻; strong broad HOMO→LUMO absorption centered ~600 nm" },
    fluorescence: { response: "Inert", emission: null, color: null },

    spectra: {
      label: "Lazurite — S₃⁻ chromophore absorption",
      source: "Synthetic curve based on Clark & Coath (2008) S₃⁻ radical absorption",
      url: "http://minerals.gps.caltech.edu/files/visible/sodalite/",
      data: [
        [350,0.35],[355,0.33],[360,0.31],[365,0.29],[370,0.27],[375,0.25],[380,0.24],
        [385,0.22],[390,0.21],[395,0.20],[400,0.19],[405,0.18],[410,0.17],[415,0.16],
        [420,0.16],[425,0.15],[430,0.15],[435,0.14],[440,0.14],[445,0.14],[450,0.13],
        [455,0.13],[460,0.13],[465,0.13],[470,0.14],[475,0.14],[480,0.15],[485,0.16],
        [490,0.17],[495,0.18],[500,0.20],[505,0.22],[510,0.25],[515,0.28],[520,0.32],
        [525,0.36],[530,0.41],[535,0.46],[540,0.52],[545,0.58],[550,0.65],[555,0.72],
        [560,0.79],[565,0.86],[570,0.93],[575,1.00],[580,1.06],[585,1.12],[590,1.17],
        [595,1.22],[600,1.26],[605,1.29],[610,1.31],[615,1.32],[620,1.32],[625,1.31],
        [630,1.29],[635,1.26],[640,1.22],[645,1.18],[650,1.13],[655,1.08],[660,1.02],
        [665,0.96],[670,0.90],[675,0.84],[680,0.78],[685,0.72],[690,0.66],[695,0.61],
        [700,0.56],[705,0.51],[710,0.47],[715,0.43],[720,0.39],[725,0.36],[730,0.33],
        [735,0.31],[740,0.28],[745,0.26],[750,0.24],[760,0.21],[770,0.19],[780,0.17],
        [790,0.15],[800,0.14]
      ]
    },

    nmr: {
      nuclei: {
        'Si29': {
          spin: '1/2',
          naturalAbundance: 4.7,
          frequency: 79.5,
          peaks: [
            { shift: -85.5, width: 4.0, relIntensity: 1.0, assignment: 'Q4(3Al) — sodalite framework' }
          ]
        },
        'Al27': {
          spin: '5/2',
          naturalAbundance: 100,
          frequency: 104.3,
          peaks: [
            { shift: 58.2, width: 7.0, relIntensity: 1.0, assignment: 'Al(IV) — tetrahedral framework' }
          ]
        },
        'Na23': {
          spin: '3/2',
          naturalAbundance: 100,
          frequency: 105.8,
          peaks: [
            { shift: 10.0, width: 15.0, relIntensity: 1.0, assignment: 'Na⁺ — cage cation' }
          ]
        }
      }
    },

    vibrational: {
      ir: {
        peaks: [
          { freq: 1000, width: 40, relIntensity: 1.0, assignment: 'Si/Al-O asym stretch' },
          { freq: 960, width: 30, relIntensity: 0.55, assignment: 'Si-O stretch' },
          { freq: 690, width: 20, relIntensity: 0.35, assignment: 'Si-O-Al bend' },
          { freq: 620, width: 18, relIntensity: 0.25, assignment: 'Al-O stretch' },
          { freq: 460, width: 22, relIntensity: 0.50, assignment: 'Si-O-Si bend' },
          { freq: 420, width: 15, relIntensity: 0.20, assignment: 'S₃⁻ mode' }
        ]
      },
      raman: {
        peaks: [
          { freq: 548, width: 10, relIntensity: 1.0, assignment: 'S₃⁻ symmetric stretch' },
          { freq: 584, width: 8, relIntensity: 0.15, assignment: 'S₃⁻ antisym stretch' },
          { freq: 260, width: 8, relIntensity: 0.35, assignment: 'S₃⁻ bend' },
          { freq: 1096, width: 15, relIntensity: 0.10, assignment: 'Si-O stretch' },
          { freq: 450, width: 10, relIntensity: 0.20, assignment: 'Framework bend' }
        ]
      }
    },

    sources: ["GIA", "Clark & Coath (2008)", "AMCSD lazurite"]
  }

};
