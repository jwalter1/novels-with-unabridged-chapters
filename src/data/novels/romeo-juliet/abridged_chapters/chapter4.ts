import { Chapter } from '../../../../types';

export const chapter4: Chapter = {
  id: 4,
  title: "Act IV",
  scenes: [
    {
      id: "act4-scene1",
      title: "The Desperate Plan",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Ffriar_cell.png",
      backgroundDescription: "The Friar's cell.",
      dialogue: [
        { text: "Paris is with Friar Lawrence, discussing the wedding. Juliet arrives.", style: "italic" },
        { characterId: "paris", text: "Hello, my lady and my wife!" },
        { characterId: "juliet", text: "That may be, sir, after I'm married." },
        { text: "Paris leaves. Juliet breaks down.", style: "italic" },
        { characterId: "juliet", text: "If you can't help me, I'll use this knife to end my life right now. I'd rather jump from a tower or walk with thieves than marry Paris." },
        { characterId: "friar_lawrence", text: "I have a risky plan. If you're brave enough to jump from a tower, you're brave enough to act like you're dead." },
        { characterId: "friar_lawrence", text: "Go home and agree to the marriage. Tomorrow night, drink this potion. It will make you look dead for 42 hours. Your family will put you in the tomb, and I'll tell Romeo to come and get you." },
        { characterId: "juliet", text: "Give it to me! Love will give me the strength I need." }
      ]
    },
    {
      id: "act4-scene2",
      title: "The Apology",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_house_interior.png",
      backgroundDescription: "A hall in the Capulet house where servants are busy preparing for a feast.",
      dialogue: [
        { characterId: "capulet", text: "Go and hire twenty skilled cooks! And where is my stubborn daughter? Has she come back from her confession yet?" },
        { characterId: "nurse", text: "Yes, she's over there. She looks much happier now." },
        { text: "Juliet approaches her father and kneels.", style: "italic" },
        { characterId: "juliet", text: "Father, I've been wrong and stubborn. I'm sorry. Friar Lawrence told me to ask for your forgiveness, and I will do whatever you say." },
        { characterId: "capulet", text: "This is great news! I'll move the wedding up to tomorrow morning! The whole city owes a lot to this Friar." },
        { characterId: "lady_capulet", text: "But we're not ready! Thursday would be better." },
        { characterId: "capulet", text: "Don't worry, I'll stay up all night to make sure everything is ready. Go, help Juliet get her things in order." }
      ]
    },
    {
      id: "act4-scene3",
      title: "The Potion",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fjuliet_chamber.png",
      backgroundDescription: "Juliet's bedroom at night.",
      dialogue: [
        { text: "Juliet has sent the Nurse away and is alone.", style: "italic" },
        { characterId: "juliet", text: "God knows when we'll meet again. A cold fear is chilling my veins; I almost want to call the Nurse back. But I must do this alone." },
        { characterId: "juliet", text: "What if this potion doesn't work? Will I have to marry Paris in the morning? [She looks at her knife] No, this will stop that." },
        { characterId: "juliet", text: "What if the Friar gave me actual poison? No, that can't be. But what if I wake up in the tomb before Romeo comes? I'll be surrounded by ghosts and dead bodies. I might go mad!" },
        { characterId: "juliet", text: "I see Tybalt's ghost! Stop, Tybalt! Romeo, Romeo, I drink this for you!", style: "italic" },
        { text: "She drinks and falls unconscious.", style: "italic" }
      ]
    },
    {
      id: "act4-scene4",
      title: "Busy Preparations",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_house_interior.png",
      backgroundDescription: "The Capulet hall, very early in the morning.",
      dialogue: [
        { text: "It's three o'clock in the morning, and the household is frantic.", style: "italic" },
        { characterId: "lady_capulet", text: "Take these keys and get more spices, Nurse!" },
        { characterId: "nurse", text: "They're asking for dates and quinces in the kitchen!" },
        { characterId: "capulet", text: "Hurry up! The sun is already coming up. Count Paris is arriving with music. Nurse, go and wake up Juliet and get her dressed. I'll go and chat with Paris." }
      ]
    },
    {
      id: "act4-scene5",
      title: "Morning of Sorrows",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fjuliet_chamber.png",
      backgroundDescription: "Juliet's room, she is still on the bed.",
      dialogue: [
        { text: "The Nurse comes in to wake Juliet.", style: "italic" },
        { characterId: "nurse", text: "Juliet! Mistress! Wake up, you sleepyhead! You're going to marry Paris today, you shouldn't be sleeping so late." },
        { characterId: "nurse", text: "How can you sleep in all your clothes? My lady! Juliet! [She touches her] Help! Help! She's dead! My child is dead!" },
        { text: "Lady Capulet and Lord Capulet rush in.", style: "italic" },
        { characterId: "lady_capulet", text: "Oh no! My only child, my only life! Wake up, or I'll die with you!" },
        { characterId: "capulet", text: "She's cold. She's been dead for hours. Death is my son-in-law now; death is my heir. Everything that was meant for a wedding will now be used for a funeral." },
        { text: "Friar Lawrence arrives with Paris and musicians.", style: "italic" },
        { characterId: "friar_lawrence", text: "She is in a better place now. Don't drown her in your tears, for she is now in heaven. Take her to the tomb." }
      ]
    }
  ]
};

// project-sync-marker
