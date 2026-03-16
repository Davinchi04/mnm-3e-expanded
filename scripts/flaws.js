const FLAWS = {
  "Limited Degree": {
    name: "Limited Degree",
    data: {
      description: "<p>Your Affliction is limited to no more than two degrees of effect. With two applications of this modifier, it is limited to no more than one degree of effect.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  "Activation": {
    name: "Activation",
    data: {
      description: "<p>Assuming your Alternate Form requires a move action (–1 point) or a standard action (–2 points).</p>",
      cout: { fixe: true, rang: false, value: -1 } // Assuming -1 for move, user can adjust
    }
  },
  "Instant Recovery": {
    name: "Instant Recovery",
    data: {
      description: "<p>The target of an Affliction effect with this modifier recovers automatically, no check required, at the end of the round in which the duration ends.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  // We will add more flaws here as we extract them
};

module.exports = FLAWS;
