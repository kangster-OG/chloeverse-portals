"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AudioGraph = {
  ctx: AudioContext;
  master: GainNode;
  ambientBus: GainNode;
  sfxBus: GainNode;
  style: AudioStyle;
  ambientNodes: AudioNode[];
  ambientStops: Array<() => void>;
};

type AudioStyle = "cinematic" | "arcade";

type UseAudioGateOptions = {
  volume?: number;
  ambientLevel?: number;
  style?: AudioStyle;
};

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }
  return buffer;
}

function setupAmbientCinematic(graph: AudioGraph, level: number) {
  const { ctx, ambientBus } = graph;
  ambientBus.gain.value = level;

  const low = ctx.createOscillator();
  low.type = "sine";
  low.frequency.value = 74;
  const lowGain = ctx.createGain();
  lowGain.gain.value = 0.18;

  const shimmer = ctx.createOscillator();
  shimmer.type = "triangle";
  shimmer.frequency.value = 161;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.05;

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 2.8);
  noise.loop = true;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 320;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1450;
  band.Q.value = 0.45;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.04;

  low.connect(lowGain).connect(ambientBus);
  shimmer.connect(shimmerGain).connect(ambientBus);
  noise.connect(highpass).connect(band).connect(noiseGain).connect(ambientBus);

  const t = ctx.currentTime + 0.01;
  low.start(t);
  shimmer.start(t);
  noise.start(t);

  graph.ambientNodes.push(low, lowGain, shimmer, shimmerGain, noise, highpass, band, noiseGain);
  graph.ambientStops.push(() => {
    try {
      low.stop();
      shimmer.stop();
      noise.stop();
    } catch {
      // no-op
    }
  });
}

function setupAmbientArcade(graph: AudioGraph, level: number) {
  const { ctx, ambientBus } = graph;
  ambientBus.gain.value = level * 0.92;

  const drone = ctx.createOscillator();
  drone.type = "triangle";
  drone.frequency.value = 82.41;
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 540;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.045;

  const pad = ctx.createOscillator();
  pad.type = "square";
  pad.frequency.value = 164.81;
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 880;
  const padGain = ctx.createGain();
  padGain.gain.value = 0.0001;

  const sparkle = ctx.createOscillator();
  sparkle.type = "triangle";
  sparkle.frequency.value = 329.63;
  const sparkleFilter = ctx.createBiquadFilter();
  sparkleFilter.type = "lowpass";
  sparkleFilter.frequency.value = 1800;
  const sparkleGain = ctx.createGain();
  sparkleGain.gain.value = 0.0001;

  const hiss = ctx.createBufferSource();
  hiss.buffer = createNoiseBuffer(ctx, 2.2);
  hiss.loop = true;
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = "highpass";
  hissFilter.frequency.value = 2800;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.0045;

  drone.connect(droneFilter).connect(droneGain).connect(ambientBus);
  pad.connect(padFilter).connect(padGain).connect(ambientBus);
  sparkle.connect(sparkleFilter).connect(sparkleGain).connect(ambientBus);
  hiss.connect(hissFilter).connect(hissGain).connect(ambientBus);

  const t = ctx.currentTime + 0.01;
  drone.start(t);
  pad.start(t);
  sparkle.start(t);
  hiss.start(t);

  const attractLoop = [
    { root: 82.41, pad: 164.81, sparkle: 329.63 },
    { root: 98, pad: 196, sparkle: 392 },
    { root: 73.42, pad: 146.83, sparkle: 293.66 },
    { root: 110, pad: 220, sparkle: 440 },
  ] as const;

  let step = 0;
  const playStep = () => {
    const now = ctx.currentTime;
    const note = attractLoop[step % attractLoop.length] ?? attractLoop[0];

    drone.frequency.cancelScheduledValues(now);
    drone.frequency.setValueAtTime(note.root, now);

    pad.frequency.cancelScheduledValues(now);
    pad.frequency.setValueAtTime(note.pad, now);
    padGain.gain.cancelScheduledValues(now);
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(0.034, now + 0.08);
    padGain.gain.linearRampToValueAtTime(0.02, now + 0.55);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    sparkle.frequency.cancelScheduledValues(now);
    sparkle.frequency.setValueAtTime(note.sparkle, now);
    sparkleGain.gain.cancelScheduledValues(now);
    sparkleGain.gain.setValueAtTime(0.0001, now);
    sparkleGain.gain.linearRampToValueAtTime(0.015, now + 0.05);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    step += 1;
  };

  playStep();
  const seq = window.setInterval(playStep, 1600);

  graph.ambientNodes.push(
    drone,
    droneFilter,
    droneGain,
    pad,
    padFilter,
    padGain,
    sparkle,
    sparkleFilter,
    sparkleGain,
    hiss,
    hissFilter,
    hissGain,
  );
  graph.ambientStops.push(() => {
    window.clearInterval(seq);
    try {
      drone.stop();
      pad.stop();
      sparkle.stop();
      hiss.stop();
    } catch {
      // no-op
    }
  });
}

