// Session Templates for Rugby, Soccer, and GAA
// Each template pre-loads a common combination of drills
// Coaches can modify these after loading (reorder, add/remove drills, adjust times)

export const SESSION_TEMPLATES = {
  rugby: [
    {
      name: "Standard Team Session",
      drills: ["r-wu-1", "r-wu-3", "r-ph-1", "r-pp-1", "r-df-1", "r-gs-1"]
    },
    {
      name: "Contact & Defence Focus",
      drills: ["r-wu-2", "r-ct-1", "r-ct-2", "r-df-1", "r-df-3", "r-gs-2"]
    },
    {
      name: "Attack & Phase Play",
      drills: ["r-wu-3", "r-ph-2", "r-pp-2", "r-pp-3", "r-gs-3"]
    },
    {
      name: "Set Piece Session",
      drills: ["r-wu-1", "r-sp-1", "r-sp-2", "r-sp-3", "r-gs-1"]
    },
    {
      name: "Light / Recovery",
      drills: ["r-wu-1", "r-ph-1", "r-wu-3"]
    },
  ],
  soccer: [
    {
      name: "Standard Team Session",
      drills: ["s-wu-1", "s-wu-2", "s-pp-1", "s-ap-1", "s-gs-2"]
    },
    {
      name: "Possession & Build-Up",
      drills: ["s-wu-2", "s-pp-3", "s-pp-4", "s-pp-2", "s-gs-2"]
    },
    {
      name: "Attacking & Finishing",
      drills: ["s-wu-3", "s-ap-2", "s-ap-3", "s-sf-1", "s-gs-1"]
    },
    {
      name: "Defensive Organisation",
      drills: ["s-wu-1", "s-df-1", "s-df-2", "s-df-3", "s-gs-3"]
    },
  ],
  gaa: [
    {
      name: "Standard Team Session",
      drills: ["g-wu-1", "g-wu-3", "g-hp-1", "g-kp-1", "g-ss-1", "g-gs-1"]
    },
    {
      name: "Skills & Scoring",
      drills: ["g-wu-2", "g-hp-2", "g-kp-3", "g-ss-1", "g-ss-2", "g-gs-2"]
    },
    {
      name: "Attack Patterns",
      drills: ["g-wu-3", "g-am-1", "g-am-2", "g-gs-1"]
    },
    {
      name: "Defence & Tackling",
      drills: ["g-wu-1", "g-td-1", "g-td-2", "g-td-3", "g-gs-3"]
    },
  ],
};

// Get templates for a specific sport
export function getTemplatesForSport(sport) {
  return SESSION_TEMPLATES[sport] || [];
}