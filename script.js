(() => {
  const hero = document.querySelector('.hero');
  const gooCircles = [...document.querySelectorAll('.goo-circle')];
  const trailCircles = [...document.querySelectorAll('.trail-circle')];
  const waves = document.querySelector('.waves');
  const baseUI = document.querySelector('.ui--base');
  const revealUI = document.querySelector('.ui--reveal');
  const cursorDot = document.querySelector('.cursor-dot');
  const interactive = [...document.querySelectorAll('.interactive, .brand')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let target = { x: innerWidth * .58, y: innerHeight * .48 };
  let current = { ...target };
  let previousTarget = { ...target };
  let speed = 0;
  let inside = false;
  let time = 0;

  const trail = Array.from({ length: trailCircles.length }, () => ({ ...target }));

  function activate(x, y, pointerType = 'mouse') {
    target.x = x;
    target.y = y;
    inside = true;
    hero.classList.add('is-active');
    if (pointerType !== 'touch') cursorDot.style.opacity = '1';
  }

  hero.addEventListener('pointerenter', (e) => activate(e.clientX, e.clientY, e.pointerType));
  hero.addEventListener('pointermove', (e) => activate(e.clientX, e.clientY, e.pointerType), { passive: true });
  hero.addEventListener('pointerleave', () => {
    inside = false;
    hero.classList.remove('is-active');
    cursorDot.style.opacity = '0';
  });

  // Touch devices still get the reveal interaction wherever the finger moves.
  hero.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) activate(t.clientX, t.clientY, 'touch');
  }, { passive: true });

  interactive.forEach((el) => {
    el.addEventListener('mouseenter', () => hero.classList.add('link-hover'));
    el.addEventListener('mouseleave', () => hero.classList.remove('link-hover'));
  });

  function resizeMask() {
    const mask = document.getElementById('blobMask');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', String(innerWidth));
    mask.setAttribute('height', String(innerHeight));
  }
  resizeMask();
  addEventListener('resize', resizeMask, { passive: true });

  function frame() {
    time += 0.016;

    const dxTarget = target.x - previousTarget.x;
    const dyTarget = target.y - previousTarget.y;
    const instantaneous = Math.hypot(dxTarget, dyTarget);
    speed += (instantaneous - speed) * .18;
    previousTarget.x = target.x;
    previousTarget.y = target.y;

    const follow = reducedMotion ? 1 : .115;
    current.x += (target.x - current.x) * follow;
    current.y += (target.y - current.y) * follow;

    // Four offset circles merge through the SVG goo filter, creating an organic edge.
    const energetic = Math.min(speed, 72);
    const mainRadius = Math.min(150, Math.max(98, Math.min(innerWidth, innerHeight) * .135));
    const wobble = reducedMotion ? 0 : 10 + energetic * .08;
    const lobes = [
      { ox: Math.cos(time * 1.1) * wobble, oy: Math.sin(time * 1.3) * wobble, r: mainRadius },
      { ox: Math.cos(time * 1.55 + 2) * (mainRadius * .48), oy: Math.sin(time * 1.12 + .4) * (mainRadius * .3), r: mainRadius * .72 },
      { ox: Math.cos(time * .91 + 4) * (mainRadius * .36), oy: Math.sin(time * 1.75 + 1) * (mainRadius * .44), r: mainRadius * .61 },
      { ox: Math.cos(time * 1.9 + 1) * (mainRadius * .42), oy: Math.sin(time * .84 + 5) * (mainRadius * .28), r: mainRadius * .48 }
    ];

    gooCircles.forEach((circle, i) => {
      const lobe = lobes[i];
      circle.setAttribute('cx', (current.x + lobe.ox).toFixed(1));
      circle.setAttribute('cy', (current.y + lobe.oy).toFixed(1));
      circle.setAttribute('r', lobe.r.toFixed(1));
    });

    // Speed-sensitive comet tail. Each point follows the previous one at a slightly slower rate.
    let leader = current;
    trail.forEach((point, i) => {
      const lag = reducedMotion ? 1 : Math.max(.07, .23 - i * .018);
      point.x += (leader.x - point.x) * lag;
      point.y += (leader.y - point.y) * lag;
      leader = point;

      const boost = Math.min(1, speed / 34);
      const base = 54 - i * 7;
      const radius = Math.max(10, base + boost * (20 - i * 2));
      const opacity = (.08 + (trail.length - i) * .038) * (.25 + boost * .9);
      const circle = trailCircles[i];
      circle.setAttribute('cx', point.x.toFixed(1));
      circle.setAttribute('cy', point.y.toFixed(1));
      circle.setAttribute('r', radius.toFixed(1));
      circle.setAttribute('opacity', Math.min(.48, opacity).toFixed(3));
    });

    // A tiny opposing shift adds depth without disturbing photo alignment.
    const nx = (current.x / Math.max(1, innerWidth) - .5) * 2;
    const ny = (current.y / Math.max(1, innerHeight) - .5) * 2;
    if (!reducedMotion) {
      waves.style.transform = `translate3d(${(-nx * 16).toFixed(1)}px, ${(-ny * 11).toFixed(1)}px, 0)`;
      baseUI.style.transform = `translate3d(${(-nx * 5).toFixed(1)}px, ${(-ny * 4).toFixed(1)}px, 0)`;
      revealUI.style.transform = `translate3d(${(-nx * 5).toFixed(1)}px, ${(-ny * 4).toFixed(1)}px, 0)`;
    }

    if (finePointer) {
      cursorDot.style.transform = `translate3d(${(target.x - 3.5).toFixed(1)}px, ${(target.y - 3.5).toFixed(1)}px, 0)`;
    }

    requestAnimationFrame(frame);
  }

  if (!finePointer) {
    // Start mobile/tablet with a quiet central reveal instead of an invisible feature.
    hero.classList.add('is-active');
    cursorDot.style.display = 'none';
  } else {
    cursorDot.style.opacity = '0';
  }

  requestAnimationFrame(frame);
})();
