const EXTRAS = {
  "Concentration": {
    name: "Concentration",
    data: {
      description: "<p>Once you have hit with a Concentration Affliction, so long as you continue to take a standard action each turn to maintain the effect, the target must make a new resistance check against it, with no attack check required.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  // We will add more extras here as we extract them
};

module.exports = EXTRAS;
