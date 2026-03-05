export function createTimer(onTick) {
  let startTime = 0;
  let elapsed = 0;
  let rafId = null;
  let running = false;

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function tick() {
    if (!running) return;
    elapsed = Date.now() - startTime;
    onTick(formatTime(elapsed));
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = Date.now() - elapsed;
      tick();
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      elapsed = 0;
      onTick('0:00');
    },
    getElapsed() {
      return elapsed;
    },
    getFormatted() {
      return formatTime(elapsed);
    },
  };
}
