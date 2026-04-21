"use client";

import { useEffect, useRef } from "react";

type Props = {
  direction: "in" | "out";
  running: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

const VERT = `
attribute vec2 a_pos;
attribute float a_threshold;
uniform float u_progress;
uniform float u_pointSize;

void main() {
  gl_Position = vec4(a_pos * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;

  // Tight smoothstep — dots snap in/out quickly for dense coverage
  float edge = smoothstep(a_threshold - 0.05, a_threshold + 0.01, u_progress);
  gl_PointSize = u_pointSize * edge;
}
`;

const FRAG = `
precision mediump float;
void main() {
  // Circle shape
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(0.039, 0.039, 0.039, 1.0); // #0a0a0a
}
`;

const DOT_COUNT = 400000;

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false })!;
  if (!gl) return null;

  const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Generate random dot positions + thresholds
  const data = new Float32Array(DOT_COUNT * 3);
  for (let i = 0; i < DOT_COUNT; i++) {
    data[i * 3] = Math.random();     // x [0,1]
    data[i * 3 + 1] = Math.random(); // y [0,1]
    data[i * 3 + 2] = Math.random(); // threshold [0,1]
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0);

  const aThreshold = gl.getAttribLocation(prog, "a_threshold");
  gl.enableVertexAttribArray(aThreshold);
  gl.vertexAttribPointer(aThreshold, 1, gl.FLOAT, false, 12, 8);

  const uProgress = gl.getUniformLocation(prog, "u_progress");
  const uPointSize = gl.getUniformLocation(prog, "u_pointSize");

  return { gl, uProgress, uPointSize };
}

export default function StippleOverlay({
  direction,
  running,
  duration = 350,
  onComplete,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<ReturnType<typeof initGL>>(null);
  const animRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Initialize WebGL once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    glRef.current = initGL(canvas);

    // Draw initial state
    const ctx = glRef.current;
    if (!ctx) return;
    const { gl, uProgress, uPointSize } = ctx;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Point size: generous overlap to guarantee zero gaps
    const area = rect.width * rect.height;
    const dotArea = area / DOT_COUNT;
    const radius = Math.sqrt(dotArea / Math.PI) * dpr * 3.0;
    gl.uniform1f(uPointSize, Math.max(radius, 4.0));

    // Initial state
    const initialProgress = direction === "out" ? 1.0 : 0.0;
    gl.uniform1f(uProgress, initialProgress);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, DOT_COUNT);
  }, [direction]);

  // Run animation
  useEffect(() => {
    if (!running) return;
    const ctx = glRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const { gl, uProgress } = ctx;
    const start = Date.now();

    function frame() {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);

      // in: 0→1, out: 1→0
      const progress = direction === "in" ? t : 1 - t;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uProgress, progress);
      gl.drawArrays(gl.POINTS, 0, DOT_COUNT);

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        onCompleteRef.current?.();
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, direction, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
