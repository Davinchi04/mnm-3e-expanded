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
      description: "<p>A power with this flaw requires an action to prepare or activate before any of its effects are usable. Move action is –1 point, standard action is –2 points.</p><p>Flat -1 or -2 points.</p>",
      cout: { fixe: true, rang: false, value: -1 }
    }
  },
  "Instant Recovery": {
    name: "Instant Recovery",
    data: {
      description: "<p>The target of an Affliction effect with this modifier recovers automatically, no check required, at the end of the round in which the duration ends.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  "Check Required": {
    name: "Check Required",
    data: {
      description: "<p>An effect with this flaw requires a check of some sort—usually a skill check—with a DC equal to 10 + rank.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  "Distracting": {
    name: "Distracting",
    data: {
      description: "<p>Using a Distracting effect requires so much concentration or effort that you are vulnerable until the start of your next turn.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  "Feedback": {
    name: "Feedback",
    data: {
      description: "<p>You suffer Damage if your effect is attacked. This flaw usually applies to manifestation or sensory effects.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  "Grab-Based": {
    name: "Grab-Based",
    data: {
      description: "<p>An attack with this flaw requires you to successfully grab and hold a target before the effect can be used.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  // We will add more flaws here as we extract them
};

module.exports = FLAWS;
