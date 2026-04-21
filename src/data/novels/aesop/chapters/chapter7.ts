import { Chapter } from '../../../../types';

export const chapter7: Chapter = {
  id: 7,
  title: "Perception and Reality",
  scenes: [
    {
      id: "aesop-c7-s1",
      title: "The Bat, the Birds, and the Beasts",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Bat, the Birds, and the Beasts" },
        { characterId: "narrator", text: "A great battle was about to take place between the Birds and the Beasts. The Bat, not knowing which side would win, kept changing sides." },
        { characterId: "bat", text: "I am a Bird," },
        { characterId: "narrator", text: "said he when the Birds were winning." },
        { characterId: "bat", text: "I am a Beast," },
        { characterId: "narrator", text: "said he when the Beasts were winning." },
        { characterId: "narrator", text: "When peace was made, neither side would have anything to do with him." },
        { characterId: "bat", text: "He that is neither one thing nor the other has no friends." },
        { characterId: "narrator", text: "He who serves two masters serves none.", style: "italic" }
      ]
    },
    {
      id: "aesop-c7-s2",
      title: "The Hart and the Hunter",
      background: "river_bank",
      dialogue: [
        { characterId: "narrator", text: "The Hart and the Hunter" },
        { characterId: "narrator", text: "A Hart was drinking at a spring and admired his branching horns, but was ashamed of his spindly legs." },
        { characterId: "hart", text: "How beautiful are my antlers, but how miserable are my legs!" },
        { characterId: "narrator", text: "Just then a Hunter appeared, and the Hart's legs soon carried him out of reach. But as he entered a thicket, his horns became entangled in the branches." },
        { characterId: "hart", text: "Woe is me! My legs, which I despised, would have saved me, while my horns, which I was so proud of, have been my ruin." },
        { characterId: "narrator", text: "We often despise what is most useful to us.", style: "italic" }
      ]
    },
    {
      id: "aesop-c7-s3",
      title: "The Serpent and the File",
      background: "default",
      dialogue: [
        { characterId: "narrator", text: "The Serpent and the File" },
        { characterId: "narrator", text: "A Serpent once entered a smithy and began to lick a File." },
        { characterId: "narrator", text: "The File said quietly:" },
        { characterId: "man", text: "You are wasting your time; I am used to biting, not being bitten." },
        { characterId: "narrator", text: "It is useless to attack those who can bite back.", style: "italic" }
      ]
    },
    {
      id: "aesop-c7-s4",
      title: "The Man and the Wood",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Man and the Wood" },
        { characterId: "narrator", text: "A Man once went into the Wood and asked for a handle for his axe. The Wood agreed to let him have a piece of ash." },
        { characterId: "narrator", text: "As soon as the Man had fitted the handle, he began to cut down all the best trees." },
        { characterId: "narrator", text: "An old Oak said to a Cedar:" },
        { characterId: "man", text: "We have only ourselves to blame; if we had not given him the handle, he could not have used the axe." },
        { characterId: "narrator", text: "Those who give their enemies the means to destroy them deserve no pity.", style: "italic" }
      ]
    },
    {
      id: "aesop-c7-s5",
      title: "The Dog and the Wolf",
      background: "winding_road",
      dialogue: [
        { characterId: "narrator", text: "The Dog and the Wolf" },
        { characterId: "narrator", text: "A Wolf met a Dog and began to admire his sleek coat." },
        { characterId: "wolf", text: "How well you look! I can hardly find enough to eat." },
        { characterId: "dog", text: "Come with me to my master's house and you shall have plenty." },
        { characterId: "narrator", text: "As they were going along, the Wolf noticed a mark on the Dog's neck." },
        { characterId: "wolf", text: "What is that?" },
        { characterId: "dog", text: "Oh, that's where I'm tied up at night." },
        { characterId: "wolf", text: "In that case, goodbye! I'd rather have a crust in freedom than a feast in chains." },
        { characterId: "narrator", text: "Lean liberty is better than fat slavery.", style: "italic" }
      ]
    }
  ]
};
