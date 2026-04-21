import { Chapter } from '../../../types';

export const abridgedChapters: Chapter[] = [
  {
    id: 1,
    title: "Major's Dream",
    scenes: [
      {
        id: "af-ab1-s1",
        title: "The Vision",
        background: "barn",
        dialogue: [
          { characterId: "narrator", text: "Old Major, the prize boar, gathers the animals of Manor Farm to share a dream of a world without humans." },
          { characterId: "old_major", text: "“Man is the only real enemy we have. Remove Man from the scene, and the root cause of hunger and overwork is abolished for ever.”" },
          { characterId: "old_major", text: "“All men are enemies. All animals are comrades.”" },
          { characterId: "narrator", text: "They sing ‘Beasts of England’, a song of freedom, before being interrupted by a shot from Mr. Jones's gun." }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "The Rebellion",
    scenes: [
      {
        id: "af-ab2-s1",
        title: "Taking the Farm",
        background: "farm_yard",
        dialogue: [
          { characterId: "narrator", text: "After Major's death, the animals rebel against the drunken Mr. Jones and drive him away." },
          { characterId: "narrator", text: "The pigs, led by Snowball and Napoleon, rename the farm ‘Animal Farm’ and establish the Seven Commandments." },
          { characterId: "snowball", text: "“THE SEVEN COMMANDMENTS:\n1. Whatever goes upon two legs is an enemy.\n...\n7. All animals are equal.”" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "The First Harvest",
    scenes: [
      {
        id: "af-ab3-s1",
        title: "Success and Suspicion",
        background: "hayfield",
        dialogue: [
          { characterId: "narrator", text: "The first harvest is a triumph. Boxer, the horse, becomes the hardest worker on the farm." },
          { characterId: "boxer", text: "“I will work harder!”" },
          { characterId: "narrator", text: "However, the pigs begin taking special privileges, like the milk and apples, claiming they need them for their 'brainwork'." }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "The Battle of the Cowshed",
    scenes: [
      {
        id: "af-ab4-s1",
        title: "Defending the Farm",
        background: "battlefield",
        dialogue: [
          { characterId: "narrator", text: "Mr. Jones returns with armed men to retake the farm, but the animals, led by Snowball's clever tactics, defeat them." },
          { characterId: "snowball", text: "“War is war. The only good human being is a dead one.”" },
          { characterId: "narrator", text: "Snowball and Boxer are awarded ‘Animal Hero, First Class’ medals." }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "The Expulsion",
    scenes: [
      {
        id: "af-ab5-s1",
        title: "Snowball's Flight",
        background: "dogs_chase",
        dialogue: [
          { characterId: "narrator", text: "Conflict grows between Snowball and Napoleon over the building of a windmill." },
          { characterId: "narrator", text: "During a vote, Napoleon unleashes nine fierce dogs to chase Snowball off the farm forever." },
          { characterId: "napoleon", text: "“Sunday Meetings are abolished. Decisions will be made by a committee of pigs!”" }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "The Windmill",
    scenes: [
      {
        id: "af-ab6-s1",
        title: "Slavery and Storms",
        background: "windmill_ruins",
        dialogue: [
          { characterId: "narrator", text: "The animals toil to build the windmill. Napoleon begins trading with humans." },
          { characterId: "narrator", text: "A storm destroys the windmill, but Napoleon blames it on the 'saboteur' Snowball." },
          { characterId: "napoleon", text: "“Comrades, here and now I pronounce the death sentence upon Snowball!”" }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "The Purge",
    scenes: [
      {
        id: "af-ab7-s1",
        title: "Executions",
        background: "executions",
        dialogue: [
          { characterId: "narrator", text: "Faced with starvation and internal dissent, Napoleon holds a public execution of 'traitors'." },
          { characterId: "narrator", text: "Animals confess to crimes they didn't commit and are slaughtered by the dogs." },
          { characterId: "boxer", text: "“It must be due to some fault in ourselves. The solution is to work harder.”" }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "The Battle of the Windmill",
    scenes: [
      {
        id: "af-ab8-s1",
        title: "Frederick's Treachery",
        background: "explosion_windmill",
        dialogue: [
          { characterId: "narrator", text: "Frederick of Pinchfield cheats the animals with fake money and then attacks the farm." },
          { characterId: "narrator", text: "He blows up the rebuilt windmill. The animals drive the humans off, but suffer heavy losses." },
          { characterId: "narrator", text: "The pigs find whisky and change the Commandments to allow drinking 'to excess'." }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Boxer's End",
    scenes: [
      {
        id: "af-ab9-s1",
        title: "The Knacker's Van",
        background: "knacker_van",
        dialogue: [
          { characterId: "narrator", text: "Boxer, now old and injured, collapses. Napoleon promises to send him to a hospital." },
          { characterId: "benjamin", text: "“Fools! Do you not see what is written on the side of that van? They are taking Boxer to the knacker's!”" },
          { characterId: "narrator", text: "Boxer is taken away to his death. Squealer lies to the animals, claiming Boxer died peacefully in a hospital." }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "The Manor Farm",
    scenes: [
      {
        id: "af-ab10-s1",
        title: "Indistinguishable",
        background: "pigs_humans",
        dialogue: [
          { characterId: "narrator", text: "Years pass. The pigs now walk on two legs and hold whips." },
          { characterId: "narrator", text: "All Commandments are gone, replaced by one: ‘ALL ANIMALS ARE EQUAL BUT SOME ANIMALS ARE MORE EQUAL THAN OTHERS’." },
          { characterId: "narrator", text: "Watching through a window, the other animals see pigs and humans dining together." },
          { characterId: "narrator", text: "The animals look from pig to man, and from man to pig, and from pig to man again; but already it was impossible to say which was which." },
          { text: "THE END", style: "italic" }
        ]
      }
    ]
  }
];
