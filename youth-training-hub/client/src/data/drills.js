// Drill Libraries for Rugby, Soccer, and GAA
// Each drill has a unique ID, name, and default duration
// IDs follow pattern: [sport]-[category]-[number]

export const DRILL_LIBRARY = {
  rugby: {
    "Warm-Up & Agility": [
      { id: "r-wu-1", name: "Dynamic Stretch Corridor", duration: 8 },
      { id: "r-wu-2", name: "Ladder & Cone Agility", duration: 10 },
      { id: "r-wu-3", name: "Touch Rugby (light)", duration: 10 },
    ],
    "Contact & Tackle": [
      { id: "r-ct-1", name: "Tackle Technique Pairs", duration: 10 },
      { id: "r-ct-2", name: "Ruck Clear-Out Circuit", duration: 12 },
      { id: "r-ct-3", name: "1v1 Channel Tackle", duration: 8 },
    ],
    "Passing & Handling": [
      { id: "r-ph-1", name: "Lateral Pass Relay", duration: 8 },
      { id: "r-ph-2", name: "Miss-Pass Progression", duration: 10 },
      { id: "r-ph-3", name: "Offload Under Pressure", duration: 10 },
    ],
    "Phase Play & Attack": [
      { id: "r-pp-1", name: "Overlap 3v2", duration: 12 },
      { id: "r-pp-2", name: "Multi-Phase Attack", duration: 15 },
      { id: "r-pp-3", name: "Loop & Switch Plays", duration: 12 },
    ],
    Defence: [
      { id: "r-df-1", name: "Drift Defence Pattern", duration: 12 },
      { id: "r-df-2", name: "Blitz Defence Walk-Through", duration: 10 },
      { id: "r-df-3", name: "Line Speed Drill", duration: 8 },
    ],
    "Set Piece": [
      { id: "r-sp-1", name: "Lineout Lifting & Timing", duration: 15 },
      { id: "r-sp-2", name: "Scrum Engagement", duration: 12 },
      { id: "r-sp-3", name: "Restart Kick-Off Patterns", duration: 10 },
    ],
    "Game Scenarios": [
      { id: "r-gs-1", name: "Small-Sided Game (6v6)", duration: 15 },
      { id: "r-gs-2", name: "Full Match Scenario", duration: 20 },
      { id: "r-gs-3", name: "Red Zone Attack/Defence", duration: 12 },
    ],
    Fitness: [
      { id: "r-fc-1", name: "Bronco / Shuttle Test", duration: 10 },
      { id: "r-fc-2", name: "Repeated Sprint Sets", duration: 12 },
    ],
  },
  soccer: {
    "Warm-Up & Agility": [
      { id: "s-wu-1", name: "Dynamic Movement Patterns", duration: 8 },
      { id: "s-wu-2", name: "Rondo (5v2)", duration: 10 },
      { id: "s-wu-3", name: "Ball Mastery Circuit", duration: 8 },
    ],
    "Passing & Possession": [
      { id: "s-pp-1", name: "4v2 Keep-Ball Grid", duration: 10 },
      { id: "s-pp-2", name: "Switching Play", duration: 12 },
      { id: "s-pp-3", name: "One-Touch Passing Triangles", duration: 8 },
      { id: "s-pp-4", name: "Positional Play Grid", duration: 15 },
    ],
    "Attacking Play": [
      { id: "s-ap-1", name: "Overlap & Underlap Runs", duration: 12 },
      { id: "s-ap-2", name: "Counter-Attack 3v2", duration: 10 },
      { id: "s-ap-3", name: "Combination Play", duration: 12 },
    ],
    Defending: [
      { id: "s-df-1", name: "Pressing Triggers", duration: 12 },
      { id: "s-df-2", name: "1v1 Defending Channel", duration: 8 },
      { id: "s-df-3", name: "Defensive Block Shape", duration: 12 },
    ],
    "Shooting & Finishing": [
      { id: "s-sf-1", name: "Finishing Circuit", duration: 15 },
      { id: "s-sf-2", name: "Crossing & Heading", duration: 12 },
    ],
    "Set Pieces": [
      { id: "s-sp-1", name: "Corner Routines", duration: 12 },
      { id: "s-sp-2", name: "Free Kick Patterns", duration: 10 },
    ],
    "Game Scenarios": [
      { id: "s-gs-1", name: "Small-Sided Game (4v4)", duration: 15 },
      { id: "s-gs-2", name: "Conditioned Game", duration: 15 },
      { id: "s-gs-3", name: "Full Match Scrimmage", duration: 20 },
    ],
  },
  gaa: {
    "Warm-Up & Agility": [
      { id: "g-wu-1", name: "Dynamic Warm-Up Laps", duration: 8 },
      { id: "g-wu-2", name: "Ladder / Cone Agility", duration: 10 },
      { id: "g-wu-3", name: "Keepball (hand-pass)", duration: 10 },
    ],
    "Hand-Passing": [
      { id: "g-hp-1", name: "Hand-Pass Accuracy Pairs", duration: 8 },
      { id: "g-hp-2", name: "Pop-Pass Under Pressure", duration: 10 },
    ],
    "Kick-Passing": [
      { id: "g-kp-1", name: "Kick-Pass to Target Zones", duration: 10 },
      { id: "g-kp-2", name: "Diagonal Kick-Pass", duration: 10 },
      { id: "g-kp-3", name: "Kick-Pass Off Both Feet", duration: 12 },
    ],
    "Shooting & Scoring": [
      { id: "g-ss-1", name: "Point-Taking Circuit", duration: 12 },
      { id: "g-ss-2", name: "Goal Chance Finishing", duration: 10 },
      { id: "g-ss-3", name: "Free-Taking Practice", duration: 10 },
    ],
    "Tackling & Defence": [
      { id: "g-td-1", name: "1v1 Tackling Drill", duration: 8 },
      { id: "g-td-2", name: "Hook & Block Practice", duration: 10 },
      { id: "g-td-3", name: "Defensive Shape", duration: 12 },
    ],
    "Attack & Movement": [
      { id: "g-am-1", name: "Overlap Runs (3v2)", duration: 12 },
      { id: "g-am-2", name: "Kick-Out Attack Pattern", duration: 12 },
    ],
    "Game Scenarios": [
      { id: "g-gs-1", name: "Small-Sided Game (5v5)", duration: 15 },
      { id: "g-gs-2", name: "Conditioned Game", duration: 15 },
      { id: "g-gs-3", name: "Full Match Scenario", duration: 20 },
    ],
  },
};

// Helper function to find a drill by ID
export function findDrill(sport, drillId) {
  const lib = DRILL_LIBRARY[sport];
  if (!lib) return null;

  for (const category of Object.values(lib)) {
    const found = category.find((d) => d.id === drillId);
    if (found) return { ...found, notes: "" };
  }

  return null;
}

// Get total duration for a list of drills
export function totalMinutes(drills) {
  return (drills || []).reduce((sum, drill) => sum + (drill.duration || 0), 0);
}