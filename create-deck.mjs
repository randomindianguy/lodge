import pptxgen from "pptxgenjs";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Lodge Team";
pres.title = "Lodge - Duke MEM PM Competition 2026";

// Colors
const BG = "0B0F1A";
const SURFACE = "141926";
const BORDER = "2A2F42";
const TEXT = "E8E8ED";
const MUTED = "6B7194";
const ACCENT = "6366F1";
const ACCENT_LIGHT = "818CF8";
const SUCCESS = "34D399";
const WARNING = "FBBF24";
const DANGER = "F87171";

// Fonts
const TITLE_FONT = "Arial Black";
const BODY_FONT = "Arial";

// Helper
function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: BG };
  return s;
}

// ============ SLIDE 1: TITLE ============
{
  const s = darkSlide();
  // Accent bar top
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: ACCENT } });

  s.addText("Lodge", {
    x: 0.8, y: 1.5, w: 8.4, h: 1.2,
    fontSize: 56, fontFace: TITLE_FONT, color: TEXT, bold: true, align: "center", margin: 0,
  });
  s.addText("AI-powered social opportunity engine", {
    x: 0.8, y: 2.7, w: 8.4, h: 0.6,
    fontSize: 20, fontFace: BODY_FONT, color: ACCENT_LIGHT, align: "center", margin: 0,
  });
  s.addText("Duke MEM PM Competition 2026", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.4,
    fontSize: 12, fontFace: BODY_FONT, color: MUTED, align: "center", margin: 0,
  });
}

