import { Chapter } from '../../../../types';

export const chapter11: Chapter = {
  id: 11,
  title: "Warnings and Wisdom",
  scenes: [
    {
      id: "aesop-c11-s1",
      title: "The Nurse and the Wolf",
      background: "default",
      dialogue: [
        { characterId: "narrator", text: "The Nurse and the Wolf" },
        { characterId: "narrator", text: "A Wolf was passing by a cottage when he heard a Child crying, and the Nurse said:" },
        { characterId: "nurse", text: "Be quiet, or I will give you to the Wolf." },
        { characterId: "narrator", text: "The Wolf, thinking she was in earnest, waited outside all day. But when evening came, he heard the Nurse say:" },
        { characterId: "nurse", text: "There's a good child; if the Wolf comes, we will kill him." },
        { characterId: "wolf", text: "People say one thing and mean another." },
        { characterId: "narrator", text: "Enemies' promises were made to be broken.", style: "italic" }
      ]
    },
    {
      id: "aesop-c11-s2",
      title: "The Tortoise and the Birds",
      background: "river_bank",
      dialogue: [
        { characterId: "narrator", text: "The Tortoise and the Birds" },
        { characterId: "narrator", text: "A Tortoise was once dissatisfied because he could not fly like the birds." },
        { characterId: "tortoise", text: "I wish I could fly! Will someone teach me?" },
        { characterId: "narrator", text: "An Eagle agreed to help him and, taking him up into the air, let him go, telling him to fly." },
        { characterId: "narrator", text: "The Tortoise fell to the ground and was dashed to pieces." },
        { characterId: "narrator", text: "You cannot change your nature.", style: "italic" }
      ]
    },
    {
      id: "aesop-c11-s3",
      title: "The Two Crabs",
      background: "river_bank",
      dialogue: [
        { characterId: "narrator", text: "The Two Crabs" },
        { characterId: "narrator", text: "A Mother Crab once said to her son:" },
        { characterId: "crab", text: "Why do you walk so sideways, child? It is much better to walk straight forward." },
        { characterId: "crab", text: "Show me how to do it, mother, and I will follow your example." },
        { characterId: "narrator", text: "But the Mother Crab could only walk sideways herself." },
        { characterId: "narrator", text: "Example is better than precept.", style: "italic" }
      ]
    },
    {
      id: "aesop-c11-s4",
      title: "The Ass in the Lion's Skin",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Ass in the Lion's Skin" },
        { characterId: "narrator", text: "An Ass once found the skin of a Lion and, putting it on, he terrified all the animals." },
        { characterId: "narrator", text: "His master, too, was at first afraid, but when he saw the long ears poking out, he soon found out the cheat." },
        { characterId: "man", text: "You can dress up like a lion, but you still bray like an ass." },
        { characterId: "narrator", text: "A fool may disguise his appearance, but his tongue will soon betray him.", style: "italic" }
      ]
    },
    {
      id: "aesop-c11-s5",
      title: "The Two Fellows and the Bear",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Two Fellows and the Bear" },
        { characterId: "narrator", text: "Two Fellows were once walking through a forest when a Bear suddenly appeared." },
        { characterId: "narrator", text: "One of them climbed a tree, while the other fell to the ground and pretended to be dead." },
        { characterId: "narrator", text: "The Bear came up and smelled him, but as he did not move, the Bear at last went away." },
        { characterId: "man", text: "What did the Bear whisper to you?" },
        { characterId: "narrator", text: "asked the one in the tree." },
        { characterId: "man", text: "He told me to avoid those who desert their friends in time of danger." },
        { characterId: "narrator", text: "Misfortune tests the sincerity of friends.", style: "italic" }
      ]
    }
  ]
};
