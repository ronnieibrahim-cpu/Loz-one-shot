// The mock AudioContext both music checkers trace the engine against.
//
// It lives here rather than inside either tool for the same reason a checker
// may never define its own collision rule: two copies of "what a Web Audio
// node looks like" drift, and check-audio-render.mjs's recorded baseline is
// literally a hash of this object's behaviour — a second, subtly different
// copy in check-music.mjs would mean the two tools were tracing two different
// engines while both printed OK.
//
// Every node returned here just RECORDS what was called on it. Nothing here
// synthesises a sample: see the long comment at the top of
// check-audio-render.mjs for why tracing INSTRUCTIONS is the only
// reproducible way to check this engine (`T71`).

export function mockCtx() {
  let nodeId = 0;
  const trace = [];
  function param(tag) {
    return {
      value: 0,
      setValueAtTime(v, t) { trace.push([tag, 'set', v, t]); return this; },
      linearRampToValueAtTime(v, t) { trace.push([tag, 'lin', v, t]); return this; },
      exponentialRampToValueAtTime(v, t) { trace.push([tag, 'exp', v, t]); return this; },
      setTargetAtTime(v, t, c) { trace.push([tag, 'tgt', v, t, c]); return this; },
      cancelScheduledValues(t) { trace.push([tag, 'cancel', t]); return this; },
    };
  }
  const ctx = {
    sampleRate: 44100, currentTime: 0, destination: {},
    createGain() { const id = nodeId++; return { gain: param('gain' + id), connect() {} }; },
    createBiquadFilter() {
      const id = nodeId++;
      return { type: '', frequency: param('bqf' + id), Q: param('bqq' + id), connect() {} };
    },
    createOscillator() {
      const id = nodeId++;
      return {
        type: '', frequency: param('osc' + id),
        setPeriodicWave(w) { trace.push(['osc' + id, 'wave', w.imag]); },
        connect() {}, start(t) { trace.push(['osc' + id, 'start', t]); }, stop(t) { trace.push(['osc' + id, 'stop', t]); },
      };
    },
    createBufferSource() {
      const id = nodeId++;
      return {
        buffer: null, loop: false, connect() {},
        start(t) { trace.push(['src' + id, 'start', t]); }, stop(t) { trace.push(['src' + id, 'stop', t]); },
      };
    },
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
    // The real wave() caches a PeriodicWave per duty, derived from `imag` by
    // pure arithmetic on the duty value — carrying the coefficients forward
    // lets the trace tell two timbres apart without needing to know "duty"
    // is the thing that produced them.
    createPeriodicWave(real, imag) { return { imag: Array.from(imag) }; },
  };
  return { ctx, trace };
}
