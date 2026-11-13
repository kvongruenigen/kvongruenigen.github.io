(() => {
  const canvas = document.querySelector(".aurora-field");
  const context = canvas.getContext("2d");
  if (!context) return;

  const intro = canvas.parentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
  const pointer = { x: 0, y: 0, strength: 0, inside: false };
  let particles = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let pulse;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    particles = Array.from({ length: Math.min(76, Math.floor(width * height / 2600)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.3,
      hue: 185 + Math.random() * 78,
    }));
    schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw(time) {
    frame = 0;
    context.clearRect(0, 0, width, height);
    if (motion.matches) {
      pointer.inside = false;
      pointer.strength = 0;
      pulse = undefined;
      return;
    }

    pointer.strength += ((pointer.inside ? 1 : 0) - pointer.strength) * 0.12;
    if (pointer.strength > 0.01) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180);
      glow.addColorStop(0, `rgba(118, 228, 242, ${0.25 * pointer.strength})`);
      glow.addColorStop(0.48, `rgba(136, 171, 255, ${0.17 * pointer.strength})`);
      glow.addColorStop(1, "transparent");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }

    for (const dot of particles) {
      const distance = Math.hypot(pointer.x - dot.x, pointer.y - dot.y);
      const pull = Math.max(0, 1 - distance / 165) * 0.28 * pointer.strength;
      context.beginPath();
      context.arc(dot.x + (pointer.x - dot.x) * pull, dot.y + (pointer.y - dot.y) * pull,
        dot.radius, 0, Math.PI * 2);
      context.fillStyle = `hsla(${dot.hue}, 90%, 75%, ${0.34 + pull})`;
      context.fill();
    }

    if (pulse) {
      const progress = Math.min((time - pulse.start) / 650, 1);
      context.beginPath();
      context.arc(pulse.x, pulse.y, 8 + progress * 140, 0, Math.PI * 2);
      context.strokeStyle = `rgba(179, 155, 255, ${0.6 * (1 - progress)})`;
      context.stroke();
      if (progress === 1) pulse = undefined;
    }

    const target = pointer.inside ? 1 : 0;
    if (pulse || Math.abs(target - pointer.strength) > 0.01) schedule();
  }

  function locatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.inside = true;
    schedule();
  }

  intro.addEventListener("pointermove", event => {
    if (!motion.matches && event.pointerType === "mouse") locatePointer(event);
  });
  intro.addEventListener("pointerleave", () => {
    pointer.inside = false;
    schedule();
  });
  intro.addEventListener("pointerdown", event => {
    if (motion.matches || event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("a")) return;
    locatePointer(event);
    pulse = { x: pointer.x, y: pointer.y, start: performance.now() };
  });
  motion.addEventListener("change", schedule);
  new ResizeObserver(resize).observe(canvas);
})();
