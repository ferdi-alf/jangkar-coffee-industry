"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface GrainCursorProps {
  /** Color of the grain trail (HEX like #FF9FFC, or RGB / HSL format) */
  color?: string;
  /** Size of each pixelated grain / dither matrix cell (default: 6.0) */
  grainSize?: number;
  /** Normalized radius of the cursor influence brush (default: 0.10) */
  radius?: number;
  /** Peak intensity / density of the cursor stamp (default: 0.5) */
  intensity?: number;
  /** Decay rate of the trail per frame (default: 0.010) */
  decay?: number;
  /** Exponent falloff curve for the brush influence (default: 2.0) */
  falloff?: number;
  /** Cursor interpolation smoothing factor between 0.05 (very smooth) and 1.0 (instant) (default: 0.4) */
  smoothness?: number;
  /** Opacity multiplier for the grain trail (default: 1.0) */
  opacity?: number;
  /** CSS mix-blend-mode for the canvas overlay (e.g. 'normal', 'screen', 'lighten', 'color-dodge') (default: 'normal') */
  blendMode?: React.CSSProperties["mixBlendMode"];
  /** Whether to bind the grain cursor effect to parent element instead of entire window (default: false) */
  attachToParent?: boolean;
  /** Optional custom container element ref to track cursor inside */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Hide native browser cursor inside the target area (default: false) */
  hideNativeCursor?: boolean;
  /** Reset / clear cursor trail when mouse leaves target (default: true) */
  clearOnLeave?: boolean;
  /** CSS z-index layer for the canvas container (default: 99999 for fullscreen, 10 for container) */
  zIndex?: number;
  /** Extra CSS classes for wrapper container */
  className?: string;
  /** Extra inline styles */
  style?: React.CSSProperties;
  /** Optional children if using GrainCursor as a wrapper container */
  children?: React.ReactNode;
  /** Disable the cursor effect (default: false) */
  disabled?: boolean;
}

/** Helper: Parse Hex / RGB string to normalized [r, g, b] array */
function parseColorToRgb(colorStr: string): [number, number, number] {
  if (!colorStr) return [0.0, 0.96, 1.0]; // fallback cosmic cyan
  const trimmed = colorStr.trim();

  // Hex format
  if (trimmed.startsWith("#")) {
    const cleanHex = trimmed.replace("#", "");
    if (cleanHex.length === 3) {
      return [
        parseInt(cleanHex[0] + cleanHex[0], 16) / 255,
        parseInt(cleanHex[1] + cleanHex[1], 16) / 255,
        parseInt(cleanHex[2] + cleanHex[2], 16) / 255,
      ];
    }
    if (cleanHex.length >= 6) {
      return [
        parseInt(cleanHex.substring(0, 2), 16) / 255,
        parseInt(cleanHex.substring(2, 4), 16) / 255,
        parseInt(cleanHex.substring(4, 6), 16) / 255,
      ];
    }
  }

  // RGB / RGBA format
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10) / 255,
      parseInt(rgbMatch[2], 10) / 255,
      parseInt(rgbMatch[3], 10) / 255,
    ];
  }

  // HSL fallback converter via temporary canvas or default
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.fillStyle = trimmed;
        const computed = ctx.fillStyle;
        if (computed.startsWith("#")) return parseColorToRgb(computed);
      }
    } catch {
      // fallback below
    }
  }

  return [1.0, 0.624, 0.988];
}

const simVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const simFragmentShader = `
  uniform sampler2D uPrevTexture;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uRadius;
  uniform float uExponent;
  uniform float uDecay;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 diff = (vUv - uMouse) * aspect;
    float dist = length(diff);

    // Falloff circle around cursor
    float cursorInfluence = 0.0;
    if (dist < uRadius) {
      cursorInfluence = pow(1.0 - (dist / uRadius), uExponent) * uIntensity;
    }

    // Sample previous trail and apply decay
    vec4 prev = texture2D(uPrevTexture, vUv);
    float trail = max(prev.r - uDecay, 0.0) + cursorInfluence;
    trail = clamp(trail, 0.0, 1.0);

    gl_FragColor = vec4(vec3(trail), 1.0);
  }
`;

