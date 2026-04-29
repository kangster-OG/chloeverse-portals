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
  ambientBus.gain.value = level * 0.82;

  const mixFilter = ctx.createBiquadFilter();
  mixFilter.type = "lowpass";
  mixFilter.frequency.value = 3600;
  mixFilter.Q.value = 0.45;
  mixFilter.connect(ambientBus);

  const noiseBuffer = createNoiseBuffer(ctx, 0.28);
  const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  const makePulseWave = (duty: number) => {
    const harmonics = 18;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let index = 1; index < harmonics; index += 1) {
      imag[index] = (2 / (index * Math.PI)) * Math.sin(index * Math.PI * duty);
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  };

  const leadWave = makePulseWave(0.125);
  const arpWave = makePulseWave(0.25);
  const bpm = 176;
  const stepDuration = 60 / bpm / 4;
  const lookAhead = 0.16;

  const leadBars: readonly (readonly number[])[] = [
    [69, 72, 76, 72, 69, 72, 76, 77, 76, 72, 69, 72, 64, 67, 69, -1],
    [69, 72, 76, 72, 69, 72, 76, 77, 81, 77, 76, 72, 69, 67, 64, -1],
    [76, 77, 81, 77, 76, 72, 69, 72, 76, 77, 81, 84, 81, 77, 76, -1],
    [69, 72, 76, 72, 69, 72, 76, 77, 76, 72, 69, 72, 64, 67, 69, -1],
  ];
  const arpBars: readonly (readonly number[])[] = [
    [69, 72, 76, 72, 69, 72, 76, 72, 69, 72, 76, 72, 69, 72, 76, 72],
    [65, 69, 72, 69, 65, 69, 72, 69, 65, 69, 72, 69, 65, 69, 72, 69],
    [67, 71, 74, 71, 67, 71, 74, 71, 67, 71, 74, 71, 67, 71, 74, 71],
    [69, 72, 76, 72, 69, 72, 76, 72, 69, 72, 76, 72, 69, 72, 76, 72],
  ];
  const bassBars: readonly (readonly number[])[] = [
    [45, -1, 40, -1, 45, -1, 40, -1, 45, -1, 40, -1, 45, -1, 40, -1],
    [41, -1, 36, -1, 41, -1, 36, -1, 41, -1, 36, -1, 41, -1, 36, -1],
    [43, -1, 38, -1, 43, -1, 38, -1, 43, -1, 38, -1, 43, -1, 38, -1],
    [45, -1, 40, -1, 45, -1, 40, -1, 45, -1, 40, -1, 45, -1, 40, -1],
  ];

  let nextTime = ctx.currentTime + 0.04;
  let step = 0;
  let stopped = false;

  const scheduleKick = (time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.1);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.24, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    osc.connect(gain).connect(mixFilter);
    osc.start(time);
    osc.stop(time + 0.16);
    window.setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // no-op
      }
    }, 320);
  };

  const scheduleNoiseHit = (time: number, kind: "snare" | "hat", accent = false) => {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noiseBuffer;
    if (kind === "snare") {
      filter.type = "bandpass";
      filter.frequency.value = 1700;
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.065, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    } else {
      filter.type = "highpass";
      filter.frequency.value = accent ? 4200 : 5600;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(accent ? 0.04 : 0.024, time + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + (accent ? 0.04 : 0.024));
    }
    source.connect(filter).connect(gain).connect(mixFilter);
    source.start(time);
    source.stop(time + (kind === "snare" ? 0.1 : 0.05));
    window.setTimeout(() => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // no-op
      }
    }, 260);
  };

  const scheduleTone = (time: number, midi: number, role: "bass" | "arp" | "lead", gate: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (role === "lead") {
      osc.setPeriodicWave(leadWave);
      filter.frequency.value = 3200;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.027, time + 0.003);
      gain.gain.setValueAtTime(0.022, time + 0.038);
    } else if (role === "arp") {
      osc.setPeriodicWave(arpWave);
      filter.frequency.value = 2100;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.019, time + 0.002);
    } else {
      osc.type = "triangle";
      filter.frequency.setValueAtTime(920, time);
      filter.frequency.exponentialRampToValueAtTime(340, time + gate);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.058, time + 0.004);
    }

    filter.type = "lowpass";
    osc.frequency.setValueAtTime(midiToHz(midi), time);
    if (role === "bass") osc.frequency.linearRampToValueAtTime(midiToHz(midi) * 0.99, time + gate);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + gate);
    osc.connect(filter).connect(gain).connect(mixFilter);
    osc.start(time);
    osc.stop(time + gate + 0.02);
    window.setTimeout(() => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // no-op
      }
    }, Math.ceil((gate + 0.25) * 1000));
  };

  const scheduleStep = (stepIndex: number, time: number) => {
    const sixteenth = stepIndex % 16;
    const bar = Math.floor(stepIndex / 16) % 4;

    if (sixteenth === 0 || sixteenth === 8) scheduleKick(time);
    if (sixteenth === 4 || sixteenth === 12) scheduleNoiseHit(time, "snare");
    if (sixteenth % 2 === 0) scheduleNoiseHit(time, "hat", sixteenth === 0 || sixteenth === 8);

    const bassMidi = bassBars[bar]?.[sixteenth] ?? -1;
    if (bassMidi >= 0) scheduleTone(time, bassMidi, "bass", 0.13);

    const arpMidi = arpBars[bar]?.[sixteenth] ?? -1;
    if (arpMidi >= 0) scheduleTone(time, arpMidi, "arp", 0.075);

    const leadMidi = leadBars[bar]?.[sixteenth] ?? -1;
    if (leadMidi >= 0) scheduleTone(time, leadMidi, "lead", 0.14);
    if (sixteenth === 15 && (bar === 1 || bar === 2)) {
      const nextLead = leadBars[(bar + 1) % 4]?.[0] ?? -1;
      if (nextLead >= 0) scheduleTone(time + stepDuration * 0.68, Math.max(48, nextLead - 2), "lead", 0.12);
    }
  };

  const tick = () => {
    if (stopped) return;
    while (nextTime < ctx.currentTime + lookAhead) {
      scheduleStep(step, nextTime);
      nextTime += stepDuration;
      step += 1;
    }
  };

  tick();
  const seq = window.setInterval(tick, 45);

  graph.ambientNodes.push(mixFilter);
  graph.ambientStops.push(() => {
    stopped = true;
    window.clearInterval(seq);
    try {
      mixFilter.disconnect();
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
