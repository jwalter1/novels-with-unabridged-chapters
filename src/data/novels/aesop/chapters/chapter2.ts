import { Chapter } from '../../../../types';

export const chapter2: Chapter = {
  id: 2,
  title: "Nature's Lessons",
  scenes: [
    {
      id: "aesop-s2-1",
      title: "The Fox and the Grapes",
      background: "vineyard_sunny",
      dialogue: [
        { characterId: "narrator", text: "The Fox and the Grapes" },
        { characterId: "narrator", text: "One hot summer’s day a Fox was strolling through an orchard till he came to a bunch of Grapes just ripening on a vine which had been trained over a lofty branch." },
        { characterId: "fox", text: "Just the thing to quench my thirst." },
        { characterId: "narrator", text: "Drawing back a few paces, he took a run and a jump, and just missed the bunch. Turning round again with a One, Two, Three, he jumped up, but with no greater success." },
        { characterId: "narrator", text: "Again and again he tried after the tempting morsel, but at last had to give it up, and walked away with his nose in the air, saying:" },
        { characterId: "fox", text: "I am sure they are sour." },
        { characterId: "narrator", text: "It is easy to despise what you cannot get.", style: "italic" }
      ]
    },
    {
      id: "aesop-s2-2",
      title: "The Ant and the Grasshopper",
      background: "summer_field",
      dialogue: [
        { characterId: "narrator", text: "The Ant and the Grasshopper" },
        { characterId: "narrator", text: "In a field one summer’s day a Grasshopper was hopping about, chirping and singing to its heart’s content." },
        { characterId: "narrator", text: "An Ant passed by, bearing along with great toil an ear of corn he was taking to the nest." },
        { characterId: "grasshopper", text: "Why not come and chat with me, instead of toiling and moiling in that way?" },
        { characterId: "ant", text: "I am helping to lay up food for the winter, and recommend you to do the same." },
        { characterId: "grasshopper", text: "Why bother about winter? We have got plenty of food at present." },
        { characterId: "narrator", text: "But the Ant went on its way and continued its toil. When the winter came the Grasshopper had no food and was dying of hunger—while it saw the ants distributing every day corn and grain from the stores they had collected in the summer." },
        { characterId: "narrator", text: "Then the Grasshopper knew:" },
        { characterId: "narrator", text: "It is best to prepare for days of need.", style: "italic" }
      ]
    },
    {
      id: "aesop-s2-3",
      title: "The Hare and the Tortoise",
      background: "winding_road",
      dialogue: [
        { characterId: "narrator", text: "The Hare and the Tortoise" },
        { characterId: "narrator", text: "The Hare was once boasting of his speed before the other animals." },
        { characterId: "hare", text: "I have never yet been beaten when I put forth my full speed. I challenge any one here to race with me." },
        { characterId: "tortoise", text: "I accept your challenge." },
        { characterId: "hare", text: "That is a good joke; I could dance round you all the way." },
        { characterId: "tortoise", text: "Keep your boasting till you’ve won. Shall we begin?" },
        { characterId: "narrator", text: "So a course was fixed and a start was made. The Hare darted almost out of sight at once, but soon stopped and, to show his contempt for the Tortoise, lay down to have a nap." },
        { characterId: "narrator", text: "The Tortoise plodded on and plodded on, and when the Hare awoke from his nap, he saw the Tortoise just near the winning-post and could not run up in time to save the race." },
        { characterId: "narrator", text: "Slow but steady wins the race.", style: "italic" }
      ]
    }
  ]
};