// ============ SLIDE 2: THE PROBLEM ============
{
  const s = darkSlide();
  s.addText("You moved to a new city.", {
    x: 0.8, y: 0.5, w: 8.4, h: 0.8,
    fontSize: 36, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  const lines = [
    "Your group chat went quiet.",
    "You go to the gym alone.",
    "You cook dinner alone.",
    "You walk in the park alone.",
  ];
  lines.forEach((line, i) => {
    s.addText(line, {
      x: 1.2, y: 1.6 + i * 0.5, w: 7, h: 0.45,
      fontSize: 18, fontFace: BODY_FONT, color: MUTED, margin: 0,
    });
  });

  s.addText("Not by choice. By default.", {
    x: 1.2, y: 3.8, w: 7, h: 0.5,
    fontSize: 20, fontFace: BODY_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Bottom stat bar
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.6, w: 8.4, h: 0.7,
    fill: { color: SURFACE }, rectRadius: 0.08,
  });
  s.addText("162,000 Americans die annually from social isolation — more than lung cancer.", {
    x: 1.0, y: 4.65, w: 8, h: 0.6,
    fontSize: 12, fontFace: BODY_FONT, color: DANGER, align: "center", margin: 0,
  });
}

// ============ SLIDE 3: WRONG DIAGNOSIS ============
{
  const s = darkSlide();
  s.addText("Everyone calls this a loneliness epidemic.", {
    x: 0.8, y: 0.5, w: 8.4, h: 0.7,
    fontSize: 30, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });
  s.addText("The data says otherwise.", {
    x: 0.8, y: 1.1, w: 8.4, h: 0.5,
    fontSize: 22, fontFace: BODY_FONT, color: ACCENT_LIGHT, margin: 0,
  });

  s.addText("Loneliness rates haven't changed in decades. What changed is the infrastructure.", {
    x: 0.8, y: 1.8, w: 8.4, h: 0.5,
    fontSize: 14, fontFace: BODY_FONT, color: MUTED, margin: 0,
  });

  // Left column - 1995
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 2.6, w: 4, h: 2.2,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addText("1995", {
    x: 1.1, y: 2.8, w: 3.4, h: 0.4,
    fontSize: 16, fontFace: TITLE_FONT, color: SUCCESS, bold: true, margin: 0,
  });
  s.addText("Your dad moved for work. His new town had a Rotary club, a church league, a VFW post.", {
    x: 1.1, y: 3.3, w: 3.4, h: 1.2,
    fontSize: 13, fontFace: BODY_FONT, color: TEXT, margin: 0,
  });

  // Right column - 2026
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.2, y: 2.6, w: 4, h: 2.2,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addText("2026", {
    x: 5.5, y: 2.8, w: 3.4, h: 0.4,
    fontSize: 16, fontFace: TITLE_FONT, color: DANGER, bold: true, margin: 0,
  });
  s.addText("You moved for work. You have a group chat and Bumble BFF.", {
    x: 5.5, y: 3.3, w: 3.4, h: 1.2,
    fontSize: 13, fontFace: BODY_FONT, color: TEXT, margin: 0,
  });

  s.addText("Source: Trinity College Dublin, 2025", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.3,
    fontSize: 9, fontFace: BODY_FONT, color: MUTED, margin: 0,
  });
}

// ============ SLIDE 4: MARKET FAILURE ============
{
  const s = darkSlide();
  s.addText("The market tried. Every solution treats loneliness as an individual problem.", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.8,
    fontSize: 24, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  const rows = [
    ["Solution", "What it does", "Why it fails"],
    ["Bumble BFF", "Matches strangers 1:1", "Awkward. 50%+ never meet."],
    ["Meetup", "30-stranger events", "Networking, not friendship."],
    ["Therapy apps", "Treats feelings", "70% drop off. No structure."],
    ["Social media", "Engagement loops", "Heavy users 2x lonelier."],
  ];

  const tableOpts = {
    x: 0.8, y: 1.5, w: 8.4,
    border: { type: "solid", pt: 0.5, color: BORDER },
    colW: [2.2, 3.1, 3.1],
    fontSize: 12, fontFace: BODY_FONT, color: TEXT,
    rowH: [0.45, 0.45, 0.45, 0.45, 0.45],
    autoPage: false,
  };

  // Header row styling
  const tableRows = rows.map((row, rowIdx) =>
    row.map((cell) => ({
      text: cell,
      options: {
        fill: { color: rowIdx === 0 ? ACCENT : (rowIdx % 2 === 0 ? SURFACE : BG) },
        color: rowIdx === 0 ? "FFFFFF" : TEXT,
        bold: rowIdx === 0,
        fontSize: rowIdx === 0 ? 11 : 12,
        valign: "middle",
      },
    }))
  );

  s.addTable(tableRows, tableOpts);
}

// ============ SLIDE 5: THE INSIGHT ============
{
  const s = darkSlide();
  s.addText("Friendship doesn't form at events.", {
    x: 0.8, y: 0.6, w: 8.4, h: 0.7,
    fontSize: 32, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Quote box
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1.2, y: 1.7, w: 7.6, h: 1.4,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  // Accent bar on left of quote
  s.addShape(pres.shapes.RECTANGLE, {
    x: 1.2, y: 1.7, w: 0.06, h: 1.4,
    fill: { color: ACCENT },
  });
  s.addText('"You became best friends in college at the dining hall, not at a mixer."', {
    x: 1.6, y: 1.8, w: 6.8, h: 1.2,
    fontSize: 20, fontFace: BODY_FONT, color: ACCENT_LIGHT, italic: true, margin: 0,
  });

  s.addText("Friendship is a byproduct of repeated mundane proximity.\nThe same people, same place, same time, every week.", {
    x: 0.8, y: 3.5, w: 8.4, h: 0.8,
    fontSize: 15, fontFace: BODY_FONT, color: MUTED, margin: 0,
  });

  s.addText("Lodge rebuilds that structure.", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.5,
    fontSize: 20, fontFace: BODY_FONT, color: SUCCESS, bold: true, margin: 0,
  });
}

// ============ SLIDE 6: TARGET SEGMENT ============
{
  const s = darkSlide();
  s.addText("Adults 22-35 who just moved to a new city", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.7,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Stats row
  const stats = [
    { num: "~15M", label: "adults relocate annually" },
    { num: "#1", label: "trigger for adult friendship loss" },
    { num: "26%", label: "of men have 6+ close friends\n(down from 55% in 1990)" },
  ];

  stats.forEach((stat, i) => {
    const x = 0.8 + i * 3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.4, w: 2.6, h: 1.4,
      fill: { color: SURFACE }, rectRadius: 0.1,
    });
    s.addText(stat.num, {
      x, y: 1.5, w: 2.6, h: 0.6,
      fontSize: 28, fontFace: TITLE_FONT, color: ACCENT_LIGHT, bold: true, align: "center", margin: 0,
    });
    s.addText(stat.label, {
      x, y: 2.1, w: 2.6, h: 0.6,
      fontSize: 10, fontFace: BODY_FONT, color: MUTED, align: "center", margin: 0,
    });
  });

  // Personas
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 3.2, w: 4, h: 2,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addText("Jake, 27", {
    x: 1.1, y: 3.4, w: 3.4, h: 0.35,
    fontSize: 14, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });
  s.addText('Moved Austin → Denver for tech job. His group chat is memes and "we should hang." Goes to the gym alone every day.', {
    x: 1.1, y: 3.8, w: 3.4, h: 1.2,
    fontSize: 11, fontFace: BODY_FONT, color: MUTED, margin: 0,
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.2, y: 3.2, w: 4, h: 2,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addText("Maya, 24", {
    x: 5.5, y: 3.4, w: 3.4, h: 0.35,
    fontSize: 14, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });
  s.addText("Moved Chicago → Phoenix for nursing. Group FaceTime every 2 months. Tried Meetup — felt like networking.", {
    x: 5.5, y: 3.8, w: 3.4, h: 1.2,
    fontSize: 11, fontFace: BODY_FONT, color: MUTED, margin: 0,
  });
}

// ============ SLIDE 7: PRODUCT ============
{
  const s = darkSlide();
  s.addText("Lodge finds where friendship fits in your life.", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.7,
    fontSize: 26, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Path 1
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.4, w: 4, h: 2.8,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.4, w: 4, h: 0.04,
    fill: { color: ACCENT },
  });
  s.addText('Path 1: "I half-know someone"', {
    x: 1.1, y: 1.6, w: 3.4, h: 0.4,
    fontSize: 14, fontFace: TITLE_FONT, color: ACCENT_LIGHT, bold: true, margin: 0,
  });
  s.addText([
    { text: "You have a coworker or neighbor you kind of vibe with.\n\n", options: { fontSize: 12, color: TEXT } },
    { text: "Lodge gives you the script + sets up the recurring structure.\n\n", options: { fontSize: 12, color: TEXT } },
    { text: '"I walk at Sloan\'s Lake Tuesdays. Want to come?"', options: { fontSize: 12, color: ACCENT_LIGHT, italic: true } },
  ], {
    x: 1.1, y: 2.1, w: 3.4, h: 1.8,
    fontFace: BODY_FONT, margin: 0,
  });

  // Path 2
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.2, y: 1.4, w: 4, h: 2.8,
    fill: { color: SURFACE }, rectRadius: 0.1,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.4, w: 4, h: 0.04,
    fill: { color: SUCCESS },
  });
  s.addText('Path 2: "I don\'t know anyone"', {
    x: 5.5, y: 1.6, w: 3.4, h: 0.4,
    fontSize: 14, fontFace: TITLE_FONT, color: SUCCESS, bold: true, margin: 0,
  });
  s.addText([
    { text: "The map shows other people's rituals nearby.\n\n", options: { fontSize: 12, color: TEXT } },
    { text: "You see a pin: 'Tuesday walk, 7:30am, 1 spot open.'\n\n", options: { fontSize: 12, color: TEXT } },
    { text: "Tap → request to join. Feels like bumping into a neighbor.", options: { fontSize: 12, color: SUCCESS, italic: true } },
  ], {
    x: 5.5, y: 2.1, w: 3.4, h: 1.8,
    fontFace: BODY_FONT, margin: 0,
  });

  s.addText("Both paths → same mundane thing, same time, same place, every week. That's the loneliness intervention.", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.5,
    fontSize: 13, fontFace: BODY_FONT, color: MUTED, align: "center", margin: 0,
  });
}

