import { Chapter } from '../../../../types';

export const chapter5: Chapter = {
  id: 5,
  title: "Act V",
  scenes: [
    {
      id: "act5-scene1",
      title: "Fatal News",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fmantua_street.png",
      backgroundDescription: "A street in Mantua.",
      dialogue: [
        { characterId: "romeo", text: "I had a dream that I was dead, and Juliet found me and kissed me back to life. I hope it's a good sign." },
        { text: "Balthasar arrives from Verona.", style: "italic" },
        { characterId: "romeo", text: "What news from Verona? How is my Juliet? Is she okay? Tell me she's well and I'll be happy." },
        { characterId: "balthasar", text: "I am so sorry to tell you this, but her body is in the family tomb. She's dead." },
        { characterId: "romeo", text: "What? No! Then I defy the stars! I'm going back to Verona tonight." },
        { characterId: "romeo", text: "I need to find an apothecary. If I'm going to die beside her, I need a quick poison." }
      ]
    },
    {
      id: "act5-scene3",
      title: "The Tragedy in the Tomb",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_tomb.png",
      backgroundDescription: "A dark, ancient stone tomb.",
      dialogue: [
        { text: "Romeo enters the tomb and finds Juliet's body.", style: "italic" },
        { characterId: "romeo", text: "My love, my wife! Death has taken your breath, but it hasn't taken your beauty yet. Your cheeks are still pink." },
        { characterId: "romeo", text: "I will stay here with you forever. Eyes, look your last. Arms, take your last hug. And lips, seal this deal with a kiss." },
        { text: "Romeo drinks the poison.", style: "italic" },
        { characterId: "romeo", text: "Oh, that apothecary was right! The poison works quickly. With a kiss, I die." },
        { text: "Romeo dies. Juliet wakes up a moment later.", style: "italic" },
        { characterId: "juliet", text: "Where am I? This is where I'm supposed to be. But where is my Romeo?" },
        { characterId: "juliet", text: "What's this? A cup in his hand? He's poisoned himself! Oh, selfish man, you didn't leave any for me." },
        { characterId: "juliet", text: "Your lips are still warm. I'll hear someone coming—I must be quick." },
        { text: "Juliet takes Romeo's dagger.", style: "italic" },
        { characterId: "juliet", text: "This is a good place for you, dagger. Rust inside me and let me die." },
        { text: "She stabs herself and dies just as the families and the Prince arrive.", style: "italic" },
        { characterId: "prince", text: "See what your hatred has done? Heaven has found a way to kill your joys with love. We have all been punished." },
        { characterId: "capulet", text: "Montague, give me your hand. Our families' fighting ends today." },
        { characterId: "prince", text: "For there was never a story of more woe than this of Juliet and her Romeo." }
      ]
    }
  ]
};
