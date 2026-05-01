// Static deck data. Cards are images + text; both rendered for fallback.
// `weight` controls draw probability within the pile (default 1).
// Body text may include placeholders [TARGET] and [WORD] which the operator
// fills in before projecting.

export const PLAYERS_DEFAULT = [
  { id: "jeroen",  name: "Jeroen"  },
  { id: "kurt",    name: "Kurt"    },
  { id: "firdoz",  name: "Firdoz"  },
  { id: "pieter",  name: "Pieter"  },
  { id: "thomas",  name: "Thomas"  },
  { id: "olivier", name: "Olivier" },
  { id: "glen",    name: "Glen"    },
];

export const CARDS = [
  // ---------- LAWS (8 entries; 4 starting + 4 drawn) ----------
  { id: "law_door_applause", type: "law", title: "DOOR APPLAUSE",
    body: "Whenever anyone walks through the marked door, the rest of the room applauds quietly.",
    image: "cards/law_door_applause.png", weight: 1, source: "starting" },
  { id: "law_no_phubben", type: "law", title: "NO PHUBBEN",
    body: "Phones on silent. Scrolling, social media, or messaging while others are present costs -1 point. Robin is the judge.",
    image: "cards/law_no_phubben.png", weight: 1, source: "starting" },
  { id: "law_add_forbidden_word", type: "law", title: "ADD A FORBIDDEN WORD",
    body: "The group nominates and votes on one new word. It joins the forbidden list, permanently.",
    image: "cards/law_add_forbidden_word.png", weight: 4, source: "wheel" },
  { id: "law_repeal", type: "law", title: "REPEAL A LAW",
    body: "The group picks one law currently in play and removes it. Vote if there is disagreement.",
    image: "cards/law_repeal.png", weight: 1, source: "wheel" },
  { id: "law_compliment_mode", type: "law", title: "COMPLIMENT MODE",
    body: "Before each TI4 action, briefly compliment another player. Sincere only — never mean.",
    image: "cards/law_compliment_mode.png", weight: 1, source: "wheel" },
  { id: "law_galactic_council", type: "law", title: "THE GALACTIC COUNCIL",
    body: "At the start of each round, the speaker reads a one-line decree of the Galactic Council, of their own invention.",
    image: "cards/law_galactic_council.png", weight: 1, source: "wheel" },

  // ---------- DIRECTIVES (10) ----------
  { id: "directive_humming", type: "directive", title: "HUMMING",
    body: "Drawn player puts on headphones with loud music and hums a known song. The rest of the table guesses within a time limit.",
    image: "cards/directive_humming.png", weight: 1 },
  { id: "directive_trigger_sip", type: "directive", title: "TAKE A SHOT",
    body: "Drawn player picks one extremely common Dutch word (het, de, ook, ja, ik…). For the rest of this round, every utterance triggers a group sip of water. Forget to sip = -1 point.",
    image: "cards/directive_trigger_sip.png", weight: 1 },
  { id: "directive_make_a_rule", type: "directive", title: "MAKE A RULE",
    body: "Drawn player invents a sub-rule for the next round. Violation = -1 point. Expires after one round.",
    image: "cards/directive_make_a_rule.png", weight: 1 },
  { id: "directive_question_master", type: "directive", title: "QUESTION MASTER",
    body: "For the next TI4 round, drawn player must phrase all their TI4 actions as questions. Violation = -1 point.",
    image: "cards/directive_question_master.png", weight: 1 },
  { id: "directive_third_person", type: "directive", title: "THIRD PERSON",
    body: "For the next TI4 round, drawn player must refer to themselves in the third person. Violation = -1 point.",
    image: "cards/directive_third_person.png", weight: 1 },
  { id: "directive_dialect_westvlaams", type: "directive", title: "DIALECT — WEST-VLAAMS",
    body: "For the first 5 minutes of the next round, drawn player speaks West-Vlaams (or as close as they can manage).",
    image: "cards/directive_dialect_westvlaams.png", weight: 1 },
  { id: "directive_dialect_limburgs", type: "directive", title: "DIALECT — LIMBURGS",
    body: "For the first 5 minutes of the next round, drawn player speaks Limburgs.",
    image: "cards/directive_dialect_limburgs.png", weight: 1 },
  { id: "directive_dialect_hyper_abn", type: "directive", title: "DIALECT — HYPER-ABN",
    body: "For the first 5 minutes of the next round, drawn player speaks perfect, over-articulated Standaardnederlands.",
    image: "cards/directive_dialect_hyper_abn.png", weight: 1 },
  { id: "directive_sportscaster", type: "directive", title: "SPORTSCASTER",
    body: "For the first 5 minutes of the next round, drawn player narrates their own TI4 actions in live-sports commentary voice.",
    image: "cards/directive_sportscaster.png", weight: 1 },
  { id: "directive_nature_documentary", type: "directive", title: "NATURE DOCUMENTARY",
    body: "For the first 5 minutes of the next round, drawn player narrates the table in soft Attenborough-hush.",
    image: "cards/directive_nature_documentary.png", weight: 1 },

  // ---------- SECRETS (7) ----------
  { id: "secret_slip_a_word", type: "secret", title: "SLIP A WORD IN",
    body: "Get [TARGET] to say [WORD] before the next round begins. +1 point if they do.",
    image: "cards/secret_slip_a_word.png", weight: 1, placeholders: ["TARGET", "WORD"] },
  { id: "secret_silent_laugh", type: "secret", title: "SILENT LAUGH",
    body: "Make Jeroen laugh within 5 minutes — without telling a joke.",
    image: "cards/secret_silent_laugh.png", weight: 1 },
  { id: "secret_compliment_chain", type: "secret", title: "COMPLIMENT CHAIN",
    body: "Compliment someone meaningfully this round. If nobody else compliments anyone, +1 point.",
    image: "cards/secret_compliment_chain.png", weight: 1 },
  { id: "secret_absurd_word", type: "secret", title: "ABSURD WORD",
    body: "Use [WORD] three times naturally this round. +1 point if uncalled.",
    image: "cards/secret_absurd_word.png", weight: 1, placeholders: ["WORD"] },
  { id: "secret_mirror", type: "secret", title: "MIRROR",
    body: "Mirror Jeroen's posture for 10 minutes. +1 point if he doesn't notice.",
    image: "cards/secret_mirror.png", weight: 1 },
  { id: "secret_two_agents", type: "secret", title: "THE TWO AGENTS",
    body: "You and one other are agents. Convince the rest of a fake Ardennes fact. Both score if the table buys it.",
    image: "cards/secret_two_agents.png", weight: 1, twoAgents: true },
  { id: "secret_quiet_move", type: "secret", title: "QUIET MOVE",
    body: "Subtly reposition an object in the room without being seen. +1 point if successful.",
    image: "cards/secret_quiet_move.png", weight: 1 },

  // ---------- TARGETED (7) ----------
  { id: "targeted_compliment_storm", type: "targeted", title: "COMPLIMENT STORM",
    body: "For ~10 minutes, the table earnestly compliments [TARGET] on tangentially related things. Confusing in a warm way.",
    image: "cards/targeted_compliment_storm.png", weight: 1, tapCount: 3, placeholders: ["TARGET"] },
  { id: "targeted_topic_drift", type: "targeted", title: "TOPIC DRIFT",
    body: "Over ~30 minutes, steer every conversation around [TARGET] toward one absurd topic until they notice.",
    image: "cards/targeted_topic_drift.png", weight: 1, tapCount: 3, placeholders: ["TARGET"] },
  { id: "targeted_furniture_creep", type: "targeted", title: "FURNITURE CREEP",
    body: "While [TARGET] is at the table, every time anyone leaves the main room, one piece of furniture moves quietly 20 cm. Never acknowledged. If they ask 'is something different?', they win.",
    image: "cards/targeted_furniture_creep.png", weight: 1, tapCount: 2, placeholders: ["TARGET"] },
  { id: "targeted_wrong_name_day", type: "targeted", title: "WRONG NAME DAY",
    body: "For ~30 minutes, everyone calls [TARGET] by [WRONG NAME]. Robin assigns the new name. Never acknowledge corrections.",
    image: "cards/targeted_wrong_name_day.png", weight: 1, tapCount: 3, placeholders: ["TARGET", "WRONG NAME"] },
  { id: "targeted_emphatic_agreement", type: "targeted", title: "EMPHATIC AGREEMENT",
    body: "Every time [TARGET] says anything, one of you enthusiastically agrees ('YES. EXACTLY.') and another nods deeply. Treat trivial statements as profound truths. Sincere, never sarcastic.",
    image: "cards/targeted_emphatic_agreement.png", weight: 1, tapCount: 2, placeholders: ["TARGET"] },
  { id: "targeted_rule_of_reality", type: "targeted", title: "RULE-OF-REALITY",
    body: "When [TARGET] leaves the room, invent a new fact about reality. When they return, act as if it has always been true.",
    image: "cards/targeted_rule_of_reality.png", weight: 1, tapCount: 4, placeholders: ["TARGET"] },
  { id: "targeted_reverse_mirror", type: "targeted", title: "REVERSE MIRROR",
    body: "Subtly mimic [TARGET]'s gestures and posture for ~15 minutes.",
    image: "cards/targeted_reverse_mirror.png", weight: 1, tapCount: 2, placeholders: ["TARGET"] },
];

// Convenience selectors
export const cardsByType = (type) => CARDS.filter((c) => c.type === type);

// Map "PUBLIC" wheel slice to law+directive combined; that's how the plan
// describes it. ~30% of public draws are laws, rest are directives. We achieve
// this by giving laws lower weights and adding the 4x weighting on
// `law_add_forbidden_word`.
export function publicPile() {
  return [...cardsByType("law"), ...cardsByType("directive")];
}

export function pickWeighted(pile, exclude = []) {
  const eligible = pile.filter((c) => !exclude.includes(c.id));
  const list = eligible.length ? eligible : pile;
  const total = list.reduce((s, c) => s + (c.weight || 1), 0);
  let r = Math.random() * total;
  for (const c of list) {
    r -= c.weight || 1;
    if (r <= 0) return c;
  }
  return list[list.length - 1];
}

export const HEADER_COLOR = {
  law: "#8B1A1A",
  directive: "#1E3A8A",
  secret: "#B8860B",
  targeted: "#5B21B6",
};