// ============ SLIDE 8: HOW IT WORKS ============
{
  const s = darkSlide();
  s.addText("Social Opportunity Map", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  const steps = [
    { num: "1", text: "Tell Lodge your weekly routines", desc: "Gym MWF, park walk Tue/Thu, cook Sunday..." },
    { num: "2", text: "AI cross-analyzes and scores on 6 factors", desc: "Consistency, compatibility, time flexibility, location, invitation ease, relationship acceleration" },
    { num: "3", text: "Map shows your social opportunity windows", desc: "Pins color-coded by score. Your week visualized." },
    { num: "4", text: "Tap a pin → AI reasoning + session scaffolding", desc: '"Your park walk scored 95 because..."' },
  ];

  steps.forEach((step, i) => {
    const y = 1.3 + i * 1;
    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: 0.8, y: y, w: 0.5, h: 0.5,
      fill: { color: ACCENT },
    });
    s.addText(step.num, {
      x: 0.8, y: y, w: 0.5, h: 0.5,
      fontSize: 16, fontFace: TITLE_FONT, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0,
    });
    s.addText(step.text, {
      x: 1.5, y: y, w: 7.5, h: 0.35,
      fontSize: 16, fontFace: BODY_FONT, color: TEXT, bold: true, margin: 0,
    });
    s.addText(step.desc, {
      x: 1.5, y: y + 0.35, w: 7.5, h: 0.35,
      fontSize: 11, fontFace: BODY_FONT, color: MUTED, margin: 0,
    });
  });
}