function setupAmbient(graph: AudioGraph, level: number) {
  if (graph.style === "arcade") {
    setupAmbientArcade(graph, level);
    return;
  }
  setupAmbientCinematic(graph, level);
}

function disposeGraph(graph: AudioGraph) {
  for (const stop of graph.ambientStops) stop();
  for (const node of graph.ambientNodes) {
    try {
      node.disconnect();
    } catch {
      // no-op
    }
  }
  try {
    graph.sfxBus.disconnect();
    graph.ambientBus.disconnect();
    graph.master.disconnect();
  } catch {
    // no-op
  }
}

export function useAudioGate(options: UseAudioGateOptions = {}) {
  const volume = options.volume ?? 0.18;
  const ambientLevel = options.ambientLevel ?? 0.26;
  const style = options.style ?? "cinematic";

  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  const graphRef = useRef<AudioGraph | null>(null);
  const mutedRef = useRef(false);
  const duckedRef = useRef(false);

  const ensureGraph = useCallback((): AudioGraph | null => {
    if (typeof window === "undefined") return null;
    if (graphRef.current) return graphRef.current;

    const ContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ContextCtor) return null;

    const ctx = new ContextCtor();
    const master = ctx.createGain();
    const ambientBus = ctx.createGain();
    const sfxBus = ctx.createGain();

    master.gain.value = 0;
    ambientBus.gain.value = ambientLevel;
    sfxBus.gain.value = 1;

    ambientBus.connect(master);
    sfxBus.connect(master);
    master.connect(ctx.destination);

    const graph: AudioGraph = {
      ctx,
      master,
      ambientBus,
      sfxBus,
      style,
      ambientNodes: [],
      ambientStops: [],
    };

    setupAmbient(graph, ambientLevel);
    graphRef.current = graph;
    return graph;
  }, [ambientLevel, style]);

  const requestStart = useCallback(async () => {
    const graph = ensureGraph();
    if (!graph) return;

    if (graph.ctx.state === "suspended") {
      try {
        await graph.ctx.resume();
      } catch {
        return;
      }
    }

    const target = mutedRef.current || duckedRef.current ? 0.0001 : volume;
    graph.master.gain.setTargetAtTime(target, graph.ctx.currentTime, 0.08);
    if (!ready) setReady(true);
  }, [ensureGraph, ready, volume]);

  const playHoverChime = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || mutedRef.current || graph.ctx.state !== "running") return;

    const t = graph.ctx.currentTime + 0.005;
    const osc = graph.ctx.createOscillator();
    osc.type = graph.style === "arcade" ? "square" : "sine";
    osc.frequency.setValueAtTime(graph.style === "arcade" ? 880 : 720, t);
    osc.frequency.exponentialRampToValueAtTime(graph.style === "arcade" ? 1320 : 980, t + 0.2);

    const gain = graph.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(graph.style === "arcade" ? 0.065 : 0.06, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    const hp = graph.ctx.createBiquadFilter();
    hp.type = graph.style === "arcade" ? "lowpass" : "highpass";
    hp.frequency.value = graph.style === "arcade" ? 2100 : 420;

    osc.connect(hp).connect(gain).connect(graph.sfxBus);
    osc.start(t);
    osc.stop(t + 0.32);

    window.setTimeout(() => {
      try {
        osc.disconnect();
        hp.disconnect();
        gain.disconnect();
      } catch {
        // no-op
      }
    }, 500);
  }, []);

  const playFocusWhoosh = useCallback((intensity = 1) => {
    const graph = graphRef.current;
    if (!graph || mutedRef.current || graph.ctx.state !== "running") return;

    const t = graph.ctx.currentTime + 0.004;

    if (graph.style === "arcade") {
      const osc = graph.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(105, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(185, t + 0.24);

      const gain = graph.ctx.createGain();
      const peak = 0.032 * Math.max(0.45, Math.min(1.5, intensity));
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);

      const filter = graph.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(620, t + 0.24);

      osc.connect(filter).connect(gain).connect(graph.sfxBus);
      osc.start(t);
      osc.stop(t + 0.28);

      window.setTimeout(() => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {
          // no-op
        }
      }, 450);
      return;
    }

    const noise = graph.ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(graph.ctx, 0.16);

    const band = graph.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(420, t);
    band.frequency.exponentialRampToValueAtTime(1350, t + 0.22);
    band.Q.value = 0.55;

    const gain = graph.ctx.createGain();
    const peak = 0.035 * Math.max(0.45, Math.min(1.5, intensity));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    noise.connect(band).connect(gain).connect(graph.sfxBus);
    noise.start(t);
    noise.stop(t + 0.28);

    window.setTimeout(() => {
      try {
        noise.disconnect();
        band.disconnect();
        gain.disconnect();
      } catch {
        // no-op
      }
    }, 450);
  }, []);

  const playOpenBloom = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || mutedRef.current || graph.ctx.state !== "running") return;

    const t = graph.ctx.currentTime + 0.004;

    if (graph.style === "arcade") {
      const lead = graph.ctx.createOscillator();
      lead.type = "square";
      lead.frequency.setValueAtTime(261.63, t);
      lead.frequency.setValueAtTime(329.63, t + 0.11);
      lead.frequency.setValueAtTime(392, t + 0.22);
      lead.frequency.setValueAtTime(523.25, t + 0.34);

      const bass = graph.ctx.createOscillator();
      bass.type = "triangle";
      bass.frequency.setValueAtTime(130.81, t);
      bass.frequency.exponentialRampToValueAtTime(196, t + 0.4);

      const leadGain = graph.ctx.createGain();
      leadGain.gain.setValueAtTime(0.0001, t);
      leadGain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      leadGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      const bassGain = graph.ctx.createGain();
      bassGain.gain.setValueAtTime(0.0001, t);
      bassGain.gain.linearRampToValueAtTime(0.055, t + 0.06);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);

      const filter = graph.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(2400, t + 0.45);

      lead.connect(filter).connect(leadGain).connect(graph.sfxBus);
      bass.connect(bassGain).connect(graph.sfxBus);
      lead.start(t);
      lead.stop(t + 0.6);
      bass.start(t);
      bass.stop(t + 0.62);

      window.setTimeout(() => {
        try {
          lead.disconnect();
          bass.disconnect();
          leadGain.disconnect();
          bassGain.disconnect();
          filter.disconnect();
        } catch {
          // no-op
        }
      }, 900);
      return;
    }

    const tone = graph.ctx.createOscillator();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(170, t);
    tone.frequency.exponentialRampToValueAtTime(340, t + 0.46);

    const toneGain = graph.ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, t);
    toneGain.gain.exponentialRampToValueAtTime(0.09, t + 0.08);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);

    const shimmer = graph.ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(620, t + 0.03);
    shimmer.frequency.exponentialRampToValueAtTime(1120, t + 0.48);

    const shimmerGain = graph.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, t);
    shimmerGain.gain.exponentialRampToValueAtTime(0.03, t + 0.12);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.56);

    tone.connect(toneGain).connect(graph.sfxBus);
    shimmer.connect(shimmerGain).connect(graph.sfxBus);
    tone.start(t);
    tone.stop(t + 0.65);
    shimmer.start(t);
    shimmer.stop(t + 0.62);

    window.setTimeout(() => {
      try {
        tone.disconnect();
        toneGain.disconnect();
        shimmer.disconnect();
        shimmerGain.disconnect();
      } catch {
        // no-op
      }
    }, 900);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      const next = !value;
      mutedRef.current = next;
      const graph = graphRef.current;
      if (graph) {
        const target = next || duckedRef.current ? 0.0001 : volume;
        graph.master.gain.setTargetAtTime(target, graph.ctx.currentTime, 0.08);
      }
      return next;
    });
  }, [volume]);

  const setDucked = useCallback((ducked: boolean) => {
    duckedRef.current = ducked;
    const graph = graphRef.current;
    if (!graph) return;
    const target = mutedRef.current || ducked ? 0.0001 : volume;
    graph.master.gain.setTargetAtTime(target, graph.ctx.currentTime, ducked ? 0.03 : 0.1);
  }, [volume]);

  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      if (!graph) return;
      disposeGraph(graph);
      void graph.ctx.close().catch(() => {});
      graphRef.current = null;
    };
  }, []);

  return {
    muted,
    ready,
    requestStart,
    toggleMuted,
    setDucked,
    playHoverChime,
    playFocusWhoosh,
    playOpenBloom,
  };
}
