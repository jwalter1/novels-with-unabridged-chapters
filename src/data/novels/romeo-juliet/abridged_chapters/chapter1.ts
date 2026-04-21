import { Chapter } from '../../../../types';

export const chapter1: Chapter = {
  id: 1,
  title: "Act I",
  scenes: [
    {
      id: "prologue",
      title: "The Prologue",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_square.png",
      backgroundDescription: "A view of the city of Verona.",
      dialogue: [
        { text: "Two families, both rich and respected, in the beautiful city of Verona, have an old grudge that has turned into new violence." },
        { text: "The citizens are getting caught in their dirty war." },
        { text: "From these two enemy families, two children fall in love." },
        { text: "Their tragic deaths finally end the fighting between their parents." },
        { text: "For the next two hours, we will tell you their story." },
        { text: "If you listen closely, we'll fill in all the details." }
      ]
    },
    {
      id: "act1-scene1",
      title: "The Street Brawl",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street.png",
      backgroundDescription: "A bustling street in Verona.",
      dialogue: [
        { text: "Sampson and Gregory, servants of the Capulets, are hanging around, looking for trouble.", style: "italic" },
        { characterId: "sampson", text: "Gregory, I swear we won't take any insults from them." },
        { characterId: "gregory", text: "Right, because then we'd be garbage men." },
        { characterId: "sampson", text: "I mean, if we get angry, we'll draw our swords." },
        { characterId: "gregory", text: "Maybe you should try drawing your head out of trouble instead." },
        { characterId: "sampson", text: "I'm quick to strike when I'm annoyed." },
        { characterId: "gregory", text: "But you're not easily annoyed enough to strike." },
        { characterId: "sampson", text: "Any dog from the house of Montague makes me want to fight." },
        { characterId: "gregory", text: "To be brave is to stand your ground, not run away." },
        { characterId: "sampson", text: "I'll stand my ground against any Montague man or woman." },
        { text: "Abraham and Balthasar, servants of the Montagues, enter.", style: "italic" },
        { characterId: "sampson", text: "Get your sword ready! Here come two Montagues." },
        { characterId: "gregory", text: "My weapon is ready. Let's start something, but let them begin so we can claim self-defense." },
        { characterId: "sampson", text: "I'll bite my thumb at them. That's a huge insult." },
        { characterId: "abraham", text: "Are you biting your thumb at us, sir?" },
        { characterId: "sampson", text: "I am biting my thumb, sir." },
        { characterId: "abraham", text: "I asked if you were biting it AT US." },
        { characterId: "sampson", text: "[To Gregory] Will the law be on our side if I say yes?", style: "italic" },
        { characterId: "gregory", text: "No." },
        { characterId: "sampson", text: "No, sir, I'm not biting my thumb AT YOU, but I am biting my thumb." }
      ]
    },
    {
      id: "act1-scene2",
      title: "Paris's Marriage Proposal",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street_dusk.png",
      backgroundDescription: "A street in Verona at dusk.",
      dialogue: [
        { text: "Lord Capulet is walking with Count Paris.", style: "italic" },
        { characterId: "capulet", text: "Montague and I are both under the same court order. It shouldn't be hard for two old men like us to keep the peace." },
        { characterId: "paris", text: "You're both highly respected. It's a shame you've been feuding for so long. But anyway, what do you say about my proposal to marry your daughter?" },
        { characterId: "capulet", text: "I'll tell you what I told you before: My daughter is still very young. She hasn't even seen her fourteenth birthday yet. Let's wait two more summers before we consider her ready for marriage." },
        { characterId: "paris", text: "Girls even younger than her are already happy mothers." },
        { characterId: "capulet", text: "And those who marry too young are often ruined. She's the only child I have left. But listen, Paris, try to win her heart. My permission is only half the battle. If she likes you, I'll give you my blessing." }
      ]
    },
    {
      id: "act1-scene3",
      title: "Juliet's Introduction",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_house_interior.png",
      backgroundDescription: "A luxurious room in the Capulet house.",
      dialogue: [
        { text: "Lady Capulet and the Nurse are looking for Juliet.", style: "italic" },
        { characterId: "lady_capulet", text: "Nurse, where is my daughter? Tell her to come here." },
        { characterId: "nurse", text: "I swear on my life, I told her to come! Where is that girl? Juliet!" },
        { text: "Juliet enters the room.", style: "italic" },
        { characterId: "juliet", text: "Here I am! Who's calling?" },
        { characterId: "nurse", text: "Your mother." },
        { characterId: "juliet", text: "I'm right here, Mother. What do you need?" },
        { characterId: "lady_capulet", text: "We need to talk. Nurse, leave us for a moment—actually, stay. You should hear this. You know my daughter is at a certain age..." },
        { characterId: "nurse", text: "I can tell you exactly how old she is down to the hour." },
        { characterId: "lady_capulet", text: "She's not even fourteen yet." }
      ]
    },
    {
      id: "act1-scene5",
      title: "The Capulet Ball",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_ball.png",
      backgroundDescription: "A grand hall filled with music and dancers.",
      dialogue: [
        { text: "The Capulet party is in full swing. Romeo, disguised in a mask, sees Juliet for the first time.", style: "italic" },
        { characterId: "romeo", text: "Who is that girl? She's so beautiful that she makes the torches look dim. She stands out like a diamond against a dark background." },
        { characterId: "romeo", text: "Did I ever love anyone before tonight? My eyes were lying to me, because I've never seen true beauty until now." },
        { text: "Tybalt, Juliet's cousin, hears Romeo's voice.", style: "italic" },
        { characterId: "tybalt", text: "That's a Montague voice! Why did that villain come here to mock our party? I'll kill him!" },
        { characterId: "capulet", text: "Calm down, Tybalt. Leave him alone. He's behaving like a gentleman, and people in Verona say he's a good, well-behaved young man." },
        { characterId: "tybalt", text: "I won't tolerate him here!" },
        { characterId: "capulet", text: "You will tolerate him! I'm the boss here, not you. Don't start a fight at my party!" },
        { text: "Romeo approaches Juliet and takes her hand.", style: "italic" },
        { characterId: "romeo", text: "If my hand is too rough for your gentle hand, let my lips make it better with a kiss." },
        { characterId: "juliet", text: "Good pilgrim, you're too hard on your hand. Devout worshippers use their hands to touch the hands of statues, and that's like a kiss." },
        { characterId: "romeo", text: "Don't worshippers and saints have lips too?" },
        { characterId: "juliet", text: "Yes, but they use them for prayer." },
        { characterId: "romeo", text: "Then let our lips do what our hands do. Kiss me, and my sins will be taken away." },
        { text: "They kiss.", style: "italic" },
        { characterId: "juliet", text: "Then my lips now have the sin you took from yours." },
        { characterId: "romeo", text: "Give me my sin back, then.", style: "italic" },
        { text: "They kiss again. The Nurse interrupts them.", style: "italic" },
        { characterId: "nurse", text: "Juliet, your mother wants to talk to you." },
        { characterId: "romeo", text: "[To the Nurse] Who is her mother?", style: "italic" },
        { characterId: "nurse", text: "Her mother is the lady of the house, a good and wise woman. Whoever marries her daughter will be very rich." },
        { characterId: "romeo", text: "[To himself] She's a Capulet? Oh, no! My life is now in the hands of my enemy.", style: "italic" },
        { text: "The party ends. Juliet asks the Nurse about Romeo.", style: "italic" },
        { characterId: "nurse", text: "His name is Romeo, and he's a Montague—the only son of your great enemy." },
        { characterId: "juliet", text: "My only love, born from my only hate! I saw him too early without knowing who he was, and I found out too late. It's a disaster that I love my enemy." }
      ]
    }
  ]
};