// ============ SLIDE 9: AI APPLICATION ============
{
  const s = darkSlide();
  s.addText("Where AI goes beyond prompts", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Implemented
  s.addText("IMPLEMENTED", {
    x: 0.8, y: 1.2, w: 4.2, h: 0.3,
    fontSize: 10, fontFace: BODY_FONT, color: SUCCESS, bold: true, margin: 0,
  });

  const implemented = [
    "Social Opportunity Engine — multi-factor scoring across full weekly routine",
    "Session Scaffolding — activity-specific, relationship-stage-aware",
    "Invitation Synthesizer — contextual low-stakes framing copy",
  ];
  implemented.forEach((item, i) => {
    s.addText(item, {
      x: 1.0, y: 1.6 + i * 0.45, w: 4, h: 0.4,
      fontSize: 11, fontFace: BODY_FONT, color: TEXT, bullet: true, margin: 0,
    });
  });

  // Roadmap
  s.addText("ROADMAP", {
    x: 5.2, y: 1.2, w: 4, h: 0.3,
    fontSize: 10, fontFace: BODY_FONT, color: ACCENT_LIGHT, bold: true, margin: 0,
  });

  const roadmap = [
    "Spatiotemporal Anchor Matching",
    "Routine Entropy Detection",
    "Compatibility Friction Scoring",
    "Silent Bridge Notifications",
  ];
  roadmap.forEach((item, i) => {
    s.addText(item, {
      x: 5.4, y: 1.6 + i * 0.45, w: 3.8, h: 0.4,
      fontSize: 11, fontFace: BODY_FONT, color: TEXT, bullet: true, margin: 0,
    });
  });

  // Key differentiator
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.0, w: 8.4, h: 0.8,
    fill: { color: SURFACE }, rectRadius: 0.08,
  });
  s.addText("Not a chatbot. Not summarization. AI reasons across your entire week to find insights no human would compute.", {
    x: 1.0, y: 4.1, w: 8, h: 0.6,
    fontSize: 13, fontFace: BODY_FONT, color: ACCENT_LIGHT, italic: true, align: "center", margin: 0,
  });
}

