import { Chapter } from '../../../../types';

export const chapter1: Chapter = {
  id: 1,
  title: "Fables of Wisdom and Wit",
  scenes: [
    {
      id: "aesop-s1",
      title: "The Wolf and the Lamb",
      background: "river_bank",
      dialogue: [
        { characterId: "narrator", text: "The Wolf and the Lamb" },
        { characterId: "narrator", text: "Once upon a time a Wolf was drinking at a spring on a hillside, when, looking up, what should he see but a Lamb just beginning to drink a little lower down." },
        { characterId: "wolf", text: "There’s my supper, if only I can find some excuse to seize it." },
        { characterId: "wolf", text: "How dare you muddle the water from which I am drinking?" },
        { characterId: "lamb", text: "Nay, master, nay; if the water be muddy up there, I cannot be the cause of it, for it runs down from you to me." },
        { characterId: "wolf", text: "Well, then, why did you call me bad names this time last year?" },
        { characterId: "lamb", text: "That cannot be, for I am only six months old." },
        { characterId: "wolf", text: "I don’t care; if it was not you it was your father;" },
        { characterId: "narrator", text: "And with that he rushed upon the poor helpless Lamb and ate her all up. But before she died she gasped out:" },
        { characterId: "narrator", text: "Any excuse will serve a tyrant.", style: "italic" }
      ]
    },
    {
      id: "aesop-s2",
      title: "The Dog and the Shadow",
      background: "bridge_over_water",
      dialogue: [
        { characterId: "narrator", text: "The Dog and the Shadow" },
        { characterId: "narrator", text: "It happened that a Dog had got a piece of meat and was carrying it home in his mouth to eat it in peace." },
        { characterId: "narrator", text: "Now on his way home he had to cross a plank lying across a running brook. As he crossed, he looked down and saw his own shadow reflected in the water beneath." },
        { characterId: "narrator", text: "Thinking it was another dog with another piece of meat, he made up his mind to have that also." },
        { characterId: "narrator", text: "So he made a snap at the shadow in the water, but as he opened his mouth the piece of meat fell out, dropped into the water and was never seen more." },
        { characterId: "narrator", text: "Beware lest you lose the substance by grasping at the shadow.", style: "italic" }
      ]
    },
    {
      id: "aesop-s3",
      title: "The Lion and the Mouse",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Lion and the Mouse" },
        { characterId: "narrator", text: "Once when a Lion was asleep a little Mouse began running up and down upon him; this soon wakened the Lion, who placed his huge paw upon him, and opened his big jaws to swallow him." },
        { characterId: "mouse", text: "Pardon, O King, forgive me this time, I shall never forget it: who knows but what I may be able to do you a turn some of these days?" },
        { characterId: "narrator", text: "The Lion was so tickled at the idea of the Mouse being able to help him, that he lifted up his paw and let him go." },
        { characterId: "narrator", text: "Some time after the Lion was caught in a trap, and the hunters, who desired to carry him alive to the King, tied him to a tree while they went in search of a waggon to carry him on." },
        { characterId: "narrator", text: "Just then the little Mouse happened to pass by, and seeing the sad plight in which the Lion was, went up to him and soon gnawed away the ropes that bound the King of the Beasts." },
        { characterId: "mouse", text: "Was I not right?" },
        { characterId: "narrator", text: "The little Mouse was very happy to help the Lion." },
        { characterId: "narrator", text: "Little friends may prove great friends.", style: "italic" }
      ]
    }
  ]
};
