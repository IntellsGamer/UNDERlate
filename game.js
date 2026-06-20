(() => {
  "use strict";

  const content = window.UNDERLATE_CONTENT;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const externalSprites = {
    skeleton: new Image(),
  };
  externalSprites.skeleton.src = "assets/sprites/pixel_skeleton.png";

  const externalAudio = {
    ending: new Audio("assets/audio/ending.mp3"),
  };
  externalAudio.ending.preload = "auto";
  externalAudio.ending.loop = false;

  const W = canvas.width;
  const H = canvas.height;
  const SAVE_KEY = "underlate-save-v2";
  const TILE = 32;
  const FONT = '"Determination Mono", "Courier New", Consolas, monospace';
  const MASTER_VOLUME = 1.25;
  const BULLET_VISUAL_SCALE = 1.85;
  const BULLET_HIT_SCALE = 1.55;

  const keys = new Set();
  const pressed = new Set();
  const pointers = [];
  const konami = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];
  let konamiIndex = 0;
  let lastTime = 0;

  const colors = {
    paper: "#f5f0dc",
    dim: "#b7af98",
    ink: "#050608",
    black: "#07090c",
    red: "#e85f5c",
    gold: "#ffda70",
    teal: "#42c3b6",
    green: "#7ed26d",
    purple: "#a875d6",
    blue: "#6ea8ff",
    wall: "#3b3430",
    wallTop: "#5a4d43",
    shadow: "rgba(0,0,0,0.36)",
  };

  const roomThemes = {
    hall: { a: "#181d20", b: "#22292c", rug: "#2d1d25", glow: "#42c3b6" },
    library: { a: "#17181f", b: "#24202c", rug: "#263347", glow: "#ffda70" },
    cafe: { a: "#1d1716", b: "#2b211d", rug: "#353027", glow: "#e85f5c" },
    machines: { a: "#151d1b", b: "#202b27", rug: "#21353e", glow: "#42c3b6" },
    rain: { a: "#121923", b: "#1d2633", rug: "#172b3e", glow: "#6ea8ff" },
    dorm: { a: "#1d1b22", b: "#292531", rug: "#30243a", glow: "#a875d6" },
    bell: { a: "#201b16", b: "#2e271c", rug: "#34221e", glow: "#ffda70" },
    bridge: { a: "#14181e", b: "#22222d", rug: "#202f37", glow: "#42c3b6" },
    gate: { a: "#151515", b: "#22201b", rug: "#35202a", glow: "#f5f0dc" },
    school: { a: "#161b1a", b: "#222825", rug: "#2c3037", glow: "#ffda70" },
    garden: { a: "#121f18", b: "#1e2c21", rug: "#273225", glow: "#7ed26d" },
    mirror: { a: "#151922", b: "#202839", rug: "#252b40", glow: "#6ea8ff" },
    stage: { a: "#171117", b: "#261924", rug: "#3a1d2d", glow: "#e85f5c" },
  };

  const state = {
    scene: "title",
    previousScene: "explore",
    roomId: "lateHall",
    player: {
      x: 304,
      y: 332,
      w: 18,
      h: 22,
      speed: 142,
      hp: 32,
      maxHp: 32,
      lv: 1,
      exp: 0,
      tokens: 0,
      name: "Rook",
      facing: "down",
      walk: 0,
    },
    flags: {},
    inventory: ["pocketBiscuit", "warmTea"],
    keyItems: [],
    stats: {
      spared: 0,
      defeated: 0,
      helped: 0,
      battles: 0,
      steps: 0,
      minutes: 0,
      timeDebt: 0,
      relief: 0,
      graceWarnings: 0,
      routeBossDone: false,
    },
    menu: {
      title: 0,
      pause: 0,
      shop: 0,
      shopMode: "buy",
      choice: 0,
    },
    dialogue: null,
    battle: null,
    toast: "",
    toastTimer: 0,
    prompt: "",
    promptTimer: 0,
    encounterMeters: {},
    particles: [],
    floaters: [],
    cameraShake: 0,
    hitStop: 0,
    fade: 0,
    bellSequence: [],
    chapterCard: "",
    chapterTimer: 0,
  };

  const sounds = {
    ctx: null,
    enabled: true,
    musicTimer: 0,
    musicStep: 0,
    currentMusic: "",
    externalTrack: "",
    ensure() {
      if (this.ctx || !this.enabled) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        this.enabled = false;
        return;
      }
      this.ctx = new AudioCtx();
    },
    tone(freq = 440, duration = 0.05, type = "square", volume = 0.055) {
      if (!this.enabled) return;
      this.ensure();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume * MASTER_VOLUME, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    },
    chord(root = 220) {
      this.tone(root, 0.09, "triangle", 0.05);
      setTimeout(() => this.tone(root * 1.5, 0.11, "triangle", 0.036), 30);
    },
    stopExternal() {
      if (this.externalTrack === "ending") {
        externalAudio.ending.pause();
        externalAudio.ending.currentTime = 0;
      }
      this.externalTrack = "";
    },
    playExternal(name) {
      if (this.externalTrack === name) return;
      this.stopExternal();
      if (name === "ending") {
        externalAudio.ending.currentTime = 0;
        externalAudio.ending.volume = 0.9;
        externalAudio.ending.play().catch(() => {});
      }
      this.externalTrack = name;
    },
    music(dt, mood) {
      if (!this.enabled) return;
      if (mood === "ending") {
        this.playExternal("ending");
        return;
      }
      if (this.externalTrack) this.stopExternal();
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      const patterns = {
        title: { notes: [196, 247, 294, 247, 330, 294], gap: 0.46, type: "triangle", vol: 0.032 },
        explore: { notes: [220, 262, 330, 294, 247, 196, 247, 294], gap: 0.38, type: "sine", vol: 0.028 },
        cafe: { notes: [196, 247, 262, 330, 294, 247, 220, 247], gap: 0.31, type: "triangle", vol: 0.032 },
        battle: { notes: [146, 146, 174, 196, 233, 196, 174, 146], gap: 0.18, type: "square", vol: 0.03 },
        boss: { notes: [110, 165, 196, 220, 247, 220, 196, 165, 123, 147], gap: 0.14, type: "sawtooth", vol: 0.032 },
        ending: { notes: [262, 330, 392, 523, 494, 392], gap: 0.52, type: "triangle", vol: 0.028 },
      };
      const pattern = patterns[mood] || patterns.explore;
      const note = pattern.notes[this.musicStep % pattern.notes.length];
      const beat = this.musicStep;
      this.musicStep += 1;
      this.musicTimer = pattern.gap;
      this.tone(note, pattern.gap * 0.75, pattern.type, pattern.vol);
      if (beat % 2 === 0) this.tone(note * 1.5, pattern.gap * 0.42, "triangle", pattern.vol * 0.42);
      if (beat % 4 === 0) this.tone(note / 2, pattern.gap * 0.9, "sine", pattern.vol * 0.82);
      if ((mood === "battle" || mood === "boss") && beat % 2 === 1) this.tone(58, 0.035, "square", pattern.vol * 0.9);
      if (mood === "boss" && beat % 5 === 0) this.tone(note * 2, 0.08, "sawtooth", pattern.vol * 0.5);
    },
  };

  window.addEventListener("keydown", (event) => {
    const key = normalizeKey(event.key);
    const actionKey = ["confirm", "cancel", "save", "load", "pause"].includes(key);
    if (actionKey || !keys.has(key)) pressed.add(key);
    keys.add(key);
    updateKonami(konamiKeyFromEvent(event));
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key)) {
      event.preventDefault();
    }
    if (key === "save") {
      saveGame();
      event.preventDefault();
    }
    if (key === "load") {
      loadGame();
      event.preventDefault();
    }
    if (key === "pause") {
      if (state.scene === "explore") state.scene = "journal";
      else if (state.scene === "journal") state.scene = "explore";
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(normalizeKey(event.key));
  });

  window.addEventListener("blur", clearInputState);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInputState();
  });

  function clearInputState() {
    keys.clear();
    pressed.clear();
  }

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointers.push({
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    });
    pressed.add("confirm");
  });

  function normalizeKey(key) {
    const lower = key.toLowerCase();
    if (lower === "arrowup" || lower === "w") return "up";
    if (lower === "arrowdown" || lower === "s") return "down";
    if (lower === "arrowleft" || lower === "a") return "left";
    if (lower === "arrowright" || lower === "d") return "right";
    if (lower === "z" || lower === "enter" || lower === " ") return "confirm";
    if (lower === "x" || lower === "escape" || lower === "backspace") return "cancel";
    if (lower === "f5") return "save";
    if (lower === "f9") return "load";
    if (lower === "shift") return "pause";
    if (lower === "b") return "b";
    return lower;
  }

  function konamiKeyFromEvent(event) {
    if (event.code === "ArrowUp") return "up";
    if (event.code === "ArrowDown") return "down";
    if (event.code === "ArrowLeft") return "left";
    if (event.code === "ArrowRight") return "right";
    if (event.code === "KeyB") return "b";
    if (event.code === "KeyA") return "a";
    return "";
  }

  function updateKonami(key) {
    if (!["up", "down", "left", "right", "a", "b"].includes(key)) return;
    if (key === konami[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        triggerKonamiBoss();
      }
    } else {
      konamiIndex = key === konami[0] ? 1 : 0;
    }
  }

  function triggerKonamiBoss() {
    if (state.scene === "battle" || state.scene === "ending" || state.scene === "gameover") return;
    startDialogue([
      "A forbidden input clicks into place.",
      "The borrowed hour opens a black command window.",
      "WARNING: S.A.N.S. Protocol is unfair, fast, and optional.",
    ], () => {
      startBattle("sansProtocol", "konamiSansProtocol");
    });
  }

  function just(key) {
    return pressed.has(key);
  }

  function currentRoom() {
    return content.rooms[state.roomId];
  }

  function clone(value) {
    if (window.structuredClone) return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function playerRect(x = state.player.x, y = state.player.y) {
    return { x, y, w: state.player.w, h: state.player.h };
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function flag(name) {
    return Boolean(state.flags[name]);
  }

  function setFlag(name, value = true) {
    state.flags[name] = value;
  }

  function showToast(text, duration = 2.4) {
    state.toast = text;
    state.toastTimer = duration;
  }

  function itemName(id) {
    return content.items[id]?.name || id;
  }

  function countPages() {
    return state.keyItems.filter((id) => id === "memoryPage").length;
  }

  function isSolid(rect) {
    const room = currentRoom();
    if (room.walls?.some((wall) => rectsOverlap(rect, wall))) return true;
    for (const npc of room.npcs || []) {
      if (rectsOverlap(rect, { x: npc.x, y: npc.y, w: 26, h: 32 })) return true;
    }
    for (const prop of room.props || []) {
      if (prop.kind === "finalDoor") continue;
      if (rectsOverlap(rect, prop)) return true;
    }
    return false;
  }

  function startDialogue(lines, after = null, speaker = "") {
    state.previousScene = state.scene;
    state.scene = "dialogue";
    const pagedLines = paginateLines(Array.isArray(lines) ? lines : [lines], 450, 17, 3);
    state.dialogue = {
      lines: pagedLines,
      index: 0,
      char: 0,
      done: false,
      tick: 0,
      after,
      speaker,
    };
    sounds.tone(520, 0.035);
  }

  function startChoice(prompt, choices, after) {
    state.previousScene = state.scene;
    state.scene = "choice";
    state.dialogue = {
      lines: [prompt],
      index: 0,
      char: prompt.length,
      done: true,
      tick: 0,
      choices,
      after,
    };
    state.menu.choice = 0;
  }

  function transitionRoom(door) {
    state.roomId = door.to;
    state.player.x = door.spawn.x;
    state.player.y = door.spawn.y;
    state.player.facing = door.spawn.y < 100 ? "down" : door.spawn.y > 360 ? "up" : door.spawn.x < 100 ? "right" : "left";
    state.encounterMeters[state.roomId] = state.encounterMeters[state.roomId] || 0;
    state.fade = 0.4;
    if (content.story.chapterCards[state.roomId]) {
      state.chapterCard = content.story.chapterCards[state.roomId];
      state.chapterTimer = 3.2;
    }
    sounds.musicStep = 0;
    sounds.musicTimer = 0;
    sounds.chord(210);
    showToast(currentRoom().name);
  }

  function beginNewGame() {
    sounds.stopExternal();
    state.scene = "explore";
    state.roomId = "lateHall";
    Object.assign(state.player, {
      x: 304,
      y: 332,
      hp: 32,
      maxHp: 32,
      lv: 1,
      exp: 0,
      tokens: 0,
      facing: "down",
      walk: 0,
    });
    state.flags = {};
    state.inventory = ["pocketBiscuit", "warmTea"];
    state.keyItems = [];
    state.stats = { spared: 0, defeated: 0, helped: 0, battles: 0, steps: 0, minutes: 0, timeDebt: 0, relief: 0, graceWarnings: 0, routeBossDone: false };
    state.encounterMeters = {};
    state.bellSequence = [];
    state.chapterCard = content.story.chapterCards.lateHall;
    state.chapterTimer = 4;
    startDialogue(content.story.intro, () => {
      state.scene = "explore";
      showToast("The hall notices you.");
    });
  }

  function saveGame() {
    if (!["explore", "dialogue", "choice", "shop"].includes(state.scene)) {
      showToast("Not while the hour is moving.");
      sounds.tone(120, 0.08, "triangle", 0.04);
      return;
    }
    const data = {
      roomId: state.roomId,
      player: state.player,
      flags: state.flags,
      inventory: state.inventory,
      keyItems: state.keyItems,
      stats: state.stats,
      encounterMeters: state.encounterMeters,
      bellSequence: state.bellSequence,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    showToast("Saved one late hour.");
    sounds.chord(360);
  }

  function loadGame() {
    sounds.stopExternal();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      showToast("No save is waiting.");
      return;
    }
    try {
      const data = JSON.parse(raw);
      state.roomId = data.roomId || "lateHall";
      Object.assign(state.player, data.player || {});
      state.flags = data.flags || {};
      state.inventory = data.inventory || ["pocketBiscuit"];
      state.keyItems = data.keyItems || [];
      state.stats = data.stats || { spared: 0, defeated: 0, helped: 0, battles: 0, steps: 0, minutes: 0 };
      normalizeStats();
      state.encounterMeters = data.encounterMeters || {};
      state.bellSequence = data.bellSequence || [];
      state.scene = "explore";
      state.battle = null;
      state.dialogue = null;
      showToast("Loaded a late hour.");
      sounds.chord(240);
    } catch {
      showToast("The save is unreadable.");
    }
  }

  function hasSave() {
    return Boolean(localStorage.getItem(SAVE_KEY));
  }

  function normalizeStats() {
    state.stats.spared ??= 0;
    state.stats.defeated ??= 0;
    state.stats.helped ??= 0;
    state.stats.battles ??= 0;
    state.stats.steps ??= 0;
    state.stats.minutes ??= 0;
    state.stats.timeDebt ??= 0;
    state.stats.relief ??= 0;
    state.stats.graceWarnings ??= 0;
    state.stats.routeBossDone ??= false;
  }

  function update(dt) {
    if (state.hitStop > 0) {
      state.hitStop = Math.max(0, state.hitStop - dt);
      dt *= 0.18;
    }
    sounds.music(dt, musicMood());
    state.toastTimer = Math.max(0, state.toastTimer - dt);
    state.promptTimer = Math.max(0, state.promptTimer - dt);
    state.fade = Math.max(0, state.fade - dt);
    state.cameraShake = Math.max(0, state.cameraShake - dt);
    state.chapterTimer = Math.max(0, state.chapterTimer - dt);
    updateParticles(dt);
    updateFloaters(dt);

    if (state.scene === "title") updateTitle();
    else if (state.scene === "explore") updateExplore(dt);
    else if (state.scene === "dialogue") updateDialogue(dt);
    else if (state.scene === "choice") updateChoice();
    else if (state.scene === "shop") updateShop();
    else if (state.scene === "journal") updateJournal();
    else if (state.scene === "battle") updateBattle(dt);
    else if (state.scene === "ending") updateEnding(dt);
    else if (state.scene === "gameover") updateGameOver();

    pressed.clear();
    pointers.length = 0;
  }

  function musicMood() {
    if (state.scene === "title") return "title";
    if (state.scene === "ending") return "ending";
    if (state.scene === "battle") return state.battle?.enemy?.boss ? "boss" : "battle";
    if (state.roomId === "dripCafe") return "cafe";
    return "explore";
  }

  function updateTitle() {
    const options = hasSave() ? ["Begin", "Continue", "How to Play"] : ["Begin", "How to Play"];
    menuMove("title", options.length, "vertical");
    const clicked = clickedMenu(226, 232, 188, options.length, 38);
    if (clicked >= 0) state.menu.title = clicked;
    if (just("confirm") || clicked >= 0) {
      const choice = options[state.menu.title];
      if (choice === "Continue") loadGame();
      else if (choice === "How to Play") {
        startDialogue([
          "Move with arrows or WASD. Use Z or Enter to confirm.",
          "In battle, choose FIGHT, ACT, ITEM, or MERCY with the arrow keys.",
          "ACT can make enemies spareable. FIGHT has a timing bar. During enemy turns, dodge with movement.",
          "After battles, choose what happens to the minute you made. Time Debt changes the route.",
          "F5 saves. F9 loads. Click also confirms menus.",
        ], () => {
          state.scene = "title";
        });
      } else {
        beginNewGame();
      }
    }
  }

  function updateExplore(dt) {
    const room = currentRoom();
    const p = state.player;
    let dx = 0;
    let dy = 0;
    if (keys.has("up")) dy -= 1;
    if (keys.has("down")) dy += 1;
    if (keys.has("left")) dx -= 1;
    if (keys.has("right")) dx += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      const speed = keys.has("cancel") ? p.speed * 1.18 : p.speed;
      const nx = p.x + dx * speed * dt;
      if (!isSolid(playerRect(nx, p.y))) p.x = nx;
      const ny = p.y + dy * speed * dt;
      if (!isSolid(playerRect(p.x, ny))) p.y = ny;
      p.walk += dt * 8;
      if (keys.has("cancel") && Math.random() < 0.22) {
        state.particles.push({
          x: p.x + p.w / 2,
          y: p.y + p.h,
          vx: (Math.random() - 0.5) * 18,
          vy: 18 + Math.random() * 20,
          life: 0.28,
          color: "rgba(245,240,220,0.45)",
        });
      }
      state.stats.steps += Math.hypot(dx, dy) * speed * dt;
      updateRandomEncounter(dt, Math.hypot(dx, dy) * speed);
    }

    for (const door of room.doors || []) {
      if (rectsOverlap(playerRect(), door)) {
        if (door.requireFlag && !flag(door.requireFlag)) {
          if (!state.flags[`door_${door.id}_warned`]) {
            setFlag(`door_${door.id}_warned`);
            startDialogue(door.locked || ["It will not open yet."], () => {
              state.scene = "explore";
            });
          }
        } else {
          setFlag(`door_${door.id}_warned`, false);
          transitionRoom(door);
        }
        return;
      }
    }

    for (const trigger of room.triggers || []) {
      if (trigger.requireFlag && !flag(trigger.requireFlag)) continue;
      if (trigger.once && flag(`${trigger.id}Done`)) continue;
      if (rectsOverlap(playerRect(), trigger)) {
        startBattle(trigger.enemy, trigger.id);
        return;
      }
    }

    if (just("confirm")) {
      const target = interactionRect();
      if (tryInteractNpc(target)) return;
      if (tryInteractProp(target)) return;
      if (tryPickup(target)) return;
    }
    updateInteractionPrompt();
  }

  function updateInteractionPrompt() {
    const target = interactionRect();
    const room = currentRoom();
    for (const npc of room.npcs || []) {
      if (rectsOverlap(target, { x: npc.x, y: npc.y, w: 26, h: 32 })) {
        setPrompt(`Z: Talk to ${npc.name}`);
        return;
      }
    }
    for (const prop of room.props || []) {
      if (rectsOverlap(target, prop)) {
        setPrompt(`Z: ${prop.name}`);
        return;
      }
    }
    for (const pickup of room.pickups || []) {
      if (!flag(pickup.flag) && rectsOverlap(target, { x: pickup.x, y: pickup.y, w: 20, h: 20 })) {
        setPrompt(`Z: Pick up ${itemName(pickup.item)}`);
        return;
      }
    }
    state.prompt = "";
  }

  function setPrompt(text) {
    state.prompt = text;
    state.promptTimer = 0.2;
  }

  function updateRandomEncounter(dt, movement) {
    const room = currentRoom();
    if (!room.randomEnemies || room.safe) return;
    if (state.battle || state.scene !== "explore") return;
    const key = state.roomId;
    state.encounterMeters[key] = (state.encounterMeters[key] || 0) + movement * dt;
    const pressure = (state.stats.timeDebt || 0) - Math.floor((state.stats.relief || 0) / 2);
    const threshold = Math.max(620, 1320 + (state.stats.battles % 4) * 240 - pressure * 18);
    if (state.encounterMeters[key] > threshold) {
      state.encounterMeters[key] = -320;
      const enemy = room.randomEnemies[Math.floor(Math.random() * room.randomEnemies.length)];
      startDialogue([
        "The hour audits your footsteps.",
        pressure > 12 ? "Principal Grace's ledger snaps open." : "A loose minute asks for proof you belong here.",
      ], () => {
        startBattle(enemy, `random_${key}_${Date.now()}`);
      });
    }
  }

  function interactionRect() {
    const p = state.player;
    const pad = 18;
    if (p.facing === "up") return { x: p.x - 6, y: p.y - pad, w: p.w + 12, h: pad };
    if (p.facing === "down") return { x: p.x - 6, y: p.y + p.h, w: p.w + 12, h: pad };
    if (p.facing === "left") return { x: p.x - pad, y: p.y - 6, w: pad, h: p.h + 12 };
    return { x: p.x + p.w, y: p.y - 6, w: pad, h: p.h + 12 };
  }

  function tryInteractNpc(target) {
    const room = currentRoom();
    for (const npc of room.npcs || []) {
      const rect = { x: npc.x, y: npc.y, w: 26, h: 32 };
      if (!rectsOverlap(target, rect)) continue;
      if (npc.shop) {
        openShop(npc.id);
        return true;
      }
      talkNpc(npc.id);
      return true;
    }
    return false;
  }

  function talkNpc(id) {
    const seen = flag(`talked_${id}`);
    setFlag(`talked_${id}`);
    if (id === "inlet") {
      if (state.keyItems.includes("minuteTag") && !flag("inletQuestDone")) {
        setFlag("inletQuestDone");
        state.keyItems = state.keyItems.filter((item) => item !== "minuteTag");
        state.inventory.push("warmTea");
        state.player.tokens += 3;
        startDialogue(content.npcText.inlet.done.concat(["You received Warm Tea and 3 tokens."]), () => {
          state.scene = "explore";
        });
        return;
      }
      const lines = flag("inletQuestDone") ? content.npcText.inlet.after : seen ? content.npcText.inlet.waiting : content.npcText.inlet.first;
      startDialogue(lines, () => {
        state.scene = "explore";
      });
      return;
    }
    const record = content.npcText[id];
    const lines = seen ? (record?.later || record?.first || ["They have nothing new to say."]) : (record?.first || ["They look at you with original placeholder concern."]);
    startDialogue(lines, () => {
      state.scene = "explore";
    });
  }

  function tryInteractProp(target) {
    const room = currentRoom();
    for (const prop of room.props || []) {
      if (!rectsOverlap(target, prop)) continue;
      interactProp(prop);
      return true;
    }
    return false;
  }

  function interactProp(prop) {
    if (prop.kind === "clock") {
      const lines = flag("murmurwickDone")
        ? ["The clock breathes at 12:00.", "It seems proud of the minute you made."]
        : ["The clock is holding its breath at 11:59.", "Something inside it whispers, 'soon, but not yet.'"];
      startDialogue(lines, () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "desk") {
      startChoice("The save desk opens one neat drawer.", ["Save", "Rest", "Leave"], (choice) => {
        if (choice === 0) saveGame();
        if (choice === 1) {
          state.player.hp = state.player.maxHp;
          showToast("You rested until the minute stopped aching.");
        }
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "lever") {
      setFlag("platformLever");
      startDialogue(["You pull the brass lever.", "Somewhere north, a gate stops chewing the scenery."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "bellSwitch") {
      ringBell(prop.order);
      return;
    }
    if (prop.kind === "finalDoor") {
      triggerEnding();
      return;
    }
    if (prop.kind === "jukebox") {
      startDialogue(["The jukebox contains no songs.", "It plays a respectful pause anyway."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "sign") {
      startDialogue(["SIGN: DO NOT RUN ON THE PLATFORM.", "Someone added: unless the hour is chasing you."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "plaque") {
      const lines = state.roomId === "bellAtrium"
        ? ["A plaque reads: first the left remembers, then the right answers, then the center tells the truth."]
        : ["The plaque is alphabetized by uncertainty."];
      startDialogue(lines, () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "blackboard") {
      startDialogue(["The blackboard reads: LATE WORK ACCEPTED IF IT ARRIVES CHANGED.", "A smaller note says: please stop changing into geese."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "fountain") {
      startDialogue(["The fountain is full of detention slips folded into boats.", "One boat is serving a six-week sentence for splashing."] , () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "mirror") {
      const line = state.stats.defeated > state.stats.spared
        ? "Your reflection looks early for a fight."
        : "Your reflection looks like it has been listening.";
      startDialogue([line, "It waves half a second after you do."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "spotlight") {
      startDialogue(["The spotlight points at an empty chair.", "The chair refuses to comment without representation."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "poster") {
      startDialogue(["POSTER: TONIGHT ONLY - The Thing You Meant To Say.", "Someone has written SOLD OUT in careful pencil."], () => {
        state.scene = "explore";
      });
      return;
    }
    if (prop.kind === "exitSign") {
      startDialogue(["EXIT SIGN: Return south to Drip Cafe, then east to Platform Run.", "Main path: Platform Run -> Bell Atrium -> Spiral Bridge -> Departure Gate."], () => {
        state.scene = "explore";
      });
    }
  }

  function ringBell(order) {
    state.bellSequence.push(order);
    if (state.bellSequence.length > 3) state.bellSequence.shift();
    const notes = [240, 320, 400];
    sounds.chord(notes[order]);
    const correct = [0, 2, 1];
    if (state.bellSequence.length === 3 && state.bellSequence.every((value, i) => value === correct[i])) {
      setFlag("bellPuzzleSolved");
      startDialogue(["The three bellstones ring one shared note.", "The northern door unlocks with a sound like relief."], () => {
        state.scene = "explore";
      });
    } else {
      showToast(["Left bell hums.", "Center bell hums.", "Right bell hums."][order]);
    }
  }

  function tryPickup(target) {
    const room = currentRoom();
    for (const pickup of room.pickups || []) {
      if (flag(pickup.flag)) continue;
      const rect = { x: pickup.x, y: pickup.y, w: 20, h: 20 };
      if (!rectsOverlap(target, rect)) continue;
      setFlag(pickup.flag);
      if (content.items[pickup.item]?.key) state.keyItems.push(pickup.item);
      else state.inventory.push(pickup.item);
      const lines = pickup.text || [`You found ${itemName(pickup.item)}.`];
      const pageReveal = pickup.item === "memoryPage" ? [content.story.revelations[countPages() - 1]].filter(Boolean) : [];
      startDialogue(lines.concat(pageReveal), () => {
        state.scene = "explore";
      });
      return true;
    }
    return false;
  }

  function openShop(id) {
    state.scene = "shop";
    state.previousScene = "explore";
    state.menu.shop = 0;
    state.menu.shopMode = "buy";
    state.shop = {
      id,
      items: ["warmTea", "staticCandy", "clockfruit", "hushMint"],
      prices: { warmTea: 3, staticCandy: 2, clockfruit: 5, hushMint: 4 },
    };
    if (!flag(`talked_${id}`)) {
      setFlag(`talked_${id}`);
      showToast("Drip nods like a kettle.");
    }
  }

  function updateShop() {
    const shop = state.shop;
    if (!shop) {
      state.scene = "explore";
      return;
    }
    const options = shop.items.concat(["Leave"]);
    menuMove("shop", options.length, "vertical");
    const clicked = clickedMenu(96, 158, 240, options.length, 34);
    if (clicked >= 0) state.menu.shop = clicked;
    if (just("cancel")) {
      state.scene = "explore";
      return;
    }
    if (just("confirm") || clicked >= 0) {
      const item = options[state.menu.shop];
      if (item === "Leave") {
        state.scene = "explore";
        return;
      }
      const price = shop.prices[item];
      if (state.player.tokens >= price) {
        state.player.tokens -= price;
        state.inventory.push(item);
        sounds.chord(420);
        showToast(`Bought ${itemName(item)}.`);
      } else {
        sounds.tone(130, 0.08, "triangle", 0.04);
        showToast("Not enough tokens.");
      }
    }
  }

  function menuMove(key, length, mode) {
    if (mode === "horizontal") {
      if (just("left")) {
        state.menu[key] = (state.menu[key] + length - 1) % length;
        sounds.tone(330, 0.035);
      }
      if (just("right")) {
        state.menu[key] = (state.menu[key] + 1) % length;
        sounds.tone(330, 0.035);
      }
    } else {
      if (just("up")) {
        state.menu[key] = (state.menu[key] + length - 1) % length;
        sounds.tone(330, 0.035);
      }
      if (just("down")) {
        state.menu[key] = (state.menu[key] + 1) % length;
        sounds.tone(330, 0.035);
      }
    }
  }

  function clickedMenu(x, y, w, length, rowH) {
    for (const point of pointers) {
      for (let i = 0; i < length; i += 1) {
        if (pointInRect(point, { x, y: y + i * rowH, w, h: rowH - 4 })) return i;
      }
    }
    return -1;
  }

  function startBattle(enemyId, triggerId) {
    const data = clone(content.enemies[enemyId]);
    state.scene = "battle";
    sounds.musicStep = 0;
    sounds.musicTimer = 0;
    state.battle = {
      enemyId,
      triggerId,
      enemy: data,
      hp: data.maxHp,
      mercy: 0,
      phase: "text",
      text: data.intro.slice(),
      textIndex: 0,
      textChar: 0,
      textDone: false,
      nextPhase: "menu",
      mainIndex: 0,
      listIndex: 0,
      focus: "main",
      box: { x: 180, y: 246, w: 280, h: 146 },
      soul: { x: 320, y: 320, r: 6, speed: 164 },
      bullets: [],
      attack: data.attacks[0],
      attackClock: 0,
      defenseTimer: 0,
      hitsThisTurn: 0,
      grazesThisTurn: 0,
      defenseDuration: data.boss ? 7.4 : 5.8,
      invuln: 0,
      turn: 0,
      fight: { cursor: 0, dir: 1, power: 0, resolved: false },
      lastAction: "",
      mercyReady: false,
      sansAttacks: 0,
      sansPendingWin: false,
      dangerMod: 0,
      difficulty: battleDifficulty(data),
    };
    state.stats.battles += 1;
    state.cameraShake = 0.2;
    sounds.tone(150, 0.14, "sawtooth", 0.04);
  }

  function battleText(lines, nextPhase = "menu") {
    const b = state.battle;
    b.phase = "text";
    b.text = paginateLines(Array.isArray(lines) ? lines : [lines], 382, 17, 4);
    b.textIndex = 0;
    b.textChar = 0;
    b.textDone = false;
    b.nextPhase = nextPhase;
    b.attackClock = 0;
  }

  function paginateLines(lines, maxWidth, size, maxLines) {
    const pages = [];
    for (const raw of lines) {
      const wrapped = wrapTextLines(String(raw), maxWidth, size);
      if (!wrapped.length) {
        pages.push("");
        continue;
      }
      for (let i = 0; i < wrapped.length; i += maxLines) {
        pages.push(wrapped.slice(i, i + maxLines).join(" "));
      }
    }
    return pages;
  }

  function updateBattle(dt) {
    const b = state.battle;
    if (!b) return;
    if (b.phase === "text") updateBattleText(dt);
    else if (b.phase === "menu") updateBattleMenu();
    else if (b.phase === "act") updateBattleAct();
    else if (b.phase === "item") updateBattleItem();
    else if (b.phase === "mercy") updateBattleMercy();
    else if (b.phase === "fight") updateBattleFight(dt);
    else if (b.phase === "defense") updateBattleDefense(dt);
  }

  function updateBattleText(dt) {
    const b = state.battle;
    b.attackClock += dt;
    const line = b.text[b.textIndex] || "";
    const speed = keys.has("confirm") ? 0.006 : 0.02;
    while (b.attackClock >= speed && b.textChar < line.length) {
      b.textChar += 1;
      b.attackClock -= speed;
      if (line[b.textChar - 1] && line[b.textChar - 1] !== " ") sounds.tone(390 + (b.textChar % 5) * 18, 0.014, "square", 0.011);
    }
    b.textDone = b.textChar >= line.length;
    if (just("confirm")) {
      if (!b.textDone) {
        b.textChar = line.length;
        b.textDone = true;
      } else if (b.textIndex < b.text.length - 1) {
        b.textIndex += 1;
        b.textChar = 0;
        b.textDone = false;
        b.attackClock = 0;
      } else if (b.nextPhase === "defense") {
        startDefense();
      } else {
        b.phase = b.nextPhase;
      }
    }
  }

  function updateBattleMenu() {
    const b = state.battle;
    const actions = ["Fight", "Act", "Item", "Mercy"];
    if (just("left")) {
      b.mainIndex = (b.mainIndex + 3) % 4;
      sounds.tone(320, 0.035);
    }
    if (just("right")) {
      b.mainIndex = (b.mainIndex + 1) % 4;
      sounds.tone(320, 0.035);
    }
    const clicked = clickedBattleButtons();
    if (clicked >= 0) b.mainIndex = clicked;
    if (just("confirm") || clicked >= 0) {
      const action = actions[b.mainIndex].toLowerCase();
      b.phase = action;
      b.listIndex = 0;
      if (action === "fight") {
        b.fight = { cursor: 0, dir: 1, power: 0, resolved: false };
      }
      showToast(actions[b.mainIndex].toUpperCase(), 0.7);
      sounds.tone(560, 0.05);
    }
  }

  function updateBattleAct() {
    const b = state.battle;
    const acts = [{ name: "Info", info: true }, ...b.enemy.acts];
    if (just("up")) {
      b.listIndex = (b.listIndex + acts.length - 1) % acts.length;
      sounds.tone(320, 0.035);
    }
    if (just("down")) {
      b.listIndex = (b.listIndex + 1) % acts.length;
      sounds.tone(320, 0.035);
    }
    const clicked = clickedMenu(96, 280, 250, acts.length, 28);
    if (clicked >= 0) b.listIndex = clicked;
    if (just("cancel")) {
      b.phase = "menu";
      return;
    }
    if (just("confirm") || clicked >= 0) {
      const act = acts[b.listIndex];
      if (act.info) {
        const status = b.enemy.secretBoss
          ? `Protocol progress ${b.sansAttacks}/20 attacks. MERCY command is locked. LV pressure ${b.difficulty}.`
          : `HP ${b.hp}/${b.enemy.maxHp}. Mercy ${b.mercy}/${b.enemy.mercyGoal}. LV pressure ${b.difficulty}.`;
        battleText([`${b.enemy.name}: ${b.enemy.check}`, status], "menu");
        return;
      }
      if (act.requiresPages && countPages() < act.requiresPages) {
        battleText(["You try to remember, but the pages are incomplete.", `${3 - countPages()} Memory Page(s) still feel absent.`], "menu");
        return;
      }
      b.lastAction = act.name;
      if (b.enemy.secretBoss) {
        if (act.calm) b.dangerMod = Math.max(b.dangerMod, act.calm);
        const remaining = Math.max(0, 20 - b.sansAttacks);
        const extra = [
          "MERCY stays locked. The only exit is to attack and survive.",
          `${remaining} committed attack(s) remain.`,
        ];
        battleText(act.text.concat(extra), "defense");
        return;
      }
      if (b.enemyId === "overtimeWarden" || b.enemyId === "fracturePrefect") {
        b.dangerMod = Math.max(b.dangerMod, 1);
      }
      b.mercy = clamp(b.mercy + act.mercy + mercyBonus(), 0, b.enemy.mercyGoal);
      b.mercyReady = b.mercy >= b.enemy.mercyGoal;
      const extra = b.mercyReady ? [`${b.enemy.name} is ready for MERCY.`] : [`Mercy ${b.mercy}/${b.enemy.mercyGoal}.`];
      battleText(act.text.concat(extra), "defense");
    }
  }

  function updateBattleItem() {
    const b = state.battle;
    const items = state.inventory.length ? state.inventory : ["none"];
    if (just("up")) {
      b.listIndex = (b.listIndex + items.length - 1) % items.length;
      sounds.tone(320, 0.035);
    }
    if (just("down")) {
      b.listIndex = (b.listIndex + 1) % items.length;
      sounds.tone(320, 0.035);
    }
    const clicked = clickedMenu(96, 280, 290, items.length, 28);
    if (clicked >= 0) b.listIndex = clicked;
    if (just("cancel")) {
      b.phase = "menu";
      return;
    }
    if (just("confirm") || clicked >= 0) {
      if (!state.inventory.length) {
        battleText("Your pockets contain only dramatic lint.", "menu");
        return;
      }
      const id = state.inventory.splice(b.listIndex, 1)[0];
      const item = content.items[id];
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + (item.heal || 0));
      if (item.calm) b.dangerMod = Math.max(b.dangerMod, item.calm);
      if (b.enemyId === "overtimeWarden" || b.enemyId === "fracturePrefect") {
        b.dangerMod = Math.max(b.dangerMod, 1);
      }
      if (item.mercy && !b.enemy.secretBoss) {
        b.mercy = clamp(b.mercy + item.mercy, 0, b.enemy.mercyGoal);
        b.mercyReady = b.mercy >= b.enemy.mercyGoal;
      }
      const extra = b.enemy.secretBoss && item.mercy ? "The MERCY command stays locked." : `HP ${state.player.hp}/${state.player.maxHp}.`;
      battleText([`You used ${item.name}.`, item.desc, extra], "defense");
    }
  }

  function updateBattleMercy() {
    const b = state.battle;
    if (b.enemy.secretBoss) {
      const options = ["Reject Mercy", "Back"];
      if (just("up")) {
        b.listIndex = (b.listIndex + options.length - 1) % options.length;
        sounds.tone(320, 0.035);
      }
      if (just("down")) {
        b.listIndex = (b.listIndex + 1) % options.length;
        sounds.tone(320, 0.035);
      }
      const clicked = clickedMenu(96, 284, 250, options.length, 30);
      if (clicked >= 0) b.listIndex = clicked;
      if (just("cancel")) {
        b.phase = "menu";
        return;
      }
      if (just("confirm") || clicked >= 0) {
        const option = options[b.listIndex];
        if (option === "Back") {
          b.phase = "menu";
          return;
        }
        battleText([
          "MERCY command rejected.",
          "S.A.N.S. Protocol only respects continued attacks.",
          `${Math.max(0, 20 - b.sansAttacks)} committed attack(s) remain.`,
        ], "defense");
      }
      return;
    }
    const options = b.mercyReady ? ["Spare", "Encourage", "Back"] : ["Encourage", "Back"];
    if (just("up")) {
      b.listIndex = (b.listIndex + options.length - 1) % options.length;
      sounds.tone(320, 0.035);
    }
    if (just("down")) {
      b.listIndex = (b.listIndex + 1) % options.length;
      sounds.tone(320, 0.035);
    }
    const clicked = clickedMenu(96, 284, 250, options.length, 30);
    if (clicked >= 0) b.listIndex = clicked;
    if (just("cancel")) {
      b.phase = "menu";
      return;
    }
    if (just("confirm") || clicked >= 0) {
      const option = options[b.listIndex];
      if (option === "Spare") {
        finishBattle("spare");
      } else if (option === "Encourage") {
        b.mercy = clamp(b.mercy + (b.enemy.secretBoss ? 2 : 1), 0, b.enemy.mercyGoal);
        b.mercyReady = b.mercy >= b.enemy.mercyGoal;
        battleText([`You encourage ${b.enemy.name} to choose a softer exit.`, b.mercyReady ? "It can be spared now." : `Mercy ${b.mercy}/${b.enemy.mercyGoal}.`], "defense");
      } else {
        b.phase = "menu";
      }
    }
  }

  function updateBattleFight(dt) {
    const b = state.battle;
    const fight = b.fight;
    fight.cursor += fight.dir * dt * 360;
    if (fight.cursor > 220) {
      fight.cursor = 220;
      fight.dir = -1;
    }
    if (fight.cursor < 0) {
      fight.cursor = 0;
      fight.dir = 1;
    }
    if (just("cancel")) {
      b.phase = "menu";
      return;
    }
    if (just("confirm")) {
      const dist = Math.abs(fight.cursor - 110);
      const accuracy = clamp(1 - dist / 110, 0.12, 1);
      if (b.enemy.secretBoss) {
        b.sansAttacks = Math.min(20, b.sansAttacks + 1);
        b.sansPendingWin = b.sansAttacks >= 20;
        b.hp = b.enemy.maxHp;
        const remaining = Math.max(0, 20 - b.sansAttacks);
        const perfect = accuracy > 0.82;
        addFloater(W / 2, 198, "MISS", colors.blue);
        burst(W / 2 + (Math.random() > 0.5 ? 34 : -34), 158, perfect ? colors.gold : colors.blue, perfect ? 18 : 12);
        state.hitStop = 0.045;
        state.cameraShake = 0.28;
        sounds.tone(perfect ? 420 : 260, 0.08, "square", 0.035);
        const lines = b.sansPendingWin
          ? [
              "S.A.N.S. Protocol dodges again.",
              "The twentieth attack tears a hole in its command loop.",
              "Survive this last pattern.",
            ]
          : [
              perfect ? "Perfect timing. It dodges anyway." : "Your attack lands exactly where it was one frame ago.",
              `S.A.N.S. Protocol cannot be hit. ${remaining} committed attack(s) remain.`,
            ];
        battleText(lines, "defense");
        return;
      }
      const damage = Math.max(2, Math.round((6 + Math.random() * 5) * accuracy));
      b.hp = Math.max(0, b.hp - damage);
      b.mercy = Math.max(0, b.mercy - 1);
      addFloater(W / 2, 198, `-${damage}`, colors.red);
      burst(W / 2, 158, accuracy > 0.82 ? colors.gold : colors.red, accuracy > 0.82 ? 18 : 10);
      state.hitStop = 0.06;
      state.cameraShake = 0.22;
      sounds.tone(120 + accuracy * 160, 0.1, "sawtooth", 0.04);
      if (b.hp <= 0) {
        finishBattle("fight");
      } else {
        battleText([`You hit ${b.enemy.name} for ${damage} damage.`, accuracy > 0.82 ? "Clean timing. The air winces." : "The hit lands unevenly.", `Enemy HP ${b.hp}/${b.enemy.maxHp}.`], "defense");
      }
    }
  }

  function startDefense() {
    const b = state.battle;
    b.phase = "defense";
    b.defenseTimer = 0;
    b.attackClock = 0;
    b.invuln = 0;
    b.hitsThisTurn = 0;
    b.grazesThisTurn = 0;
    b.turn += 1;
    b.bullets = [];
    if (b.enemy.secretBoss) {
      const script = ["boneRush", "blueBones", "skullBeam", "gravitySnap", "boneSpiral", "blueBones", "boneRush", "skullBeam"];
      b.attack = script[(b.turn - 1) % script.length];
    } else {
      const choices = b.enemy.attacks.filter((attack) => attack !== b.attack);
      b.attack = choices[Math.floor(Math.random() * choices.length)] || b.enemy.attacks[b.turn % b.enemy.attacks.length];
    }
    b.secondaryAttack = Math.random() < (b.enemy.secretBoss ? (b.turn > 5 ? 0.22 : 0) : 0.65) && b.enemy.attacks.length > 1
      ? b.enemy.attacks[Math.floor(Math.random() * b.enemy.attacks.length)]
      : "";
    if (b.secondaryAttack === b.attack) b.secondaryAttack = "";
    b.variant = Math.floor(Math.random() * 4);
    b.feintClock = 0;
    b.soul.x = b.box.x + b.box.w / 2;
    b.soul.y = b.box.y + b.box.h / 2;
    b.defenseDuration = b.enemy.boss ? 7.4 : 5.8;
    b.defenseDuration += Math.min(1.6, b.difficulty * 0.18);
    if (b.enemy.secretBoss) b.defenseDuration = 5.4 + Math.min(0.8, b.turn * 0.08);
    if (b.dangerMod) b.defenseDuration = Math.max(3.6, b.defenseDuration - 0.9);
    showToast(attackTell(b.attack, b.secondaryAttack), 1.5);
  }

  function attackTell(primary, secondary) {
    const names = {
      drizzle: "Falling pattern",
      inkDrops: "Ink rain",
      murmurFlame: "Candle fan",
      paperCuts: "Paper cuts",
      bellLanes: "Bell lanes",
      moonfall: "Moonfall",
      mirrorSteps: "Mirror steps",
      wardenClock: "Clock hands",
      boneRush: "Bone rush",
      blueBones: "Blue bones",
      skullBeam: "Skull beam",
      gravitySnap: "Gravity snap",
      boneSpiral: "Bone spiral",
    };
    const label = secondary ? `${names[primary] || primary} + ${names[secondary] || secondary}` : (names[primary] || primary);
    return primary === "blueBones" ? `${label}: stand still` : label;
  }

  function updateBattleDefense(dt) {
    const b = state.battle;
    const soul = b.soul;
    let dx = 0;
    let dy = 0;
    if (keys.has("up")) dy -= 1;
    if (keys.has("down")) dy += 1;
    if (keys.has("left")) dx -= 1;
    if (keys.has("right")) dx += 1;
    const soulMoving = Boolean(dx || dy);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      soul.x += (dx / len) * soul.speed * dt;
      soul.y += (dy / len) * soul.speed * dt;
    }
    soul.x = clamp(soul.x, b.box.x + soul.r, b.box.x + b.box.w - soul.r);
    soul.y = clamp(soul.y, b.box.y + soul.r, b.box.y + b.box.h - soul.r);
    b.defenseTimer += dt;
    b.attackClock += dt;
    b.invuln = Math.max(0, b.invuln - dt);
    spawnBullets(b);
    for (const bullet of b.bullets) {
      if (bullet.delay > 0) {
        bullet.delay -= dt;
        continue;
      }
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.wave) bullet.y += Math.sin((b.defenseTimer + bullet.phase) * 6) * bullet.wave * dt;
      bullet.life -= dt;
      const graze = !bullet.grazed && !circleHit(soul, bullet) && Math.hypot(soul.x - bullet.x, soul.y - bullet.y) < soul.r + bullet.r * BULLET_HIT_SCALE + 10;
      if (graze) {
        bullet.grazed = true;
        b.grazesThisTurn += 1;
        state.player.tokens += 1;
        addFloater(soul.x, soul.y - 14, "+1", colors.gold);
        sounds.tone(720, 0.035, "triangle", 0.035);
      }
      if (circleHit(soul, bullet) && b.invuln <= 0 && (!bullet.stillOnly || soulMoving)) {
        const difficultyDamage = b.enemy.secretBoss
          ? Math.floor(b.difficulty / 2)
          : b.enemyId === "overtimeWarden"
            ? Math.max(1, Math.floor(b.difficulty * 0.55))
            : b.enemyId === "fracturePrefect"
              ? Math.max(1, Math.floor(b.difficulty * 0.6))
            : b.difficulty;
        const damage = Math.max(1, bullet.damage + difficultyDamage - (b.dangerMod || 0));
        b.hitsThisTurn += 1;
        state.player.hp = Math.max(0, state.player.hp - damage);
        addFloater(soul.x, soul.y - 18, `-${damage}`, colors.red);
        bullet.life = 0;
        bullet.spent = true;
        b.invuln = b.enemy.secretBoss ? 0.56 : 0.82;
        state.cameraShake = 0.18;
        state.hitStop = b.enemy.secretBoss ? 0.015 : 0.07;
        sounds.tone(86, 0.12, "sawtooth", 0.055);
        burst(soul.x, soul.y, colors.red, 8);
      }
    }
    b.bullets = b.bullets.filter((bullet) => bullet.life > 0 && bullet.x > b.box.x - 90 && bullet.x < b.box.x + b.box.w + 90 && bullet.y > b.box.y - 90 && bullet.y < b.box.y + b.box.h + 90);
    if (state.player.hp <= 0) {
      state.scene = "gameover";
      state.battle = null;
      state.dialogue = null;
      sounds.tone(80, 0.35, "sawtooth", 0.035);
      return;
    }
    if (b.defenseTimer >= b.defenseDuration) {
      b.dangerMod = 0;
      if (b.enemy.secretBoss && b.sansPendingWin) {
        finishBattle("fight");
        return;
      }
      if (b.enemy.secretBoss && (b.hitsThisTurn === 0 || b.grazesThisTurn >= 4)) {
        const heal = b.hitsThisTurn === 0 ? 4 : 2;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
        addFloater(b.soul.x, b.soul.y - 26, `+${heal}`, colors.green);
      }
      if ((b.enemyId === "overtimeWarden" || b.enemyId === "fracturePrefect") && b.hitsThisTurn === 0) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
        addFloater(b.soul.x, b.soul.y - 26, "+3", colors.green);
      }
      const grade = b.hitsThisTurn === 0
        ? b.grazesThisTurn > 3 ? "You danced dangerously close and stayed untouched." : "You avoided every hit."
        : b.hitsThisTurn === 1 ? "You took one hit and kept your footing." : "The attack left bruises.";
      const status = b.enemy.secretBoss
        ? `${Math.max(0, 20 - b.sansAttacks)} committed attack(s) remain. MERCY remains locked.`
        : b.mercyReady
          ? `${b.enemy.name} is ready for MERCY.`
          : b.mercy > 0
            ? `${b.enemy.name} is wavering. Mercy ${b.mercy}/${b.enemy.mercyGoal}.`
            : `${b.enemy.name} studies your next choice.`;
      battleText([grade, status], "menu");
    }
  }

  function mercyBonus() {
    return state.stats.spared >= 4 ? 1 : 0;
  }

  function battleDifficulty(enemy) {
    if (enemy.secretBoss) return 4 + Math.floor(Math.max(0, state.player.lv - 1) / 2);
    return Math.max(0, state.player.lv - 1) + (enemy.boss ? 2 : 0) + Math.floor(state.stats.battles / 4);
  }

  function gainExp(amount) {
    state.player.exp += amount;
    const nextLv = 1 + Math.floor(state.player.exp / 10);
    if (nextLv > state.player.lv) {
      const gained = nextLv - state.player.lv;
      state.player.lv = nextLv;
      state.player.maxHp += gained * 4;
      state.player.hp = state.player.maxHp;
      showToast(`LV rose to ${state.player.lv}.`);
    }
  }

  function addTimeDebt(amount, reason = "") {
    state.stats.timeDebt = clamp((state.stats.timeDebt || 0) + amount, 0, 99);
    if (reason) showToast(`${amount > 0 ? "+" : ""}${amount} debt: ${reason}`, 2.2);
    maybeGraceInterject();
  }

  function addRelief(amount, reason = "") {
    state.stats.relief = clamp((state.stats.relief || 0) + amount, 0, 99);
    if (amount > 0) state.stats.timeDebt = Math.max(0, (state.stats.timeDebt || 0) - Math.ceil(amount / 2));
    if (reason) showToast(`+${amount} relief: ${reason}`, 2.2);
    maybeGraceInterject();
  }

  function maybeGraceInterject() {
    const debt = state.stats.timeDebt || 0;
    const warnings = state.stats.graceWarnings || 0;
    const thresholds = [8, 18, 32, 50];
    if (warnings >= thresholds.length || debt < thresholds[warnings] || state.scene === "battle") return;
    state.stats.graceWarnings = warnings + 1;
    const lines = [
      "PRINCIPAL GRACE: Debt is not punishment. It is arithmetic with a spine.",
      "PRINCIPAL GRACE: Every shortcut sends an invoice.",
      "PRINCIPAL GRACE: Keep borrowing. The hour has excellent memory.",
      "PRINCIPAL GRACE: At this rate, child, you will graduate into a locked door.",
    ];
    startDialogue([lines[warnings]], () => {
      state.scene = "explore";
    });
  }

  function offerBattleConsequence(b, spare) {
    const prompt = spare
      ? `${b.enemy.name} leaves behind a quiet minute. What do you do with it?`
      : `${b.enemy.name} collapses into a sharp minute. What do you take from it?`;
    const choices = spare
      ? ["Heal", "Lower Debt", "Gain Tokens"]
      : ["Take Power", "Take Tokens", "Walk Away"];
    startChoice(prompt, choices, (choice) => {
      if (spare) {
        if (choice === 0) {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
          addRelief(2, "kindness rested");
        } else if (choice === 1) {
          addRelief(5, "debt forgiven");
        } else {
          state.player.tokens += 4;
          addRelief(1, "mercy paid forward");
        }
      } else {
        if (choice === 0) {
          gainExp(3);
          addTimeDebt(5, "power taken");
        } else if (choice === 1) {
          state.player.tokens += 6;
          addTimeDebt(3, "profit taken");
        } else {
          addTimeDebt(1, "silence kept");
        }
      }
      state.scene = "explore";
    });
  }

  function finishBattle(kind) {
    const b = state.battle;
    const spare = kind === "spare";
    if (spare) {
      state.stats.spared += 1;
      addRelief(2, `${b.enemy.name} spared`);
    }
    else {
      state.stats.defeated += 1;
      gainExp(b.enemy.exp || Math.max(3, Math.round((b.enemy.maxHp || 20) / 5)));
      addTimeDebt(3, `${b.enemy.name} defeated`);
    }
    state.player.tokens += b.enemy.reward || 1;
    setFlag(`${b.triggerId}Done`);
    if (!b.triggerId.startsWith("random")) setFlag(`${b.enemyId}Done`);
    if (b.enemyId === "murmurwick") setFlag("murmurwickDone");
    if (b.enemyId === "bellwight") setFlag("bellwightDone");
    if (b.enemyId === "overtimeWarden") setFlag("wardenDone");
    if (b.enemy.routeBoss) state.stats.routeBossDone = true;
    if (b.enemy.secretBoss && !flag("sansProtocolReward")) {
      setFlag("sansProtocolReward");
      state.keyItems.push("boneWhitePass");
      state.player.hp = state.player.maxHp;
      state.player.tokens += 25;
      burst(W / 2, 156, colors.blue, 32);
    }
    state.battle = null;
    state.scene = "dialogue";
    const lines = (spare ? b.enemy.spareText : b.enemy.defeatText).concat([
      `You gained ${b.enemy.reward || 1} token(s).`,
      spare ? "LV unchanged." : `EXP ${state.player.exp}. LV ${state.player.lv}.`,
    ]);
    startDialogue(lines, () => {
      showToast(spare ? "Mercy changed the room." : "The room remembers the damage.");
      offerBattleConsequence(b, spare);
    });
  }

  function spawnBullets(b) {
    const attack = b.attack;
    const box = b.box;
    const before = b.bullets.length;
    const baseRate = {
      drizzle: 0.36,
      sweep: 0.42,
      rings: 0.48,
      inkDrops: 0.31,
      lanes: 0.58,
      waves: 0.28,
      spiral: 0.18,
      zigzag: 0.34,
      orbit: 0.55,
      bellLanes: 0.62,
      wardenClock: 0.26,
      chalkDust: 0.24,
      paperCuts: 0.33,
      moonfall: 0.52,
      principalInk: 0.29,
      mirrorSteps: 0.38,
      murmurFlame: 0.26,
      puddleRise: 0.32,
      clockHands: 0.24,
      receiptStorm: 0.22,
      chalkBoard: 0.4,
      hallPass: 0.36,
      attendanceBeam: 0.44,
      bellToll: 0.5,
      overtimeSweep: 0.34,
      detentionStamp: 0.42,
      rankLines: 0.3,
      echoBox: 0.28,
      boneRush: 0.16,
      blueBones: 0.42,
      skullBeam: 0.62,
      gravitySnap: 0.68,
      boneSpiral: 0.18,
    }[attack] || 0.4;
    const rate = Math.max(0.12, baseRate - b.difficulty * 0.018);
    if (b.attackClock < rate) return;
    b.attackClock = 0;
    const originalAttack = b.attack;
    const useSecondary = b.secondaryAttack && Math.random() < 0.28;
    const activeAttack = useSecondary ? b.secondaryAttack : originalAttack;
    b.attack = activeAttack;

    if (activeAttack === "boneRush") {
      const fromLeft = Math.random() > 0.5;
      const lanes = [box.y + 24, box.y + 54, box.y + 84, box.y + 114];
      const safeLane = Math.floor(Math.random() * lanes.length);
      for (let i = 0; i < lanes.length; i += 1) {
        if (i === safeLane || Math.random() < 0.22) continue;
        b.bullets.push({
          x: fromLeft ? box.x - 18 - i * 30 : box.x + box.w + 18 + i * 30,
          y: lanes[i],
          vx: fromLeft ? 172 + b.difficulty * 5 : -(172 + b.difficulty * 5),
          vy: (Math.random() - 0.5) * 14,
          r: 5.5,
          life: 2.4,
          damage: 4,
          color: colors.paper,
          kind: "bone",
          delay: i === safeLane + 1 ? 0.12 : 0,
        });
      }
    } else if (activeAttack === "blueBones") {
      const lanes = [box.y + 22, box.y + 50, box.y + 78, box.y + 106, box.y + 132];
      const fromLeft = Math.floor(b.defenseTimer * 2) % 2 === 0;
      const speed = 142 + b.difficulty * 5 + Math.min(40, b.turn * 2);
      const safeLane = Math.floor((b.defenseTimer * 3 + b.turn) % lanes.length);
      for (let i = 0; i < lanes.length; i += 1) {
        if (i === safeLane) continue;
        const isBlue = (i + b.turn + Math.floor(b.defenseTimer * 2)) % 2 === 0;
        b.bullets.push({
          x: fromLeft ? box.x - 24 - i * 10 : box.x + box.w + 24 + i * 10,
          y: lanes[i],
          vx: fromLeft ? speed : -speed,
          vy: isBlue ? Math.sin(b.defenseTimer * 4 + i) * 8 : (i - safeLane) * 6,
          r: isBlue ? 8 : 7,
          life: 2.6,
          damage: isBlue ? 4 : 5,
          color: isBlue ? colors.blue : colors.paper,
          kind: isBlue ? "blueBone" : "bone",
          stillOnly: isBlue,
          delay: 0.16 + (i % 2) * 0.08,
        });
      }
      const verticalLane = box.x + 34 + ((b.turn * 47 + Math.floor(b.defenseTimer * 90)) % Math.max(40, box.w - 68));
      b.bullets.push({
        x: verticalLane,
        y: box.y - 18,
        vx: Math.sin(b.defenseTimer * 8) * 18,
        vy: 166 + b.difficulty * 4,
        r: 6.5,
        life: 1.8,
        damage: 5,
        color: colors.paper,
        kind: "bone",
        delay: 0.28,
      });
    } else if (activeAttack === "skullBeam") {
      const y = box.y + 22 + Math.floor(Math.random() * 4) * 32;
      b.bullets.push({
        x: box.x - 26,
        y,
        vx: 210 + b.difficulty * 7,
        vy: 0,
        r: 10,
        life: 1.6,
        damage: 6,
        color: colors.blue,
        kind: "beam",
        delay: 0.42,
      });
    } else if (activeAttack === "gravitySnap") {
      const side = Math.floor(Math.random() * 4);
      const targets = [
        { x: box.x + box.w / 2, y: box.y - 14, vx: 0, vy: 205 },
        { x: box.x + box.w + 14, y: box.y + box.h / 2, vx: -205, vy: 0 },
        { x: box.x + box.w / 2, y: box.y + box.h + 14, vx: 0, vy: -205 },
        { x: box.x - 14, y: box.y + box.h / 2, vx: 205, vy: 0 },
      ];
      const t = targets[side];
      b.bullets.push({
        ...t,
        r: 9,
        life: 1.7,
        damage: 5,
        color: colors.purple,
        kind: "bone",
        delay: 0.34,
      });
    } else if (activeAttack === "boneSpiral") {
      const count = 3;
      const base = b.defenseTimer * 4.4;
      for (let i = 0; i < count; i += 1) {
        const angle = base + (Math.PI * 2 * i) / count;
        b.bullets.push({
          x: box.x + box.w / 2,
          y: box.y + box.h / 2,
          vx: Math.cos(angle) * (118 + b.difficulty * 5),
          vy: Math.sin(angle) * (118 + b.difficulty * 5),
          r: 5,
          life: 2.3,
          damage: 4,
          color: colors.paper,
          kind: "bone",
        });
      }
    } else if (activeAttack === "drizzle" || activeAttack === "inkDrops") {
      b.bullets.push({
        x: box.x + 10 + Math.random() * (box.w - 20),
        y: box.y - 10,
        vx: activeAttack === "inkDrops" ? Math.sin(b.defenseTimer * 4) * 36 : Math.sin(b.defenseTimer * 2.4) * 18,
        vy: 96 + b.difficulty * 8 + Math.random() * 58,
        r: activeAttack === "inkDrops" ? 3.5 : 4.5,
        life: 3.4,
        damage: 3,
        color: activeAttack === "inkDrops" ? colors.purple : colors.gold,
      });
    } else if (activeAttack === "murmurFlame") {
      const angle = Math.sin(b.defenseTimer * 2) * 0.8 + Math.PI / 2;
      for (let i = -1; i <= 1; i += 1) {
        b.bullets.push({
          x: box.x + box.w / 2 + i * 26,
          y: box.y - 12,
          vx: Math.cos(angle + i * 0.22) * 54,
          vy: Math.sin(angle + i * 0.22) * (120 + b.difficulty * 5),
          r: 4,
          life: 3,
          damage: 4,
          color: colors.gold,
        });
      }
    } else if (activeAttack === "sweep" || activeAttack === "zigzag" || activeAttack === "paperCuts") {
      const fromLeft = Math.random() > 0.5;
      b.bullets.push({
        x: fromLeft ? box.x - 14 : box.x + box.w + 14,
        y: box.y + 18 + Math.random() * (box.h - 36),
        vx: fromLeft ? (activeAttack === "paperCuts" ? 170 : 136) + b.difficulty * 5 : -((activeAttack === "paperCuts" ? 170 : 136) + b.difficulty * 5),
        vy: activeAttack === "paperCuts" ? (Math.random() - 0.5) * 42 : 0,
        wave: activeAttack === "zigzag" ? 80 : activeAttack === "paperCuts" ? 0 : 20,
        phase: Math.random() * Math.PI * 2,
        r: activeAttack === "paperCuts" ? 3.5 : 5,
        life: 3.2,
        damage: activeAttack === "paperCuts" ? 4 : 3,
        color: activeAttack === "paperCuts" ? colors.paper : activeAttack === "zigzag" ? colors.blue : colors.teal,
      });
    } else if (activeAttack === "lanes" || activeAttack === "bellLanes") {
      const lanes = [box.y + 26, box.y + 56, box.y + 86, box.y + 116];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const fromLeft = Math.random() > 0.5;
      for (let i = 0; i < (activeAttack === "bellLanes" ? 2 : 1); i += 1) {
        b.bullets.push({
          x: fromLeft ? box.x - 18 - i * 48 : box.x + box.w + 18 + i * 48,
          y: lane,
          vx: fromLeft ? 150 + b.difficulty * 5 : -(150 + b.difficulty * 5),
          vy: 0,
          r: activeAttack === "bellLanes" ? 6 : 5,
          life: 3,
          damage: activeAttack === "bellLanes" ? 5 : 3,
          color: activeAttack === "bellLanes" ? colors.gold : colors.paper,
        });
      }
    } else if (activeAttack === "waves") {
      b.bullets.push({
        x: box.x - 10,
        y: box.y + 24 + Math.random() * (box.h - 48),
        vx: 126 + b.difficulty * 5,
        vy: 0,
        wave: 120,
        phase: Math.random() * Math.PI * 2,
        r: 4,
        life: 3.4,
        damage: 3,
        color: colors.blue,
      });
    } else if (activeAttack === "puddleRise") {
      for (let x = box.x + 28; x < box.x + box.w; x += 52) {
        b.bullets.push({
          x,
          y: box.y + box.h + 12,
          vx: Math.sin(b.defenseTimer + x) * 20,
          vy: -(98 + b.difficulty * 5),
          r: 5,
          life: 3,
          damage: 4,
          color: colors.blue,
        });
      }
    } else if (activeAttack === "chalkDust") {
      for (let i = 0; i < 2; i += 1) {
        b.bullets.push({
          x: box.x + Math.random() * box.w,
          y: box.y + Math.random() * box.h,
          vx: (Math.random() - 0.5) * 48,
          vy: (Math.random() - 0.5) * 48,
          wave: 34,
          phase: Math.random() * Math.PI * 2,
          r: 3,
          life: 2.4,
          damage: 2,
          color: colors.paper,
        });
      }
    } else if (activeAttack === "rings" || activeAttack === "spiral" || activeAttack === "orbit") {
      const count = activeAttack === "rings" ? 6 : activeAttack === "orbit" ? 4 : 3;
      const speed = (activeAttack === "spiral" ? 116 : 82) + b.difficulty * 4;
      const base = b.defenseTimer * (activeAttack === "spiral" ? 3.2 : 1.1);
      for (let i = 0; i < count; i += 1) {
        const angle = base + (Math.PI * 2 * i) / count;
        b.bullets.push({
          x: box.x + box.w / 2,
          y: box.y + box.h / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: activeAttack === "orbit" ? 5 : 3.5,
          life: 3.1,
          damage: activeAttack === "orbit" ? 5 : 3,
          color: activeAttack === "orbit" ? colors.green : colors.purple,
        });
      }
    } else if (activeAttack === "clockHands") {
      const base = b.defenseTimer * 4;
      for (let i = 0; i < 2; i += 1) {
        const angle = base + i * Math.PI;
        b.bullets.push({
          x: box.x + box.w / 2,
          y: box.y + box.h / 2,
          vx: Math.cos(angle) * (130 + b.difficulty * 5),
          vy: Math.sin(angle) * (130 + b.difficulty * 5),
          r: 4,
          life: 2.2,
          damage: 4,
          color: colors.gold,
        });
      }
    } else if (activeAttack === "receiptStorm") {
      for (let i = 0; i < 3; i += 1) {
        const fromTop = Math.random() > 0.5;
        b.bullets.push({
          x: box.x + Math.random() * box.w,
          y: fromTop ? box.y - 10 : box.y + box.h + 10,
          vx: (Math.random() - 0.5) * 90,
          vy: fromTop ? 118 + b.difficulty * 5 : -(118 + b.difficulty * 5),
          r: 3,
          life: 2.8,
          damage: 3,
          color: colors.paper,
        });
      }
    } else if (activeAttack === "chalkBoard") {
      const y = box.y + 24 + Math.floor(Math.random() * 4) * 30;
      for (let x = box.x + 10; x < box.x + box.w; x += 26) {
        if (Math.random() < 0.24) continue;
        b.bullets.push({
          x,
          y,
          vx: 0,
          vy: 0,
          r: 4,
          life: 1.2,
          damage: 4,
          color: colors.paper,
        });
      }
    } else if (activeAttack === "hallPass") {
      const laneX = box.x + 24 + Math.floor(Math.random() * 5) * 48;
      b.bullets.push({
        x: laneX,
        y: box.y - 14,
        vx: 0,
        vy: 155 + b.difficulty * 6,
        r: 7,
        life: 2.5,
        damage: 5,
        color: colors.gold,
      });
    } else if (activeAttack === "wardenClock") {
      const angle = b.defenseTimer * 2.1;
      const positions = [
        { x: box.x + box.w / 2 + Math.cos(angle) * 116, y: box.y - 12, vx: -Math.cos(angle) * 18, vy: 88 },
        { x: box.x + box.w / 2 - Math.cos(angle) * 116, y: box.y + box.h + 12, vx: Math.cos(angle) * 18, vy: -88 },
      ];
      for (const pos of positions) {
        b.bullets.push({
          ...pos,
          r: 4.5,
          life: 3,
          damage: 4,
          color: colors.red,
        });
      }
    } else if (activeAttack === "moonfall") {
      const gaps = [box.x + 52, box.x + box.w / 2, box.x + box.w - 52];
      const gap = gaps[Math.floor(Math.random() * gaps.length)];
      for (let x = box.x + 20; x < box.x + box.w; x += 34) {
        if (Math.abs(x - gap) < 30) continue;
        b.bullets.push({
          x,
          y: box.y - 12,
          vx: Math.sin(b.defenseTimer * 3 + x) * 12,
          vy: 112 + b.difficulty * 5,
          r: 5,
          life: 3,
          damage: 5,
          color: colors.gold,
        });
      }
    } else if (activeAttack === "principalInk") {
      const side = Math.random() > 0.5 ? -1 : 1;
      const bursts = b.enemyId === "fracturePrefect" ? 2 : 3;
      for (let i = 0; i < bursts; i += 1) {
        b.bullets.push({
          x: side < 0 ? box.x - 12 - i * 22 : box.x + box.w + 12 + i * 22,
          y: box.y + 24 + Math.random() * (box.h - 48),
          vx: side < 0 ? 146 + b.difficulty * 4 : -(146 + b.difficulty * 4),
          vy: (i - (bursts - 1) / 2) * 20,
          r: 4,
          life: 2.8,
          damage: b.enemyId === "fracturePrefect" ? 4 : 5,
          color: colors.green,
          delay: b.enemyId === "fracturePrefect" ? i * 0.08 : 0,
        });
      }
    } else if (activeAttack === "attendanceBeam") {
      const y = box.y + 20 + Math.floor(Math.random() * 4) * 32;
      b.bullets.push({
        x: box.x - 20,
        y,
        vx: 210 + b.difficulty * 8,
        vy: 0,
        r: 8,
        life: 2.2,
        damage: 6,
        color: colors.gold,
      });
    } else if (activeAttack === "bellToll") {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + b.defenseTimer;
        b.bullets.push({
          x: box.x + box.w / 2 + Math.cos(angle) * 42,
          y: box.y + box.h / 2 + Math.sin(angle) * 34,
          vx: Math.cos(angle) * (88 + b.difficulty * 4),
          vy: Math.sin(angle) * (88 + b.difficulty * 4),
          r: 4,
          life: 2.6,
          damage: 5,
          color: colors.gold,
        });
      }
    } else if (activeAttack === "overtimeSweep") {
      const top = Math.random() > 0.5;
      const safeIndex = Math.floor((b.turn + Math.floor(b.defenseTimer * 2)) % 3);
      for (let i = 0; i < 3; i += 1) {
        if (i === safeIndex) continue;
        b.bullets.push({
          x: box.x + 54 + i * 82,
          y: top ? box.y - 12 - i * 8 : box.y + box.h + 12 + i * 8,
          vx: Math.sin(b.defenseTimer * 2.4 + i) * 18,
          vy: top ? 122 + b.difficulty * 4 : -(122 + b.difficulty * 4),
          r: 5,
          life: 2.8,
          damage: 4,
          color: colors.red,
          delay: i * 0.1,
        });
      }
      b.bullets.push({
        x: box.x + 46 + safeIndex * 82,
        y: top ? box.y - 18 : box.y + box.h + 18,
        vx: 0,
        vy: top ? 78 : -78,
        r: 4,
        life: 1.2,
        damage: 0,
        color: colors.gold,
        surprise: true,
      });
    } else if (activeAttack === "detentionStamp") {
      const x = box.x + 30 + Math.floor(Math.random() * 5) * 54;
      const y = box.y + 24 + Math.floor(Math.random() * 3) * 42;
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI * 2 * i) / 6;
        b.bullets.push({
          x,
          y,
          vx: Math.cos(angle) * 80,
          vy: Math.sin(angle) * 80,
          r: 4,
          life: 2.5,
          damage: 5,
          color: colors.green,
        });
      }
    } else if (activeAttack === "rankLines") {
      const fromLeft = Math.random() > 0.5;
      const rows = b.enemyId === "fracturePrefect" ? 3 : 4;
      for (let i = 0; i < rows; i += 1) {
        b.bullets.push({
          x: fromLeft ? box.x - 14 - i * 28 : box.x + box.w + 14 + i * 28,
          y: box.y + 26 + i * 36,
          vx: fromLeft ? 154 + b.difficulty * 5 : -(154 + b.difficulty * 5),
          vy: Math.sin(b.defenseTimer * 3.1 + i) * 24,
          r: 4,
          life: 2.5,
          damage: b.enemyId === "fracturePrefect" ? 4 : 5,
          color: colors.red,
          delay: b.enemyId === "fracturePrefect" ? i * 0.07 : 0,
        });
      }
    } else if (activeAttack === "mirrorSteps") {
      const targetX = b.soul.x;
      const targetY = b.soul.y;
      b.bullets.push({
        x: box.x + Math.random() * box.w,
        y: box.y - 12,
        vx: (targetX - (box.x + box.w / 2)) * 0.22,
        vy: 120 + b.difficulty * 5,
        r: 5,
        life: 3,
        damage: 5,
        color: colors.blue,
      });
      b.bullets.push({
        x: box.x + box.w + 12,
        y: targetY,
        vx: -(140 + b.difficulty * 5),
        vy: 0,
        r: 4,
        life: 3,
        damage: 4,
        color: colors.paper,
      });
    } else if (activeAttack === "echoBox") {
      const inset = 18 + (Math.floor(b.defenseTimer * 4) % 3) * 22;
      const edges = [
        { x: box.x + inset, y: box.y + inset, vx: 115, vy: 0 },
        { x: box.x + box.w - inset, y: box.y + inset, vx: 0, vy: 115 },
        { x: box.x + box.w - inset, y: box.y + box.h - inset, vx: -115, vy: 0 },
        { x: box.x + inset, y: box.y + box.h - inset, vx: 0, vy: -115 },
      ];
      for (const edge of edges) {
        b.bullets.push({
          ...edge,
          r: 4,
          life: 2.4,
          damage: 5,
          color: colors.blue,
        });
      }
    }
    stylizeNewBullets(b, before);
    b.attack = originalAttack;
  }

  function makeBullet(data, kind = "orb") {
    const jitter = data.jitter || 0;
    return {
      kind,
      angle: data.angle ?? Math.atan2(data.vy || 0, data.vx || 1),
      spin: data.spin || 0,
      pulse: data.pulse || 0,
      vx: (data.vx || 0) + (Math.random() - 0.5) * jitter,
      vy: (data.vy || 0) + (Math.random() - 0.5) * jitter,
      ...data,
    };
  }

  function stylizeNewBullets(b, startIndex) {
    for (let i = startIndex; i < b.bullets.length; i += 1) {
      const bullet = b.bullets[i];
      bullet.kind = bullet.kind || bulletKindFor(b.attack);
      bullet.angle = bullet.angle ?? Math.atan2(bullet.vy || 0, bullet.vx || 1);
      bullet.spin = bullet.spin ?? (Math.random() - 0.5) * 5;
      bullet.pulse = bullet.pulse ?? Math.random() * Math.PI * 2;
      const jitter = 0.06 + Math.min(0.16, b.difficulty * 0.012);
      bullet.vx *= 1 + (Math.random() - 0.5) * jitter;
      bullet.vy *= 1 + (Math.random() - 0.5) * jitter;
      if (b.variant === 1 && i % 2 === 0) bullet.delay = 0.18 + Math.random() * 0.22;
      if (bullet.delay > 0) bullet.tell = true;
      if (b.variant === 2) bullet.wave = (bullet.wave || 0) + 18 + Math.random() * 28;
    }

    if (Math.random() < 0.2 + Math.min(0.18, b.difficulty * 0.02)) {
      addSurpriseBullet(b);
    }
  }

  function bulletKindFor(attack) {
    if (attack.includes("Flame")) return "flame";
    if (attack.includes("ink") || attack.includes("Ink")) return "drop";
    if (attack.includes("paper") || attack.includes("receipt") || attack.includes("Pass") || attack.includes("rank")) return "paper";
    if (attack.includes("bell")) return "bell";
    if (attack.includes("chalk")) return "chalk";
    if (attack.includes("moon") || attack.includes("Beam")) return "moon";
    if (attack.includes("mirror") || attack.includes("echo")) return "diamond";
    if (attack.includes("clock") || attack.includes("Clock") || attack.includes("warden")) return "hand";
    if (attack.includes("puddle") || attack.includes("waves")) return "drop";
    if (attack.includes("Stamp")) return "stamp";
    return "orb";
  }

  function addSurpriseBullet(b) {
    const box = b.box;
    const side = Math.floor(Math.random() * 4);
    const speed = 80 + b.difficulty * 6 + Math.random() * 45;
    let x = box.x + Math.random() * box.w;
    let y = box.y + Math.random() * box.h;
    let vx = 0;
    let vy = 0;
    if (side === 0) {
      y = box.y - 12;
      vy = speed;
    } else if (side === 1) {
      x = box.x + box.w + 12;
      vx = -speed;
    } else if (side === 2) {
      y = box.y + box.h + 12;
      vy = -speed;
    } else {
      x = box.x - 12;
      vx = speed;
    }
    b.bullets.push({
      x,
      y,
      vx,
      vy,
      r: 4 + Math.random() * 2,
      life: 2.6,
      damage: 3 + Math.min(3, b.difficulty),
      color: colors.red,
      kind: "spark",
      angle: Math.atan2(vy, vx),
      spin: 6,
      surprise: true,
    });
  }

  function circleHit(soul, bullet) {
    return Math.hypot(soul.x - bullet.x, soul.y - bullet.y) < soul.r + bullet.r * BULLET_HIT_SCALE;
  }

  function clickedBattleButtons() {
    for (const point of pointers) {
      for (let i = 0; i < 4; i += 1) {
        const rect = { x: 50 + i * 138, y: 414, w: 116, h: 40 };
        if (pointInRect(point, rect)) return i;
      }
    }
    return -1;
  }

  function updateDialogue(dt) {
    const d = state.dialogue;
    if (!d) {
      state.scene = state.previousScene || "explore";
      return;
    }
    typeDialogue(d, dt);
    if (just("cancel")) {
      d.char = (d.lines[d.index] || "").length;
      d.done = true;
    }
    if (just("confirm")) advanceDialogue();
  }

  function typeDialogue(d, dt) {
    d.tick += dt;
    const line = d.lines[d.index] || "";
    const speed = keys.has("confirm") || keys.has("cancel") ? 0.003 : 0.017;
    while (d.tick >= speed && d.char < line.length) {
      d.char += 1;
      d.tick -= speed;
      if (line[d.char - 1] && line[d.char - 1] !== " ") sounds.tone(420 + (d.char % 6) * 18, 0.014, "square", 0.01);
    }
    d.done = d.char >= line.length;
  }

  function advanceDialogue() {
    const d = state.dialogue;
    const line = d.lines[d.index] || "";
    if (!d.done) {
      d.char = line.length;
      d.done = true;
      return;
    }
    if (d.index < d.lines.length - 1) {
      d.index += 1;
      d.char = 0;
      d.done = false;
      d.tick = 0;
      return;
    }
    const after = d.after;
    state.dialogue = null;
    if (after) after();
    else state.scene = state.previousScene || "explore";
  }

  function updateChoice() {
    const d = state.dialogue;
    if (!d) {
      state.scene = "explore";
      return;
    }
    if (just("up")) state.menu.choice = (state.menu.choice + d.choices.length - 1) % d.choices.length;
    if (just("down")) state.menu.choice = (state.menu.choice + 1) % d.choices.length;
    const clicked = clickedMenu(76, 368, 220, d.choices.length, 26);
    if (clicked >= 0) state.menu.choice = clicked;
    if (just("cancel")) {
      state.dialogue = null;
      state.scene = state.previousScene || "explore";
    }
    if (just("confirm") || clicked >= 0) {
      const after = d.after;
      state.dialogue = null;
      if (after) after(state.menu.choice);
    }
  }

  function updateEnding(dt) {
    updateDialogue(dt);
    if (!state.dialogue) {
      sounds.stopExternal();
      state.scene = "title";
    }
  }

  function updateGameOver() {
    if (just("confirm")) {
      sounds.stopExternal();
      state.player.hp = state.player.maxHp;
      state.scene = "title";
    }
  }

  function updateJournal() {
    if (just("cancel") || just("confirm") || just("pause")) state.scene = "explore";
  }

  function triggerEnding() {
    if (!flag("wardenDone")) {
      startDialogue(["The Departure Door listens.", "It hears an unfinished hour behind you."], () => {
        state.scene = "explore";
      });
      return;
    }
    let route = "mixed";
    if (state.stats.defeated === 0) route = "mercy";
    if (state.stats.spared === 0) route = "fracture";
    if ((state.stats.timeDebt || 0) >= 40 && route === "mixed") route = "fracture";
    if ((state.stats.relief || 0) >= 18 && state.stats.defeated <= 1) route = "mercy";
    if (!state.stats.routeBossDone) {
      const bossByRoute = {
        mercy: "gracePrincipal",
        fracture: "fracturePrefect",
        mixed: "mirrorRook",
      };
      startDialogue([
        route === "mercy"
          ? "A green office door appears inside the Departure Gate."
          : route === "fracture"
            ? "A gold badge splits the Departure Gate into sharp applause."
            : "The Departure Gate becomes a mirror with your hand already on it.",
        "One last question steps forward.",
      ], () => {
        startBattle(bossByRoute[route], `routeBoss_${route}`);
      });
      return;
    }
    state.scene = "ending";
    state.dialogue = {
      lines: paginateLines(content.endings[route], 450, 17, 3),
      index: 0,
      char: 0,
      done: false,
      tick: 0,
      after: () => {
        sounds.stopExternal();
        state.scene = "title";
      },
    };
    saveGame();
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function updateFloaters(dt) {
    for (const f of state.floaters) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    state.floaters = state.floaters.filter((f) => f.life > 0);
  }

  function addFloater(x, y, label, color) {
    state.floaters.push({ x, y, label, color, life: 0.9 });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        color,
      });
    }
  }

  function draw() {
    ctx.save();
    if (state.cameraShake > 0) {
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    }
    if (state.scene === "title") drawTitle();
    else if (state.scene === "battle") drawBattle();
    else if (state.scene === "ending") drawEnding();
    else if (state.scene === "gameover") drawGameOver();
    else if (state.scene === "journal") {
      drawExplore();
      drawJournal();
    }
    else {
      drawExplore();
      if (state.scene === "dialogue" || state.scene === "choice") drawDialogue();
      if (state.scene === "shop") drawShop();
    }
    drawParticles();
    drawFloaters();
    ctx.restore();
    drawChapterCard();
    drawToast();
    if (state.fade > 0) {
      ctx.globalAlpha = clamp(state.fade * 2.5, 0, 1);
      fillRect(0, 0, W, H, colors.black);
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle() {
    fillRect(0, 0, W, H, "#06080b");
    drawStarfield();
    for (let i = 0; i < 9; i += 1) {
      const x = 86 + i * 58;
      const h = 92 + (i % 3) * 28;
      fillRect(x, 226 - h, 28, h, "rgba(245,240,220,0.035)");
      fillRect(x + 6, 226 - h + 18, 16, 3, "rgba(255,218,112,0.08)");
    }
    fillRect(92, 222, 456, 5, "rgba(255,218,112,0.18)");
    drawTitleClock(W / 2, 116);
    for (let y = 0; y < H; y += 28) {
      fillRect(0, y, W, 1, "rgba(245,240,220,0.04)");
    }
    text("UNDERlate", W / 2 + 3, 124, 50, "rgba(232,95,92,0.42)", "center");
    text("UNDERlate", W / 2, 122, 50, colors.paper, "center");
    text("The Borrowed Hour", W / 2, 164, 17, colors.dim, "center");
    const options = hasSave() ? ["Begin", "Continue", "How to Play"] : ["Begin", "How to Play"];
    for (let i = 0; i < options.length; i += 1) {
      const y = 238 + i * 38;
      const selected = state.menu.title === i;
      if (selected) strokeRect(226, y - 24, 188, 30, colors.gold, 2);
      text(`${selected ? "*" : " "} ${options[i]}`, W / 2, y, 22, selected ? colors.gold : colors.paper, "center");
    }
    text("A story about late work, borrowed time, and what choices cost.", W / 2, 420, 12, "rgba(245,240,220,0.58)", "center");
  }

  function drawTitleClock(cx, cy) {
    ctx.globalAlpha = 0.28;
    strokeRect(cx - 84, cy - 66, 168, 132, colors.gold, 2);
    strokeRect(cx - 66, cy - 50, 132, 100, colors.teal, 1);
    ctx.globalAlpha = 1;
    fillRect(cx - 3, cy - 36, 6, 42, "rgba(255,218,112,0.28)");
    fillRect(cx, cy - 3, 42, 6, "rgba(110,168,255,0.24)");
  }

  function drawChapterCard() {
    if (state.chapterTimer <= 0 || !state.chapterCard) return;
    const alpha = clamp(state.chapterTimer / 0.5, 0, 1);
    ctx.globalAlpha = Math.min(alpha, 0.94);
    fillRect(108, 72, 424, 48, "rgba(5,6,8,0.86)");
    strokeRect(108, 72, 424, 48, colors.gold, 2);
    text(state.chapterCard, W / 2, 103, 16, colors.paper, "center");
    ctx.globalAlpha = 1;
  }

  function drawExplore() {
    const room = currentRoom();
    const theme = roomThemes[room.theme] || roomThemes.hall;
    fillRect(0, 0, W, H, "#080a0d");
    drawFloor(theme, room.theme);
    drawRoomSetDressing(room.theme);
    drawDoors(room, theme);
    drawWalls(room);
    drawProps(room);
    drawPickups(room);
    drawNpcs(room);
    drawPlayer();
    drawInteractionPrompt();
    drawRoomOverlay(room, theme);
    drawHud();
  }

  function drawFloor(theme, roomTheme) {
    for (let y = 34; y < 446; y += TILE) {
      for (let x = 34; x < 606; x += TILE) {
        const even = ((x + y) / TILE) % 2 === 0;
        fillRect(x, y, TILE, TILE, even ? theme.a : theme.b);
        if ((x + y) % 96 === 0) fillRect(x + 6, y + 6, 3, 3, "rgba(245,240,220,0.07)");
      }
    }
    if (roomTheme === "bridge") {
      for (let i = 0; i < 12; i += 1) strokeRect(78 + i * 42, 70 + i * 23, 160, 26, "rgba(66,195,182,0.12)", 1);
    } else if (roomTheme === "rain") {
      for (let i = 0; i < 36; i += 1) fillRect((i * 47) % W, (i * 83 + performance.now() * 0.035) % H, 2, 12, "rgba(110,168,255,0.16)");
    } else if (roomTheme === "cafe") {
      fillRect(54, 70, 530, 260, "rgba(255,218,112,0.035)");
    } else if (roomTheme === "school") {
      for (let x = 60; x < W - 60; x += 70) fillRect(x, 74, 46, 5, "rgba(255,218,112,0.14)");
    } else if (roomTheme === "garden") {
      for (let i = 0; i < 28; i += 1) fillRect((i * 61) % W, 70 + (i * 37) % 320, 7, 10, "rgba(126,210,109,0.18)");
    } else if (roomTheme === "mirror") {
      for (let i = 0; i < 6; i += 1) strokeRect(88 + i * 78, 118, 48, 210, "rgba(110,168,255,0.16)", 1);
    } else if (roomTheme === "stage") {
      fillRect(80, 92, 480, 92, "rgba(232,95,92,0.12)");
      for (let i = 0; i < 9; i += 1) fillRect(92 + i * 50, 92, 18, 92, "rgba(0,0,0,0.18)");
    }
    fillRect(216, 170, 208, 106, theme.rug);
    strokeRect(216, 170, 208, 106, "rgba(245,240,220,0.18)", 2);
  }

  function drawRoomSetDressing(roomTheme) {
    if (roomTheme === "library") {
      for (let i = 0; i < 7; i += 1) drawBookStack(58 + i * 78, 74 + (i % 2) * 280);
    } else if (roomTheme === "cafe") {
      for (let i = 0; i < 4; i += 1) drawCafeTable(108 + i * 112, 276);
    } else if (roomTheme === "machines") {
      for (let i = 0; i < 5; i += 1) drawPipe(70 + i * 112, 72, i % 2 === 0);
    } else if (roomTheme === "dorm") {
      drawBed(70, 88);
      drawBed(452, 88);
      drawBed(70, 318);
      drawBed(452, 318);
    } else if (roomTheme === "bell") {
      for (let i = 0; i < 4; i += 1) drawHangingBell(110 + i * 130, 58);
    } else if (roomTheme === "school") {
      for (let i = 0; i < 5; i += 1) drawDeskChair(96 + i * 100, 318);
    } else if (roomTheme === "garden") {
      for (let i = 0; i < 12; i += 1) drawPlant(58 + (i * 47) % 520, 92 + (i * 71) % 300);
    } else if (roomTheme === "stage") {
      fillRect(80, 92, 480, 8, colors.gold);
      for (let i = 0; i < 10; i += 1) fillRect(90 + i * 46, 100, 22, 78, "#5a1827");
    }
  }

  function drawBookStack(x, y) {
    const books = [
      { ox: 0, oy: 0, w: 44, h: 9, c: colors.red, stripe: colors.gold },
      { ox: 4, oy: -8, w: 38, h: 8, c: colors.blue, stripe: colors.paper },
      { ox: -2, oy: -16, w: 46, h: 8, c: colors.gold, stripe: colors.ink },
      { ox: 8, oy: -23, w: 32, h: 7, c: colors.green, stripe: colors.paper },
    ];
    fillRect(x - 5, y + 7, 52, 5, colors.shadow);
    for (const book of books) {
      fillRect(x + book.ox - 1, y + book.oy - 1, book.w + 2, book.h + 2, colors.ink);
      fillRect(x + book.ox, y + book.oy, book.w, book.h, book.c);
      fillRect(x + book.ox + 5, y + book.oy + 2, 3, book.h - 4, book.stripe);
      fillRect(x + book.ox + book.w - 8, y + book.oy + 2, 4, 2, "rgba(255,255,255,0.25)");
    }
  }

  function drawCafeTable(x, y) {
    fillRect(x - 4, y + 32, 62, 6, colors.shadow);
    fillRect(x - 2, y - 2, 58, 18, colors.ink);
    fillRect(x, y, 54, 14, "#6d4936");
    fillRect(x + 3, y + 3, 48, 3, "rgba(255,218,112,0.18)");
    fillRect(x + 8, y - 11, 13, 12, colors.ink);
    fillRect(x + 9, y - 10, 11, 10, colors.paper);
    fillRect(x + 12, y - 8, 6, 2, "#c8bea7");
    fillRect(x + 30, y - 8, 12, 8, colors.ink);
    fillRect(x + 31, y - 7, 10, 6, colors.gold);
    fillRect(x + 8, y + 14, 6, 22, "#2b211d");
    fillRect(x + 40, y + 14, 6, 22, "#2b211d");
    fillRect(x + 9, y + 14, 4, 18, "rgba(245,240,220,0.1)");
  }

  function drawPipe(x, y, bent) {
    fillRect(x - 2, y - 2, 62, 14, colors.ink);
    fillRect(x, y, 58, 10, "#52666a");
    fillRect(x + 22, y, 10, bent ? 58 : 32, "#52666a");
    fillRect(x + 4, y + 3, 50, 2, "rgba(245,240,220,0.22)");
    fillRect(x + 24, y + 4, 6, bent ? 50 : 24, "rgba(0,0,0,0.18)");
    for (let i = 0; i < 3; i += 1) strokeRect(x + 8 + i * 17, y - 1, 8, 12, "#3d4d52", 1);
    if (bent) fillRect(x + 17, y + 50, 20, 7, colors.teal);
  }

  function drawBed(x, y) {
    fillRect(x - 4, y + 38, 124, 8, colors.shadow);
    fillRect(x - 2, y - 2, 120, 46, colors.ink);
    fillRect(x, y, 116, 42, "#3e2b35");
    fillRect(x + 8, y + 8, 32, 20, colors.paper);
    fillRect(x + 12, y + 12, 22, 3, "rgba(0,0,0,0.1)");
    fillRect(x + 44, y + 6, 62, 28, colors.purple);
    fillRect(x + 48, y + 10, 54, 5, "rgba(245,240,220,0.16)");
    fillRect(x + 44, y + 31, 62, 3, "#6c4d91");
    fillRect(x + 3, y + 34, 110, 6, "#2b1d25");
  }

  function drawHangingBell(x, y) {
    fillRect(x + 18, y, 4, 29, "#6b5949");
    fillRect(x + 14, y + 3, 12, 4, colors.ink);
    fillRect(x - 2, y + 26, 44, 34, colors.ink);
    fillRect(x, y + 28, 40, 30, colors.gold);
    fillRect(x + 6, y + 32, 28, 5, "rgba(255,255,255,0.24)");
    fillRect(x + 4, y + 51, 32, 4, "#b38938");
    fillRect(x + 13, y + 52, 14, 8, colors.paper);
    fillRect(x + 18, y + 60, 4, 6, colors.gold);
  }

  function drawDeskChair(x, y) {
    fillRect(x - 3, y + 36, 48, 6, colors.shadow);
    fillRect(x - 1, y - 1, 44, 22, colors.ink);
    fillRect(x, y, 42, 20, "#6b4631");
    fillRect(x + 4, y + 5, 34, 3, "rgba(255,218,112,0.18)");
    fillRect(x + 7, y - 19, 28, 20, colors.ink);
    fillRect(x + 8, y - 18, 26, 18, "#2d5e68");
    fillRect(x + 11, y - 14, 20, 3, "rgba(245,240,220,0.14)");
    fillRect(x + 6, y + 20, 5, 18, "#2b211d");
    fillRect(x + 30, y + 20, 5, 18, "#2b211d");
  }

  function drawPlant(x, y) {
    fillRect(x + 3, y + 23, 17, 4, colors.shadow);
    fillRect(x + 4, y + 11, 14, 14, colors.ink);
    fillRect(x + 5, y + 12, 12, 12, "#6a4934");
    fillRect(x + 7, y + 15, 8, 2, "rgba(255,218,112,0.16)");
    fillRect(x - 1, y + 8, 12, 6, colors.green);
    fillRect(x + 12, y + 5, 11, 6, colors.green);
    fillRect(x + 7, y - 1, 9, 10, "#9be082");
    fillRect(x + 3, y + 2, 7, 5, "#5ba44e");
    fillRect(x + 15, y + 1, 8, 5, "#5ba44e");
  }

  function drawWalls(room) {
    for (const wall of room.walls || []) {
      fillRect(wall.x, wall.y, wall.w, wall.h, colors.wall);
      fillRect(wall.x, wall.y, wall.w, Math.min(8, wall.h), colors.wallTop);
      fillRect(wall.x, wall.y + wall.h - 3, wall.w, 3, "rgba(0,0,0,0.24)");
    }
  }

  function drawDoors(room, theme) {
    for (const door of room.doors || []) {
      const open = !door.requireFlag || flag(door.requireFlag);
      fillRect(door.x - 8, door.y - 8, door.w + 16, door.h + 16, colors.ink);
      fillRect(door.x - 5, door.y - 5, door.w + 10, door.h + 10, open ? "#08090b" : "#2b211d");
      strokeRect(door.x - 5, door.y - 5, door.w + 10, door.h + 10, open ? theme.glow : "#8b6d42", 1);
      fillRect(door.x, door.y, door.w, door.h, open ? theme.glow : "#6b5949");
      if (open) {
        ctx.globalAlpha = 0.22;
        fillRect(door.x + 6, door.y + 6, door.w - 12, door.h - 12, colors.paper);
        ctx.globalAlpha = 1;
      }
      if (!open) {
        for (let i = 0; i < 4; i += 1) fillRect(door.x + 8 + i * 15, door.y + 2, 4, door.h - 4, "#2f2520");
        fillRect(door.x + door.w - 12, door.y + door.h / 2, 5, 5, colors.gold);
      }
    }
  }

  function drawProps(room) {
    for (const prop of room.props || []) {
      if (prop.kind === "clock") drawClock(prop.x, prop.y);
      else if (prop.kind === "desk") drawDesk(prop.x, prop.y);
      else if (prop.kind === "lever") drawLever(prop.x, prop.y, flag("platformLever"));
      else if (prop.kind === "bellSwitch") drawBellSwitch(prop.x, prop.y, prop.order);
      else if (prop.kind === "finalDoor") drawFinalDoor(prop.x, prop.y);
      else if (prop.kind === "jukebox") drawJukebox(prop.x, prop.y);
      else if (prop.kind === "sign" || prop.kind === "plaque") drawPlaque(prop.x, prop.y, prop.w, prop.h);
      else if (prop.kind === "blackboard") drawBlackboard(prop.x, prop.y, prop.w, prop.h);
      else if (prop.kind === "fountain") drawFountain(prop.x, prop.y);
      else if (prop.kind === "mirror") drawMirror(prop.x, prop.y, prop.w, prop.h);
      else if (prop.kind === "spotlight") drawSpotlight(prop.x, prop.y);
      else if (prop.kind === "poster") drawPoster(prop.x, prop.y, prop.w, prop.h);
      else if (prop.kind === "exitSign") drawExitSign(prop.x, prop.y, prop.w, prop.h);
    }
  }

  function drawPickups(room) {
    for (const pickup of room.pickups || []) {
      if (flag(pickup.flag)) continue;
      const item = content.items[pickup.item];
      const pulse = Math.sin(performance.now() * 0.006) * 2;
      fillRect(pickup.x + 1, pickup.y + 18, 18, 4, "rgba(0,0,0,0.38)");
      if (item?.key) {
        fillRect(pickup.x + 1, pickup.y - 1 + pulse, 18, 22, colors.ink);
        fillRect(pickup.x + 3, pickup.y + pulse, 14, 18, colors.paper);
        fillRect(pickup.x + 6, pickup.y + 5 + pulse, 8, 2, colors.dim);
        fillRect(pickup.x + 6, pickup.y + 10 + pulse, 6, 2, colors.dim);
        fillRect(pickup.x + 14, pickup.y + 15 + pulse, 3, 3, colors.gold);
      } else {
        fillRect(pickup.x + 2, pickup.y - 1 + pulse, 16, 16, colors.ink);
        fillRect(pickup.x + 4, pickup.y + pulse, 12, 12, colors.gold);
        fillRect(pickup.x + 7, pickup.y + 3 + pulse, 6, 6, colors.red);
        fillRect(pickup.x + 6, pickup.y + 2 + pulse, 4, 2, "rgba(255,255,255,0.45)");
      }
    }
  }

  function drawNpcs(room) {
    for (const npc of room.npcs || []) drawSprite(npc.sprite, npc.x, npc.y);
  }

  function drawRoomOverlay(room, theme) {
    text(room.name, 48, 62, 14, "rgba(245,240,220,0.72)");
    fillRect(34, 34, W - 68, 5, "rgba(245,240,220,0.05)");
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = theme.glow;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    panel(42, 424, 556, 34, "rgba(5,6,8,0.7)");
    text(`LV ${state.player.lv}`, 56, 447, 14, colors.gold);
    text(`HP ${state.player.hp}/${state.player.maxHp}`, 118, 447, 14, colors.paper);
    text(`TOK ${state.player.tokens}`, 250, 447, 14, colors.gold);
    text(`SP ${state.stats.spared}`, 342, 447, 14, colors.green);
    text(`DF ${state.stats.defeated}`, 426, 447, 14, colors.red);
    text(`DEBT ${state.stats.timeDebt || 0}`, 514, 447, 13, colors.red, "center");
    text(currentObjective(), 320, 418, 12, colors.dim, "center");
  }

  function currentObjective() {
    if ((state.stats.timeDebt || 0) >= 32) return "Objective: reduce Time Debt before Grace locks the hour";
    if (!flag("murmurwickDone")) return "Objective: cross the Late Hall and survive the first encounter";
    if (!flag("inletQuestDone")) return "Objective: find Courier Inlet's Minute Tag";
    if (!flag("platformLever")) return "Objective: go east from the cafe and pull the brass lever";
    if (!flag("bellPuzzleSolved")) return "Objective: solve the Bell Atrium order";
    if (!flag("bellwightDone")) return "Objective: face the Bellwight";
    if (!flag("wardenDone")) return "Objective: cross Spiral Bridge and face the Warden";
    if (!state.stats.routeBossDone) return "Objective: touch the Departure Door";
    return "Objective: touch the Departure Door again";
  }

  function drawInteractionPrompt() {
    if (!state.prompt) return;
    const x = clamp(state.player.x + state.player.w / 2 - 84, 42, W - 210);
    const y = clamp(state.player.y - 30, 48, H - 86);
    fillRect(x, y, 168, 24, "rgba(5,6,8,0.84)");
    strokeRect(x, y, 168, 24, colors.gold, 1);
    text(state.prompt, x + 84, y + 17, 12, colors.paper, "center");
  }

  function routeLabel() {
    if (state.stats.defeated === 0 && state.stats.spared > 0) return "MERCY";
    if (state.stats.spared === 0 && state.stats.defeated > 0) return "FRACTURE";
    if (state.stats.spared || state.stats.defeated) return "MIXED";
    return "UNWRITTEN";
  }

  function drawPlayer() {
    const p = state.player;
    const step = Math.floor(Math.sin(p.walk) * 2);
    drawHumanoid(p.x - 2, p.y - 4, {
      hair: "#6a4bc3",
      skin: "#d7a171",
      coat: "#2f937d",
      trim: colors.gold,
      pants: "#111417",
      accent: colors.paper,
      facing: p.facing,
      bob: step,
      scale: 1,
      satchel: true,
    });
  }

  function drawSprite(sprite, x, y) {
    const pulse = Math.sin(performance.now() * 0.004 + x * 0.01) * 1.2;
    const specs = {
      archivist: { hair: colors.gold, skin: "#d9b886", coat: "#2d5e68", trim: colors.paper, pants: "#1e3b43", accessory: "book" },
      venn: { hair: "#d9c28f", skin: "#d7a171", coat: "#5f6fb4", trim: colors.teal, pants: "#353e78", accessory: "pages" },
      drip: { hair: "#f5f0dc", skin: "#9b6c55", coat: "#7a5244", trim: colors.gold, pants: "#3b2924", accessory: "cup" },
      courier: { hair: "#c99557", skin: "#d19862", coat: "#398f78", trim: colors.gold, pants: "#1f4e42", accessory: "satchel" },
      lume: { hair: "#eff8ff", skin: "#d8f2ff", coat: "#6ea8ff", trim: colors.paper, pants: "#264e82", accessory: "halo", glow: colors.blue },
      sella: { hair: "#443045", skin: "#f0cfb0", coat: "#a875d6", trim: colors.paper, pants: "#4e376b", accessory: "ribbon" },
      echo: { hair: "#b7af98", skin: "#c8bea7", coat: "#262f37", trim: colors.teal, pants: "#111417", accessory: "echo" },
      marn: { hair: colors.gold, skin: "#d9c28f", coat: "#324f3f", trim: colors.green, pants: "#1d3128", accessory: "glasses" },
      brill: { hair: "#5ba44e", skin: "#a6784f", coat: "#567c45", trim: colors.green, pants: "#283d26", accessory: "leaves" },
      palin: { hair: colors.blue, skin: "#9dbfff", coat: "#4c5f8f", trim: colors.paper, pants: "#26324f", accessory: "mirror", alpha: 0.62 },
    };
    if (sprite === "gatekeeper") {
      drawGatekeeperSprite(x, y, pulse);
    } else if (sprite === "curtain") {
      drawCurtainSprite(x, y, pulse);
    } else {
      const spec = specs[sprite] || specs.venn;
      ctx.globalAlpha = spec.alpha || 1;
      drawHumanoid(x - 2, y - 3 + pulse, {
        hair: spec.hair,
        skin: spec.skin,
        coat: spec.coat,
        trim: spec.trim,
        pants: spec.pants,
        accent: colors.paper,
        facing: "down",
        bob: 0,
        scale: 1,
        accessory: spec.accessory,
        glow: spec.glow,
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawHumanoid(x, y, spec) {
    const bob = spec.bob || 0;
    const facing = spec.facing || "down";
    fillRect(x + 2, y + 31 + bob, 26, 5, colors.shadow);
    if (spec.glow) {
      ctx.globalAlpha *= 0.35;
      fillRect(x - 3, y - 1 + bob, 36, 35, spec.glow);
      ctx.globalAlpha /= 0.35;
    }
    fillRect(x + 6, y + 3 + bob, 18, 14, colors.ink);
    fillRect(x + 7, y + 4 + bob, 16, 12, spec.skin);
    fillRect(x + 6, y + 2 + bob, 18, 7, spec.hair);
    fillRect(x + 4, y + 12 + bob, 22, 18, colors.ink);
    fillRect(x + 5, y + 13 + bob, 20, 16, spec.coat);
    fillRect(x + 6, y + 16 + bob, 18, 3, "rgba(245,240,220,0.18)");
    fillRect(x + 14, y + 13 + bob, 2, 16, spec.trim);
    fillRect(x + 1, y + 15 + bob, 5, 12, colors.ink);
    fillRect(x + 24, y + 15 + bob, 5, 12, colors.ink);
    fillRect(x + 2, y + 16 + bob, 4, 10, spec.coat);
    fillRect(x + 24, y + 16 + bob, 4, 10, spec.coat);
    fillRect(x + 5, y + 28 + bob, 8, 6, colors.ink);
    fillRect(x + 17, y + 28 + bob, 8, 6, colors.ink);
    fillRect(x + 6, y + 28 + bob, 6, 5, spec.pants);
    fillRect(x + 18, y + 28 + bob, 6, 5, spec.pants);
    if (facing === "down") {
      fillRect(x + 10, y + 9 + bob, 2, 2, colors.ink);
      fillRect(x + 18, y + 9 + bob, 2, 2, colors.ink);
      fillRect(x + 13, y + 13 + bob, 5, 1, "rgba(0,0,0,0.32)");
    } else if (facing === "left") {
      fillRect(x + 9, y + 9 + bob, 2, 2, colors.ink);
    } else if (facing === "right") {
      fillRect(x + 19, y + 9 + bob, 2, 2, colors.ink);
    }
    if (spec.satchel || spec.accessory === "satchel") {
      fillRect(x + 20, y + 18 + bob, 7, 8, "#8b6d42");
      fillRect(x + 21, y + 19 + bob, 5, 2, colors.gold);
    }
    if (spec.accessory === "book") {
      fillRect(x - 1, y + 18 + bob, 8, 7, colors.gold);
      fillRect(x + 1, y + 20 + bob, 4, 1, colors.ink);
    } else if (spec.accessory === "pages") {
      fillRect(x + 22, y + 11 + bob, 7, 9, colors.paper);
      fillRect(x + 24, y + 14 + bob, 4, 1, colors.dim);
    } else if (spec.accessory === "cup") {
      fillRect(x + 2, y + 21 + bob, 6, 6, colors.paper);
      fillRect(x + 7, y + 22 + bob, 2, 3, colors.paper);
    } else if (spec.accessory === "halo") {
      strokeRect(x + 10, y - 3 + bob, 10, 4, colors.blue, 1);
    } else if (spec.accessory === "ribbon") {
      fillRect(x + 8, y + 1 + bob, 5, 4, colors.red);
      fillRect(x + 17, y + 1 + bob, 5, 4, colors.red);
    } else if (spec.accessory === "echo") {
      strokeRect(x + 3, y + 3 + bob, 24, 30, colors.teal, 1);
      strokeRect(x + 0, y + 7 + bob, 30, 22, "rgba(66,195,182,0.45)", 1);
    } else if (spec.accessory === "glasses") {
      strokeRect(x + 8, y + 8 + bob, 6, 4, colors.ink, 1);
      strokeRect(x + 16, y + 8 + bob, 6, 4, colors.ink, 1);
      fillRect(x + 14, y + 10 + bob, 2, 1, colors.ink);
    } else if (spec.accessory === "leaves") {
      fillRect(x + 0, y + 9 + bob, 6, 16, colors.green);
      fillRect(x + 24, y + 9 + bob, 6, 16, colors.green);
    } else if (spec.accessory === "mirror") {
      strokeRect(x + 2, y + 1 + bob, 26, 33, colors.paper, 1);
      fillRect(x + 7, y + 5 + bob, 5, 2, "rgba(255,255,255,0.38)");
    }
  }

  function drawGatekeeperSprite(x, y, pulse) {
    fillRect(x + 1, y + 30, 28, 5, colors.shadow);
    fillRect(x, y + 1 + pulse, 30, 32, colors.ink);
    fillRect(x + 2, y + 2 + pulse, 26, 28, "#2a2622");
    strokeRect(x + 5, y + 5 + pulse, 20, 22, colors.gold, 2);
    fillRect(x + 10, y + 10 + pulse, 10, 14, colors.gold);
    fillRect(x + 13, y + 14 + pulse, 4, 6, colors.ink);
    fillRect(x + 4, y + 27 + pulse, 22, 3, "#17130f");
  }

  function drawCurtainSprite(x, y, pulse) {
    fillRect(x + 1, y + 31, 28, 5, colors.shadow);
    fillRect(x, y - 1 + pulse, 30, 35, colors.ink);
    fillRect(x + 1, y + pulse, 28, 32, "#7d2435");
    for (let i = 0; i < 5; i += 1) fillRect(x + 3 + i * 5, y + pulse, 3, 32, i % 2 ? "#4b1722" : "#9f3346");
    fillRect(x + 7, y + 12 + pulse, 4, 4, colors.gold);
    fillRect(x + 18, y + 12 + pulse, 4, 4, colors.gold);
    fillRect(x + 12, y + 21 + pulse, 6, 2, "#2a0f17");
  }

  function drawClock(x, y) {
    fillRect(x - 3, y + 45, 36, 5, colors.shadow);
    fillRect(x - 2, y + 6, 34, 44, colors.ink);
    fillRect(x + 8, y, 14, 8, "#8a7b68");
    fillRect(x, y + 8, 30, 40, "#453d36");
    fillRect(x + 3, y + 11, 24, 24, "#27231f");
    strokeRect(x + 5, y + 13, 20, 20, colors.paper, 2);
    fillRect(x + 14, y + 21, 2, 9, colors.paper);
    fillRect(x + 15, y + 21, 7, 2, colors.paper);
    fillRect(x + 12, y + 36, 6, 10, colors.gold);
    fillRect(x + 5, y + 40, 20, 2, "rgba(255,218,112,0.28)");
  }

  function drawDesk(x, y) {
    fillRect(x - 4, y + 24, 66, 6, colors.shadow);
    fillRect(x - 2, y - 2, 62, 30, colors.ink);
    fillRect(x, y, 58, 26, "#6b4631");
    fillRect(x + 6, y + 6, 46, 5, colors.paper);
    fillRect(x + 8, y + 8, 28, 1, colors.dim);
    fillRect(x + 10, y + 17, 10, 6, "#31231e");
    fillRect(x + 38, y + 17, 10, 6, "#31231e");
    fillRect(x + 23, y + 15, 12, 7, "#493126");
  }

  function drawLever(x, y, on) {
    fillRect(x, y + 20, 32, 14, "#453d36");
    strokeRect(x + 4, y + 8, 24, 20, colors.paper, 1);
    fillRect(x + 14, y + 8, 4, 17, colors.gold);
    fillRect(x + (on ? 18 : 8), y + 4, 10, 8, on ? colors.green : colors.red);
  }

  function drawBellSwitch(x, y, order) {
    const c = [colors.teal, colors.gold, colors.red][order];
    fillRect(x, y + 10, 34, 24, "#3a3029");
    fillRect(x + 8, y, 18, 18, c);
    fillRect(x + 13, y + 5, 8, 8, colors.paper);
  }

  function drawFinalDoor(x, y) {
    fillRect(x - 8, y - 8, 108, 74, colors.ink);
    fillRect(x, y, 92, 58, "#08090b");
    strokeRect(x + 6, y + 6, 80, 46, colors.gold, 2);
    strokeRect(x + 14, y + 14, 64, 30, flag("wardenDone") ? colors.teal : "#5d5045", 2);
    fillRect(x + 18, y + 18, 56, 22, flag("wardenDone") ? colors.teal : "#5d5045");
    fillRect(x + 26, y + 23, 40, 4, "rgba(245,240,220,0.18)");
    text("12", x + 46, y + 35, 16, colors.ink, "center");
    fillRect(x + 43, y + 49, 6, 8, colors.gold);
  }

  function drawJukebox(x, y) {
    fillRect(x - 4, y + 40, 52, 5, colors.shadow);
    fillRect(x - 2, y - 2, 48, 46, colors.ink);
    fillRect(x, y + 8, 44, 34, "#3f2830");
    fillRect(x + 8, y, 28, 16, colors.red);
    strokeRect(x + 10, y + 4, 24, 22, colors.gold, 1);
    fillRect(x + 12, y + 13, 20, 16, colors.gold);
    fillRect(x + 15, y + 16, 14, 3, colors.paper);
    fillRect(x + 10, y + 34, 6, 5, colors.teal);
    fillRect(x + 28, y + 34, 6, 5, colors.teal);
    fillRect(x + 8, y + 30, 28, 2, colors.red);
  }

  function drawPlaque(x, y, w, h) {
    fillRect(x - 2, y - 2, w + 4, h + 4, colors.ink);
    fillRect(x, y, w, h, "#6b4631");
    strokeRect(x + 3, y + 3, w - 6, h - 6, "#8b6d42", 1);
    fillRect(x + 7, y + 7, w - 14, 3, colors.paper);
    fillRect(x + 7, y + 14, w - 20, 3, colors.dim);
    fillRect(x + w - 13, y + h - 9, 6, 4, colors.gold);
  }

  function drawBlackboard(x, y, w, h) {
    fillRect(x - 3, y - 3, w + 6, h + 6, colors.ink);
    fillRect(x, y, w, h, "#1e3b34");
    strokeRect(x, y, w, h, "#8b6d42", 3);
    fillRect(x + 12, y + 12, w - 24, 3, colors.paper);
    fillRect(x + 12, y + 23, w - 48, 3, "rgba(245,240,220,0.65)");
    fillRect(x + w - 34, y + h - 8, 22, 3, colors.gold);
    fillRect(x + 12, y + h - 8, 18, 3, colors.paper);
  }

  function drawFountain(x, y) {
    fillRect(x - 12, y + 39, 58, 6, colors.shadow);
    fillRect(x - 10, y + 26, 54, 18, colors.ink);
    fillRect(x - 8, y + 28, 50, 14, "#3a4a50");
    fillRect(x - 2, y + 6, 38, 28, colors.ink);
    fillRect(x, y + 8, 34, 24, "#4e626a");
    fillRect(x + 12, y, 10, 18, colors.blue);
    fillRect(x + 8, y + 20, 18, 6, colors.teal);
    fillRect(x + 6, y + 28, 22, 3, "rgba(255,255,255,0.22)");
  }

  function drawMirror(x, y, w, h) {
    fillRect(x - 4, y - 4, w + 8, h + 8, colors.ink);
    fillRect(x, y, w, h, "#152033");
    strokeRect(x, y, w, h, colors.paper, 2);
    fillRect(x + 8, y + 8, w - 16, h - 16, "rgba(110,168,255,0.2)");
    fillRect(x + 14, y + 14, 6, h - 28, "rgba(245,240,220,0.22)");
    fillRect(x + w - 20, y + 18, 5, h - 36, "rgba(245,240,220,0.12)");
  }

  function drawSpotlight(x, y) {
    fillRect(x + 11, y - 1, 16, 30, colors.ink);
    fillRect(x + 12, y, 14, 28, "#504742");
    fillRect(x - 2, y + 20, 42, 22, colors.ink);
    fillRect(x, y + 22, 38, 18, colors.gold);
    fillRect(x + 6, y + 25, 26, 5, "rgba(255,255,255,0.25)");
    fillRect(x + 16, y + 40, 6, 18, "#302824");
    ctx.globalAlpha = 0.08;
    fillRect(x - 44, y + 40, 126, 94, colors.gold);
    ctx.globalAlpha = 1;
  }

  function drawPoster(x, y, w, h) {
    fillRect(x - 2, y - 2, w + 4, h + 4, colors.ink);
    fillRect(x, y, w, h, "#d8c28e");
    strokeRect(x, y, w, h, "#6b4939", 2);
    fillRect(x + 8, y + 10, w - 16, 5, colors.red);
    fillRect(x + 8, y + 24, w - 22, 4, colors.ink);
    fillRect(x + 8, y + 34, w - 28, 4, colors.ink);
    fillRect(x + w - 14, y + h - 13, 7, 7, colors.gold);
  }

  function drawExitSign(x, y, w, h) {
    fillRect(x - 3, y - 3, w + 6, h + 6, colors.ink);
    fillRect(x, y, w, h, "#123d2f");
    fillRect(x + 4, y + 4, w - 8, h - 8, "#0d2c23");
    strokeRect(x, y, w, h, colors.green, 2);
    text("EXIT", x + w / 2, y + 19, 13, colors.green, "center");
    fillRect(x + 5, y + h - 6, w - 10, 2, "rgba(126,210,109,0.25)");
  }

  function drawDialogue() {
    const d = state.dialogue;
    if (!d) return;
    panel(42, 328, 556, 112, "#050608");
    drawDialoguePortrait(58, 342, detectSpeaker(d.lines[d.index] || ""));
    const line = d.lines[d.index] || "";
    wrapText(line.slice(0, d.char), 108, 360, 450, 20, 17, colors.paper, { maxLines: 3 });
    if (state.scene === "choice" && d.choices) {
      for (let i = 0; i < d.choices.length; i += 1) {
        text(`${state.menu.choice === i ? "*" : " "} ${d.choices[i]}`, 108, 386 + i * 25, 15, state.menu.choice === i ? colors.gold : colors.paper);
      }
    } else if (d.done) text("*", 566, 416, 20, colors.gold);
  }

  function detectSpeaker(line) {
    const upper = line.toUpperCase();
    if (upper.startsWith("ARCHIVIST NALE")) return "archivist";
    if (upper.startsWith("VENN")) return "venn";
    if (upper.startsWith("DRIP")) return "drip";
    if (upper.startsWith("COURIER INLET")) return "courier";
    if (upper.startsWith("LUME")) return "lume";
    if (upper.startsWith("SELLA")) return "sella";
    if (upper.startsWith("ECHO KID")) return "echo";
    if (upper.startsWith("PROFESSOR MARN")) return "marn";
    if (upper.startsWith("BRILL")) return "brill";
    if (upper.startsWith("PALIN")) return "palin";
    if (upper.startsWith("PRINCIPAL GRACE")) return "gracePrincipal";
    if (upper.includes("S.A.N.S.")) return "sansProtocol";
    return "rook";
  }

  function drawDialoguePortrait(x, y, speaker) {
    fillRect(x - 2, y - 2, 42, 42, colors.ink);
    fillRect(x, y, 38, 38, "#1c2228");
    strokeRect(x, y, 38, 38, colors.dim, 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, 34, 34);
    ctx.clip();
    if (speaker === "sansProtocol") {
      drawSansMini(x + 19, y + 5);
    } else if (speaker === "gracePrincipal") {
      drawHumanoid(x + 4, y + 3, { hair: colors.gold, skin: "#d9c28f", coat: "#183f32", trim: colors.green, pants: "#10231b", facing: "down" });
    } else if (speaker === "rook") {
      drawHumanoid(x + 4, y + 4, { hair: "#6a4bc3", skin: "#d7a171", coat: "#2f937d", trim: colors.gold, pants: "#111417", facing: "down", satchel: true });
    } else {
      drawSprite(speaker, x + 5, y + 6);
    }
    ctx.restore();
  }

  function drawSansMini(cx, y) {
    fillRect(cx - 11, y + 5, 22, 18, colors.paper);
    fillRect(cx - 15, y + 24, 30, 18, "#2b2f36");
    fillRect(cx - 7, y + 12, 4, 4, colors.ink);
    fillRect(cx + 4, y + 12, 4, 4, colors.ink);
    fillRect(cx - 8, y + 20, 16, 2, colors.ink);
    fillRect(cx - 13, y + 40, 26, 4, colors.shadow);
  }

  function drawShop() {
    const shop = state.shop;
    if (!shop) return;
    panel(72, 78, 496, 330, "#07090c");
    text("DRIP CAFE COUNTER", 320, 116, 22, colors.gold, "center");
    text(`Tokens: ${state.player.tokens}`, 436, 144, 14, colors.paper);
    const options = shop.items.concat(["Leave"]);
    for (let i = 0; i < options.length; i += 1) {
      const y = 180 + i * 34;
      const selected = state.menu.shop === i;
      const id = options[i];
      const label = id === "Leave" ? "Leave" : `${itemName(id)} - ${shop.prices[id]} tokens`;
      text(`${selected ? "*" : " "} ${label}`, 96, y, 17, selected ? colors.gold : colors.paper);
    }
    const id = options[state.menu.shop];
    if (id !== "Leave") wrapText(content.items[id].desc, 342, 180, 190, 18, 13, colors.dim, { maxLines: 8 });
  }

  function drawJournal() {
    panel(56, 58, 528, 344, "rgba(5,6,8,0.94)");
    text("JOURNAL", 320, 96, 24, colors.gold, "center");
    const hints = [];
    hints.push("Rook is trapped inside a borrowed school hour made from late apologies, stolen rest, and unfinished work.");
    if (!flag("murmurwickDone")) hints.push("The Late Hall is still listening.");
    else if (!flag("inletQuestDone")) hints.push("The cafe courier lost a Minute Tag.");
    else if (!flag("permissionSlipFound")) hints.push("Afterclass Wing has a garden with paperwork.");
    else if (!flag("bellPuzzleSolved")) hints.push("The bells remember: left, right, center.");
    else if (!flag("bellwightDone")) hints.push("The Bell Atrium has a witness to answer.");
    else if (!flag("wardenDone")) hints.push("The Spiral Bridge waits for the Warden.");
    else if (!state.stats.routeBossDone) hints.push("Touch the Departure Door. Your route boss is waiting.");
    else hints.push("Touch the Departure Door again to end the borrowed hour.");

    hints.push(countPages() < 3 ? `Memory Pages: ${countPages()}/3.` : "All Memory Pages found. The Warden can be remembered.");
    hints.push(`Spared: ${state.stats.spared}. Defeated: ${state.stats.defeated}.`);
    hints.push(`Current route: ${routeLabel()}.`);
    hints.push(`Time Debt: ${state.stats.timeDebt || 0}. Relief: ${state.stats.relief || 0}. Grace reacts when debt rises.`);
    hints.push(`Tokens: ${state.player.tokens}. Items: ${state.inventory.map(itemName).join(", ") || "none"}.`);
    hints.push(`Key items: ${state.keyItems.map(itemName).join(", ") || "none"}.`);

    for (let i = 0; i < hints.length; i += 1) {
      wrapText(`* ${hints[i]}`, 88, 130 + i * 36, 460, 17, 14, colors.paper, { maxLines: 2 });
    }
    text("Shift, Z, or X closes.", 320, 374, 13, colors.dim, "center");
  }

  function drawBattle() {
    fillRect(0, 0, W, H, "#040506");
    drawBattleBackdrop();
    drawEnemy();
    drawBattleInfo();
    if (state.battle.phase === "defense") drawDefenseBox();
    else drawBattlePanel();
    drawBattleButtons();
  }

  function drawBattleBackdrop() {
    const b = state.battle;
    const tint = b?.enemy?.secretBoss ? colors.blue : b?.enemy?.boss ? colors.red : colors.teal;
    ctx.globalAlpha = 0.12;
    fillRect(0, 0, W, H, tint);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 80; i += 1) {
      const x = (i * 89 + Math.floor(performance.now() * 0.01)) % W;
      const y = (i * 47) % H;
      fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1, "rgba(245,240,220,0.12)");
    }
    for (let i = 0; i < 8; i += 1) {
      const x = 46 + i * 76;
      const y = 74 + ((i * 37 + Math.floor(performance.now() * 0.018)) % 90);
      strokeRect(x, y, 44, 28, "rgba(245,240,220,0.045)", 1);
    }
    fillRect(0, 236, W, 2, "rgba(245,240,220,0.1)");
  }

  function drawEnemy() {
    const b = state.battle;
    const cx = W / 2;
    const y = 70;
    const bob = Math.sin(performance.now() * 0.004) * 3;
    fillRect(cx - 64, y + 112, 128, 12, "rgba(0,0,0,0.38)");
    if (b.enemy.sprite === "murmurwick") {
      drawCandleEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "quillimp") {
      drawQuillimpEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "puddleChoir") {
      drawPuddleChoirEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "clockmoth") {
      drawClockmothEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "staticClerk") {
      drawStaticClerkEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "chalkling") {
      drawChalklingEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "paperSentry") {
      drawPaperSentryEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "substituteMoon") {
      drawSubstituteMoonEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "gracePrincipal") {
      drawGraceEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "fracturePrefect") {
      drawFractureEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "mirrorRook") {
      drawMirrorRookEnemy(cx, y + bob);
    } else if (b.enemy.sprite === "sansProtocol") {
      drawSansProtocol(cx, y + bob);
    } else if (b.enemy.sprite === "bellwight") {
      drawBellwightEnemy(cx, y + bob);
    } else {
      drawOvertimeWardenEnemy(cx, y + bob);
    }
    fillRect(cx - 118, 20, 236, 30, "rgba(5,6,8,0.72)");
    strokeRect(cx - 118, 20, 236, 30, b.enemy.boss ? colors.red : colors.paper, 1);
    text(b.enemy.name, cx, 42, 19, b.enemy.boss ? colors.gold : colors.paper, "center");
    if (b.mercyReady) text("SPAREABLE", cx, 218, 13, colors.green, "center");
  }

  function drawSansProtocol(cx, y) {
    if (externalSprites.skeleton.complete && externalSprites.skeleton.naturalWidth > 0) {
      const frame = Math.floor(performance.now() / 180) % 2;
      const sx = frame * 48;
      const sy = 0;
      ctx.drawImage(externalSprites.skeleton, sx, sy, 48, 48, cx - 42, y + 20, 84, 84);
    } else {
      fillRect(cx - 22, y + 22, 44, 34, colors.paper);
      fillRect(cx - 30, y + 56, 60, 52, "#2b2f36");
      fillRect(cx - 12, y + 34, 7, 7, colors.ink);
      fillRect(cx + 6, y + 34, 7, 7, colors.ink);
      fillRect(cx - 14, y + 48, 28, 4, colors.ink);
    }
    strokeRect(cx - 58, y + 8, 116, 108, colors.blue, 2);
    fillRect(cx - 34, y + 96, 68, 8, colors.shadow);
  }

  function drawCandleEnemy(cx, y) {
    fillRect(cx - 30, y + 43, 60, 72, colors.ink);
    fillRect(cx - 24, y + 52, 48, 58, "#f2cf91");
    fillRect(cx - 20, y + 52, 40, 8, "#fff1c6");
    fillRect(cx - 15, y + 72, 30, 4, "#d7a871");
    fillRect(cx - 12, y + 84, 24, 4, "#d7a871");
    fillRect(cx - 19, y + 35, 38, 24, colors.ink);
    fillRect(cx - 15, y + 34, 30, 24, colors.gold);
    fillRect(cx - 8, y + 21, 16, 18, colors.ink);
    fillRect(cx - 6, y + 20, 12, 16, "#fff1a8");
    fillRect(cx - 3, y + 15, 6, 8, colors.red);
    fillRect(cx - 10, y + 78, 5, 5, colors.ink);
    fillRect(cx + 5, y + 78, 5, 5, colors.ink);
    fillRect(cx - 7, y + 94, 14, 3, "#8b6d42");
  }

  function drawQuillimpEnemy(cx, y) {
    fillRect(cx - 28, y + 52, 56, 48, colors.ink);
    fillRect(cx - 22, y + 56, 44, 38, "#2e2833");
    fillRect(cx - 9, y + 26, 18, 38, colors.ink);
    fillRect(cx - 6, y + 28, 12, 34, colors.paper);
    fillRect(cx - 3, y + 30, 6, 24, "#c8bea7");
    fillRect(cx - 32, y + 68, 64, 8, colors.purple);
    fillRect(cx - 30, y + 72, 60, 3, "#6d4b93");
    fillRect(cx - 13, y + 64, 4, 4, colors.paper);
    fillRect(cx + 9, y + 64, 4, 4, colors.paper);
    fillRect(cx - 6, y + 82, 12, 3, colors.red);
    fillRect(cx + 18, y + 48, 12, 5, colors.gold);
  }

  function drawPuddleChoirEnemy(cx, y) {
    for (let i = 0; i < 3; i += 1) {
      const px = cx - 48 + i * 48;
      const py = y + 74 + Math.sin(i + performance.now() * 0.005) * 3;
      fillRect(px - 5, py + 18, 42, 8, colors.shadow);
      fillRect(px - 2, py - 2, 36, 26, colors.ink);
      fillRect(px, py, 32, 22, i === 1 ? colors.teal : colors.blue);
      fillRect(px + 3, py + 3, 26, 4, "rgba(255,255,255,0.22)");
      fillRect(px + 8, py + 8, 4, 4, colors.paper);
      fillRect(px + 21, py + 8, 4, 4, colors.paper);
      fillRect(px + 11, py + 16, 10, 2, colors.ink);
      fillRect(px + 10, py - 8, 12, 9, "rgba(110,168,255,0.45)");
    }
  }

  function drawClockmothEnemy(cx, y) {
    const wing = Math.sin(performance.now() * 0.006) * 5;
    fillRect(cx - 56, y + 38 + wing, 46, 52, colors.ink);
    fillRect(cx + 10, y + 38 - wing, 46, 52, colors.ink);
    fillRect(cx - 52, y + 42 + wing, 40, 44, "#b78f5a");
    fillRect(cx + 12, y + 42 - wing, 40, 44, "#b78f5a");
    fillRect(cx - 44, y + 50 + wing, 22, 4, colors.gold);
    fillRect(cx + 22, y + 50 - wing, 22, 4, colors.gold);
    fillRect(cx - 11, y + 48, 22, 52, colors.ink);
    fillRect(cx - 8, y + 52, 16, 42, "#6f5c49");
    strokeRect(cx - 6, y + 58, 12, 12, colors.paper, 1);
    fillRect(cx - 1, y + 60, 2, 8, colors.paper);
    fillRect(cx, y + 65, 5, 2, colors.paper);
    fillRect(cx - 4, y + 77, 8, 4, colors.ink);
  }

  function drawStaticClerkEnemy(cx, y) {
    fillRect(cx - 38, y + 38, 76, 68, colors.ink);
    fillRect(cx - 32, y + 42, 64, 58, "#263447");
    fillRect(cx - 24, y + 52, 48, 30, colors.paper);
    fillRect(cx - 18, y + 60, 36, 3, colors.ink);
    fillRect(cx - 18, y + 68, 28, 3, colors.ink);
    fillRect(cx - 18, y + 76, 34, 2, colors.red);
    fillRect(cx - 28, y + 88, 56, 7, "#18202d");
    for (let i = 0; i < 7; i += 1) {
      const flicker = ((i + Math.floor(performance.now() / 90)) % 2) * 8;
      fillRect(cx - 50 + i * 16, y + 34 + flicker, 8, 3, colors.teal);
    }
    fillRect(cx + 28, y + 57, 15, 12, colors.gold);
  }

  function drawChalklingEnemy(cx, y) {
    fillRect(cx - 38, y + 42, 76, 60, colors.ink);
    fillRect(cx - 34, y + 46, 68, 52, "rgba(245,240,220,0.2)");
    strokeRect(cx - 32, y + 48, 64, 48, colors.paper, 2);
    fillRect(cx - 18, y + 62, 7, 7, colors.paper);
    fillRect(cx + 11, y + 62, 7, 7, colors.paper);
    fillRect(cx - 20, y + 82, 40, 4, colors.paper);
    fillRect(cx - 14, y + 72, 5, 3, colors.gold);
    fillRect(cx + 9, y + 72, 5, 3, colors.gold);
    for (let i = 0; i < 5; i += 1) fillRect(cx - 50 + i * 24, y + 34 + (i % 2) * 10, 12, 3, colors.gold);
  }

  function drawPaperSentryEnemy(cx, y) {
    fillRect(cx - 36, y + 32, 72, 78, colors.ink);
    fillRect(cx - 30, y + 36, 60, 68, colors.paper);
    fillRect(cx - 22, y + 50, 44, 8, "#c8bea7");
    fillRect(cx - 22, y + 64, 32, 6, "#c8bea7");
    fillRect(cx - 18, y + 78, 36, 4, colors.red);
    strokeRect(cx - 30, y + 36, 60, 68, colors.ink, 2);
    fillRect(cx - 48, y + 54, 18, 30, colors.ink);
    fillRect(cx + 30, y + 54, 18, 30, colors.ink);
    fillRect(cx - 44, y + 56, 14, 26, colors.paper);
    fillRect(cx + 30, y + 56, 14, 26, colors.paper);
    fillRect(cx + 12, y + 40, 12, 12, colors.gold);
    fillRect(cx - 9, y + 91, 18, 5, "#8f2934");
  }

  function drawSubstituteMoonEnemy(cx, y) {
    ctx.globalAlpha = 0.94;
    fillRect(cx - 48, y + 24, 96, 92, colors.ink);
    fillRect(cx - 42, y + 28, 84, 84, "#d7d0aa");
    fillRect(cx + 10, y + 26, 24, 72, "#bcb48d");
    fillRect(cx - 20, y + 47, 12, 12, colors.ink);
    fillRect(cx + 18, y + 49, 8, 8, colors.ink);
    fillRect(cx - 10, y + 78, 32, 5, "#8b7f65");
    fillRect(cx - 60, y + 35, 22, 68, colors.ink);
    fillRect(cx + 38, y + 35, 22, 68, colors.ink);
    fillRect(cx - 56, y + 36, 18, 64, "#7d2435");
    fillRect(cx + 38, y + 36, 18, 64, "#7d2435");
    ctx.globalAlpha = 1;
  }

  function drawBellwightEnemy(cx, y) {
    fillRect(cx - 50, y + 18, 100, 98, colors.ink);
    strokeRect(cx - 45, y + 21, 90, 90, colors.paper, 2);
    fillRect(cx - 36, y + 29, 72, 76, "#7d5e2c");
    fillRect(cx - 26, y + 43, 52, 42, colors.gold);
    fillRect(cx - 19, y + 48, 38, 6, "rgba(255,255,255,0.22)");
    fillRect(cx - 8, y + 86, 16, 12, colors.paper);
    fillRect(cx - 18, y + 63, 6, 6, colors.ink);
    fillRect(cx + 12, y + 63, 6, 6, colors.ink);
  }

  function drawGraceEnemy(cx, y) {
    fillRect(cx - 38, y + 15, 76, 104, colors.ink);
    fillRect(cx - 28, y + 28, 56, 86, "#183f32");
    fillRect(cx - 22, y + 18, 44, 28, "#d9c28f");
    fillRect(cx - 24, y + 15, 48, 8, colors.gold);
    fillRect(cx - 34, y + 44, 68, 12, "#245f4b");
    fillRect(cx - 10, y + 28, 5, 5, colors.ink);
    fillRect(cx + 7, y + 28, 5, 5, colors.ink);
    fillRect(cx - 18, y + 68, 36, 4, colors.gold);
    fillRect(cx + 30, y + 58, 40, 5, colors.green);
    fillRect(cx + 66, y + 56, 6, 9, colors.paper);
    strokeRect(cx - 44, y + 12, 88, 110, colors.green, 2);
  }

  function drawFractureEnemy(cx, y) {
    fillRect(cx - 40, y + 16, 80, 104, colors.ink);
    fillRect(cx - 30, y + 24, 60, 90, "#d6b24c");
    fillRect(cx - 22, y + 18, 44, 22, colors.paper);
    fillRect(cx - 32, y + 54, 64, 6, colors.red);
    fillRect(cx - 12, y + 28, 5, 5, colors.ink);
    fillRect(cx + 8, y + 28, 5, 5, colors.ink);
    for (let i = 0; i < 6; i += 1) {
      fillRect(cx - 38 + i * 14, y + 44 + i * 9, 28, 3, colors.ink);
      fillRect(cx - 30 + i * 10, y + 35 + i * 12, 4, 11, colors.paper);
    }
    strokeRect(cx - 46, y + 14, 92, 108, colors.red, 2);
  }

  function drawMirrorRookEnemy(cx, y) {
    ctx.globalAlpha = 0.78;
    fillRect(cx - 46, y + 8, 92, 118, colors.ink);
    strokeRect(cx - 42, y + 10, 84, 112, colors.blue, 2);
    fillRect(cx - 18, y + 24, 36, 76, colors.blue);
    fillRect(cx - 12, y + 16, 24, 18, "#6a4bc3");
    fillRect(cx - 10, y + 48, 20, 34, "#2f937d");
    fillRect(cx - 7, y + 28, 4, 4, colors.paper);
    fillRect(cx + 4, y + 28, 4, 4, colors.paper);
    fillRect(cx - 36, y + 18, 14, 88, "rgba(255,255,255,0.18)");
    fillRect(cx + 23, y + 22, 8, 76, "rgba(255,255,255,0.12)");
    ctx.globalAlpha = 1;
  }

  function drawOvertimeWardenEnemy(cx, y) {
    fillRect(cx - 50, y + 28, 100, 92, colors.ink);
    fillRect(cx - 42, y + 34, 84, 74, "#27222b");
    fillRect(cx - 24, y + 54, 48, 44, colors.red);
    fillRect(cx - 10, y + 62, 20, 26, colors.gold);
    fillRect(cx - 34, y + 41, 68, 8, "#3a3442");
    fillRect(cx - 14, y + 72, 6, 6, colors.ink);
    fillRect(cx + 8, y + 72, 6, 6, colors.ink);
    for (let i = 0; i < 8; i += 1) {
      const a = performance.now() * 0.002 + i * Math.PI / 4;
      fillRect(cx + Math.cos(a) * 62, y + 70 + Math.sin(a) * 40, 6, 6, colors.teal);
    }
  }

  function drawBattleInfo() {
    const b = state.battle;
    const hpRatio = b.hp / b.enemy.maxHp;
    fillRect(248, 204, 144, 8, "#452827");
    fillRect(248, 204, 144 * hpRatio, 8, colors.red);
    if (b.enemy.secretBoss) {
      const progress = clamp(b.sansAttacks / 20, 0, 1);
      fillRect(248, 216, 144, 5, "#262b36");
      fillRect(248, 216, 144 * progress, 5, colors.blue);
      text(`LV ${state.player.lv}  ATTACKS ${b.sansAttacks}/20`, W / 2, 236, 12, colors.dim, "center");
    } else {
      fillRect(248, 216, 144, 5, "#263126");
      fillRect(248, 216, 144 * (b.mercy / b.enemy.mercyGoal), 5, colors.green);
      text(`LV ${state.player.lv}  EXP ${state.player.exp}`, W / 2, 236, 12, colors.dim, "center");
    }
  }

  function drawBattlePanel() {
    const b = state.battle;
    panel(72, 252, 496, 138, "#050608");
    if (b.phase === "text") {
      const line = b.text[b.textIndex] || "";
      drawBattlePortrait(92, 280, b.enemy.sprite);
      wrapText(line.slice(0, b.textChar), 154, 286, 382, 20, 17, colors.paper, { maxLines: 4 });
      if (b.textDone) text("*", 540, 364, 20, colors.gold);
    } else if (b.phase === "menu") {
      text("* Choose an action.", 98, 304, 18, colors.paper);
      text("FIGHT, ACT, ITEM, MERCY. The aftermath changes Time Debt.", 98, 338, 13, colors.dim);
    } else if (b.phase === "act") {
      drawActList();
    } else if (b.phase === "item") {
      drawItemList();
    } else if (b.phase === "mercy") {
      drawMercyList();
    } else if (b.phase === "fight") {
      drawFightMeter();
    }
  }

  function drawActList() {
    const b = state.battle;
    const acts = [{ name: "Info", info: true }, ...b.enemy.acts];
    for (let i = 0; i < acts.length; i += 1) {
      const act = acts[i];
      const locked = act.requiresPages && countPages() < act.requiresPages;
      const color = locked ? "rgba(245,240,220,0.35)" : i === b.listIndex ? colors.gold : colors.paper;
      text(`${i === b.listIndex ? "*" : " "} ${act.name}${locked ? " (needs pages)" : ""}`, 98, 292 + i * 28, 17, color);
    }
    text("X returns. Z chooses.", 368, 364, 13, colors.dim);
  }

  function drawItemList() {
    const b = state.battle;
    if (!state.inventory.length) {
      text("* No items", 98, 292, 17, colors.dim);
      return;
    }
    for (let i = 0; i < state.inventory.length; i += 1) {
      const id = state.inventory[i];
      text(`${i === b.listIndex ? "*" : " "} ${itemName(id)}`, 98, 292 + i * 28, 17, i === b.listIndex ? colors.gold : colors.paper);
    }
    const item = content.items[state.inventory[b.listIndex]];
    if (item) wrapText(item.desc, 340, 292, 190, 18, 13, colors.dim, { maxLines: 4 });
  }

  function drawMercyList() {
    const b = state.battle;
    if (b.enemy.secretBoss) {
      const options = ["Reject Mercy", "Back"];
      for (let i = 0; i < options.length; i += 1) {
        const color = options[i] === "Reject Mercy" ? colors.red : colors.paper;
        text(`${i === b.listIndex ? "*" : " "} ${options[i]}`, 98, 296 + i * 30, 17, i === b.listIndex ? colors.gold : color);
      }
      text("MERCY LOCKED", 370, 316, 15, colors.red);
      text(`Attacks ${b.sansAttacks}/20`, 370, 340, 15, colors.blue);
      return;
    }
    const options = b.mercyReady ? ["Spare", "Encourage", "Back"] : ["Encourage", "Back"];
    for (let i = 0; i < options.length; i += 1) {
      const color = options[i] === "Spare" ? colors.green : colors.paper;
      text(`${i === b.listIndex ? "*" : " "} ${options[i]}`, 98, 296 + i * 30, 17, i === b.listIndex ? colors.gold : color);
    }
    text(`Mercy ${b.mercy}/${b.enemy.mercyGoal}`, 370, 316, 15, b.mercyReady ? colors.green : colors.dim);
  }

  function drawFightMeter() {
    const b = state.battle;
    const x = 142;
    const y = 312;
    fillRect(x, y, 220, 18, "#2e2424");
    fillRect(x + 88, y, 44, 18, colors.red);
    fillRect(x + 102, y, 16, 18, colors.gold);
    fillRect(x + b.fight.cursor, y - 5, 4, 28, colors.paper);
    text("Press Z near the center. X cancels.", 98, 364, 14, colors.dim);
  }

  function drawDefenseBox() {
    const b = state.battle;
    const box = b.box;
    strokeRect(box.x, box.y, box.w, box.h, colors.paper, 3);
    if (state.player.hp <= Math.ceil(state.player.maxHp * 0.3) && Math.floor(performance.now() / 120) % 2 === 0) {
      strokeRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10, colors.red, 2);
    }
    for (const bullet of b.bullets) {
      drawProjectile(bullet);
    }
    const soulColor = b.invuln > 0 && Math.floor(b.invuln * 18) % 2 === 0 ? colors.paper : colors.red;
    drawHeart(b.soul.x, b.soul.y, soulColor);
    const progress = clamp(b.defenseTimer / b.defenseDuration, 0, 1);
    fillRect(box.x, box.y + box.h + 8, box.w, 5, "#242424");
    fillRect(box.x, box.y + box.h + 8, box.w * progress, 5, colors.gold);
    text(`${Math.max(0, b.defenseDuration - b.defenseTimer).toFixed(1)}s`, box.x + box.w - 42, box.y - 12, 12, colors.dim);
  }

  function drawProjectile(bullet) {
    const r = bullet.r * BULLET_VISUAL_SCALE * (bullet.delay > 0 ? 0.72 : 1);
    const x = bullet.x;
    const y = bullet.y;
    const color = bullet.delay > 0 ? "rgba(245,240,220,0.45)" : bullet.color;
    if (bullet.delay > 0) {
      strokeRect(x - r * 1.25, y - r * 1.25, r * 2.5, r * 2.5, "rgba(255,218,112,0.55)", 1);
    }
    if (bullet.surprise) {
      strokeRect(x - r * 1.15, y - r * 1.15, r * 2.3, r * 2.3, "rgba(232,95,92,0.5)", 1);
    }
    if (bullet.kind === "flame") {
      fillRect(x - r * 0.45, y - r, r * 0.9, r * 1.8, color);
      fillRect(x - r * 0.75, y - r * 0.2, r * 1.5, r * 0.9, color);
      fillRect(x - r * 0.25, y - r * 0.4, r * 0.5, r * 0.8, colors.gold);
    } else if (bullet.kind === "drop") {
      fillRect(x - r * 0.45, y - r * 0.85, r * 0.9, r * 1.4, color);
      fillRect(x - r * 0.75, y - r * 0.2, r * 1.5, r * 0.9, color);
      fillRect(x - r * 0.2, y - r * 0.35, r * 0.4, r * 0.4, "rgba(255,255,255,0.35)");
    } else if (bullet.kind === "paper") {
      fillRect(x - r * 0.9, y - r * 0.55, r * 1.8, r * 1.1, color);
      fillRect(x - r * 0.55, y - r * 0.25, r * 1.1, r * 0.18, colors.ink);
      fillRect(x - r * 0.55, y + r * 0.15, r * 0.75, r * 0.18, colors.ink);
    } else if (bullet.kind === "bell") {
      fillRect(x - r * 0.75, y - r * 0.45, r * 1.5, r, color);
      fillRect(x - r * 0.45, y - r, r * 0.9, r * 0.7, color);
      fillRect(x - r * 0.25, y + r * 0.5, r * 0.5, r * 0.35, colors.paper);
    } else if (bullet.kind === "chalk") {
      fillRect(x - r, y - r * 0.25, r * 2, r * 0.5, color);
      fillRect(x - r * 0.8, y - r * 0.55, r * 0.4, r * 1.1, color);
      fillRect(x + r * 0.4, y - r * 0.55, r * 0.4, r * 1.1, color);
    } else if (bullet.kind === "moon") {
      fillRect(x - r, y - r, r * 1.8, r * 1.8, color);
      fillRect(x - r * 0.25, y - r * 0.9, r * 1.4, r * 1.4, colors.ink);
    } else if (bullet.kind === "diamond") {
      fillRect(x - r * 0.35, y - r, r * 0.7, r * 2, color);
      fillRect(x - r, y - r * 0.35, r * 2, r * 0.7, color);
      fillRect(x - r * 0.2, y - r * 0.2, r * 0.4, r * 0.4, colors.paper);
    } else if (bullet.kind === "hand") {
      fillRect(x - r * 0.18, y - r, r * 0.36, r * 2, color);
      fillRect(x - r, y - r * 0.18, r * 2, r * 0.36, color);
      fillRect(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.6, colors.paper);
    } else if (bullet.kind === "stamp") {
      fillRect(x - r, y - r * 0.7, r * 2, r * 1.4, color);
      fillRect(x - r * 0.55, y - r * 1.05, r * 1.1, r * 0.45, color);
      fillRect(x - r * 0.7, y + r * 0.15, r * 1.4, r * 0.22, colors.ink);
    } else if (bullet.kind === "spark") {
      fillRect(x - r * 0.2, y - r, r * 0.4, r * 2, color);
      fillRect(x - r, y - r * 0.2, r * 2, r * 0.4, color);
      fillRect(x - r * 0.6, y - r * 0.6, r * 1.2, r * 1.2, "rgba(255,255,255,0.2)");
    } else if (bullet.kind === "bone" || bullet.kind === "blueBone") {
      fillRect(x - r * 0.28, y - r * 1.25, r * 0.56, r * 2.5, color);
      fillRect(x - r * 0.65, y - r * 1.35, r * 1.3, r * 0.55, color);
      fillRect(x - r * 0.65, y + r * 0.8, r * 1.3, r * 0.55, color);
      fillRect(x - r * 0.18, y - r * 0.85, r * 0.36, r * 1.7, colors.ink);
      if (bullet.kind === "blueBone") strokeRect(x - r, y - r * 1.55, r * 2, r * 3.1, colors.blue, 1);
    } else if (bullet.kind === "beam") {
      fillRect(x - r * 3, y - r * 0.55, r * 6, r * 1.1, color);
      fillRect(x - r * 2.4, y - r * 0.18, r * 4.8, r * 0.36, colors.paper);
      strokeRect(x - r * 3.2, y - r * 0.72, r * 6.4, r * 1.44, colors.blue, 1);
    } else {
      fillRect(x - r, y - r, r * 2, r * 2, color);
      fillRect(x - bullet.r * 0.55, y - bullet.r * 0.55, bullet.r * 1.1, bullet.r * 1.1, "rgba(255,255,255,0.28)");
    }
  }

  function drawBattleButtons() {
    const labels = ["Fight", "Act", "Item", "Mercy"];
    const b = state.battle;
    for (let i = 0; i < labels.length; i += 1) {
      const x = 50 + i * 138;
      const selected = b.mainIndex === i && b.phase === "menu";
      fillRect(x, 414, 116, 40, selected ? "rgba(255,218,112,0.12)" : "rgba(5,6,8,0.7)");
      strokeRect(x, 414, 116, 40, selected ? colors.gold : colors.paper, 2);
      drawCommandIcon(labels[i], x + 18, 426, selected ? colors.gold : colors.paper);
      text(labels[i], x + 66, 440, 18, selected ? colors.gold : colors.paper, "center");
    }
    text(`${state.player.name}  HP ${state.player.hp}/${state.player.maxHp}`, 64, 402, 14, colors.paper);
  }

  function drawCommandIcon(label, x, y, color) {
    if (label === "Fight") {
      fillRect(x + 8, y, 4, 20, color);
      fillRect(x + 3, y + 5, 14, 4, color);
      fillRect(x + 5, y + 18, 10, 3, color);
    } else if (label === "Act") {
      fillRect(x + 3, y + 2, 18, 16, color);
      fillRect(x + 6, y + 6, 12, 2, colors.ink);
      fillRect(x + 6, y + 11, 9, 2, colors.ink);
    } else if (label === "Item") {
      fillRect(x + 4, y + 4, 16, 14, color);
      fillRect(x + 7, y + 1, 10, 5, color);
      fillRect(x + 8, y + 9, 8, 3, colors.ink);
    } else {
      drawHeart(x + 12, y + 11, color);
    }
  }

  function drawEnding() {
    fillRect(0, 0, W, H, "#050608");
    drawStarfield();
    drawDialogue();
  }

  function drawGameOver() {
    fillRect(0, 0, W, H, "#050608");
    text("The hour closes.", W / 2, 210, 28, colors.red, "center");
    text("Press Z / Enter to return to the title.", W / 2, 252, 16, colors.dim, "center");
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life * 3, 0, 1);
      fillRect(p.x, p.y, 3, 3, p.color);
      ctx.globalAlpha = 1;
    }
  }

  function drawFloaters() {
    for (const f of state.floaters) {
      ctx.globalAlpha = clamp(f.life * 1.8, 0, 1);
      text(f.label, f.x, f.y, 15, f.color, "center");
      ctx.globalAlpha = 1;
    }
  }

  function drawToast() {
    if (state.toastTimer <= 0 || !state.toast) return;
    const alpha = clamp(state.toastTimer / 0.35, 0, 1);
    ctx.globalAlpha = alpha;
    fillRect(168, 16, 304, 30, "rgba(5,6,8,0.84)");
    strokeRect(168, 16, 304, 30, "rgba(245,240,220,0.45)", 1);
    text(state.toast, W / 2, 37, 13, colors.paper, "center");
    ctx.globalAlpha = 1;
  }

  function drawStarfield() {
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 97) % W;
      const y = (i * 53) % H;
      fillRect(x, y, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1, i % 3 === 0 ? "rgba(245,240,220,0.42)" : "rgba(245,240,220,0.16)");
    }
  }

  function drawHeart(x, y, color) {
    const px = Math.round(x);
    const py = Math.round(y);
    fillRect(px - 5, py - 6, 5, 4, colors.ink);
    fillRect(px, py - 6, 5, 4, colors.ink);
    fillRect(px - 7, py - 3, 14, 7, colors.ink);
    fillRect(px - 5, py + 4, 10, 4, colors.ink);
    fillRect(px - 3, py + 8, 6, 3, colors.ink);
    fillRect(px - 4, py - 5, 3, 3, color);
    fillRect(px + 1, py - 5, 3, 3, color);
    fillRect(px - 6, py - 2, 12, 5, color);
    fillRect(px - 4, py + 3, 8, 3, color);
    fillRect(px - 2, py + 6, 4, 3, color);
    fillRect(px - 3, py - 1, 2, 2, "rgba(255,255,255,0.36)");
  }

  function panel(x, y, w, h, color = "#050608") {
    fillRect(x, y, w, h, color);
    fillRect(x + 4, y + 4, w - 8, 4, "rgba(245,240,220,0.08)");
    fillRect(x + 4, y + h - 8, w - 8, 4, "rgba(0,0,0,0.28)");
    strokeRect(x, y, w, h, colors.paper, 3);
    strokeRect(x + 5, y + 5, w - 10, h - 10, "rgba(245,240,220,0.16)", 1);
  }

  function fillRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function strokeRect(x, y, w, h, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
  }

  function text(value, x, y, size = 16, color = colors.paper, align = "left") {
    ctx.fillStyle = color;
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, Math.round(x), Math.round(y));
  }

  function wrapText(value, x, y, maxWidth, lineHeight, size, color, options = {}) {
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    const maxLines = options.maxLines || Infinity;
    const lines = wrapTextLines(value, maxWidth, size);
    const visible = lines.slice(0, maxLines);
    if (lines.length > visible.length && visible.length) {
      let last = visible[visible.length - 1];
      while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 0) last = last.slice(0, -1);
      visible[visible.length - 1] = `${last}...`;
    }
    for (let i = 0; i < visible.length; i += 1) {
      ctx.fillText(visible[i], x, y + i * lineHeight);
    }
    return lines.length;
  }

  function wrapTextLines(value, maxWidth, size) {
    ctx.font = `${size}px ${FONT}`;
    const words = String(value).split(" ").flatMap((word) => splitLongWord(word, maxWidth, size));
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawBattlePortrait(x, y, sprite) {
    fillRect(x - 3, y - 3, 48, 58, colors.ink);
    fillRect(x, y, 42, 52, "#15191f");
    strokeRect(x, y, 42, 52, colors.dim, 1);
    const cx = x + 21;
    if (sprite === "sansProtocol") {
      drawSansMini(cx, y + 4);
      strokeRect(x + 3, y + 3, 36, 46, colors.blue, 1);
    } else if (sprite === "murmurwick") {
      fillRect(cx - 10, y + 18, 20, 26, "#f2cf91");
      fillRect(cx - 7, y + 8, 14, 12, colors.gold);
      fillRect(cx - 3, y + 1, 6, 8, "#fff1a8");
    } else if (sprite === "quillimp") {
      fillRect(cx - 13, y + 20, 26, 21, "#2e2833");
      fillRect(cx - 3, y + 5, 6, 22, colors.paper);
      fillRect(cx - 15, y + 29, 30, 3, colors.purple);
    } else if (sprite === "puddleChoir") {
      for (let i = 0; i < 3; i += 1) fillRect(cx - 17 + i * 12, y + 25 + (i % 2) * 3, 11, 9, colors.blue);
    } else if (sprite === "clockmoth") {
      fillRect(cx - 18, y + 18, 15, 20, "#b78f5a");
      fillRect(cx + 3, y + 18, 15, 20, "#b78f5a");
      fillRect(cx - 4, y + 21, 8, 22, "#6f5c49");
    } else if (sprite === "gracePrincipal") {
      drawHumanoid(x + 6, y + 8, { hair: colors.gold, skin: "#d9c28f", coat: "#183f32", trim: colors.green, pants: "#10231b", facing: "down" });
    } else if (sprite === "fracturePrefect") {
      fillRect(cx - 11, y + 10, 22, 34, "#d6b24c");
      fillRect(cx - 14, y + 23, 28, 3, colors.red);
      strokeRect(cx - 17, y + 6, 34, 42, colors.red, 1);
    } else if (sprite === "mirrorRook") {
      ctx.globalAlpha = 0.75;
      drawHumanoid(x + 6, y + 9, { hair: "#6a4bc3", skin: "#9dbfff", coat: "#2f937d", trim: colors.blue, pants: "#111417", facing: "down" });
      ctx.globalAlpha = 1;
      strokeRect(x + 4, y + 4, 34, 44, colors.blue, 1);
    } else {
      fillRect(cx - 14, y + 17, 28, 27, colors.red);
      fillRect(cx - 6, y + 23, 12, 14, colors.gold);
    }
  }

  function splitLongWord(word, maxWidth, size) {
    ctx.font = `${size}px ${FONT}`;
    if (ctx.measureText(word).width <= maxWidth) return [word];
    const parts = [];
    let chunk = "";
    for (const ch of word) {
      const test = `${chunk}${ch}`;
      if (ctx.measureText(`${test}-`).width > maxWidth && chunk) {
        parts.push(`${chunk}-`);
        chunk = ch;
      } else {
        chunk = test;
      }
    }
    if (chunk) parts.push(chunk);
    return parts;
  }

  function loop(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.__UNDERLATE_DEBUG__ = {
    snapshot() {
      return {
        scene: state.scene,
        roomId: state.roomId,
        hp: state.player.hp,
        tokens: state.player.tokens,
        flags: { ...state.flags },
        inventory: state.inventory.slice(),
        keyItems: state.keyItems.slice(),
        stats: { ...state.stats },
        battle: state.battle ? {
          enemyId: state.battle.enemyId,
          phase: state.battle.phase,
          hp: state.battle.hp,
          mercy: state.battle.mercy,
          mercyReady: state.battle.mercyReady,
          sansAttacks: state.battle.sansAttacks || 0,
          sansPendingWin: Boolean(state.battle.sansPendingWin),
          bullets: state.battle.bullets.map((bullet) => ({ kind: bullet.kind, stillOnly: Boolean(bullet.stillOnly), delay: bullet.delay || 0 })),
          mainIndex: state.battle.mainIndex,
          listIndex: state.battle.listIndex,
        } : null,
      };
    },
    warp(roomId, x = 304, y = 332) {
      if (!content.rooms[roomId]) return false;
      state.roomId = roomId;
      state.player.x = x;
      state.player.y = y;
      state.scene = "explore";
      state.battle = null;
      state.dialogue = null;
      return true;
    },
    flag(name, value = true) {
      setFlag(name, value);
      return true;
    },
    startBattle(enemyId, triggerId = `debug_${enemyId}`) {
      if (!content.enemies[enemyId]) return false;
      startBattle(enemyId, triggerId);
      return true;
    },
    battleMenu() {
      if (!state.battle) return false;
      state.battle.phase = "menu";
      state.battle.text = [];
      state.battle.textIndex = 0;
      state.battle.textChar = 0;
      state.battle.textDone = true;
      state.battle.mainIndex = 0;
      state.battle.listIndex = 0;
      return true;
    },
    battleFight() {
      if (!state.battle) return false;
      state.battle.phase = "fight";
      state.battle.fight = { cursor: 110, dir: 1, power: 0, resolved: false };
      return true;
    },
    forceAttack(attack) {
      if (!state.battle) return false;
      state.battle.attack = attack;
      state.battle.secondaryAttack = "";
      state.battle.attackClock = 99;
      spawnBullets(state.battle);
      return true;
    },
    triggerKonamiBoss() {
      triggerKonamiBoss();
      return true;
    },
    heal() {
      state.player.hp = state.player.maxHp;
      return true;
    },
  };

  requestAnimationFrame(loop);
})();
