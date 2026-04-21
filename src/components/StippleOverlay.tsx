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
uniform float u_dotProgress;
uniform float u_pointSize;

void main() {
  gl_Position = vec4(a_pos * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  float edge = smoothstep(a_threshold - 0.05, a_threshold + 0.01, u_dotProgress);
  gl_PointSize = u_pointSize * edge;
}
`;

const FRAG = `
precision mediump float;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(0.082, 0.078, 0.063, 1.0);
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

  const data = new Float32Array(DOT_COUNT * 3);
  for (let i = 0; i < DOT_COUNT; i++) {
    data[i * 3] = Math.random();
    data[i * 3 + 1] = Math.random();
    data[i * 3 + 2] = Math.random();
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

  const uDotProgress = gl.getUniformLocation(prog, "u_dotProgress");
  const uPointSize = gl.getUniformLocation(prog, "u_pointSize");

  return { gl, uDotProgress, uPointSize };
}

export default function StippleOverlay({
  direction,
  running,
  duration = 500,
  onComplete,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<ReturnType<typeof initGL>>(null);
  const animRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    glRef.current = initGL(canvas);

    const ctx = glRef.current;
    if (!ctx) return;
    const { gl, uDotProgress, uPointSize } = ctx;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const area = rect.width * rect.height;
    const dotArea = area / DOT_COUNT;
    const radius = Math.sqrt(dotArea / Math.PI) * dpr * 3.0;
    gl.uniform1f(uPointSize, Math.max(radius, 4.0));

    // Initial draw
    if (direction === "out") {
      // Start fully covered: dots at full + solid black visible
      gl.uniform1f(uDotProgress, 1.0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, DOT_COUNT);
      if (solidRef.current) solidRef.current.style.opacity = "1";
    } else {
      gl.uniform1f(uDotProgress, 0.0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (solidRef.current) solidRef.current.style.opacity = "0";
    }
  }, [direction]);

  // Animate
  useEffect(() => {
    if (!running) return;
    const ctx = glRef.current;
    const canvas = canvasRef.current;
    const solid = solidRef.current;
    if (!ctx || !canvas) return;

    const { gl, uDotProgress } = ctx;
    const start = Date.now();

    /*
     * "in" animation (covering):
     *   0.0–0.6: dots appear (stipple phase)
     *   0.5–1.0: solid black fades in over dots (overlap for seamless merge)
     *
     * "out" animation (revealing):
     *   0.0–0.5: solid black fades out, dots visible underneath
     *   0.4–1.0: dots disappear (stipple phase, overlap for continuity)
     */

    function frame() {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);

      if (direction === "in") {
        // Dots: progress 0→1 over first 60% of time
        const dotT = Math.min(t / 0.6, 1);
        gl.uniform1f(uDotProgress, dotT);

        // Solid: fade in during last 50%
        const solidT = Math.max(0, (t - 0.5) / 0.5);
        if (solid) solid.style.opacity = String(solidT);
      } else {
        // Solid: fade out during first 50%
        const solidT = 1 - Math.min(t / 0.5, 1);
        if (solid) solid.style.opacity = String(solidT);

        // Dots: progress 1→0 starting at 40%
        const dotT = t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6;
        gl.uniform1f(uDotProgress, Math.max(0, dotT));
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
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
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Solid black layer — fades in after dots cover, fades out before dots reveal */}
      <div
        ref={solidRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#151410",
          opacity: 0,
          transition: "none",
        }}
      />
      {/* WebGL dot canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