// ============ SLIDE 10: CONSTRAINTS ============
{
  const s = darkSlide();
  s.addText("Constraint compliance", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  const constraints = [
    { check: "Digital product only", how: "Web app with map interface" },
    { check: "AI meaningful role", how: "7 AI layers (4 built, 3 roadmap)" },
    { check: "Clearly defined segment", how: "Adults 22-35, relocators (~15M/yr)" },
    { check: "No social networks", how: "No feed, profiles, followers" },
    { check: "No dating apps", how: "No matching, swiping, 1:1 pairing" },
    { check: "No therapy apps", how: "Never mentions loneliness" },
  ];

  constraints.forEach((c, i) => {
    const y = 1.3 + i * 0.65;
    s.addText("✓", {
      x: 0.8, y, w: 0.4, h: 0.5,
      fontSize: 18, fontFace: BODY_FONT, color: SUCCESS, bold: true, margin: 0,
    });
    s.addText(c.check, {
      x: 1.3, y, w: 3.5, h: 0.5,
      fontSize: 14, fontFace: BODY_FONT, color: TEXT, bold: true, margin: 0,
    });
    s.addText(c.how, {
      x: 5, y, w: 4.2, h: 0.5,
      fontSize: 12, fontFace: BODY_FONT, color: MUTED, margin: 0,
    });
  });
}

// ============ SLIDE 11: GTM ============
{
  const s = darkSlide();
  s.addText("Relocators self-identify.", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });
  s.addText("We don't find them — they announce themselves.", {
    x: 0.8, y: 0.9, w: 8.4, h: 0.4,
    fontSize: 16, fontFace: BODY_FONT, color: ACCENT_LIGHT, margin: 0,
  });

  const phases = [
    { phase: "Phase 1: Seed", items: 'Reddit r/moving, r/[city]\nFacebook "[City] Newcomers"\nWorkplace Slack #new-in-town', color: SUCCESS },
    { phase: "Phase 2: Organic", items: "Cross-city virality\nEvery user seeds 2 markets\nSMS invites = marketing", color: ACCENT_LIGHT },
    { phase: "Phase 3: Paid", items: "Corporate HR relocation packages\nReal estate platform partnerships\nTargeted ads: 'just moved to [city]'", color: WARNING },
  ];

  phases.forEach((p, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.7, w: 2.8, h: 2.8,
      fill: { color: SURFACE }, rectRadius: 0.1,
    });
    s.addText(p.phase, {
      x: x + 0.2, y: 1.9, w: 2.4, h: 0.4,
      fontSize: 13, fontFace: TITLE_FONT, color: p.color, bold: true, margin: 0,
    });
    s.addText(p.items, {
      x: x + 0.2, y: 2.4, w: 2.4, h: 1.8,
      fontSize: 11, fontFace: BODY_FONT, color: MUTED, margin: 0,
    });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.7, w: 8.4, h: 0.6,
    fill: { color: SURFACE }, rectRadius: 0.08,
  });
  s.addText("Lodge NEVER positions as a loneliness solution. Utility framing only. Loneliness reduction is the outcome, not the pitch.", {
    x: 1.0, y: 4.75, w: 8, h: 0.5,
    fontSize: 11, fontFace: BODY_FONT, color: WARNING, align: "center", margin: 0,
  });
}

// ============ SLIDE 12: SCALE ============
{
  const s = darkSlide();
  s.addText("Works for user #1. Becomes infrastructure at 1M.", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 26, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  const scale = [
    { users: "0", desc: "Personal analysis tool.\nSingle-player value.", color: MUTED },
    { users: "1K", desc: "Nearby rituals appear.\nDiscovery begins.", color: ACCENT_LIGHT },
    { users: "100K", desc: "AI learns from real data.\nWhich rituals stick.", color: SUCCESS },
    { users: "1M", desc: "Every neighborhood\nhas a living map.", color: WARNING },
  ];

  scale.forEach((s2, i) => {
    const x = 0.5 + i * 2.4;
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.55, y: 1.5, w: 1.3, h: 1.3,
      fill: { color: SURFACE },
      line: { color: s2.color, width: 2 },
    });
    s.addText(s2.users, {
      x: x + 0.55, y: 1.7, w: 1.3, h: 0.9,
      fontSize: 22, fontFace: TITLE_FONT, color: s2.color, bold: true, align: "center", valign: "middle", margin: 0,
    });
    s.addText(s2.desc, {
      x: x, y: 3.1, w: 2.4, h: 1,
      fontSize: 11, fontFace: BODY_FONT, color: MUTED, align: "center", margin: 0,
    });
  });

  // Connecting line
  s.addShape(pres.shapes.LINE, {
    x: 1.85, y: 2.15, w: 6.7, h: 0,
    line: { color: BORDER, width: 1.5, dashType: "dash" },
  });
}