const ditherFragmentShader = `
  uniform sampler2D uTrailTexture;
  uniform vec2 uResolution;
  uniform float uDitherSize;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  // 8x8 Bayer Matrix
  float bayer8x8(vec2 uv) {
    int x = int(mod(uv.x, 8.0));
    int y = int(mod(uv.y, 8.0));
    int index = x + y * 8;

    int matrix[64];
    matrix[0] = 0;   matrix[1] = 32;  matrix[2] = 8;   matrix[3] = 40;  matrix[4] = 2;   matrix[5] = 34;  matrix[6] = 10;  matrix[7] = 42;
    matrix[8] = 48;  matrix[9] = 16;  matrix[10] = 56; matrix[11] = 24; matrix[12] = 50; matrix[13] = 18; matrix[14] = 58; matrix[15] = 26;
    matrix[16] = 12; matrix[17] = 44; matrix[18] = 4;  matrix[19] = 36; matrix[20] = 14; matrix[21] = 46; matrix[22] = 6;  matrix[23] = 38;
    matrix[24] = 60; matrix[25] = 28; matrix[26] = 52; matrix[27] = 20; matrix[28] = 62; matrix[29] = 30; matrix[30] = 54; matrix[31] = 22;
    matrix[32] = 3;  matrix[33] = 35; matrix[34] = 11; matrix[35] = 43; matrix[36] = 1;  matrix[37] = 33; matrix[38] = 9;  matrix[39] = 41;
    matrix[40] = 51; matrix[41] = 19; matrix[42] = 59; matrix[43] = 27; matrix[44] = 49; matrix[45] = 17; matrix[46] = 57; matrix[47] = 25;
    matrix[48] = 15; matrix[49] = 47; matrix[50] = 7;  matrix[51] = 39; matrix[52] = 13; matrix[53] = 45; matrix[54] = 5;  matrix[55] = 37;
    matrix[56] = 63; matrix[57] = 31; matrix[58] = 55; matrix[59] = 23; matrix[60] = 61; matrix[61] = 29; matrix[62] = 53; matrix[63] = 21;

    for (int i = 0; i < 64; i++) {
      if (i == index) return float(matrix[i]) / 64.0;
    }
    return 0.0;
  }

  void main() {
    vec2 screenCoord = gl_FragCoord.xy / max(uDitherSize, 1.0);
    float threshold = bayer8x8(screenCoord);

    float intensity = texture2D(uTrailTexture, vUv).r;
    float dither = step(threshold, intensity);

    // Alpha blended color trail over background with opacity control
    float alpha = dither * smoothstep(0.01, 0.08, intensity) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const GrainCursor: React.FC<GrainCursorProps> = ({
  color = "#00F5FF",
  grainSize = 6.0,
  radius = 0.10,
  intensity = 0.5,
  decay = 0.010,
  falloff = 2.0,
  smoothness = 0.4,
  opacity = 1.0,
  blendMode = "normal",
  attachToParent = false,
  targetRef,
  hideNativeCursor = false,
  clearOnLeave = true,
  zIndex,
  className = "",
  style = {},
  children,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  // References for live prop updates to avoid rebuilding Three.js scene
  const propsRef = useRef({
    color,
    grainSize,
    radius,
    intensity,
    decay,
    falloff,
    smoothness,
    opacity,
    disabled,
  });

  useEffect(() => {
    propsRef.current = {
      color,
      grainSize,
      radius,
      intensity,
      decay,
      falloff,
      smoothness,
      opacity,
      disabled,
    };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || disabled) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    // Determine target tracking element
    const isBound = attachToParent || Boolean(targetRef);
    const targetElement: HTMLElement | Window = targetRef?.current
      ? targetRef.current
      : attachToParent && container?.parentElement
      ? container.parentElement
      : window;

    // Track width & height
    const getTargetDimensions = () => {
      if (isBound && targetElement && targetElement !== window) {
        const el = targetElement as HTMLElement;
        const rect = el.getBoundingClientRect();
        return {
          width: Math.max(rect.width, 1),
          height: Math.max(rect.height, 1),
        };
      }
      return {
        width: Math.max(window.innerWidth, 1),
        height: Math.max(window.innerHeight, 1),
      };
    };

    const initialDim = getTargetDimensions();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setSize(initialDim.width, initialDim.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Render Targets for Ping-Pong Buffer
    const targetOptions: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      stencilBuffer: false,
    };

    let rtA = new THREE.WebGLRenderTarget(initialDim.width, initialDim.height, targetOptions);
    let rtB = new THREE.WebGLRenderTarget(initialDim.width, initialDim.height, targetOptions);

    const initialRgb = parseColorToRgb(color);

    // Materials
    const simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      uniforms: {
        uPrevTexture: { value: null },
        uMouse: { value: new THREE.Vector2(-10, -10) },
        uResolution: { value: new THREE.Vector2(initialDim.width, initialDim.height) },
        uRadius: { value: radius },
        uExponent: { value: falloff },
        uDecay: { value: decay },
        uIntensity: { value: intensity },
      },
    });

    const displayMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: ditherFragmentShader,
      transparent: true,
      uniforms: {
        uTrailTexture: { value: null },
        uResolution: { value: new THREE.Vector2(initialDim.width, initialDim.height) },
        uDitherSize: { value: grainSize },
        uColor: { value: new THREE.Vector3(...initialRgb) },
        uOpacity: { value: opacity },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, simMaterial);
    scene.add(quad);

    const targetMouse = new THREE.Vector2(-10, -10);

    // Mouse / Pointer Move Handler
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (isBound && targetElement && targetElement !== window) {
        const el = targetElement as HTMLElement;
        const rect = el.getBoundingClientRect();
        targetMouse.x = (e.clientX - rect.left) / rect.width;
        targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      } else {
        targetMouse.x = e.clientX / window.innerWidth;
        targetMouse.y = 1.0 - e.clientY / window.innerHeight;
      }
    };

    const handlePointerLeave = () => {
      if (clearOnLeave) {
        targetMouse.set(-10, -10);
      }
    };

    // Event listeners
    if (isBound && targetElement && targetElement !== window) {
      const el = targetElement as HTMLElement;
      el.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
      el.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    } else {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }

    // Resize Handler
    const handleResize = () => {
      const { width, height } = getTargetDimensions();
      renderer.setSize(width, height);
      rtA.setSize(width, height);
      rtB.setSize(width, height);

      simMaterial.uniforms.uResolution.value.set(width, height);
      displayMaterial.uniforms.uResolution.value.set(width, height);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (isBound && targetElement && targetElement !== window && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(targetElement as HTMLElement);
    } else {
      window.addEventListener("resize", handleResize);
    }

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentProps = propsRef.current;
      if (currentProps.disabled) return;

      // Sync updated uniforms from current props dynamically
      const rgb = parseColorToRgb(currentProps.color);
      displayMaterial.uniforms.uColor.value.set(rgb[0], rgb[1], rgb[2]);
      displayMaterial.uniforms.uDitherSize.value = currentProps.grainSize;
      displayMaterial.uniforms.uOpacity.value = currentProps.opacity;

      simMaterial.uniforms.uRadius.value = currentProps.radius;
      simMaterial.uniforms.uExponent.value = currentProps.falloff;
      simMaterial.uniforms.uDecay.value = currentProps.decay;
      simMaterial.uniforms.uIntensity.value = currentProps.intensity;

      // Smooth mouse coordinate interpolation
      const lerpFactor = Math.min(Math.max(currentProps.smoothness, 0.01), 1.0);
      simMaterial.uniforms.uMouse.value.lerp(targetMouse, lerpFactor);

      // 1. Render trail simulation to Ping-Pong Buffer (rtB)
      simMaterial.uniforms.uPrevTexture.value = rtA.texture;
      quad.material = simMaterial;
      renderer.setRenderTarget(rtB);
      renderer.render(scene, camera);

      // 2. Render final dither pass to screen
      quad.material = displayMaterial;
      displayMaterial.uniforms.uTrailTexture.value = rtB.texture;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      // Swap buffers
      const temp = rtA;
      rtA = rtB;
      rtB = temp;
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);

      if (isBound && targetElement && targetElement !== window) {
        const el = targetElement as HTMLElement;
        el.removeEventListener("pointermove", handlePointerMove as EventListener);
        el.removeEventListener("pointerleave", handlePointerLeave);
        if (resizeObserver) resizeObserver.disconnect();
      } else {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("resize", handleResize);
      }

      // Dispose Three.js WebGL resources
      simMaterial.dispose();
      displayMaterial.dispose();
      geometry.dispose();
      rtA.dispose();
      rtB.dispose();
      renderer.dispose();
    };
  }, [mounted, attachToParent, targetRef, clearOnLeave, disabled]);

  if (!mounted) return null;

  const isBound = attachToParent || Boolean(targetRef);
  const resolvedZIndex = zIndex !== undefined ? zIndex : isBound ? 10 : 99999;

  const containerClasses = isBound
    ? "absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
    : "fixed inset-0 w-screen h-screen pointer-events-none";

  const cursorClass = hideNativeCursor ? "cursor-none" : "";

  return (
    <div
      ref={containerRef}
      className={`${containerClasses} ${cursorClass} ${className}`}
      style={{
        zIndex: resolvedZIndex,
        mixBlendMode: blendMode,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
      {children}
    </div>
  );
};

export default GrainCursor;
