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
  "Accurate": {
    name: "Accurate",
    data: {
      description: "<p>An effect with this extra is especially accurate; you get +2 per Accurate rank to attack checks made with it.</p><p>Flat 1 point per rank.</p>",
      cout: { fixe: true, rang: true, value: 1 }
    }
  },
  "Affects Corporeal": {
    name: "Affects Corporeal",
    data: {
      description: "<p>An incorporeal being can use an effect with this extra on the corporeal world. When an effect is used against a corporeal target, the effect’s rank is equal to the rank of this extra, up to a maximum of the effect’s full rank.</p><p>Flat 1 point per rank.</p>",
      cout: { fixe: true, rang: true, value: 1 }
    }
  },
  "Affects Insubstantial": {
    name: "Affects Insubstantial",
    data: {
      description: "<p>An effect with this extra works on insubstantial targets, in addition to having its normal effect on corporeal targets. Rank 1 allows the effect to work at half its normal rank; rank 2 allows it to function at full rank.</p><p>Flat 1 or 2 points.</p>",
      cout: { fixe: true, rang: false, value: 1 }
    }
  },
  "Affects Objects": {
    name: "Affects Objects",
    data: {
      description: "<p>This modifier allows effects normally resisted by Fortitude to work on non-living objects (those with no Stamina).</p><p>+0 or +1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Affects Others": {
    name: "Affects Others",
    data: {
      description: "<p>This extra allows you to give someone else use of a personal effect. You must touch the subject as a standard action, and they have control over their use of the effect.</p><p>+0 or +1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Alternate Effect": {
    name: "Alternate Effect",
    data: {
      description: "<p>This modifier allows you to “swap-out” the effect for an entire other, alternate, effect!</p><p>Flat 1 or 2 points.</p>",
      cout: { fixe: true, rang: false, value: 1 }
    }
  },
  "Area": {
    name: "Area",
    data: {
      description: "<p>This extra allows an effect that normally works on a single target to affect an area. No attack check is needed; potential targets are permitted a Dodge resistance check (DC 10 + effect rank) to reduce the effect.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Burst Area": {
    name: "Burst Area",
    data: {
      description: "<p>The effect fills a sphere with a 30-foot radius (distance rank 0).</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Cloud Area": {
    name: "Cloud Area",
    data: {
      description: "<p>The effect fills a sphere with a 15-foot radius (distance rank –1) that lingers for one round.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Cone Area": {
    name: "Cone Area",
    data: {
      description: "<p>The effect fills a cone with a length, width, and height of 60 feet (distance rank 1).</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Cylinder Area": {
    name: "Cylinder Area",
    data: {
      description: "<p>The effect fills a cylinder 30 feet in radius and height (distance rank 0).</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Line Area": {
    name: "Line Area",
    data: {
      description: "<p>The effect fills a path 6 feet wide and 30 feet long (distance ranks -2 and 0) in a straight line.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  "Perception Area": {
    name: "Perception Area",
    data: {
      description: "<p>The effect works on anyone able to perceive the target point with a particular sense. Targets get a Dodge resistance check to avoid the effect entirely.</p><p>+1 cost per rank.</p>",
      cout: { fixe: false, rang: true, value: 1 }
    }
  },
  // We will add more extras here as we extract them
};

module.exports = EXTRAS;
