/**
 * ============================================================
 *  A-Frame Solar System — Custom Logic
 *  All sizes, distances, speeds, and textures are configured
 *  here. Swap textures in index.html <a-assets>, or replace
 *  sphere geometry with a glTF model without touching orbits.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  PLANET CONFIGURATION
//  Easy to tweak: sizes (radius), orbit distances, and speeds.
//  orbitSpeed  → degrees per second the orbit pivot rotates
//  selfSpeed   → degrees per second the planet spins on its axis
// ─────────────────────────────────────────────────────────────
window.SOLAR_CONFIG = {
  sun: {
    radius: 2.5,
    selfSpeed: 2,          // slow self-rotation
  },

  planets: [
    {
      id:         "mercury",
      radius:     0.25,
      distance:   5,        // from Sun centre
      orbitSpeed: 47.87,    // relative orbital speed (scaled down)
      selfSpeed:  0.017,
      tilt:       0.034,    // axial tilt in degrees
    },
    {
      id:         "venus",
      radius:     0.55,
      distance:   7.5,
      orbitSpeed: 35.02,
      selfSpeed:  -0.004,   // retrograde rotation
      tilt:       177.4,
    },
    {
      id:         "earth",
      radius:     0.6,
      distance:   10.5,
      orbitSpeed: 29.78,
      selfSpeed:  15,
      tilt:       23.4,
      moon: {
        radius:     0.16,
        distance:   1.4,
        orbitSpeed: 13.2,
        selfSpeed:  0.5,
      },
    },
    {
      id:         "mars",
      radius:     0.38,
      distance:   14,
      orbitSpeed: 24.13,
      selfSpeed:  14.6,
      tilt:       25.2,
    },
    {
      id:         "jupiter",
      radius:     1.4,
      distance:   20,
      orbitSpeed: 13.07,
      selfSpeed:  35,
      tilt:       3.1,
    },
    {
      id:         "saturn",
      radius:     1.2,
      distance:   27,
      orbitSpeed: 9.69,
      selfSpeed:  32,
      tilt:       26.7,
      rings: {
        innerRadius: 1.6,
        outerRadius: 2.8,
      },
    },
    {
      id:         "uranus",
      radius:     0.8,
      distance:   34,
      orbitSpeed: 6.81,
      selfSpeed:  -14,      // retrograde
      tilt:       97.8,
    },
    {
      id:         "neptune",
      radius:     0.75,
      distance:   40,
      orbitSpeed: 5.43,
      selfSpeed:  16,
      tilt:       28.3,
    },
  ],
};


// ─────────────────────────────────────────────────────────────
//  COMPONENT: orbit-rotate
//  Rotates the entity around the Y-axis (orbit pivot).
//  Attribute: speed (degrees/s)
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent("orbit-rotate", {
  schema: { speed: { type: "number", default: 10 } },

  tick(time, delta) {
    const deltaSeconds = delta / 1000;
    const rotation     = this.el.getAttribute("rotation") || { x: 0, y: 0, z: 0 };
    this.el.setAttribute("rotation", {
      x: rotation.x,
      y: rotation.y + this.data.speed * deltaSeconds,
      z: rotation.z,
    });
  },
});


// ─────────────────────────────────────────────────────────────
//  COMPONENT: self-rotate
//  Spins the entity on its own Y-axis (self-rotation / day).
//  Attribute: speed (degrees/s)
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent("self-rotate", {
  schema: { speed: { type: "number", default: 10 } },

  tick(time, delta) {
    const deltaSeconds = delta / 1000;
    const rotation     = this.el.getAttribute("rotation") || { x: 0, y: 0, z: 0 };
    this.el.setAttribute("rotation", {
      x: rotation.x,
      y: rotation.y + this.data.speed * deltaSeconds,
      z: rotation.z,
    });
  },
});


// ─────────────────────────────────────────────────────────────
//  COMPONENT: solar-system-builder
//  Reads SOLAR_CONFIG and dynamically builds the full scene.
//  Attach to any entity (we use <a-scene> via a wrapper).
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent("solar-system-builder", {

  init() {
    const scene  = this.el;
    const config = window.SOLAR_CONFIG;

    // ── Sun ────────────────────────────────────────────────
    const sun = this._makeSphere({
      radius:   config.sun.radius,
      textureId: "#sunTexture",
      position: "0 0 0",
      selfSpeed: config.sun.selfSpeed,
      emissive: true,
    });
    scene.appendChild(sun);

    // ── Point light at Sun centre ──────────────────────────
    const light = document.createElement("a-light");
    light.setAttribute("type",      "point");
    light.setAttribute("color",     "#fff9e6");
    light.setAttribute("intensity", "2.5");
    light.setAttribute("position",  "0 0 0");
    light.setAttribute("decay",     "2");
    scene.appendChild(light);

    // ── Ambient fill ───────────────────────────────────────
    const ambient = document.createElement("a-light");
    ambient.setAttribute("type",      "ambient");
    ambient.setAttribute("color",     "#ffffff");
    ambient.setAttribute("intensity", "0.15");
    scene.appendChild(ambient);

    // ── Planets ────────────────────────────────────────────
    config.planets.forEach(planet => this._buildPlanet(scene, planet));
  },

  // ── Build one planet (orbit pivot + sphere + optional extras) ──
  _buildPlanet(scene, cfg) {

    // Orbit pivot — rotates around the Sun
    const pivot = document.createElement("a-entity");
    pivot.setAttribute("orbit-rotate", `speed: ${cfg.orbitSpeed}`);
    pivot.setAttribute("id",           `orbit-${cfg.id}`);

    // Planet wrapper — positioned at orbit distance, holds tilt
    const wrapper = document.createElement("a-entity");
    wrapper.setAttribute("position", `${cfg.distance} 0 0`);
    wrapper.setAttribute("rotation", `0 0 ${cfg.tilt || 0}`);

    // Planet sphere
    const sphere = this._makeSphere({
      radius:    cfg.radius,
      textureId: `#${cfg.id}Texture`,
      selfSpeed: cfg.selfSpeed,
    });
    wrapper.appendChild(sphere);

    // ── Saturn Rings ───────────────────────────────────────
    if (cfg.rings) {
      const ring = document.createElement("a-ring");
      ring.setAttribute("radius-inner",  cfg.rings.innerRadius);
      ring.setAttribute("radius-outer",  cfg.rings.outerRadius);
      ring.setAttribute("rotation",      "-90 0 0");
      ring.setAttribute("material",
        `src: #saturnRingTexture; side: double; transparent: true; opacity: 0.85; alphaTest: 0.1`
      );
      wrapper.appendChild(ring);
    }

    // ── Moon (Earth) ───────────────────────────────────────
    if (cfg.moon) {
      const moonPivot = document.createElement("a-entity");
      moonPivot.setAttribute("orbit-rotate", `speed: ${cfg.moon.orbitSpeed}`);
      moonPivot.setAttribute("id",           `orbit-moon`);

      const moonWrapper = document.createElement("a-entity");
      moonWrapper.setAttribute("position", `${cfg.moon.distance} 0 0`);

      const moon = this._makeSphere({
        radius:    cfg.moon.radius,
        textureId: "#moonTexture",
        selfSpeed: cfg.moon.selfSpeed,
      });
      moonWrapper.appendChild(moon);
      moonPivot.appendChild(moonWrapper);
      wrapper.appendChild(moonPivot);
    }

    pivot.appendChild(wrapper);
    scene.appendChild(pivot);

    // ── Orbit trail (visual ring) ─────────────────────────
    const trail = document.createElement("a-torus");
    trail.setAttribute("radius",         cfg.distance);
    trail.setAttribute("radius-tubular", "0.01");
    trail.setAttribute("rotation",       "-90 0 0");
    trail.setAttribute("material",
      `color: #ffffff; opacity: 0.12; transparent: true; shader: flat`
    );
    trail.setAttribute("segments-tubular", "64");
    trail.setAttribute("segments-radial",  "128");
    scene.appendChild(trail);
  },

  // ── Helper: create a textured sphere ──────────────────────
  _makeSphere({ radius, textureId, position = "0 0 0", selfSpeed = 10, emissive = false }) {
    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("radius",   radius);
    sphere.setAttribute("position", position);
    sphere.setAttribute("segments-height", "36");
    sphere.setAttribute("segments-width",  "36");
    sphere.setAttribute("self-rotate",     `speed: ${selfSpeed}`);

    const matAttrs = `src: ${textureId}; roughness: 0.9; metalness: 0`
      + (emissive ? `; emissive: #ffdd88; emissiveIntensity: 0.6` : ``);
    sphere.setAttribute("material", matAttrs);

    return sphere;
  },
});
