import type { AuthoredLevelSpec } from "./rectangular-authoring";

export const PANDA_SPECS: readonly AuthoredLevelSpec[] = [
  {
    "id": 51,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Bamboo Grove",
    "hint": "Guide Panda home to the Bamboo Pagoda. Step on cracked tiles to break them open.",
    "route": [
      1,
      0,
      5,
      6,
      7,
      8
    ],
    "collectibles": [
      5,
      6
    ],
    "scramble": {
      "5": 1,
      "6": 1,
      "7": 3
    },
    "decoys": [
      {
        "index": 19,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      0
    ],
    "gate": {
      "trigger": 0,
      "tile": 7
    }
  },
  {
    "id": 52,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Whispering Chutes",
    "hint": "Guide Panda home to the Bamboo Pagoda. Step on cracked tiles to break them open.",
    "route": [
      9,
      8,
      7,
      12,
      17,
      18,
      13
    ],
    "collectibles": [
      8,
      7
    ],
    "scramble": {
      "7": 1,
      "8": 2,
      "12": 3,
      "17": 3,
      "18": 2
    },
    "decoys": [
      {
        "index": 6,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 53,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Jade Creek",
    "hint": "Guide Panda home to the Bamboo Pagoda. Step on cracked tiles to break them open.",
    "route": [
      8,
      3,
      2,
      1,
      6,
      5,
      0
    ],
    "collectibles": [
      3,
      2
    ],
    "scramble": {
      "1": 2,
      "2": 2,
      "3": 2,
      "5": 2,
      "6": 1
    },
    "decoys": [
      {
        "index": 7,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 54,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Lantern Walk",
    "hint": "Guide Panda home to the Bamboo Pagoda. Step on cracked tiles to break them open.",
    "route": [
      5,
      0,
      1,
      2,
      3,
      8
    ],
    "collectibles": [
      0,
      1
    ],
    "scramble": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 3
    },
    "decoys": [
      {
        "index": 11,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 55,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Stone Gate",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      16,
      15,
      10,
      5,
      6,
      11,
      12
    ],
    "collectibles": [
      0,
      7
    ],
    "scramble": {
      "0": 3,
      "1": 2,
      "2": 3,
      "5": 3,
      "6": 2,
      "7": 3,
      "11": 3,
      "15": 1
    },
    "decoys": [
      {
        "index": 4,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 5,
      "rejoinTile": 6,
      "detourRoute": [
        0,
        1,
        2,
        7
      ],
      "collectible": 0,
      "scramble": {
        "0": 3,
        "1": 2,
        "2": 3,
        "5": 3,
        "6": 2,
        "7": 3,
        "11": 3,
        "15": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      10
    ],
    "gate": {
      "trigger": 10,
      "tile": 11
    }
  },
  {
    "id": 56,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Emerald Terrace",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      9,
      8,
      13,
      18,
      17,
      16,
      15
    ],
    "collectibles": [
      12,
      11
    ],
    "scramble": {
      "1": 3,
      "2": 1,
      "6": 1,
      "7": 1,
      "8": 2,
      "11": 2,
      "12": 1,
      "13": 1,
      "16": 2,
      "17": 2,
      "18": 3
    },
    "decoys": [
      {
        "index": 3,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 13,
      "rejoinTile": 16,
      "detourRoute": [
        12,
        7,
        2,
        1,
        6,
        11
      ],
      "collectible": 12,
      "scramble": {
        "1": 3,
        "2": 1,
        "6": 1,
        "7": 1,
        "8": 2,
        "11": 2,
        "12": 1,
        "13": 1,
        "16": 2,
        "17": 2,
        "18": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 57,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Misty Bamboo",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      0,
      5,
      6,
      7,
      2,
      3,
      4,
      9,
      14
    ],
    "collectibles": [
      12,
      8
    ],
    "scramble": {
      "2": 1,
      "3": 1,
      "4": 3,
      "5": 1,
      "6": 3,
      "7": 3,
      "8": 3,
      "9": 1,
      "12": 3,
      "13": 2,
      "17": 3,
      "18": 1
    },
    "decoys": [
      {
        "index": 10,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 9,
      "detourRoute": [
        12,
        17,
        18,
        13,
        8
      ],
      "collectible": 12,
      "scramble": {
        "2": 1,
        "3": 1,
        "4": 3,
        "5": 1,
        "6": 3,
        "7": 3,
        "8": 3,
        "9": 1,
        "12": 3,
        "13": 2,
        "17": 3,
        "18": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 58,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Pebble Brook",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      13,
      14,
      9,
      4,
      3,
      8,
      7,
      12,
      17
    ],
    "collectibles": [
      2,
      11
    ],
    "scramble": {
      "0": 1,
      "1": 2,
      "2": 3,
      "3": 3,
      "4": 1,
      "5": 3,
      "6": 3,
      "7": 3,
      "8": 1,
      "9": 1,
      "11": 1,
      "12": 2,
      "14": 3
    },
    "decoys": [
      {
        "index": 15,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 3,
      "rejoinTile": 12,
      "detourRoute": [
        2,
        1,
        0,
        5,
        6,
        11
      ],
      "collectible": 2,
      "scramble": {
        "0": 1,
        "1": 2,
        "2": 3,
        "3": 3,
        "4": 1,
        "5": 3,
        "6": 3,
        "7": 3,
        "8": 1,
        "9": 1,
        "11": 1,
        "12": 2,
        "14": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 59,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Verdant Pass",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      6,
      1,
      2,
      7,
      12,
      13,
      14,
      9
    ],
    "collectibles": [
      3,
      8
    ],
    "scramble": {
      "1": 2,
      "2": 3,
      "3": 1,
      "7": 2,
      "8": 3,
      "12": 2,
      "13": 3,
      "14": 3
    },
    "decoys": [
      {
        "index": 5,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 2,
      "rejoinTile": 7,
      "detourRoute": [
        3,
        8
      ],
      "collectible": 3,
      "scramble": {
        "1": 2,
        "2": 3,
        "3": 1,
        "7": 2,
        "8": 3,
        "12": 2,
        "13": 3,
        "14": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 60,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Cracked Causeway",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      3,
      2,
      1,
      6,
      11,
      16,
      15
    ],
    "collectibles": [
      7,
      12
    ],
    "scramble": {
      "1": 2,
      "2": 1,
      "6": 3,
      "7": 3,
      "8": 3,
      "9": 3,
      "11": 3,
      "12": 1,
      "13": 2,
      "14": 3,
      "16": 3
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 2,
      "rejoinTile": 11,
      "detourRoute": [
        7,
        8,
        9,
        14,
        13,
        12
      ],
      "collectible": 7,
      "scramble": {
        "1": 2,
        "2": 1,
        "6": 3,
        "7": 3,
        "8": 3,
        "9": 3,
        "11": 3,
        "12": 1,
        "13": 2,
        "14": 3,
        "16": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      3
    ],
    "gate": {
      "trigger": 3,
      "tile": 16
    }
  },
  {
    "id": 61,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Dragon Chute",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      2,
      7,
      8,
      13,
      12,
      11,
      10,
      5,
      0
    ],
    "collectibles": [
      16,
      15
    ],
    "scramble": {
      "5": 3,
      "7": 1,
      "8": 1,
      "10": 1,
      "11": 2,
      "12": 3,
      "13": 1,
      "15": 3,
      "16": 3
    },
    "decoys": [
      {
        "index": 1,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 10,
      "detourRoute": [
        16,
        15
      ],
      "collectible": 16,
      "scramble": {
        "5": 3,
        "7": 1,
        "8": 1,
        "10": 1,
        "11": 2,
        "12": 3,
        "13": 1,
        "15": 3,
        "16": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 62,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Bamboo Bridge",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      5,
      6,
      11,
      16,
      17,
      18,
      13,
      12
    ],
    "collectibles": [
      10,
      15
    ],
    "scramble": {
      "6": 1,
      "10": 2,
      "11": 3,
      "13": 1,
      "15": 3,
      "16": 1,
      "17": 1,
      "18": 1
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 14,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 16,
      "detourRoute": [
        10,
        15
      ],
      "collectible": 10,
      "scramble": {
        "6": 1,
        "10": 2,
        "11": 3,
        "13": 1,
        "15": 3,
        "16": 1,
        "17": 1,
        "18": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 63,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Mossy Pathway",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      10,
      5,
      6,
      1,
      2,
      3,
      4,
      9,
      8
    ],
    "collectibles": [
      11,
      7
    ],
    "scramble": {
      "1": 1,
      "2": 3,
      "3": 2,
      "4": 2,
      "5": 3,
      "6": 1,
      "7": 1,
      "9": 1,
      "11": 1,
      "12": 2
    },
    "decoys": [
      {
        "index": 17,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 14,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 6,
      "rejoinTile": 2,
      "detourRoute": [
        11,
        12,
        7
      ],
      "collectible": 11,
      "scramble": {
        "1": 1,
        "2": 3,
        "3": 2,
        "4": 2,
        "5": 3,
        "6": 1,
        "7": 1,
        "9": 1,
        "11": 1,
        "12": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 64,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Lotus Pond",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      16,
      15,
      10,
      5,
      6,
      7,
      8,
      9,
      14
    ],
    "collectibles": [
      12,
      13
    ],
    "scramble": {
      "5": 3,
      "6": 2,
      "7": 3,
      "8": 1,
      "9": 3,
      "10": 1,
      "12": 3,
      "13": 3,
      "15": 1,
      "17": 1,
      "18": 1
    },
    "decoys": [
      {
        "index": 3,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 2,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 8,
      "detourRoute": [
        12,
        17,
        18,
        13
      ],
      "collectible": 12,
      "scramble": {
        "5": 3,
        "6": 2,
        "7": 3,
        "8": 1,
        "9": 3,
        "10": 1,
        "12": 3,
        "13": 3,
        "15": 1,
        "17": 1,
        "18": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 65,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Boulder Breach",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      18,
      19,
      14,
      13,
      8,
      9,
      4,
      3
    ],
    "collectibles": [
      12,
      7
    ],
    "scramble": {
      "4": 2,
      "7": 1,
      "8": 3,
      "9": 3,
      "12": 3,
      "13": 2,
      "19": 2
    },
    "decoys": [
      {
        "index": 15,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 5,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 13,
      "rejoinTile": 8,
      "detourRoute": [
        12,
        7
      ],
      "collectible": 12,
      "scramble": {
        "4": 2,
        "7": 1,
        "8": 3,
        "9": 3,
        "12": 3,
        "13": 2,
        "19": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      14
    ],
    "gate": {
      "trigger": 14,
      "tile": 4
    }
  },
  {
    "id": 66,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Spring Pavilion",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      14,
      19,
      18,
      13,
      8,
      7,
      6,
      1
    ],
    "collectibles": [
      9,
      2
    ],
    "scramble": {
      "2": 1,
      "3": 2,
      "4": 3,
      "6": 3,
      "7": 3,
      "8": 2,
      "9": 2,
      "13": 1,
      "18": 2,
      "19": 2
    },
    "decoys": [
      {
        "index": 12,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 16,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 7,
      "detourRoute": [
        9,
        4,
        3,
        2
      ],
      "collectible": 9,
      "scramble": {
        "2": 1,
        "3": 2,
        "4": 3,
        "6": 3,
        "7": 3,
        "8": 2,
        "9": 2,
        "13": 1,
        "18": 2,
        "19": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 67,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Jungle Arch",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      19,
      14,
      9,
      8,
      7,
      6,
      5,
      0,
      1
    ],
    "collectibles": [
      12,
      11
    ],
    "scramble": {
      "0": 3,
      "5": 1,
      "6": 3,
      "7": 3,
      "8": 1,
      "9": 3,
      "11": 3,
      "12": 1,
      "13": 3,
      "14": 2,
      "16": 3,
      "17": 2,
      "18": 1
    },
    "decoys": [
      {
        "index": 3,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 15,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 6,
      "detourRoute": [
        12,
        13,
        18,
        17,
        16,
        11
      ],
      "collectible": 12,
      "scramble": {
        "0": 3,
        "5": 1,
        "6": 3,
        "7": 3,
        "8": 1,
        "9": 3,
        "11": 3,
        "12": 1,
        "13": 3,
        "14": 2,
        "16": 3,
        "17": 2,
        "18": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 68,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Tea Garden",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      10,
      15,
      16,
      17,
      12,
      13,
      8,
      7
    ],
    "collectibles": [
      11,
      3
    ],
    "scramble": {
      "1": 1,
      "2": 1,
      "3": 1,
      "6": 1,
      "8": 2,
      "11": 3,
      "12": 3,
      "13": 1,
      "15": 1,
      "16": 1,
      "17": 1
    },
    "decoys": [
      {
        "index": 18,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 9,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 16,
      "rejoinTile": 8,
      "detourRoute": [
        11,
        6,
        1,
        2,
        3
      ],
      "collectible": 11,
      "scramble": {
        "1": 1,
        "2": 1,
        "3": 1,
        "6": 1,
        "8": 2,
        "11": 3,
        "12": 3,
        "13": 1,
        "15": 1,
        "16": 1,
        "17": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 69,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Fern Forest",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      14,
      19,
      18,
      17,
      16,
      11,
      10,
      15
    ],
    "collectibles": [
      12,
      6
    ],
    "scramble": {
      "6": 3,
      "7": 1,
      "10": 2,
      "11": 3,
      "12": 3,
      "16": 2,
      "17": 2,
      "18": 3,
      "19": 3
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 17,
      "rejoinTile": 11,
      "detourRoute": [
        12,
        7,
        6
      ],
      "collectible": 12,
      "scramble": {
        "6": 3,
        "7": 1,
        "10": 2,
        "11": 3,
        "12": 3,
        "16": 2,
        "17": 2,
        "18": 3,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 70,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Ancient Lock",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      9,
      8,
      13,
      12,
      7,
      2,
      1
    ],
    "collectibles": [
      18,
      6
    ],
    "scramble": {
      "2": 1,
      "6": 1,
      "7": 1,
      "9": 2,
      "11": 2,
      "12": 2,
      "13": 1,
      "16": 3,
      "17": 1,
      "18": 1
    },
    "decoys": [
      {
        "index": 19,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 5,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 13,
      "rejoinTile": 7,
      "detourRoute": [
        18,
        17,
        16,
        11,
        6
      ],
      "collectible": 18,
      "scramble": {
        "2": 1,
        "6": 1,
        "7": 1,
        "9": 2,
        "11": 2,
        "12": 2,
        "13": 1,
        "16": 3,
        "17": 1,
        "18": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      8
    ],
    "gate": {
      "trigger": 8,
      "tile": 2
    }
  },
  {
    "id": 71,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "River Chasm",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      10,
      15,
      16,
      17,
      18,
      13,
      8,
      9,
      4,
      3,
      2
    ],
    "collectibles": [
      11,
      12
    ],
    "scramble": {
      "3": 3,
      "4": 1,
      "6": 1,
      "7": 3,
      "8": 2,
      "9": 2,
      "11": 1,
      "12": 2,
      "13": 1,
      "15": 2,
      "16": 3,
      "17": 1,
      "18": 3
    },
    "decoys": [
      {
        "index": 14,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 1,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 16,
      "rejoinTile": 13,
      "detourRoute": [
        11,
        6,
        7,
        12
      ],
      "collectible": 11,
      "scramble": {
        "3": 3,
        "4": 1,
        "6": 1,
        "7": 3,
        "8": 2,
        "9": 2,
        "11": 1,
        "12": 2,
        "13": 1,
        "15": 2,
        "16": 3,
        "17": 1,
        "18": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 72,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Shaded Ravine",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      2,
      1,
      0,
      5,
      10,
      15,
      16,
      11,
      12,
      17,
      18
    ],
    "collectibles": [
      6,
      13
    ],
    "scramble": {
      "0": 2,
      "1": 3,
      "5": 1,
      "6": 3,
      "7": 2,
      "8": 2,
      "10": 3,
      "11": 1,
      "12": 1,
      "13": 2,
      "15": 3,
      "16": 1,
      "17": 3
    },
    "decoys": [
      {
        "index": 3,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 14,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 12,
      "detourRoute": [
        6,
        7,
        8,
        13
      ],
      "collectible": 6,
      "scramble": {
        "0": 2,
        "1": 3,
        "5": 1,
        "6": 3,
        "7": 2,
        "8": 2,
        "10": 3,
        "11": 1,
        "12": 1,
        "13": 2,
        "15": 3,
        "16": 1,
        "17": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 73,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Waterfall Bend",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      9,
      8,
      7,
      12,
      11,
      10,
      15,
      16,
      17
    ],
    "collectibles": [
      6,
      5
    ],
    "scramble": {
      "0": 2,
      "1": 1,
      "5": 2,
      "6": 3,
      "7": 1,
      "8": 2,
      "9": 1,
      "10": 1,
      "11": 2,
      "12": 3,
      "15": 2,
      "16": 1
    },
    "decoys": [
      {
        "index": 13,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 10,
      "detourRoute": [
        6,
        1,
        0,
        5
      ],
      "collectible": 6,
      "scramble": {
        "0": 2,
        "1": 1,
        "5": 2,
        "6": 3,
        "7": 1,
        "8": 2,
        "9": 1,
        "10": 1,
        "11": 2,
        "12": 3,
        "15": 2,
        "16": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 74,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Bamboo Crest",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      7,
      6,
      1,
      2,
      3,
      8,
      9,
      14,
      19
    ],
    "collectibles": [
      0,
      13
    ],
    "scramble": {
      "0": 1,
      "1": 2,
      "2": 3,
      "3": 3,
      "5": 3,
      "6": 2,
      "8": 3,
      "9": 2,
      "10": 2,
      "11": 1,
      "12": 3,
      "13": 2,
      "14": 3
    },
    "decoys": [
      {
        "index": 17,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 15,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 1,
      "rejoinTile": 14,
      "detourRoute": [
        0,
        5,
        10,
        11,
        12,
        13
      ],
      "collectible": 0,
      "scramble": {
        "0": 1,
        "1": 2,
        "2": 3,
        "3": 3,
        "5": 3,
        "6": 2,
        "8": 3,
        "9": 2,
        "10": 2,
        "11": 1,
        "12": 3,
        "13": 2,
        "14": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 75,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Granite Gate",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      8,
      13,
      18,
      17,
      16,
      15,
      10,
      5,
      6
    ],
    "collectibles": [
      12,
      11
    ],
    "scramble": {
      "5": 2,
      "10": 1,
      "11": 1,
      "12": 2,
      "13": 3,
      "15": 1,
      "16": 1,
      "17": 1
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 17,
      "rejoinTile": 16,
      "detourRoute": [
        12,
        11
      ],
      "collectible": 12,
      "scramble": {
        "5": 2,
        "10": 1,
        "11": 1,
        "12": 2,
        "13": 3,
        "15": 1,
        "16": 1,
        "17": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      18
    ],
    "gate": {
      "trigger": 18,
      "tile": 5
    }
  },
  {
    "id": 76,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Serene Stream",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      6,
      7,
      2,
      1,
      0,
      5,
      10,
      11,
      12,
      13,
      14
    ],
    "collectibles": [
      8,
      3
    ],
    "scramble": {
      "0": 1,
      "1": 2,
      "2": 1,
      "3": 3,
      "4": 1,
      "5": 2,
      "7": 3,
      "8": 2,
      "9": 1,
      "10": 2,
      "11": 3,
      "12": 3,
      "13": 1
    },
    "decoys": [
      {
        "index": 15,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 17,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 2,
      "detourRoute": [
        8,
        9,
        4,
        3
      ],
      "collectible": 8,
      "scramble": {
        "0": 1,
        "1": 2,
        "2": 1,
        "3": 3,
        "4": 1,
        "5": 2,
        "7": 3,
        "8": 2,
        "9": 1,
        "10": 2,
        "11": 3,
        "12": 3,
        "13": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 77,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Moonlit Copse",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      12,
      7,
      2,
      1,
      6,
      5,
      10,
      11,
      16
    ],
    "collectibles": [
      8,
      3
    ],
    "scramble": {
      "1": 3,
      "2": 2,
      "3": 3,
      "4": 3,
      "5": 2,
      "6": 1,
      "7": 2,
      "8": 3,
      "9": 3,
      "10": 2,
      "11": 2,
      "13": 2,
      "14": 1
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 2,
      "detourRoute": [
        8,
        13,
        14,
        9,
        4,
        3
      ],
      "collectible": 8,
      "scramble": {
        "1": 3,
        "2": 2,
        "3": 3,
        "4": 3,
        "5": 2,
        "6": 1,
        "7": 2,
        "8": 3,
        "9": 3,
        "10": 2,
        "11": 2,
        "13": 2,
        "14": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 78,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Cobblestone Run",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      19,
      18,
      17,
      12,
      13,
      14,
      9,
      4,
      3,
      8,
      7
    ],
    "collectibles": [
      11,
      2
    ],
    "scramble": {
      "0": 3,
      "1": 3,
      "2": 1,
      "3": 2,
      "4": 3,
      "5": 3,
      "8": 1,
      "9": 1,
      "10": 1,
      "11": 2,
      "12": 2,
      "13": 3,
      "14": 1,
      "17": 1,
      "18": 2
    },
    "decoys": [
      {
        "index": 16,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 6,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 15,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 12,
      "rejoinTile": 3,
      "detourRoute": [
        11,
        10,
        5,
        0,
        1,
        2
      ],
      "collectible": 11,
      "scramble": {
        "0": 3,
        "1": 3,
        "2": 1,
        "3": 2,
        "4": 3,
        "5": 3,
        "8": 1,
        "9": 1,
        "10": 1,
        "11": 2,
        "12": 2,
        "13": 3,
        "14": 1,
        "17": 1,
        "18": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 79,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Highland Terrace",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      6,
      11,
      10,
      15,
      16,
      17,
      18,
      19,
      14,
      13
    ],
    "collectibles": [
      5,
      12
    ],
    "scramble": {
      "0": 1,
      "1": 2,
      "2": 1,
      "5": 1,
      "7": 3,
      "10": 2,
      "11": 1,
      "12": 2,
      "14": 2,
      "15": 2,
      "16": 2,
      "17": 1,
      "18": 1,
      "19": 3
    },
    "decoys": [
      {
        "index": 4,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 8,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 10,
      "rejoinTile": 17,
      "detourRoute": [
        5,
        0,
        1,
        2,
        7,
        12
      ],
      "collectible": 5,
      "scramble": {
        "0": 1,
        "1": 2,
        "2": 1,
        "5": 1,
        "7": 3,
        "10": 2,
        "11": 1,
        "12": 2,
        "14": 2,
        "15": 2,
        "16": 2,
        "17": 1,
        "18": 1,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 80,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Crumbling Steppes",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      7,
      6,
      5,
      10,
      11,
      12,
      13,
      14,
      19,
      18,
      17
    ],
    "collectibles": [
      15,
      16
    ],
    "scramble": {
      "5": 1,
      "10": 1,
      "11": 2,
      "12": 2,
      "13": 2,
      "14": 1,
      "15": 1,
      "16": 3,
      "18": 3,
      "19": 3
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 0,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 10,
      "rejoinTile": 11,
      "detourRoute": [
        15,
        16
      ],
      "collectible": 15,
      "scramble": {
        "5": 1,
        "10": 1,
        "11": 2,
        "12": 2,
        "13": 2,
        "14": 1,
        "15": 1,
        "16": 3,
        "18": 3,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      6
    ],
    "gate": {
      "trigger": 6,
      "tile": 18
    }
  },
  {
    "id": 81,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Emerald Labyrinth",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      13,
      14,
      9,
      4,
      3,
      2,
      1,
      0,
      5,
      10,
      11
    ],
    "collectibles": [
      6,
      15
    ],
    "scramble": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 2,
      "4": 1,
      "5": 1,
      "6": 1,
      "7": 2,
      "9": 2,
      "10": 1,
      "12": 2,
      "14": 2,
      "15": 1,
      "16": 1,
      "17": 3
    },
    "decoys": [
      {
        "index": 19,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 8,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 5,
      "rejoinTile": 10,
      "detourRoute": [
        6,
        7,
        12,
        17,
        16,
        15
      ],
      "collectible": 6,
      "scramble": {
        "0": 1,
        "1": 3,
        "2": 3,
        "3": 2,
        "4": 1,
        "5": 1,
        "6": 1,
        "7": 2,
        "9": 2,
        "10": 1,
        "12": 2,
        "14": 2,
        "15": 1,
        "16": 1,
        "17": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 82,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Bamboo Sanctuary",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      17,
      18,
      13,
      14,
      9,
      8,
      7,
      6,
      11
    ],
    "collectibles": [
      3,
      2
    ],
    "scramble": {
      "2": 1,
      "3": 1,
      "6": 3,
      "7": 3,
      "8": 2,
      "9": 3,
      "13": 1,
      "14": 1,
      "18": 2
    },
    "decoys": [
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 10,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 0,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 7,
      "detourRoute": [
        3,
        2
      ],
      "collectible": 3,
      "scramble": {
        "2": 1,
        "3": 1,
        "6": 3,
        "7": 3,
        "8": 2,
        "9": 3,
        "13": 1,
        "14": 1,
        "18": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 83,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Forest Shrine",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      12,
      11,
      6,
      7,
      8,
      3,
      2,
      1,
      0,
      5,
      10
    ],
    "collectibles": [
      9,
      4
    ],
    "scramble": {
      "0": 2,
      "1": 3,
      "2": 2,
      "3": 2,
      "4": 1,
      "5": 2,
      "6": 1,
      "7": 2,
      "8": 2,
      "9": 1,
      "11": 2
    },
    "decoys": [
      {
        "index": 19,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 16,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 3,
      "detourRoute": [
        9,
        4
      ],
      "collectible": 9,
      "scramble": {
        "0": 2,
        "1": 3,
        "2": 2,
        "3": 2,
        "4": 1,
        "5": 2,
        "6": 1,
        "7": 2,
        "8": 2,
        "9": 1,
        "11": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 84,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Cascading Steps",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      6,
      5,
      0,
      1,
      2,
      7,
      8,
      13,
      12,
      17
    ],
    "collectibles": [
      3,
      18
    ],
    "scramble": {
      "0": 2,
      "1": 3,
      "2": 1,
      "3": 3,
      "4": 2,
      "5": 2,
      "7": 3,
      "8": 3,
      "9": 2,
      "12": 1,
      "13": 3,
      "14": 3,
      "18": 1,
      "19": 1
    },
    "decoys": [
      {
        "index": 15,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 16,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 11,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 13,
      "detourRoute": [
        3,
        4,
        9,
        14,
        19,
        18
      ],
      "collectible": 3,
      "scramble": {
        "0": 2,
        "1": 3,
        "2": 1,
        "3": 3,
        "4": 2,
        "5": 2,
        "7": 3,
        "8": 3,
        "9": 2,
        "12": 1,
        "13": 3,
        "14": 3,
        "18": 1,
        "19": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 85,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Monsoon Barrier",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      9,
      8,
      13,
      12,
      11,
      10,
      15,
      16,
      17
    ],
    "collectibles": [
      7,
      6
    ],
    "scramble": {
      "1": 1,
      "2": 3,
      "6": 1,
      "7": 2,
      "8": 2,
      "10": 2,
      "11": 2,
      "12": 1,
      "13": 1,
      "15": 1,
      "16": 3
    },
    "decoys": [
      {
        "index": 19,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 0,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 11,
      "detourRoute": [
        7,
        2,
        1,
        6
      ],
      "collectible": 7,
      "scramble": {
        "1": 1,
        "2": 3,
        "6": 1,
        "7": 2,
        "8": 2,
        "10": 2,
        "11": 2,
        "12": 1,
        "13": 1,
        "15": 1,
        "16": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      9
    ],
    "gate": {
      "trigger": 9,
      "tile": 16
    }
  },
  {
    "id": 86,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Overgrown Trail",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      7,
      6,
      11,
      12,
      13,
      8,
      9,
      14,
      19,
      18
    ],
    "collectibles": [
      10,
      17
    ],
    "scramble": {
      "6": 2,
      "8": 3,
      "9": 1,
      "10": 1,
      "11": 2,
      "12": 2,
      "13": 3,
      "14": 1,
      "15": 2,
      "16": 1,
      "17": 3,
      "19": 3
    },
    "decoys": [
      {
        "index": 2,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 0,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 12,
      "detourRoute": [
        10,
        15,
        16,
        17
      ],
      "collectible": 10,
      "scramble": {
        "6": 2,
        "8": 3,
        "9": 1,
        "10": 1,
        "11": 2,
        "12": 2,
        "13": 3,
        "14": 1,
        "15": 2,
        "16": 1,
        "17": 3,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 87,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Canopy Crossing",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      3,
      8,
      13,
      14,
      19,
      18,
      17,
      16,
      15,
      10,
      5
    ],
    "collectibles": [
      12,
      11
    ],
    "scramble": {
      "1": 2,
      "2": 1,
      "6": 3,
      "7": 1,
      "8": 1,
      "10": 3,
      "11": 2,
      "12": 3,
      "13": 2,
      "14": 1,
      "15": 3,
      "16": 1,
      "17": 1,
      "18": 1,
      "19": 2
    },
    "decoys": [
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 9,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 0,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 17,
      "rejoinTile": 10,
      "detourRoute": [
        12,
        7,
        2,
        1,
        6,
        11
      ],
      "collectible": 12,
      "scramble": {
        "1": 2,
        "2": 1,
        "6": 3,
        "7": 1,
        "8": 1,
        "10": 3,
        "11": 2,
        "12": 3,
        "13": 2,
        "14": 1,
        "15": 3,
        "16": 1,
        "17": 1,
        "18": 1,
        "19": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 88,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Winding Rivulet",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      3,
      2,
      1,
      6,
      7,
      12,
      17,
      18
    ],
    "collectibles": [
      0,
      11
    ],
    "scramble": {
      "0": 3,
      "1": 2,
      "2": 1,
      "3": 1,
      "5": 3,
      "6": 1,
      "7": 2,
      "10": 3,
      "11": 1,
      "12": 3,
      "15": 1,
      "16": 3,
      "17": 1
    },
    "decoys": [
      {
        "index": 13,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 8,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 14,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 1,
      "rejoinTile": 12,
      "detourRoute": [
        0,
        5,
        10,
        15,
        16,
        11
      ],
      "collectible": 0,
      "scramble": {
        "0": 3,
        "1": 2,
        "2": 1,
        "3": 1,
        "5": 3,
        "6": 1,
        "7": 2,
        "10": 3,
        "11": 1,
        "12": 3,
        "15": 1,
        "16": 3,
        "17": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 89,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Hidden Alcove",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      1,
      0,
      5,
      10,
      11,
      16,
      17,
      18,
      19,
      14
    ],
    "collectibles": [
      6,
      12
    ],
    "scramble": {
      "0": 1,
      "5": 3,
      "6": 2,
      "7": 2,
      "10": 3,
      "11": 2,
      "12": 1,
      "16": 1,
      "17": 2,
      "18": 3,
      "19": 3
    },
    "decoys": [
      {
        "index": 8,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 5,
      "rejoinTile": 11,
      "detourRoute": [
        6,
        7,
        12
      ],
      "collectible": 6,
      "scramble": {
        "0": 1,
        "5": 3,
        "6": 2,
        "7": 2,
        "10": 3,
        "11": 2,
        "12": 1,
        "16": 1,
        "17": 2,
        "18": 3,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 90,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Ironwood Gate",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      11,
      16,
      17,
      18,
      13,
      14,
      9,
      8,
      7,
      6,
      5
    ],
    "collectibles": [
      4,
      2
    ],
    "scramble": {
      "2": 2,
      "3": 2,
      "4": 2,
      "6": 2,
      "7": 3,
      "8": 1,
      "9": 2,
      "13": 2,
      "14": 3,
      "16": 1,
      "18": 3
    },
    "decoys": [
      {
        "index": 15,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 12,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 9,
      "rejoinTile": 7,
      "detourRoute": [
        4,
        3,
        2
      ],
      "collectible": 4,
      "scramble": {
        "2": 2,
        "3": 2,
        "4": 2,
        "6": 2,
        "7": 3,
        "8": 1,
        "9": 2,
        "13": 2,
        "14": 3,
        "16": 1,
        "18": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      17
    ],
    "gate": {
      "trigger": 17,
      "tile": 6
    }
  },
  {
    "id": 91,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Zen Bamboo Maze",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      15,
      16,
      11,
      6,
      7,
      8,
      3,
      4,
      9,
      14,
      13
    ],
    "collectibles": [
      10,
      2
    ],
    "scramble": {
      "0": 3,
      "1": 1,
      "2": 1,
      "3": 1,
      "4": 2,
      "5": 2,
      "6": 3,
      "7": 2,
      "8": 3,
      "9": 2,
      "10": 2,
      "11": 3,
      "14": 1,
      "16": 3
    },
    "decoys": [
      {
        "index": 12,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 17,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 3,
      "detourRoute": [
        10,
        5,
        0,
        1,
        2
      ],
      "collectible": 10,
      "scramble": {
        "0": 3,
        "1": 1,
        "2": 1,
        "3": 1,
        "4": 2,
        "5": 2,
        "6": 3,
        "7": 2,
        "8": 3,
        "9": 2,
        "10": 2,
        "11": 3,
        "14": 1,
        "16": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 92,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Thunder Falls",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      18,
      19,
      14,
      13,
      8,
      7,
      2,
      1,
      0,
      5
    ],
    "collectibles": [
      9,
      3
    ],
    "scramble": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 2,
      "4": 2,
      "7": 1,
      "8": 1,
      "9": 2,
      "13": 1,
      "14": 2,
      "19": 1
    },
    "decoys": [
      {
        "index": 16,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 12,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 10,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 2,
      "detourRoute": [
        9,
        4,
        3
      ],
      "collectible": 9,
      "scramble": {
        "0": 1,
        "1": 3,
        "2": 3,
        "3": 2,
        "4": 2,
        "7": 1,
        "8": 1,
        "9": 2,
        "13": 1,
        "14": 2,
        "19": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 93,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Twilight Thicket",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      19,
      14,
      9,
      8,
      3,
      2,
      7,
      12,
      11,
      16,
      15
    ],
    "collectibles": [
      6,
      10
    ],
    "scramble": {
      "2": 1,
      "3": 3,
      "5": 1,
      "6": 2,
      "7": 3,
      "8": 1,
      "9": 1,
      "10": 1,
      "11": 1,
      "12": 2,
      "14": 3,
      "16": 3
    },
    "decoys": [
      {
        "index": 18,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 1,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 7,
      "rejoinTile": 11,
      "detourRoute": [
        6,
        5,
        10
      ],
      "collectible": 6,
      "scramble": {
        "2": 1,
        "3": 3,
        "5": 1,
        "6": 2,
        "7": 3,
        "8": 1,
        "9": 1,
        "10": 1,
        "11": 1,
        "12": 2,
        "14": 3,
        "16": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 94,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Stone Dragon Pass",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      12,
      17,
      16,
      15,
      10,
      11,
      6,
      1,
      2,
      7,
      8
    ],
    "collectibles": [
      5,
      0
    ],
    "scramble": {
      "0": 3,
      "1": 1,
      "2": 3,
      "5": 2,
      "6": 1,
      "7": 3,
      "10": 1,
      "11": 3,
      "15": 2,
      "16": 3,
      "17": 3
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 18,
        "kind": "corner",
        "rotation": 1
      }
    ],
    "detour": {
      "branchTile": 6,
      "rejoinTile": 1,
      "detourRoute": [
        5,
        0
      ],
      "collectible": 5,
      "scramble": {
        "0": 3,
        "1": 1,
        "2": 3,
        "5": 2,
        "6": 1,
        "7": 3,
        "10": 1,
        "11": 3,
        "15": 2,
        "16": 3,
        "17": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 95,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Panda Fort Gate",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      8,
      7,
      12,
      17,
      16,
      15,
      10,
      5,
      0,
      1
    ],
    "collectibles": [
      11,
      6
    ],
    "scramble": {
      "0": 2,
      "5": 3,
      "6": 2,
      "7": 3,
      "10": 1,
      "11": 3,
      "15": 2,
      "16": 3,
      "17": 1
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 19,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 10,
      "rejoinTile": 5,
      "detourRoute": [
        11,
        6
      ],
      "collectible": 11,
      "scramble": {
        "0": 2,
        "5": 3,
        "6": 2,
        "7": 3,
        "10": 1,
        "11": 3,
        "15": 2,
        "16": 3,
        "17": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      12
    ],
    "gate": {
      "trigger": 12,
      "tile": 0
    }
  },
  {
    "id": 96,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Brocade Jungle",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      4,
      3,
      2,
      1,
      0,
      5,
      10,
      11,
      16,
      17,
      12
    ],
    "collectibles": [
      8,
      7
    ],
    "scramble": {
      "0": 3,
      "1": 3,
      "2": 3,
      "3": 1,
      "5": 1,
      "7": 2,
      "8": 3,
      "10": 1,
      "11": 3,
      "16": 2,
      "17": 3
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 0
      },
      {
        "index": 15,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 13,
        "kind": "corner",
        "rotation": 3
      }
    ],
    "detour": {
      "branchTile": 3,
      "rejoinTile": 2,
      "detourRoute": [
        8,
        7
      ],
      "collectible": 8,
      "scramble": {
        "0": 3,
        "1": 3,
        "2": 3,
        "3": 1,
        "5": 1,
        "7": 2,
        "8": 3,
        "10": 1,
        "11": 3,
        "16": 2,
        "17": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 97,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Whispering Peaks",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      11,
      10,
      15,
      16,
      17,
      12,
      13,
      14,
      19,
      18
    ],
    "collectibles": [
      7,
      8
    ],
    "scramble": {
      "2": 3,
      "3": 1,
      "7": 1,
      "8": 1,
      "10": 1,
      "12": 2,
      "13": 3,
      "14": 2,
      "15": 1,
      "16": 2,
      "17": 1,
      "19": 2
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 1,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 6,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 12,
      "rejoinTile": 13,
      "detourRoute": [
        7,
        2,
        3,
        8
      ],
      "collectible": 7,
      "scramble": {
        "2": 3,
        "3": 1,
        "7": 1,
        "8": 1,
        "10": 1,
        "12": 2,
        "13": 3,
        "14": 2,
        "15": 1,
        "16": 2,
        "17": 1,
        "19": 2
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 98,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Dragon Spring",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      11,
      16,
      17,
      18,
      13,
      12,
      7,
      6,
      5,
      0,
      1
    ],
    "collectibles": [
      19,
      14
    ],
    "scramble": {
      "0": 3,
      "5": 1,
      "6": 2,
      "7": 2,
      "12": 1,
      "13": 2,
      "14": 3,
      "16": 3,
      "17": 3,
      "18": 3,
      "19": 1
    },
    "decoys": [
      {
        "index": 9,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 3,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 4,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 18,
      "rejoinTile": 13,
      "detourRoute": [
        19,
        14
      ],
      "collectible": 19,
      "scramble": {
        "0": 3,
        "5": 1,
        "6": 2,
        "7": 2,
        "12": 1,
        "13": 2,
        "14": 3,
        "16": 3,
        "17": 3,
        "18": 3,
        "19": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 99,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Imperial Bamboo",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      7,
      12,
      17,
      18,
      19,
      14,
      13,
      8,
      3,
      2,
      1
    ],
    "collectibles": [
      9,
      4
    ],
    "scramble": {
      "2": 3,
      "3": 2,
      "4": 3,
      "8": 2,
      "9": 3,
      "12": 3,
      "13": 1,
      "14": 3,
      "17": 2,
      "18": 2,
      "19": 1
    },
    "decoys": [
      {
        "index": 0,
        "kind": "corner",
        "rotation": 2
      },
      {
        "index": 15,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 6,
        "kind": "corner",
        "rotation": 0
      }
    ],
    "detour": {
      "branchTile": 8,
      "rejoinTile": 3,
      "detourRoute": [
        9,
        4
      ],
      "collectible": 9,
      "scramble": {
        "2": 3,
        "3": 2,
        "4": 3,
        "8": 2,
        "9": 3,
        "12": 3,
        "13": 1,
        "14": 3,
        "17": 2,
        "18": 2,
        "19": 1
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": []
  },
  {
    "id": 100,
    "size": 5,
    "columns": 5,
    "rows": 4,
    "title": "Panda Finale Pagoda",
    "hint": "Break through the cracked path with Panda, or follow the bamboo stream.",
    "route": [
      18,
      19,
      14,
      9,
      8,
      7,
      12,
      11,
      6,
      1,
      0
    ],
    "collectibles": [
      10,
      5
    ],
    "scramble": {
      "1": 2,
      "5": 3,
      "6": 3,
      "7": 2,
      "8": 1,
      "9": 2,
      "10": 1,
      "11": 1,
      "12": 3,
      "19": 3
    },
    "decoys": [
      {
        "index": 4,
        "kind": "corner",
        "rotation": 1
      },
      {
        "index": 17,
        "kind": "corner",
        "rotation": 3
      },
      {
        "index": 13,
        "kind": "corner",
        "rotation": 2
      }
    ],
    "detour": {
      "branchTile": 11,
      "rejoinTile": 6,
      "detourRoute": [
        10,
        5
      ],
      "collectible": 10,
      "scramble": {
        "1": 2,
        "5": 3,
        "6": 3,
        "7": 2,
        "8": 1,
        "9": 2,
        "10": 1,
        "11": 1,
        "12": 3,
        "19": 3
      }
    },
    "character": "panda",
    "characterWorldId": "bamboo_jungle",
    "cracked": [
      14
    ],
    "gate": {
      "trigger": 14,
      "tile": 1
    }
  }
];

export const PANDA_PLANS: Readonly<Record<number, { short: number[]; stars: number[]; par: number; starPar: number }>> = {
  "51": {
    "short": [
      0,
      0,
      0,
      5,
      5,
      5,
      6,
      7
    ],
    "stars": [
      0,
      0,
      0,
      5,
      5,
      5,
      6,
      7
    ],
    "par": 8,
    "starPar": 8
  },
  "52": {
    "short": [
      7,
      7,
      7,
      12,
      17,
      18,
      18
    ],
    "stars": [
      7,
      7,
      7,
      12,
      17,
      18,
      18
    ],
    "par": 7,
    "starPar": 7
  },
  "53": {
    "short": [
      1,
      1,
      3,
      3,
      5,
      5,
      6,
      6,
      6
    ],
    "stars": [
      1,
      1,
      3,
      3,
      5,
      5,
      6,
      6,
      6
    ],
    "par": 9,
    "starPar": 9
  },
  "54": {
    "short": [
      0,
      0,
      0,
      1,
      2,
      3
    ],
    "stars": [
      0,
      0,
      0,
      1,
      2,
      3
    ],
    "par": 6,
    "starPar": 6
  },
  "55": {
    "short": [
      5,
      6,
      6,
      10,
      11,
      15,
      15,
      15
    ],
    "stars": [
      0,
      2,
      5,
      6,
      7,
      10,
      11,
      15,
      15,
      15
    ],
    "par": 8,
    "starPar": 10
  },
  "56": {
    "short": [
      8,
      8,
      13,
      18
    ],
    "stars": [
      1,
      2,
      2,
      2,
      6,
      7,
      8,
      8,
      12,
      12,
      12,
      16
    ],
    "par": 4,
    "starPar": 12
  },
  "57": {
    "short": [
      2,
      2,
      2,
      3,
      4,
      5,
      5,
      5,
      6,
      7,
      9
    ],
    "stars": [
      5,
      5,
      5,
      6,
      8,
      9,
      9,
      12,
      17,
      18,
      18,
      18
    ],
    "par": 11,
    "starPar": 12
  },
  "58": {
    "short": [
      4,
      4,
      4,
      7,
      8,
      8,
      8,
      9,
      14
    ],
    "stars": [
      0,
      0,
      0,
      2,
      3,
      4,
      4,
      4,
      5,
      6,
      9,
      11,
      11,
      11,
      12,
      14
    ],
    "par": 9,
    "starPar": 16
  },
  "59": {
    "short": [
      1,
      1,
      2,
      12,
      12,
      13,
      14
    ],
    "stars": [
      1,
      1,
      2,
      3,
      3,
      3,
      7,
      7,
      8,
      12,
      12,
      13,
      14
    ],
    "par": 7,
    "starPar": 13
  },
  "60": {
    "short": [
      1,
      1,
      2,
      3,
      6,
      11,
      16
    ],
    "stars": [
      2,
      2,
      3,
      7,
      8,
      9,
      11,
      12,
      14,
      16
    ],
    "par": 7,
    "starPar": 10
  },
  "61": {
    "short": [
      5,
      7,
      7,
      7,
      8,
      8,
      8,
      10,
      10,
      12,
      13,
      13,
      13
    ],
    "stars": [
      5,
      7,
      7,
      7,
      8,
      8,
      8,
      10,
      11,
      12,
      13,
      13,
      13,
      15,
      16
    ],
    "par": 13,
    "starPar": 15
  },
  "62": {
    "short": [
      6,
      6,
      6,
      11,
      13,
      13,
      13,
      17,
      18,
      18,
      18
    ],
    "stars": [
      6,
      6,
      6,
      10,
      10,
      11,
      13,
      13,
      13,
      15,
      16,
      17,
      18,
      18,
      18
    ],
    "par": 11,
    "starPar": 15
  },
  "63": {
    "short": [
      1,
      1,
      1,
      2,
      4,
      4,
      5,
      9,
      9,
      9
    ],
    "stars": [
      4,
      4,
      5,
      6,
      6,
      7,
      9,
      9,
      9,
      11,
      11,
      11,
      12,
      12
    ],
    "par": 10,
    "starPar": 14
  },
  "64": {
    "short": [
      5,
      7,
      8,
      9,
      10,
      15,
      15,
      15
    ],
    "stars": [
      5,
      7,
      8,
      8,
      9,
      10,
      12,
      13,
      15,
      15,
      15,
      17,
      17,
      17,
      18,
      18,
      18
    ],
    "par": 8,
    "starPar": 17
  },
  "65": {
    "short": [
      4,
      4,
      9,
      13,
      13,
      14,
      14,
      14,
      19,
      19
    ],
    "stars": [
      4,
      4,
      7,
      7,
      7,
      8,
      9,
      12,
      14,
      14,
      14,
      19,
      19
    ],
    "par": 10,
    "starPar": 13
  },
  "66": {
    "short": [
      6,
      7,
      8,
      8,
      13,
      18,
      18,
      19,
      19
    ],
    "stars": [
      2,
      2,
      2,
      4,
      6,
      8,
      9,
      9,
      13,
      18,
      18,
      19,
      19
    ],
    "par": 9,
    "starPar": 13
  },
  "67": {
    "short": [
      0,
      5,
      5,
      5,
      6,
      7,
      8,
      9
    ],
    "stars": [
      0,
      5,
      5,
      5,
      6,
      8,
      9,
      11,
      12,
      12,
      12,
      13,
      16,
      18,
      18,
      18
    ],
    "par": 8,
    "starPar": 16
  },
  "68": {
    "short": [
      8,
      12,
      13,
      13,
      13,
      15,
      15,
      15,
      16,
      17,
      17,
      17
    ],
    "stars": [
      1,
      1,
      1,
      2,
      3,
      3,
      3,
      6,
      8,
      8,
      11,
      15,
      15,
      15,
      16,
      16
    ],
    "par": 12,
    "starPar": 16
  },
  "69": {
    "short": [
      10,
      10,
      16,
      16,
      18,
      19
    ],
    "stars": [
      6,
      7,
      7,
      7,
      10,
      10,
      11,
      12,
      17,
      17,
      18,
      19
    ],
    "par": 6,
    "starPar": 12
  },
  "70": {
    "short": [
      2,
      2,
      2,
      7,
      8,
      8,
      8,
      9,
      9,
      12,
      12
    ],
    "stars": [
      2,
      2,
      2,
      6,
      6,
      6,
      8,
      8,
      8,
      9,
      9,
      13,
      16,
      17,
      18,
      18,
      18
    ],
    "par": 11,
    "starPar": 17
  },
  "71": {
    "short": [
      3,
      4,
      4,
      4,
      8,
      8,
      9,
      9,
      13,
      15,
      15,
      16,
      17,
      18
    ],
    "stars": [
      3,
      4,
      4,
      4,
      6,
      6,
      6,
      7,
      8,
      8,
      9,
      9,
      11,
      12,
      12,
      15,
      15
    ],
    "par": 14,
    "starPar": 17
  },
  "72": {
    "short": [
      0,
      0,
      1,
      5,
      10,
      15,
      16,
      16,
      16,
      17
    ],
    "stars": [
      0,
      0,
      1,
      5,
      6,
      8,
      8,
      10,
      11,
      12,
      12,
      13,
      13,
      15,
      16,
      16,
      16,
      17
    ],
    "par": 10,
    "starPar": 18
  },
  "73": {
    "short": [
      7,
      7,
      9,
      9,
      9,
      12,
      15,
      15,
      16
    ],
    "stars": [
      0,
      0,
      1,
      1,
      1,
      6,
      7,
      9,
      9,
      9,
      10,
      15,
      15,
      16
    ],
    "par": 9,
    "starPar": 14
  },
  "74": {
    "short": [
      1,
      2,
      3,
      6,
      6,
      8,
      9,
      9,
      14
    ],
    "stars": [
      0,
      0,
      0,
      1,
      1,
      5,
      6,
      6,
      10,
      10,
      11,
      12
    ],
    "par": 9,
    "starPar": 12
  },
  "75": {
    "short": [
      5,
      5,
      10,
      13,
      15,
      15,
      15,
      16,
      17,
      18,
      18,
      18
    ],
    "stars": [
      5,
      5,
      10,
      11,
      11,
      11,
      12,
      12,
      13,
      15,
      15,
      15,
      16,
      16,
      18,
      18,
      18
    ],
    "par": 12,
    "starPar": 17
  },
  "76": {
    "short": [
      0,
      0,
      0,
      10,
      10,
      11,
      12,
      13
    ],
    "stars": [
      0,
      0,
      0,
      2,
      3,
      4,
      4,
      4,
      7,
      9,
      9,
      9,
      10,
      10,
      11,
      12,
      13
    ],
    "par": 8,
    "starPar": 17
  },
  "77": {
    "short": [
      1,
      2,
      2,
      5,
      5,
      6,
      6,
      6,
      10,
      10,
      11,
      11
    ],
    "stars": [
      1,
      3,
      4,
      5,
      5,
      6,
      6,
      6,
      7,
      7,
      8,
      9,
      10,
      10,
      11,
      11,
      13,
      13,
      14,
      14,
      14
    ],
    "par": 12,
    "starPar": 21
  },
  "78": {
    "short": [
      3,
      4,
      8,
      8,
      8,
      9,
      12,
      13,
      14,
      14,
      14,
      17,
      17,
      17
    ],
    "stars": [
      0,
      1,
      2,
      3,
      3,
      5,
      8,
      8,
      8,
      10,
      10,
      10,
      12,
      12,
      17,
      17,
      17
    ],
    "par": 14,
    "starPar": 17
  },
  "79": {
    "short": [
      10,
      10,
      11,
      11,
      11,
      14,
      14,
      15,
      15,
      17,
      18,
      19
    ],
    "stars": [
      0,
      0,
      0,
      2,
      2,
      2,
      5,
      7,
      10,
      11,
      11,
      11,
      14,
      14,
      18,
      19
    ],
    "par": 12,
    "starPar": 16
  },
  "80": {
    "short": [
      5,
      5,
      5,
      6,
      10,
      10,
      14,
      14,
      14,
      18,
      19
    ],
    "stars": [
      5,
      5,
      5,
      6,
      10,
      11,
      14,
      14,
      14,
      15,
      15,
      15,
      16,
      18,
      19
    ],
    "par": 11,
    "starPar": 15
  },
  "81": {
    "short": [
      0,
      0,
      0,
      1,
      2,
      4,
      4,
      4,
      5,
      10,
      10,
      14,
      14
    ],
    "stars": [
      0,
      0,
      0,
      1,
      2,
      4,
      4,
      4,
      5,
      5,
      6,
      7,
      7,
      14,
      14,
      15,
      15,
      15,
      16,
      17
    ],
    "par": 13,
    "starPar": 20
  },
  "82": {
    "short": [
      6,
      7,
      9,
      13,
      13,
      13,
      14,
      14,
      14,
      18,
      18
    ],
    "stars": [
      2,
      2,
      2,
      3,
      3,
      3,
      6,
      8,
      8,
      9,
      13,
      13,
      13,
      14,
      14,
      14,
      18,
      18
    ],
    "par": 11,
    "starPar": 18
  },
  "83": {
    "short": [
      0,
      0,
      1,
      3,
      3,
      6,
      6,
      6,
      8,
      11,
      11
    ],
    "stars": [
      0,
      0,
      1,
      4,
      4,
      4,
      6,
      6,
      6,
      9,
      9,
      9,
      11,
      11
    ],
    "par": 11,
    "starPar": 14
  },
  "84": {
    "short": [
      0,
      0,
      1,
      2,
      2,
      2,
      5,
      5,
      7,
      12,
      12,
      12,
      13
    ],
    "stars": [
      0,
      0,
      1,
      2,
      2,
      2,
      3,
      4,
      4,
      5,
      5,
      7,
      8,
      12,
      12,
      12,
      14,
      18,
      18,
      18,
      19,
      19,
      19
    ],
    "par": 13,
    "starPar": 23
  },
  "85": {
    "short": [
      8,
      9,
      9,
      9,
      10,
      10,
      12,
      13,
      13,
      13,
      15,
      15,
      15,
      16
    ],
    "stars": [
      1,
      1,
      1,
      2,
      6,
      7,
      7,
      9,
      9,
      9,
      10,
      10,
      11,
      15,
      15,
      15,
      16
    ],
    "par": 14,
    "starPar": 17
  },
  "86": {
    "short": [
      6,
      6,
      8,
      9,
      9,
      9,
      11,
      11,
      13,
      14,
      19
    ],
    "stars": [
      6,
      6,
      8,
      9,
      9,
      9,
      10,
      10,
      10,
      11,
      12,
      13,
      14,
      15,
      15,
      16,
      17,
      19
    ],
    "par": 11,
    "starPar": 18
  },
  "87": {
    "short": [
      8,
      10,
      13,
      13,
      14,
      14,
      14,
      15,
      16,
      17,
      18,
      19,
      19
    ],
    "stars": [
      1,
      1,
      2,
      2,
      2,
      6,
      7,
      8,
      11,
      11,
      12,
      13,
      13,
      14,
      14,
      14,
      18,
      19,
      19
    ],
    "par": 13,
    "starPar": 19
  },
  "88": {
    "short": [
      1,
      2,
      3,
      6,
      6,
      6,
      7,
      7,
      12,
      17,
      17,
      17
    ],
    "stars": [
      0,
      2,
      3,
      5,
      10,
      11,
      11,
      11,
      15,
      15,
      15,
      16,
      17,
      17,
      17
    ],
    "par": 12,
    "starPar": 15
  },
  "89": {
    "short": [
      0,
      0,
      0,
      5,
      10,
      11,
      11,
      16,
      16,
      16,
      18,
      19
    ],
    "stars": [
      0,
      0,
      0,
      7,
      7,
      11,
      12,
      12,
      12,
      16,
      16,
      16,
      18,
      19
    ],
    "par": 12,
    "starPar": 14
  },
  "90": {
    "short": [
      7,
      8,
      9,
      13,
      13,
      14,
      16,
      16,
      16,
      17,
      18
    ],
    "stars": [
      2,
      2,
      4,
      4,
      13,
      13,
      14,
      16,
      16,
      16,
      17,
      18
    ],
    "par": 11,
    "starPar": 12
  },
  "91": {
    "short": [
      3,
      3,
      4,
      4,
      6,
      8,
      11,
      14,
      14,
      14,
      16
    ],
    "stars": [
      0,
      1,
      2,
      3,
      4,
      4,
      10,
      10,
      14,
      14,
      14,
      16
    ],
    "par": 11,
    "starPar": 12
  },
  "92": {
    "short": [
      0,
      0,
      0,
      1,
      2,
      7,
      7,
      7,
      13,
      13,
      13,
      14,
      14,
      19,
      19,
      19
    ],
    "stars": [
      0,
      0,
      0,
      1,
      2,
      4,
      4,
      8,
      8,
      9,
      9,
      13,
      13,
      13,
      14,
      14,
      19,
      19,
      19
    ],
    "par": 16,
    "starPar": 19
  },
  "93": {
    "short": [
      2,
      2,
      2,
      3,
      7,
      8,
      8,
      8,
      9,
      9,
      9,
      11,
      11,
      12,
      12,
      14,
      16
    ],
    "stars": [
      2,
      2,
      2,
      3,
      5,
      5,
      5,
      7,
      8,
      8,
      8,
      9,
      9,
      9,
      10,
      10,
      10,
      14,
      16
    ],
    "par": 17,
    "starPar": 19
  },
  "94": {
    "short": [
      1,
      1,
      2,
      6,
      7,
      10,
      10,
      10,
      11,
      15,
      15,
      16,
      17
    ],
    "stars": [
      0,
      1,
      2,
      5,
      5,
      6,
      6,
      7,
      10,
      10,
      10,
      11,
      15,
      15,
      16,
      17
    ],
    "par": 13,
    "starPar": 16
  },
  "95": {
    "short": [
      0,
      0,
      5,
      7,
      10,
      12,
      15,
      15,
      16,
      17,
      17,
      17
    ],
    "stars": [
      0,
      0,
      6,
      6,
      7,
      11,
      12,
      15,
      15,
      16,
      17,
      17,
      17
    ],
    "par": 12,
    "starPar": 13
  },
  "96": {
    "short": [
      0,
      1,
      2,
      3,
      5,
      10,
      10,
      10,
      11,
      16,
      16,
      17
    ],
    "stars": [
      0,
      1,
      2,
      3,
      3,
      5,
      7,
      7,
      8,
      10,
      10,
      10,
      11,
      16,
      16,
      17
    ],
    "par": 12,
    "starPar": 16
  },
  "97": {
    "short": [
      10,
      10,
      10,
      12,
      12,
      13,
      14,
      14,
      15,
      15,
      15,
      17,
      17,
      17,
      19,
      19
    ],
    "stars": [
      2,
      3,
      3,
      3,
      7,
      8,
      10,
      10,
      10,
      13,
      14,
      14,
      15,
      15,
      15,
      17,
      17,
      17,
      19,
      19
    ],
    "par": 16,
    "starPar": 20
  },
  "98": {
    "short": [
      0,
      5,
      5,
      5,
      7,
      7,
      12,
      12,
      12,
      13,
      13,
      16,
      17
    ],
    "stars": [
      0,
      5,
      5,
      5,
      7,
      7,
      12,
      12,
      12,
      14,
      16,
      17,
      18,
      19,
      19,
      19
    ],
    "par": 13,
    "starPar": 16
  },
  "99": {
    "short": [
      2,
      3,
      3,
      12,
      13,
      13,
      13,
      14,
      17,
      17,
      19,
      19,
      19
    ],
    "stars": [
      2,
      4,
      8,
      8,
      9,
      12,
      13,
      13,
      13,
      14,
      17,
      17,
      19,
      19,
      19
    ],
    "par": 13,
    "starPar": 15
  },
  "100": {
    "short": [
      1,
      1,
      6,
      7,
      7,
      8,
      9,
      9,
      12,
      14,
      19
    ],
    "stars": [
      1,
      1,
      5,
      6,
      7,
      7,
      8,
      9,
      9,
      10,
      10,
      10,
      11,
      12,
      14,
      19
    ],
    "par": 11,
    "starPar": 16
  }
};
