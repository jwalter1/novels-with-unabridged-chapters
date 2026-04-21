import { Chapter } from '../../../../types';

export const chapter9: Chapter = {
  id: 9,
  title: "Deceptive Appearances",
  scenes: [
    {
      id: "aesop-c9-s1",
      title: "The Lion and the Statue",
      background: "default",
      dialogue: [
        { characterId: "narrator", text: "The Lion and the Statue" },
        { characterId: "narrator", text: "A Man and a Lion were once discussing which was the stronger, and the Man showed the Lion a statue of a Man strangling a Lion." },
        { characterId: "lion", text: "If we Lions were the sculptors, you would see the Lion strangling the Man." },
        { characterId: "narrator", text: "We can only judge by what we see.", style: "italic" }
      ]
    },
    {
      id: "aesop-c9-s2",
      title: "The Tree and the Reed",
      background: "river_bank",
      dialogue: [
        { characterId: "narrator", text: "The Tree and the Reed" },
        { characterId: "narrator", text: "A huge Oak was blown down by a storm while a slender Reed remained standing." },
        { characterId: "narrator", text: "The Oak said to the Reed:" },
        { characterId: "ox", text: "I was strong and stiff, while you bowed before the wind." },
        { characterId: "reed", text: "It is better to bend than to break." },
        { characterId: "narrator", text: "Obscurity often brings safety.", style: "italic" }
      ]
    },
    {
      id: "aesop-c9-s3",
      title: "The Fox and the Cat",
      background: "forest_clearing",
      dialogue: [
        { characterId: "narrator", text: "The Fox and the Cat" },
        { characterId: "narrator", text: "The Fox was once boasting to the Cat of his many ways of escaping from his enemies." },
        { characterId: "fox", text: "I have a whole bag of tricks! How many have you?" },
        { characterId: "cat", text: "I have only one, and it is to climb a tree." },
        { characterId: "narrator", text: "Just then the hunters appeared. The Cat climbed a tree and was safe, while the Fox, after trying all his tricks, was caught by the dogs." },
        { characterId: "cat", text: "Better one sure way than a hundred that fail." },
        { characterId: "narrator", text: "One good trick is worth a hundred poor ones.", style: "italic" }
      ]
    },
    {
      id: "aesop-c9-s4",
      title: "The Wolf in Sheep's Clothing",
      background: "summer_field",
      dialogue: [
        { characterId: "narrator", text: "The Wolf in Sheep's Clothing" },
        { characterId: "narrator", text: "A Wolf once found the skin of a Sheep and, putting it on, he managed to get among the flock and eat several sheep." },
        { characterId: "narrator", text: "But during the night the Shepherd wanted some mutton, and taking up his knife, he killed the first sheep he came to, which happened to be the Wolf." },
        { characterId: "narrator", text: "Appearances are deceptive.", style: "italic" }
      ]
    },
    {
      id: "aesop-c9-s5",
      title: "The Dog in the Manger",
      background: "default",
      dialogue: [
        { characterId: "narrator", text: "The Dog in the Manger" },
        { characterId: "narrator", text: "A Dog lay in a manger and would not let the Oxen touch the hay." },
        { characterId: "ox", text: "You cannot eat it yourself, why should you prevent others from eating it?" },
        { characterId: "narrator", text: "People often grudge others what they cannot enjoy themselves.", style: "italic" }
      ]
    }
  ]
};

// project-sync-marker
