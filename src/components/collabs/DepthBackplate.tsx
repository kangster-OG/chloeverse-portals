"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Grade = {
  brightness: number;
  contrast: number;
  saturate: number;
};

type DepthBackplateProps = {
  widthPx: number;
  heightPx: number;
  mx: number;
  my: number;
  grade: Grade;
  enableDepth: boolean;
  onMissingDepth?: () => void;
  className?: string;
};

type GlResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  textures: {
    color: WebGLTexture;
    depth: WebGLTexture;
  };
  locations: {
    aPosition: number;
    uColor: WebGLUniformLocation | null;
    uDepth: WebGLUniformLocation | null;
    uMouse: WebGLUniformLocation | null;
    uStrength: WebGLUniformLocation | null;
  };
};

const COLOR_SRC = "/collabs/backplate.png";
const DEPTH_SRC = "/collabs/backplate_depth.png";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = (aPosition + 1.0) * 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    varying vec2 vUv;
    uniform sampler2D uColor;
    uniform sampler2D uDepth;
    uniform vec2 uMouse;
    uniform float uStrength;

    void main() {
      float depth = texture2D(uDepth, vUv).r;
      vec2 offset = vec2(uMouse.x, -uMouse.y) * (uStrength * depth);
      vec2 uv = clamp(vUv + offset, vec2(0.001), vec2(0.999));
      gl_FragColor = texture2D(uColor, uv);
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function createTexture(gl: WebGLRenderingContext, image: HTMLImageElement) {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

function destroyResources(resources: GlResources | null) {
  if (!resources) return;
  const { gl } = resources;
  gl.deleteTexture(resources.textures.color);
  gl.deleteTexture(resources.textures.depth);
  gl.deleteBuffer(resources.buffer);
  gl.deleteProgram(resources.program);
}

export function DepthBackplate({
  widthPx,
  heightPx,
  mx,
  my,
  grade,
  enableDepth,
  onMissingDepth,
  className,
}: DepthBackplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resourcesRef = useRef<GlResources | null>(null);
  const [mode, setMode] = useState<"fallback" | "canvas">("fallback");
  const [depthMissing, setDepthMissing] = useState(false);
  const reportedMissingDepthRef = useRef(false);
  const onMissingDepthRef = useRef(onMissingDepth);

  useEffect(() => {
    onMissingDepthRef.current = onMissingDepth;
  }, [onMissingDepth]);

  const filterStyle = useMemo<CSSProperties>(() => {
    return {
      filter: `brightness(${grade.brightness}) contrast(${grade.contrast}) saturate(${grade.saturate})`,
    };
  }, [grade.brightness, grade.contrast, grade.saturate]);

  useEffect(() => {
    if (!enableDepth) {
      destroyResources(resourcesRef.current);
      resourcesRef.current = null;
      setMode("fallback");
      return;
    }

    let cancelled = false;

    const init = async () => {
      const colorImage = await loadImage(COLOR_SRC).catch(() => null);
      if (cancelled) return;
      if (!colorImage) {
        setMode("fallback");
        return;
      }

      const depthImage = await loadImage(DEPTH_SRC).catch(() => null);
      if (cancelled) return;
      if (!depthImage) {
        setDepthMissing(true);
        setMode("fallback");
        if (!reportedMissingDepthRef.current) {
          reportedMissingDepthRef.current = true;
          onMissingDepthRef.current?.();
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        setMode("fallback");
        return;
      }

      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        setMode("fallback");
        return;
      }

      const program = createProgram(gl);
      if (!program) {
        setMode("fallback");
        return;
      }

      const buffer = gl.createBuffer();
      if (!buffer) {
        gl.deleteProgram(program);
        setMode("fallback");
        return;
      }

      const colorTexture = createTexture(gl, colorImage);
      const depthTexture = createTexture(gl, depthImage);
      if (!colorTexture || !depthTexture) {
        if (colorTexture) gl.deleteTexture(colorTexture);
        if (depthTexture) gl.deleteTexture(depthTexture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        setMode("fallback");
        return;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          1, 1,
        ]),
        gl.STATIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const aPosition = gl.getAttribLocation(program, "aPosition");

      resourcesRef.current = {
        gl,
        program,
        buffer,
        textures: {
          color: colorTexture,
          depth: depthTexture,
        },
        locations: {
          aPosition,
          uColor: gl.getUniformLocation(program, "uColor"),
          uDepth: gl.getUniformLocation(program, "uDepth"),
          uMouse: gl.getUniformLocation(program, "uMouse"),
          uStrength: gl.getUniformLocation(program, "uStrength"),
        },
      };

      setDepthMissing(false);
      setMode("canvas");
    };

    init();

    return () => {
      cancelled = true;
      destroyResources(resourcesRef.current);
      resourcesRef.current = null;
    };
  }, [enableDepth]);

  useEffect(() => {
    if (mode !== "canvas") return;
    const canvas = canvasRef.current;
    const resources = resourcesRef.current;
    if (!canvas || !resources) return;

    const { gl, program, buffer, textures, locations } = resources;
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const cssWidth = Math.max(1, Math.round(widthPx || 1));
    const cssHeight = Math.max(1, Math.round(heightPx || 1));
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(locations.aPosition);
    gl.vertexAttribPointer(locations.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.color);
    gl.uniform1i(locations.uColor, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.depth);
    gl.uniform1i(locations.uDepth, 1);

    const mobileScale = cssWidth < 900 ? Math.max(0.65, cssWidth / 900) : 1;
    gl.uniform2f(locations.uMouse, clamp(mx, -1, 1), clamp(my, -1, 1));
    gl.uniform1f(locations.uStrength, 0.018 * mobileScale);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(locations.aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }, [heightPx, mode, mx, my, widthPx]);

  if (mode !== "canvas" || !enableDepth || depthMissing) {
    return (
      <img
        src={COLOR_SRC}
        alt=""
        aria-hidden="true"
        className={className}
        style={filterStyle}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={filterStyle}
      aria-hidden="true"
    />
  );
}
