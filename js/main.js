(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Меню и подвал ---------- */
  const menuBtn = $(".menu-btn");
  const nav = $(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Главная: ваза на гончарном круге ---------- */
  const stage = $("#hero-stage");
  if (stage) {
    const NS = "http://www.w3.org/2000/svg";
    const CX = 250, TOP = 98, H = 360, BOTTOM = TOP + H;
    const body = $("#vase-body"), lipOuter = $("#lip-outer"), lipInner = $("#lip-inner");
    const ribs = $("#vase-ribs"), bands = $("#vase-bands"), vase = $("#vase");
    const hint = $(".hint", stage), btn = $("#shape-btn"), live = $("#shape-name");

    const presets = [
      { name: "Амфора",       belly: .52, bellyW: 118, neckW: 34, lipW: 50, footW: 52 },
      { name: "Кувшин",       belly: .62, bellyW: 98,  neckW: 24, lipW: 38, footW: 56 },
      { name: "Лунная банка", belly: .50, bellyW: 140, neckW: 70, lipW: 66, footW: 60 },
      { name: "Стакан",       belly: .50, bellyW: 66,  neckW: 62, lipW: 68, footW: 58 },
      { name: "Бутыль",       belly: .72, bellyW: 112, neckW: 20, lipW: 32, footW: 70 }
    ];
    const keys = ["belly", "bellyW", "neckW", "lipW", "footW"];
    let idx = 0;
    let P = { ...presets[0] };
    let T = { ...presets[0] };
    let influence = { x: 0, y: 0 };

    const ribCount = 8;
    const ribEls = Array.from({ length: ribCount }, () => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#e2a52e");
      p.setAttribute("stroke-linecap", "round");
      ribs.appendChild(p);
      return p;
    });
    const bandEls = [.4, .46].map(() => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#f4f6f2");
      p.setAttribute("stroke-width", "4");
      bands.appendChild(p);
      return p;
    });

    // Профиль сосуда: сплайн Catmull-Rom по контрольным точкам (t, r)
    function profile(p) {
      const b = p.belly;
      const pts = [
        [0, p.lipW], [0.1, p.neckW],
        [0.1 + (b - 0.1) * 0.5, p.neckW + (p.bellyW - p.neckW) * 0.28],
        [b, p.bellyW],
        [b + (0.97 - b) * 0.5, p.footW + (p.bellyW - p.footW) * 0.55],
        [0.97, p.footW], [1, p.footW * 0.96]
      ];
      const q = [pts[0], ...pts, pts[pts.length - 1]];
      const out = [];
      for (let i = 1; i < q.length - 2; i++) {
        const [a0, a1, a2, a3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
        for (let s = 0; s < 14; s++) {
          const t = s / 14, t2 = t * t, t3 = t2 * t;
          const f = (k) => 0.5 * (2 * a1[k] + (-a0[k] + a2[k]) * t + (2 * a0[k] - 5 * a1[k] + 4 * a2[k] - a3[k]) * t2 + (-a0[k] + 3 * a1[k] - 3 * a2[k] + a3[k]) * t3);
          out.push([f(0), f(1)]);
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    }
    function rAt(dense, t) {
      for (let i = 0; i < dense.length - 1; i++) {
        const a = dense[i], b = dense[i + 1];
        if (t >= a[0] && t <= b[0] && b[0] > a[0]) return a[1] + (b[1] - a[1]) * ((t - a[0]) / (b[0] - a[0]));
      }
      return dense[dense.length - 1][1];
    }

    let theta = 0, reveal = reduced ? 1 : 0;

    function render() {
      const dense = profile(P);
      const N = 56;
      const L = [], R = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, r = rAt(dense, t), y = TOP + H * t;
        L.push(`${(CX - r).toFixed(1)},${y.toFixed(1)}`);
        R.push(`${(CX + r).toFixed(1)},${y.toFixed(1)}`);
      }
      body.setAttribute("d", "M" + L.join("L") + "L" + R.reverse().join("L") + "Z");

      const r0 = rAt(dense, 0);
      lipOuter.setAttribute("cx", CX); lipOuter.setAttribute("cy", TOP);
      lipOuter.setAttribute("rx", r0); lipOuter.setAttribute("ry", r0 * 0.2);
      lipInner.setAttribute("cx", CX); lipInner.setAttribute("cy", TOP + 1.5);
      lipInner.setAttribute("rx", r0 * 0.86); lipInner.setAttribute("ry", r0 * 0.17);

      // ребра-узор: вращаются вместе с кругом
      const M = 34;
      ribEls.forEach((el, k) => {
        const a = theta + (k * 2 * Math.PI) / ribCount;
        const c = Math.cos(a);
        if (c <= 0.04) { el.setAttribute("d", ""); return; }
        let d = "";
        for (let i = 0; i <= M; i++) {
          const t = 0.06 + (0.9 * i) / M, r = rAt(dense, t);
          d += (i ? "L" : "M") + (CX + r * Math.sin(a)).toFixed(1) + "," + (TOP + H * t).toFixed(1);
        }
        el.setAttribute("d", d);
        el.setAttribute("stroke-width", (1 + 3.2 * c).toFixed(2));
        el.setAttribute("opacity", Math.min(1, c * 1.6).toFixed(2));
      });
      [.4, .46].forEach((t, i) => {
        const r = rAt(dense, t), y = TOP + H * t;
        bandEls[i].setAttribute("d", `M${CX - r},${y} A${r},${r * 0.2} 0 0 0 ${CX + r},${y}`);
      });

      const s = 0.1 + 0.9 * reveal;
      vase.setAttribute("transform", `translate(0 ${BOTTOM}) scale(1 ${s.toFixed(3)}) translate(0 ${-BOTTOM})`);
    }

    function updateTarget() {
      const base = presets[idx];
      T = { ...base };
      T.belly = Math.min(0.72, Math.max(0.34, base.belly + influence.y * 0.3));
      T.neckW = Math.min(70, Math.max(18, base.neckW + influence.x * 36));
      T.lipW = Math.max(T.neckW * 0.95, base.lipW + influence.x * 18);
    }

    let last = performance.now(), start = last;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      theta += dt * 0.85;
      if (reveal < 1) {
        const e = Math.min(1, Math.max(0, (now - start - 250) / 1700));
        reveal = 1 - Math.pow(1 - e, 3);
      }
      const k = Math.min(1, dt * 6);
      keys.forEach((key) => (P[key] += (T[key] - P[key]) * k));
      render();
      requestAnimationFrame(frame);
    }

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      influence.x = (e.clientX - r.left) / r.width - 0.5;
      influence.y = (e.clientY - r.top) / r.height - 0.5;
      hint && hint.classList.add("gone");
      updateTarget();
      if (reduced) { P = { ...T }; render(); }
    });
    stage.addEventListener("pointerleave", () => {
      influence = { x: 0, y: 0 };
      updateTarget();
      if (reduced) { P = { ...T }; render(); }
    });
    btn.addEventListener("click", () => {
      idx = (idx + 1) % presets.length;
      influence = { x: 0, y: 0 };
      updateTarget();
      live.textContent = "Форма: " + presets[idx].name;
      hint && hint.classList.add("gone");
      if (reduced) { P = { ...T }; render(); }
    });

    render();
    if (!reduced) requestAnimationFrame(frame);
  }

  /* ---------- О мастере: кривая обжига ---------- */
  const kiln = $("#kiln");
  if (kiln) {
    const curve = $(".curve", kiln);
    const len = curve.getTotalLength();
    const dots = $$(".dot", kiln), lbls = $$(".lbl", kiln);
    const showAll = () => { curve.style.strokeDasharray = "none"; dots.forEach((d) => d.classList.add("on")); lbls.forEach((d) => d.classList.add("on")); };
    if (reduced || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      curve.style.strokeDasharray = len;
      curve.style.strokeDashoffset = len;
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        curve.style.transition = "stroke-dashoffset 3.2s cubic-bezier(.4,.1,.3,1)";
        curve.style.strokeDashoffset = 0;
        [1100, 2500].forEach((ms, i) => setTimeout(() => { dots[i].classList.add("on"); lbls[i].classList.add("on"); }, ms));
      }, { threshold: 0.45 });
      io.observe(kiln);
    }
  }

  /* ---------- Работы: фильтр и окно просмотра ---------- */
  const gallery = $("#gallery");
  if (gallery) {
    const items = $$(".item", gallery);
    const chips = $$(".chip");
    chips.forEach((chip) => chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      const cat = chip.dataset.cat;
      const before = new Map(items.filter((i) => !i.hidden).map((i) => [i, i.getBoundingClientRect()]));
      items.forEach((i) => (i.hidden = !(cat === "all" || i.dataset.cat === cat)));
      if (reduced) return;
      items.filter((i) => !i.hidden).forEach((i) => {
        const f = before.get(i), l = i.getBoundingClientRect();
        if (f) {
          const dx = f.left - l.left, dy = f.top - l.top;
          if (dx || dy) i.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
        } else {
          i.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
        }
      });
    }));

    const dlg = $("#lightbox");
    const set = (id, v) => ($(id, dlg).textContent = v);
    let opener = null;
    items.forEach((it) => it.addEventListener("click", () => {
      opener = it;
      const img = $("#lb-img", dlg);
      img.src = it.dataset.img; img.alt = it.dataset.title;
      set("#lb-title", it.dataset.title);
      set("#lb-desc", it.dataset.desc);
      set("#lb-size", it.dataset.size);
      set("#lb-glaze", it.dataset.glaze);
      set("#lb-fire", it.dataset.fire);
      $("#lb-ask", dlg).href = "contacts.html?work=" + encodeURIComponent(it.dataset.title);
      dlg.showModal();
    }));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    $("#lb-close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("close", () => opener && opener.focus());
  }

  /* ---------- Контакты: форма ---------- */
  const form = $("#contact-form");
  if (form) {
    const params = new URLSearchParams(location.search);
    const work = params.get("work");
    if (work) {
      $("#topic").value = "order";
      $("#message").value = `Здравствуйте! Меня заинтересовала работа «${work}». Можно сделать такую же?`;
    }
    const rules = {
      name: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: (v) => v.trim().length >= 10
    };
    const check = (el) => {
      const ok = rules[el.name](el.value);
      el.closest(".field").classList.toggle("invalid", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      return ok;
    };
    Object.keys(rules).forEach((n) => {
      const el = form.elements[n];
      el.addEventListener("blur", () => check(el));
      el.addEventListener("input", () => el.closest(".field").classList.contains("invalid") && check(el));
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).map((n) => form.elements[n]).filter((el) => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      const topic = form.elements.topic.selectedOptions[0].textContent;
      const subject = `${topic} — ${form.elements.name.value.trim()}`;
      const text = `${form.elements.message.value.trim()}\n\n${form.elements.name.value.trim()}\n${form.elements.email.value.trim()}`;
      $(".sent", form).classList.add("show");
      window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    });
  }
})();