// ============ SLIDE 13: BUSINESS MODEL ============
{
  const s = darkSlide();
  s.addText("Business model", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
  });

  // Tiers
  const tiers = [
    { name: "Free", price: "$0", features: "1 map analysis\nBasic results", color: MUTED },
    { name: "Pro", price: "$8/mo", features: "Unlimited analyses\nSession scaffolding\nRitual creation", color: ACCENT_LIGHT },
    { name: "Enterprise", price: "$5/emp/mo", features: "HR relocation packages\nTeam onboarding\nAnalytics", color: SUCCESS },
  ];

  tiers.forEach((t, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.3, w: 2.8, h: 2.6,
      fill: { color: SURFACE }, rectRadius: 0.1,
      line: i === 1 ? { color: ACCENT, width: 2 } : undefined,
    });
    s.addText(t.name, {
      x: x + 0.2, y: 1.5, w: 2.4, h: 0.35,
      fontSize: 14, fontFace: TITLE_FONT, color: t.color, bold: true, margin: 0,
    });
    s.addText(t.price, {
      x: x + 0.2, y: 1.9, w: 2.4, h: 0.45,
      fontSize: 24, fontFace: TITLE_FONT, color: TEXT, bold: true, margin: 0,
    });
    s.addText(t.features, {
      x: x + 0.2, y: 2.5, w: 2.4, h: 1.2,
      fontSize: 11, fontFace: BODY_FONT, color: MUTED, margin: 0,
    });
  });

  // TAM
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 4.2, w: 8.4, h: 0.8,
    fill: { color: SURFACE }, rectRadius: 0.08,
  });
  s.addText("15M relocators × 5% adoption × $8/mo = $72M ARR", {
    x: 1, y: 4.3, w: 8, h: 0.6,
    fontSize: 16, fontFace: BODY_FONT, color: ACCENT_LIGHT, bold: true, align: "center", margin: 0,
  });
}

// ============ SLIDE 14: CLOSE ============
{
  const s = darkSlide();
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.585, w: 10, h: 0.04, fill: { color: ACCENT } });

  s.addText("Lodge doesn't find you friends.", {
    x: 0.8, y: 1.5, w: 8.4, h: 0.9,
    fontSize: 36, fontFace: TITLE_FONT, color: TEXT, bold: true, align: "center", margin: 0,
  });
  s.addText("It finds where friendship fits in the life you're already living.", {
    x: 0.8, y: 2.5, w: 8.4, h: 0.6,
    fontSize: 20, fontFace: BODY_FONT, color: ACCENT_LIGHT, align: "center", margin: 0,
  });

  s.addText("lodge-bay.vercel.app", {
    x: 0.8, y: 3.8, w: 8.4, h: 0.4,
    fontSize: 14, fontFace: BODY_FONT, color: MUTED, align: "center", margin: 0,
  });
  s.addText("Thank you.", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.4,
    fontSize: 16, fontFace: BODY_FONT, color: TEXT, align: "center", margin: 0,
  });
}

// ============ SAVE ============
pres.writeFile({ fileName: "/Users/sidharthsundaram/Desktop/lodge/Lodge-Pitch-Deck.pptx" })
  .then(() => console.log("Deck saved: Lodge-Pitch-Deck.pptx"))
  .catch((err) => console.error("Error:", err));
