const FLAWS = {
  "Limited Degree": {
    name: "Limited Degree",
    data: {
      description: "<p>Your Affliction is limited to no more than two degrees of effect. With two applications of this modifier, it is limited to no more than one degree of effect.</p><p>–1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: -1 }
    }
  },
  // We will add more flaws here as we extract them
};

module.exports = FLAWS;
