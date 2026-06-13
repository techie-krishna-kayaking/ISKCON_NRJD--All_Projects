// Extracted from Google Apps Script — single source of truth for level progression data
const LEVEL_ORDER = [
  "None",
  "Shraddhavan",
  "Krishna Sevak",
  "Krishna Sadhak",
  "Srila Prabhupada Ashraya",
  "Srila Guru Charana Ashraya",
];

const NEXT_LEVEL_MAP = {
  "none": "Shraddhavan",
  "shraddhavan": "Krishna Sevak",
  "krishna sevak": "Krishna Sadhak",
  "krishna sadhak": "Srila Prabhupada Ashraya",
  "srila prabhupada ashraya": "Srila Guru Charana Ashraya",
};

const LEVEL_DATA = {
  "Shraddhavan": {
    chanting: ["chanting hare Krishna mantra a minimum 1 round (1 x 108)"],
    books: ["Hare Krishna Challenge"],
    commitments: [],
  },
  "Krishna Sevak": {
    chanting: ["chanting hare Krishna mantra a minimum of 4 round (4 x 108)"],
    books: [
      "A Second Chance : The Story of a Near - Death Experience",
      "Beyond Birth & Death",
      "Elevation to Krsna Consciousness",
    ],
    commitments: [
      "I promise not eat meat including eggs throughout my life",
    ],
  },
  "Krishna Sadhak": {
    chanting: ["chanting hare Krishna mantra a minimum of 8 round (8 x 108)"],
    books: [
      "Bhadavad Gita Chapters 1 to 6",
      "Krsna Consciousness The Topmost Yoga System",
      "Perfect Questions, Perfect Answers",
      "Teachings of Queen Kunti",
      "The Perfection of Yoga",
      "The Path of Perfection",
      "The Science of Self Realization",
      "Transcendental Teachings of Prahlada Maharaja",
      "Srila Prabhupada's other books(if any)",
    ],
    commitments: [
      "In addition to the above I will not eat meat including eggs, onion and garlic.",
      "I will avoid drinking coffee and Tea.",
      "I will make all efforts to attend atleast two Mangalarthi Programs in a week",
      "I will make all efforts to attend the Sunday Mangalarthi Program",
      "I will follow Ekadashi",
    ],
  },
  "Srila Prabhupada Ashraya": {
    chanting: ["chanting hare Krishna mantra a minimum of 16 round (16 x 108)"],
    books: [
      "Krsna - the Supreme Personality of Godhead",
      "Bhagavad Gita Chapters 7 to 12",
      "Srila Prabhupada Lilamrita (abridged version)",
      "Nectar of Instruction",
    ],
    commitments: [
      "In addition to the above I will not eat meat including eggs, onion and garlic.",
      "I will avoid drinking coffee and Tea.",
      "I will make all efforts to attend atleast two Mangalarthi Programs in a week",
      "I will make all efforts to attend the Sunday Mangalarthi Program",
      "I will make all efforts to eat only prasadam",
      "I will avoid frivolous sports",
      "I will not have illicit sex",
      "I will avoid watching mundane Television and Cinemas",
    ],
  },
  "Srila Guru Charana Ashraya": {
    chanting: ["chanting hare Krishna mantra a minimum of 16 round (16 x 108)"],
    books: [
      "Bhagavad Gita Chapter (all chapters)",
      "Spiritual Master and Disciple",
      "Teachings of Lord Caitanya",
      "Nectar of Devotion",
    ],
    commitments: [
      "I will follow the FOUR regulative principles",
      "Accept Krsna as the Supreme Personality of Godhead",
      "Perform/attend Tulasi Arati Everyday at home/temple",
      "Perform/attend Mangal Arati, Guru puja & gaura Atati atleast FOUR times a week at home/temple",
      "Listen to Srila Prabhupada's lectures everyday",
    ],
  },
};

module.exports = { LEVEL_ORDER, NEXT_LEVEL_MAP, LEVEL_DATA };
