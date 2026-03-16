const EXTRAS = {
  "Concentration": {
    name: "Concentration",
    data: {
      description: "<p>Once you have hit with a Concentration Affliction, so long as you continue to take a standard action each turn to maintain the effect, the target must make a new resistance check against it, with no attack check required.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Alternate Resistance": {
    name: "Alternate Resistance",
    data: {
      description: "<p>Some Afflictions may be initially resisted by Dodge, representing the need for quick reaction time or reflexes to avoid the effect. In this case, the later resistance checks to remove the Affliction’s conditions are typically still based on Fortitude or Will.</p><p>+0 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 0 }
    }
  },
  "Cumulative": {
    name: "Cumulative",
    data: {
      description: "<p>A Cumulative Affliction adds any further degrees to the existing degrees on the target. For example, if you hit a target and impose a vulnerable condition (one degree), then attack again and get one degree on the effect, you impose the Affliction’s second degree condition.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Progressive": {
    name: "Progressive",
    data: {
      description: "<p>This modifier causes an Affliction to increase incrementally without any effort from you. If the target fails a resistance check to end the Affliction, it not only persists, but increases in effect by one degree!</p><p>+2 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 2 }
    }
  },
  // We will add more extras here as we extract them
};

module.exports = EXTRAS;
