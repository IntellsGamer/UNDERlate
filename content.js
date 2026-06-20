window.UNDERLATE_CONTENT = {
  story: {
    intro: [
      "ROOK was late on the day the school clock forgot how to count.",
      "One hallway stretched into an hour that did not belong to anyone anymore.",
      "Teachers called it a power outage. Students called it a rumor.",
      "The things left unfinished called it home.",
      "At the center of it all waited PRINCIPAL GRACE, the first person who learned to lock guilt inside a clock.",
      "To leave, Rook must return the borrowed hour: gently, violently, or honestly enough to hurt.",
    ],
    chapterCards: {
      lateHall: "CHAPTER 1: The minute that noticed you",
      shelfpass: "CHAPTER 2: Shelves for unfinished sentences",
      dripCafe: "CHAPTER 3: Tea before rumors",
      afterclassWing: "OPTIONAL: Extra credit for the lost",
      bellAtrium: "CHAPTER 4: Three bells and one witness",
      spiralBridge: "CHAPTER 5: The hour that wants repayment",
      departureGate: "FINAL: Keep what you chose",
    },
    revelations: [
      "Memory Page 1: Rook promised to apologize after class, then ran out of time.",
      "Memory Page 2: The clock did not break. It was asked to hold everyone else's delay.",
      "Memory Page 3: The Overtime Warden was once the school's quietest student.",
      "Together, the pages say: Principal Grace built the borrowed hour to punish lateness, then got trapped by her own perfect rule.",
    ],
  },

  items: {
    pocketBiscuit: {
      name: "Pocket Biscuit",
      desc: "A square snack from a coat that was not yours.",
      heal: 8,
    },
    warmTea: {
      name: "Warm Tea",
      desc: "Still warm, even in a place that misplaced morning.",
      heal: 12,
    },
    staticCandy: {
      name: "Static Candy",
      desc: "Crackles gently. Restores 6 HP and lowers the next attack.",
      heal: 6,
      calm: 1,
    },
    clockfruit: {
      name: "Clockfruit",
      desc: "A tiny pear that ticks only when ignored.",
      heal: 16,
    },
    hushMint: {
      name: "Hush Mint",
      desc: "Freshens breath and awkward silences.",
      heal: 10,
      mercy: 1,
    },
    memoryPage: {
      name: "Memory Page",
      desc: "A torn page that seems heavier when read aloud.",
      key: true,
    },
    minuteTag: {
      name: "Minute Tag",
      desc: "Courier Inlet's lost tag. It refuses to be yesterday.",
      key: true,
    },
    permissionSlip: {
      name: "Permission Slip",
      desc: "A formal excuse for entering rooms that never asked permission to exist.",
      key: true,
    },
    chalkStar: {
      name: "Chalk Star",
      desc: "A five-point doodle that believes in extra credit.",
      heal: 14,
      mercy: 1,
    },
    boneWhitePass: {
      name: "Bone-White Pass",
      desc: "Proof that you survived an optional protocol that should not have compiled.",
      key: true,
    },
  },

  rooms: {
    lateHall: {
      name: "The Late Hall",
      theme: "hall",
      safe: true,
      start: { x: 304, y: 332 },
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 66, y: 86, w: 122, h: 26 },
        { x: 452, y: 86, w: 122, h: 26 },
        { x: 86, y: 398, w: 154, h: 22 },
        { x: 400, y: 398, w: 154, h: 22 },
      ],
      doors: [
        { id: "hallNorth", x: 282, y: 30, w: 78, h: 18, to: "shelfpass", spawn: { x: 304, y: 398 }, requireFlag: "murmurwickDone", locked: ["The northern door waits for a changed room.", "Something between the floorboards is still listening."] },
      ],
      npcs: [
        { id: "nale", name: "Archivist Nale", x: 110, y: 286, sprite: "archivist" },
      ],
      props: [
        { id: "hallClock", name: "Breathless Clock", x: 500, y: 222, w: 30, h: 48, kind: "clock" },
        { id: "saveDesk", name: "Save Desk", x: 292, y: 94, w: 58, h: 26, kind: "desk" },
      ],
      triggers: [
        { id: "murmurwick", x: 224, y: 164, w: 192, h: 112, enemy: "murmurwick", once: true },
      ],
    },

    shelfpass: {
      name: "Shelfpass Underpass",
      theme: "library",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 76, y: 112, w: 128, h: 42 },
        { x: 436, y: 112, w: 128, h: 42 },
        { x: 76, y: 318, w: 128, h: 42 },
        { x: 436, y: 318, w: 128, h: 42 },
        { x: 274, y: 174, w: 92, h: 26 },
      ],
      doors: [
        { id: "shelfSouth", x: 282, y: 430, w: 78, h: 18, to: "lateHall", spawn: { x: 304, y: 72 } },
        { id: "shelfEast", x: 596, y: 230, w: 18, h: 68, to: "dripCafe", spawn: { x: 60, y: 248 } },
        { id: "shelfNorth", x: 282, y: 30, w: 78, h: 18, to: "rainArchive", spawn: { x: 306, y: 400 } },
      ],
      npcs: [
        { id: "venn", name: "Venn the Misplaced", x: 296, y: 206, sprite: "venn" },
      ],
      props: [
        { id: "shelfPlaque", name: "Shelf Plaque", x: 460, y: 332, w: 42, h: 26, kind: "plaque" },
      ],
      pickups: [
        { id: "pageOne", x: 104, y: 168, item: "memoryPage", flag: "pageOne", text: ["You found Memory Page 1: a handwriting lesson that misses its student."] },
      ],
      triggers: [
        { id: "quillimpScript", x: 244, y: 242, w: 144, h: 74, enemy: "quillimp", once: true },
      ],
      randomEnemies: ["quillimp", "staticClerk"],
    },

    dripCafe: {
      name: "Drip Cafe",
      theme: "cafe",
      safe: true,
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 400, y: 80, w: 138, h: 56 },
        { x: 88, y: 330, w: 120, h: 34 },
        { x: 246, y: 330, w: 120, h: 34 },
        { x: 404, y: 330, w: 120, h: 34 },
      ],
      doors: [
        { id: "cafeWest", x: 26, y: 230, w: 18, h: 68, to: "shelfpass", spawn: { x: 560, y: 248 } },
        { id: "cafeNorth", x: 282, y: 30, w: 78, h: 18, to: "afterclassWing", spawn: { x: 304, y: 398 }, requireFlag: "inletQuestDone", locked: ["A chalky hallway is blocked by a polite velvet rope.", "A sign says: AFTERCLASS WING - COURIERS AND EXCUSES ONLY."] },
        { id: "cafeEast", x: 596, y: 230, w: 18, h: 68, to: "platformRun", spawn: { x: 58, y: 250 } },
      ],
      npcs: [
        { id: "drip", name: "Drip", x: 452, y: 154, sprite: "drip", shop: true },
        { id: "inlet", name: "Courier Inlet", x: 146, y: 230, sprite: "courier" },
      ],
      props: [
        { id: "jukebox", name: "Jukebox Without Songs", x: 274, y: 110, w: 44, h: 42, kind: "jukebox" },
      ],
      pickups: [
        { id: "cafeMint", x: 502, y: 378, item: "hushMint", flag: "cafeMint", text: ["You found a Hush Mint under a table.", "It was waiting for a conversation to end."] },
      ],
    },

    platformRun: {
      name: "Platform Run",
      theme: "machines",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 112, y: 120, w: 80, h: 26 },
        { x: 238, y: 210, w: 164, h: 26 },
        { x: 448, y: 302, w: 90, h: 26 },
        { x: 98, y: 360, w: 98, h: 26 },
      ],
      doors: [
        { id: "platformWest", x: 26, y: 230, w: 18, h: 68, to: "dripCafe", spawn: { x: 558, y: 248 } },
        { id: "platformNorth", x: 282, y: 30, w: 78, h: 18, to: "bellAtrium", spawn: { x: 304, y: 398 }, requireFlag: "platformLever", locked: ["A gate of brass teeth blocks the way.", "A lever nearby is pretending not to be important."] },
      ],
      props: [
        { id: "platformLever", name: "Brass Lever", x: 506, y: 350, w: 32, h: 34, kind: "lever" },
        { id: "platformSign", name: "Warning Sign", x: 88, y: 82, w: 38, h: 30, kind: "sign" },
      ],
      triggers: [
        { id: "puddleChoirScript", x: 220, y: 276, w: 164, h: 84, enemy: "puddleChoir", once: true },
      ],
      randomEnemies: ["puddleChoir", "staticClerk"],
    },

    rainArchive: {
      name: "Rain Archive",
      theme: "rain",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 94, y: 116, w: 86, h: 150 },
        { x: 460, y: 116, w: 86, h: 150 },
        { x: 246, y: 326, w: 148, h: 26 },
      ],
      doors: [
        { id: "rainSouth", x: 282, y: 430, w: 78, h: 18, to: "shelfpass", spawn: { x: 306, y: 72 } },
        { id: "rainEast", x: 596, y: 230, w: 18, h: 68, to: "dormitory", spawn: { x: 62, y: 248 } },
      ],
      npcs: [
        { id: "lume", name: "Lume of the Margins", x: 306, y: 146, sprite: "lume" },
      ],
      pickups: [
        { id: "pageTwo", x: 506, y: 312, item: "memoryPage", flag: "pageTwo", text: ["You found Memory Page 2: a weather report for tears that never fell."] },
        { id: "rainCandy", x: 98, y: 326, item: "staticCandy", flag: "rainCandy", text: ["You found Static Candy humming in a damp drawer."] },
      ],
      triggers: [
        { id: "clockmothScript", x: 244, y: 226, w: 152, h: 80, enemy: "clockmoth", once: true },
      ],
      randomEnemies: ["clockmoth", "quillimp"],
    },

    dormitory: {
      name: "Quiet Dormitory",
      theme: "dorm",
      safe: true,
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 96, y: 86, w: 132, h: 52 },
        { x: 412, y: 86, w: 132, h: 52 },
        { x: 96, y: 314, w: 132, h: 52 },
        { x: 412, y: 314, w: 132, h: 52 },
      ],
      doors: [
        { id: "dormWest", x: 26, y: 230, w: 18, h: 68, to: "rainArchive", spawn: { x: 560, y: 248 } },
        { id: "dormSouth", x: 282, y: 430, w: 78, h: 18, to: "platformRun", spawn: { x: 306, y: 72 }, requireFlag: "foundMinuteTag", locked: ["The south exit is buried in blankets.", "Something with a name tag is snoring on the other side."] },
      ],
      npcs: [
        { id: "sella", name: "Sella", x: 302, y: 236, sprite: "sella" },
      ],
      pickups: [
        { id: "minuteTag", x: 502, y: 170, item: "minuteTag", flag: "foundMinuteTag", text: ["You found Courier Inlet's Minute Tag.", "It says: IF LOST, PLEASE BE PROMPT ABOUT IT."] },
        { id: "dormFruit", x: 132, y: 380, item: "clockfruit", flag: "dormFruit", text: ["You found Clockfruit in a folded blanket."] },
      ],
    },

    bellAtrium: {
      name: "Bell Atrium",
      theme: "bell",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 78, y: 96, w: 126, h: 28 },
        { x: 436, y: 96, w: 126, h: 28 },
        { x: 274, y: 236, w: 92, h: 46 },
      ],
      doors: [
        { id: "bellSouth", x: 282, y: 430, w: 78, h: 18, to: "platformRun", spawn: { x: 304, y: 70 } },
        { id: "bellNorth", x: 282, y: 30, w: 78, h: 18, to: "spiralBridge", spawn: { x: 304, y: 400 }, requireFlag: "bellPuzzleSolved", locked: ["The bells disagree about what time it is.", "Three switchstones hum: left, right, center."] },
      ],
      props: [
        { id: "bellLeft", name: "Left Bellstone", x: 158, y: 198, w: 34, h: 34, kind: "bellSwitch", order: 0 },
        { id: "bellCenter", name: "Center Bellstone", x: 304, y: 164, w: 34, h: 34, kind: "bellSwitch", order: 1 },
        { id: "bellRight", name: "Right Bellstone", x: 450, y: 198, w: 34, h: 34, kind: "bellSwitch", order: 2 },
        { id: "bellHint", name: "Bell Hint", x: 286, y: 292, w: 68, h: 26, kind: "plaque" },
      ],
      triggers: [
        { id: "bellwightScript", x: 226, y: 324, w: 190, h: 80, enemy: "bellwight", once: true, requireFlag: "bellPuzzleSolved" },
      ],
      randomEnemies: ["clockmoth", "puddleChoir", "staticClerk"],
    },

    spiralBridge: {
      name: "Spiral Bridge",
      theme: "bridge",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 88, y: 118, w: 80, h: 28 },
        { x: 472, y: 118, w: 80, h: 28 },
        { x: 244, y: 220, w: 152, h: 34 },
        { x: 88, y: 336, w: 80, h: 28 },
        { x: 472, y: 336, w: 80, h: 28 },
      ],
      doors: [
        { id: "bridgeSouth", x: 282, y: 430, w: 78, h: 18, to: "bellAtrium", spawn: { x: 304, y: 70 } },
        { id: "bridgeNorth", x: 282, y: 30, w: 78, h: 18, to: "departureGate", spawn: { x: 304, y: 400 }, requireFlag: "wardenDone", locked: ["The bridge curls back on itself.", "A patient shape waits in the middle span."] },
      ],
      npcs: [
        { id: "echoKid", name: "Echo Kid", x: 452, y: 258, sprite: "echo" },
      ],
      pickups: [
        { id: "pageThree", x: 108, y: 224, item: "memoryPage", flag: "pageThree", text: ["You found Memory Page 3: a goodbye crossed out until it became a map."] },
      ],
      triggers: [
        { id: "wardenScript", x: 230, y: 164, w: 180, h: 96, enemy: "overtimeWarden", once: true, requireFlag: "bellwightDone" },
      ],
      randomEnemies: ["staticClerk", "clockmoth"],
    },

    departureGate: {
      name: "Departure Gate",
      theme: "gate",
      safe: true,
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 224, y: 122, w: 192, h: 36 },
      ],
      doors: [
        { id: "gateSouth", x: 282, y: 430, w: 78, h: 18, to: "spiralBridge", spawn: { x: 304, y: 70 } },
      ],
      npcs: [
        { id: "gatekeeper", name: "The Late Gate", x: 294, y: 178, sprite: "gatekeeper" },
      ],
      props: [
        { id: "finalDoor", name: "Departure Door", x: 274, y: 72, w: 92, h: 58, kind: "finalDoor" },
      ],
      pickups: [
        { id: "gateTea", x: 516, y: 382, item: "warmTea", flag: "gateTea", text: ["You found Warm Tea beside the gate.", "Someone expected you to arrive tired."] },
      ],
    },

    afterclassWing: {
      name: "Afterclass Wing",
      theme: "school",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 82, y: 98, w: 126, h: 34 },
        { x: 432, y: 98, w: 126, h: 34 },
        { x: 252, y: 202, w: 136, h: 26 },
        { x: 86, y: 350, w: 130, h: 26 },
        { x: 424, y: 350, w: 130, h: 26 },
      ],
      doors: [
        { id: "afterSouth", x: 282, y: 430, w: 78, h: 18, to: "dripCafe", spawn: { x: 304, y: 70 } },
        { id: "afterWest", x: 26, y: 230, w: 18, h: 68, to: "detentionGarden", spawn: { x: 560, y: 248 } },
        { id: "afterEast", x: 596, y: 230, w: 18, h: 68, to: "mirrorGym", spawn: { x: 60, y: 248 } },
        { id: "afterNorth", x: 282, y: 30, w: 78, h: 18, to: "lostAuditorium", spawn: { x: 304, y: 398 }, requireFlag: "permissionSlipFound", locked: ["The northern hall folds itself into a hall monitor.", "It wants a permission slip. Very badly."] },
      ],
      npcs: [
        { id: "marn", name: "Professor Marn", x: 306, y: 238, sprite: "marn" },
      ],
      props: [
        { id: "blackboard", name: "Blackboard", x: 260, y: 104, w: 120, h: 38, kind: "blackboard" },
        { id: "afterExitSign", name: "Exit Sign", x: 94, y: 204, w: 70, h: 30, kind: "exitSign" },
      ],
      pickups: [
        { id: "chalkStarOne", x: 500, y: 286, item: "chalkStar", flag: "chalkStarOne", text: ["You found a Chalk Star.", "It awards itself partial credit."] },
      ],
      triggers: [
        { id: "chalklingScript", x: 220, y: 278, w: 200, h: 80, enemy: "chalkling", once: true },
      ],
      randomEnemies: ["chalkling", "paperSentry", "quillimp"],
    },

    detentionGarden: {
      name: "Detention Garden",
      theme: "garden",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 92, y: 94, w: 94, h: 94 },
        { x: 454, y: 94, w: 94, h: 94 },
        { x: 96, y: 330, w: 448, h: 24 },
      ],
      doors: [
        { id: "gardenEast", x: 596, y: 230, w: 18, h: 68, to: "afterclassWing", spawn: { x: 60, y: 248 } },
      ],
      npcs: [
        { id: "brill", name: "Brill", x: 132, y: 238, sprite: "brill" },
      ],
      props: [
        { id: "detentionFountain", name: "Detention Fountain", x: 304, y: 166, w: 34, h: 42, kind: "fountain" },
        { id: "gardenExitSign", name: "Exit Sign", x: 520, y: 210, w: 54, h: 26, kind: "exitSign" },
      ],
      pickups: [
        { id: "permissionSlip", x: 500, y: 248, item: "permissionSlip", flag: "permissionSlipFound", text: ["You found a Permission Slip.", "It is signed by someone named 'The Consequence.'"] },
      ],
      triggers: [
        { id: "paperSentryGarden", x: 254, y: 256, w: 150, h: 70, enemy: "paperSentry", once: true },
      ],
      randomEnemies: ["paperSentry", "puddleChoir"],
    },

    mirrorGym: {
      name: "Mirror Gym",
      theme: "mirror",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 94, y: 90, w: 452, h: 22 },
        { x: 94, y: 366, w: 452, h: 22 },
        { x: 292, y: 172, w: 56, h: 128 },
      ],
      doors: [
        { id: "mirrorWest", x: 26, y: 230, w: 18, h: 68, to: "afterclassWing", spawn: { x: 560, y: 248 } },
      ],
      npcs: [
        { id: "palin", name: "Palin Reflection", x: 438, y: 232, sprite: "palin" },
      ],
      props: [
        { id: "mirrorWall", name: "Long Mirror", x: 122, y: 126, w: 72, h: 96, kind: "mirror" },
        { id: "mirrorWallTwo", name: "Long Mirror", x: 446, y: 126, w: 72, h: 96, kind: "mirror" },
        { id: "mirrorExitSign", name: "Exit Sign", x: 64, y: 210, w: 54, h: 26, kind: "exitSign" },
      ],
      pickups: [
        { id: "mirrorTea", x: 132, y: 294, item: "warmTea", flag: "mirrorTea", text: ["You found Warm Tea reflected into existence."] },
      ],
      triggers: [
        { id: "chalkMirror", x: 228, y: 316, w: 184, h: 70, enemy: "chalkling", once: true },
      ],
      randomEnemies: ["chalkling", "clockmoth", "staticClerk"],
    },

    lostAuditorium: {
      name: "Lost Auditorium",
      theme: "stage",
      walls: [
        { x: 0, y: 0, w: 640, h: 34 },
        { x: 0, y: 446, w: 640, h: 34 },
        { x: 0, y: 0, w: 34, h: 480 },
        { x: 606, y: 0, w: 34, h: 480 },
        { x: 80, y: 92, w: 480, h: 40 },
        { x: 92, y: 348, w: 456, h: 30 },
      ],
      doors: [
        { id: "audSouth", x: 282, y: 430, w: 78, h: 18, to: "afterclassWing", spawn: { x: 304, y: 70 } },
      ],
      npcs: [
        { id: "curtain", name: "Curtain That Stayed", x: 306, y: 156, sprite: "curtain" },
      ],
      props: [
        { id: "spotlight", name: "Shy Spotlight", x: 110, y: 158, w: 38, h: 58, kind: "spotlight" },
        { id: "stagePoster", name: "Stage Poster", x: 484, y: 158, w: 42, h: 54, kind: "poster" },
        { id: "audExitSign", name: "Exit Sign", x: 294, y: 394, w: 54, h: 26, kind: "exitSign" },
      ],
      pickups: [
        { id: "auditoriumCandy", x: 320, y: 300, item: "staticCandy", flag: "auditoriumCandy", text: ["You found Static Candy in the front row.", "It claps once when picked up."] },
      ],
      triggers: [
        { id: "substituteMoonScript", x: 204, y: 222, w: 232, h: 92, enemy: "substituteMoon", once: true },
      ],
      randomEnemies: ["paperSentry", "chalkling", "clockmoth"],
    },
  },

  enemies: {
    murmurwick: {
      name: "Murmurwick",
      maxHp: 24,
      exp: 4,
      mercyGoal: 4,
      reward: 2,
      check: "A candle-shaped echo carrying everyone's unfinished sentence.",
      intro: ["Murmurwick slides out from between two late minutes."],
      spareText: ["Murmurwick remembers a place to be and leaves you its warmth."],
      defeatText: ["Murmurwick's flame gutters into a hard little spark."],
      acts: [
        { name: "Listen", mercy: 1, text: ["You let Murmurwick finish its thought.", "It forgot the point, but seems lighter."] },
        { name: "Hum", mercy: 1, text: ["You hum a tune with no chorus.", "Murmurwick's flame keeps time."] },
        { name: "Apologize", mercy: 2, text: ["You apologize for being late to somewhere neither of you remember.", "Murmurwick blinks. That was apparently enough."] },
      ],
      attacks: ["drizzle", "murmurFlame", "rings"],
      sprite: "murmurwick",
    },
    quillimp: {
      name: "Quillimp",
      maxHp: 20,
      exp: 4,
      mercyGoal: 3,
      reward: 2,
      check: "A nervous ink creature who corrects signs before reading them.",
      intro: ["Quillimp leaps from a footnote and underlines your shoes."],
      spareText: ["Quillimp files your kindness under LATE, BUT ACCEPTABLE."],
      defeatText: ["Quillimp spills into a period and stops correcting things."],
      acts: [
        { name: "Compliment", mercy: 1, text: ["You compliment Quillimp's punctuation.", "It blushes in semicolons."] },
        { name: "Read Aloud", mercy: 1, text: ["You read the room's smallest label aloud.", "Quillimp relaxes. Finally, accuracy."] },
        { name: "Straighten", mercy: 2, text: ["You straighten a crooked shelf card.", "Quillimp gasps like you solved literature."] },
      ],
      attacks: ["inkDrops", "paperCuts", "lanes"],
      sprite: "quillimp",
    },
    puddleChoir: {
      name: "Puddle Choir",
      maxHp: 26,
      exp: 5,
      mercyGoal: 4,
      reward: 3,
      check: "Three puddles trying to sing harmony in a hallway with no rain.",
      intro: ["Puddle Choir burbles up and begins a song in several wrong keys."],
      spareText: ["The puddles ripple into a chord soft enough to step over."],
      defeatText: ["The Puddle Choir dries into a chalk outline of a song."],
      acts: [
        { name: "Harmonize", mercy: 2, text: ["You match their worst note with confidence.", "The choir decides that counts as leadership."] },
        { name: "Share Umbrella", mercy: 1, text: ["You hold up an imaginary umbrella.", "The puddles appreciate the theater."] },
        { name: "Wait", mercy: 1, text: ["You wait through the awkward verse.", "It eventually finds a rhyme for 'hallway.'"] },
      ],
      attacks: ["waves", "puddleRise", "lanes"],
      sprite: "puddleChoir",
    },
    clockmoth: {
      name: "Clockmoth",
      maxHp: 22,
      exp: 5,
      mercyGoal: 4,
      reward: 3,
      check: "A moth that eats spare seconds and gets hiccups from deadlines.",
      intro: ["Clockmoth flutters in with dusty second hands for wings."],
      spareText: ["Clockmoth lands on your shoulder, steals one worry, and departs."],
      defeatText: ["Clockmoth loses its hour and falls silent."],
      acts: [
        { name: "Stand Still", mercy: 2, text: ["You stand perfectly still.", "Clockmoth mistakes you for a dependable clock."] },
        { name: "Dim Light", mercy: 1, text: ["You shield your eyes and soften the light.", "Clockmoth stops panicking at your brightness."] },
        { name: "Count Ticks", mercy: 1, text: ["You count ticks out loud.", "Clockmoth corrects you, but fondly."] },
      ],
      attacks: ["spiral", "clockHands", "rings"],
      sprite: "clockmoth",
    },
    staticClerk: {
      name: "Static Clerk",
      maxHp: 28,
      exp: 6,
      mercyGoal: 5,
      reward: 3,
      check: "An office-shaped storm with forms for emotions it has not had yet.",
      intro: ["Static Clerk asks you to take a number from the weather."],
      spareText: ["Static Clerk stamps APPROVED on a cloud and lets you pass."],
      defeatText: ["Static Clerk collapses into unsigned sparks."],
      acts: [
        { name: "Ask Name", mercy: 1, text: ["You ask for the clerk's name.", "It says the form for that is missing, but sounds touched."] },
        { name: "File Receipt", mercy: 2, text: ["You file a receipt for one inconvenient feeling.", "Static Clerk crackles with professional relief."] },
        { name: "Smile", mercy: 1, text: ["You smile without making it a demand.", "Static Clerk's stapler-heart unclenches."] },
      ],
      attacks: ["zigzag", "receiptStorm", "orbit"],
      sprite: "staticClerk",
    },
    chalkling: {
      name: "Chalkling",
      maxHp: 24,
      exp: 5,
      mercyGoal: 4,
      reward: 3,
      check: "A chalk doodle who escaped a lesson on acceptable margins.",
      intro: ["Chalkling squeaks out of the floor and draws a circle around your feet."],
      spareText: ["Chalkling redraws itself smiling and rolls back into the lesson."],
      defeatText: ["Chalkling smears into a lesson nobody wanted to learn."],
      acts: [
        { name: "Erase Gently", mercy: 2, text: ["You erase one angry line without removing the whole drawing.", "Chalkling looks relieved to be edited, not deleted."] },
        { name: "Solve Sum", mercy: 1, text: ["You solve the equation Chalkling wrote upside down.", "It pretends that was the assignment."] },
        { name: "Doodle", mercy: 1, text: ["You add a tiny star beside it.", "Chalkling gives the star a hat."] },
      ],
      attacks: ["chalkDust", "chalkBoard", "spiral"],
      sprite: "chalkling",
    },
    paperSentry: {
      name: "Paper Sentry",
      maxHp: 30,
      exp: 6,
      mercyGoal: 5,
      reward: 4,
      check: "A folded hall monitor with a badge made of very serious staples.",
      intro: ["Paper Sentry unfolds to full official height."],
      spareText: ["Paper Sentry stamps your imaginary pass and folds into a swan."],
      defeatText: ["Paper Sentry tears along the dotted line."],
      acts: [
        { name: "Show Pass", mercy: 2, text: ["You show the Permission Slip.", "Paper Sentry salutes the bureaucracy of your soul."] },
        { name: "Fold Crane", mercy: 1, text: ["You fold a crane from a scrap of worry.", "Paper Sentry checks its wings for compliance."] },
        { name: "Respect Line", mercy: 1, text: ["You stand exactly behind the painted line.", "Paper Sentry radiates approval."] },
      ],
      attacks: ["paperCuts", "hallPass", "orbit"],
      sprite: "paperSentry",
    },
    substituteMoon: {
      name: "Substitute Moon",
      maxHp: 42,
      exp: 10,
      mercyGoal: 7,
      reward: 7,
      boss: true,
      check: "A moon hired to watch the class while morning stepped out.",
      intro: ["Substitute Moon rises over the auditorium seats.", "It takes attendance by looking sad at everyone."],
      spareText: ["Substitute Moon marks you present and excuses itself from the sky."],
      defeatText: ["Substitute Moon falls behind the stage curtain without applause."],
      acts: [
        { name: "Take Roll", mercy: 2, text: ["You answer 'present' for yourself and for the quiet chairs.", "Substitute Moon glows a little less lonely."] },
        { name: "Ask Lesson", mercy: 1, text: ["You ask what the lesson is.", "Substitute Moon admits it was hoping you knew."] },
        { name: "Dim Lights", mercy: 2, text: ["You dim the house lights.", "The moon stops pretending it enjoys being stared at."] },
        { name: "Applaud Softly", mercy: 1, text: ["You applaud without startling the curtains.", "Substitute Moon bows to a room that finally sees it."] },
      ],
      attacks: ["moonfall", "attendanceBeam", "paperCuts", "spiral"],
      sprite: "substituteMoon",
    },
    bellwight: {
      name: "Bellwight",
      maxHp: 38,
      exp: 9,
      mercyGoal: 6,
      reward: 5,
      boss: true,
      check: "A bell-shaped witness who believes every ending should announce itself.",
      intro: ["Bellwight lowers from the ceiling, ringing once for you and once for the room."],
      spareText: ["Bellwight rings without sound. The atrium finally agrees on now."],
      defeatText: ["Bellwight cracks. The atrium opens anyway, but no one applauds."],
      acts: [
        { name: "Echo", mercy: 2, text: ["You echo Bellwight's tone softly.", "It hears itself without the threat."] },
        { name: "Bow", mercy: 1, text: ["You bow to the witness.", "Bellwight sways, startled by manners."] },
        { name: "Let Ring", mercy: 2, text: ["You let the bell finish ringing.", "The silence afterward seems grateful."] },
      ],
      attacks: ["bellLanes", "bellToll", "spiral"],
      sprite: "bellwight",
    },
    overtimeWarden: {
      name: "Overtime Warden",
      maxHp: 48,
      exp: 12,
      mercyGoal: 8,
      reward: 8,
      boss: true,
      final: true,
      check: "The keeper of every hour that people promised to make up later.",
      intro: ["The Overtime Warden unfolds from the bridge rails.", "Its lantern is full of borrowed evenings."],
      spareText: ["The Warden lowers its lantern.", "One full hour returns to the people who forgot they were owed rest."],
      defeatText: ["The Warden drops the lantern.", "The hour breaks into useful, jagged pieces."],
      acts: [
        { name: "Breathe", mercy: 2, text: ["You breathe slowly enough for the bridge to hear.", "The Warden's lantern dims."] },
        { name: "Return Hour", mercy: 2, text: ["You promise to return what was borrowed.", "The Warden tests the promise and finds it warm."] },
        { name: "Forgive Delay", mercy: 1, text: ["You forgive the minute that stranded you here.", "The Warden's shoulders lower by one century."] },
        { name: "Remember", mercy: 2, requiresPages: 3, text: ["You read all three Memory Pages together.", "They become a name the Warden had forgotten."] },
      ],
      attacks: ["wardenClock", "overtimeSweep", "bellLanes", "spiral"],
      sprite: "overtimeWarden",
    },
    gracePrincipal: {
      name: "Principal Grace",
      maxHp: 56,
      exp: 14,
      mercyGoal: 10,
      reward: 12,
      boss: true,
      routeBoss: "mercy",
      check: "The founder of the borrowed hour, stern enough to forgive without forgetting.",
      intro: ["Principal Grace steps from a clock-shaped office.", "She has been waiting to see whether kindness can keep its teeth."],
      spareText: ["Principal Grace signs your release in green ink.", "The hour becomes a door instead of a debt."],
      defeatText: ["Principal Grace lowers her pen.", "Even mercy can fail when it refuses to stand up."],
      acts: [
        { name: "Confess", mercy: 2, text: ["You admit you ran from an apology.", "Principal Grace writes nothing down, which is worse and kinder."] },
        { name: "Defend Mercy", mercy: 2, text: ["You explain every spared monster as a choice, not a loophole.", "Grace's pen stops tapping."] },
        { name: "Promise Rest", mercy: 2, text: ["You promise not to turn guilt into another schedule.", "The office clock softens."] },
        { name: "Read Pages", mercy: 3, requiresPages: 3, text: ["You read the Memory Pages aloud.", "Grace hears the Warden's old name and closes her eyes."] },
      ],
      attacks: ["principalInk", "detentionStamp", "moonfall", "rings"],
      sprite: "gracePrincipal",
    },
    fracturePrefect: {
      name: "Fracture Prefect",
      maxHp: 64,
      exp: 16,
      mercyGoal: 9,
      reward: 12,
      boss: true,
      routeBoss: "fracture",
      check: "A perfect student made from every shortcut that worked too well.",
      intro: ["Fracture Prefect applauds without moving its hands.", "It likes your efficiency. It wants the rest of you."],
      spareText: ["Fracture Prefect cracks along a line shaped like doubt.", "It lets you pass, furious that restraint is also power."],
      defeatText: ["Fracture Prefect shatters into gold stars and warning slips.", "The hour learns to fear your footsteps."],
      acts: [
        { name: "Refuse Prize", mercy: 2, text: ["You refuse the prize for finishing first.", "Fracture Prefect briefly forgets how to rank you."] },
        { name: "Name Cost", mercy: 2, text: ["You name what each victory cost.", "A crack opens under its badge."] },
        { name: "Stand Down", mercy: 2, text: ["You lower your hands.", "It hates that you can choose not to continue."] },
      ],
      attacks: ["paperCuts", "rankLines", "principalInk", "wardenClock"],
      sprite: "fracturePrefect",
    },
    mirrorRook: {
      name: "Mirror Rook",
      maxHp: 60,
      exp: 15,
      mercyGoal: 10,
      reward: 12,
      boss: true,
      routeBoss: "mixed",
      check: "You, if every excuse had learned to speak first.",
      intro: ["Mirror Rook blocks the Departure Gate.", "It knows which kindnesses you meant and which ones were convenient."],
      spareText: ["Mirror Rook steps aside.", "It does not forgive you. It gives you the work of becoming forgivable."],
      defeatText: ["Mirror Rook breaks into reflections too small to argue.", "The gate opens on a silence you earned."],
      acts: [
        { name: "Own Both", mercy: 2, text: ["You name the help and the harm without averaging them.", "Mirror Rook has to look at you directly."] },
        { name: "Apologize", mercy: 2, text: ["You apologize without asking the apology to become a key.", "The reflection loses a sharp edge."] },
        { name: "Ask Witness", mercy: 2, text: ["You ask the room to remember honestly.", "The floor answers with every footstep you took."] },
        { name: "Read Pages", mercy: 3, requiresPages: 3, text: ["You read the Memory Pages aloud.", "Mirror Rook mouths the words one beat late."] },
      ],
      attacks: ["mirrorSteps", "echoBox", "paperCuts", "moonfall"],
      sprite: "mirrorRook",
    },
    sansProtocol: {
      name: "S.A.N.S. Protocol",
      maxHp: 56,
      exp: 0,
      mercyGoal: 20,
      reward: 25,
      boss: true,
      secretBoss: true,
      check: "A forbidden anti-lateness routine. It dodges every attack, rejects mercy, and only crashes after twenty committed attacks.",
      intro: [
        "The screen blinks in a sequence it was not taught.",
        "S.A.N.S. Protocol loads from the bones of a deleted detention file.",
        "It gives you exactly twenty chances to regret knowing the code.",
        "It dodges attacks before they happen. You can only outlast the loop.",
        "Blue bones hurt only when you move. White bones hurt always.",
      ],
      spareText: [
        "S.A.N.S. Protocol rejects the mercy packet and keeps smiling.",
        "The fight continues.",
      ],
      defeatText: [
        "On the twentieth committed attack, S.A.N.S. Protocol dodges into its own error handler.",
        "The grin flickers. The command loop finally admits it is tired.",
        "You received the Bone-White Pass, 25 tokens, and a full heal.",
      ],
      acts: [
        { name: "Trace Code", mercy: 0, calm: 1, text: ["You trace the forbidden input sequence in the air.", "The Protocol stutters for one frame. The next pattern softens."] },
        { name: "Stay Still", mercy: 0, calm: 1, text: ["You stop moving when the blue bones hum.", "The Protocol seems annoyed that you read the room."] },
        { name: "Debug Smile", mercy: 0, calm: 0, text: ["You smile like you found the bug first.", "The Protocol's grin loses administrator privileges for almost a second."] },
        { name: "Overwrite Fear", mercy: 0, calm: 1, text: ["You overwrite panic with timing.", "The Protocol respects inputs, even insolent ones."] },
      ],
      attacks: ["boneRush", "blueBones", "skullBeam", "gravitySnap", "boneSpiral"],
      sprite: "sansProtocol",
    },
  },

  npcText: {
    nale: {
      first: [
        "ARCHIVIST NALE: You arrived after the bell, which is odd.",
        "ARCHIVIST NALE: There has not been a bell here in years.",
        "ARCHIVIST NALE: Principal Grace removed it after the first disappearance.",
        "ARCHIVIST NALE: The hall keeps unfinished moments in its floorboards.",
        "ARCHIVIST NALE: If one speaks to you, try not to answer with a weapon first.",
      ],
      later: [
        "ARCHIVIST NALE: You are making a shape in the hour.",
        "ARCHIVIST NALE: The shape is yours, even when it resembles a mistake.",
      ],
    },
    venn: {
      first: [
        "VENN: Oh! A walking appointment.",
        "VENN: I have misplaced myself between shelves B and Maybe.",
        "VENN: Grace said every late person owes the world interest. The shelves believed her.",
        "VENN: If you find loose pages, keep them. Memory hates being shelved alone.",
      ],
      later: [
        "VENN: The cafe is east. The rain is north. The exit is a rumor with hinges.",
        "VENN: I recommend tea before rumors.",
      ],
    },
    drip: {
      first: [
        "DRIP: Welcome to Drip Cafe. We serve tea, sympathy, and small edible clocks.",
        "DRIP: Tokens accepted. Apologies accepted at market value.",
      ],
      later: [
        "DRIP: Buying something is optional. Being dramatic near the counter is traditional.",
      ],
    },
    inlet: {
      first: [
        "COURIER INLET: I lost my Minute Tag again.",
        "COURIER INLET: Without it, every route thinks I am yesterday.",
        "COURIER INLET: If you see a name tag napping somewhere, please be stern with it.",
      ],
      waiting: [
        "COURIER INLET: The tag likes blankets, corners, and excuses.",
      ],
      done: [
        "COURIER INLET: That's my Minute Tag!",
        "COURIER INLET: Please take this tea. It has been legally warmed.",
      ],
      after: [
        "COURIER INLET: I am prompt now. It feels suspiciously athletic.",
      ],
    },
    lume: {
      first: [
        "LUME: The rain here remembers people by the pauses in their letters.",
        "LUME: Grace is not a monster because she is cruel. She is dangerous because she thinks cruelty is tidy.",
        "LUME: The Bell Atrium opens when its stones agree on a rhythm.",
        "LUME: Left rings twice. Right rings once. Center rings thrice. Order is a door wearing manners.",
      ],
      later: [
        "LUME: You can win some fights by making them less lonely.",
        "LUME: You can also win by hurting them. Winning is an imprecise word.",
      ],
    },
    sella: {
      first: [
        "SELLA: Shh. The beds are rehearsing dreams.",
        "SELLA: If you find a tag here, return it before it learns to snore in cursive.",
      ],
      later: [
        "SELLA: Rest is not a side quest. People just keep treating it like one.",
      ],
    },
    echoKid: {
      first: [
        "ECHO KID: I heard you three rooms ago.",
        "ECHO KID: Not words. Choices.",
        "ECHO KID: They make different sounds when they land.",
      ],
      later: [
        "ECHO KID: The Warden waits ahead.",
        "ECHO KID: If you brought pages, read them like a lantern.",
      ],
    },
    gatekeeper: {
      first: [
        "THE LATE GATE: You reached the departure side of a borrowed hour.",
        "THE LATE GATE: Touch the door when you are ready to keep what you chose.",
      ],
      later: [
        "THE LATE GATE: A door is just a question that learned carpentry.",
      ],
    },
    marn: {
      first: [
        "PROFESSOR MARN: Welcome to Afterclass, where lessons go when the bell abandons them.",
        "PROFESSOR MARN: If the hall monitor asks, you were always supposed to be here.",
        "PROFESSOR MARN: The garden west keeps paperwork. The gym east keeps reflections. Neither keeps normal hours.",
      ],
      later: [
        "PROFESSOR MARN: Extra credit is just guilt with stationery.",
        "PROFESSOR MARN: Still, it does unlock doors.",
      ],
    },
    brill: {
      first: [
        "BRILL: I water the detention plants. They grow excuses.",
        "BRILL: A Permission Slip blew into the hedge. It has been acting superior ever since.",
      ],
      later: [
        "BRILL: If a plant tells you it was framed, ask to see the frame.",
      ],
    },
    palin: {
      first: [
        "PALIN REFLECTION: I am what you look like when you almost understand yourself.",
        "PALIN REFLECTION: Do not worry. Everybody squints at first.",
      ],
      later: [
        "PALIN REFLECTION: You are getting clearer.",
        "PALIN REFLECTION: Not simpler. Clearer.",
      ],
    },
    curtain: {
      first: [
        "CURTAIN THAT STAYED: The show ended, but I was never dismissed.",
        "CURTAIN THAT STAYED: Substitute Moon keeps taking attendance for an audience that left politely.",
      ],
      later: [
        "CURTAIN THAT STAYED: Applause is just rain with opinions.",
      ],
    },
  },

  endings: {
    mercy: [
      "You step through the Departure Gate with the borrowed hour intact.",
      "Behind you, the hall keeps ticking for everyone who needed another minute.",
      "UNDERlate: The Borrowed Hour - kind ending.",
    ],
    mixed: [
      "You step through the Departure Gate carrying warmth and splinters.",
      "Some rooms will remember your help. Some will remember the sharp parts.",
      "UNDERlate: The Borrowed Hour - uneven ending.",
    ],
    fracture: [
      "You step through the Departure Gate while the hour cracks into useful pieces.",
      "You are on time now.",
      "UNDERlate: The Borrowed Hour - fracture ending.",
    ],
  },
};
