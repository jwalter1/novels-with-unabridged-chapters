import { Chapter } from '../../../../types';

export const chapter2: Chapter = {
  id: 2,
  title: "Act II",
  scenes: [
    {
      id: "act2-prologue",
      title: "Chorus",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_square.png",
      backgroundDescription: "A view of the city of Verona.",
      dialogue: [
        { text: "The old passion is dead, and a new affection has taken its place." },
        { text: "Romeo now loves Juliet, and she loves him back. They are both caught in a beautiful but dangerous trap because of their families' feud." },
        { text: "But their love gives them the power and time to meet, making their extreme difficulties seem like sweet pleasures." }
      ]
    },
    {
      id: "act2-scene1",
      title: "Outside the Garden",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street_dusk.png",
      backgroundDescription: "A dark street outside the high stone walls of the Capulet garden.",
      dialogue: [
        { text: "Romeo has slipped away from his friends after the party.", style: "italic" },
        { characterId: "romeo", text: "How can I go away when my heart is still here? I have to go back and find the center of my world." },
        { text: "Romeo climbs over the wall. Benvolio and Mercutio enter, looking for him.", style: "italic" },
        { characterId: "benvolio", text: "Romeo! My cousin Romeo!" },
        { characterId: "mercutio", text: "He's definitely gone to bed. I'll try to summon him using his old love's name. Romeo! Rosaline! Speak to us!" },
        { characterId: "benvolio", text: "Stop it, you'll make him angry if he hears you." },
        { characterId: "mercutio", text: "This won't make him angry. He's probably hidden himself among these trees to be one with the night." },
        { characterId: "benvolio", text: "Blind love cannot hit the mark. Let's go; it's useless to look for someone who doesn't want to be found." }
      ]
    },
    {
      id: "act2-scene2",
      title: "The Balcony Scene",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_garden.png",
      backgroundDescription: "Capulet's garden by moonlight. Juliet's balcony is visible above.",
      dialogue: [
        { characterId: "romeo", text: "He laughs at scars who never felt a wound." },
        { text: "Juliet appears at the window.", style: "italic" },
        { characterId: "romeo", text: "But wait! What light is breaking through that window? It is the east, and Juliet is the sun!" },
        { characterId: "juliet", text: "Oh, Romeo, Romeo! Why do you have to be Romeo?" },
        { characterId: "juliet", text: "Deny your father and refuse your name. Or, if you won't, just swear you love me, and I'll stop being a Capulet." },
        { characterId: "romeo", text: "[To himself] Should I listen more, or should I speak now?", style: "italic" },
        { characterId: "juliet", text: "It's only your name that is my enemy. What's in a name? A rose would smell just as sweet if it were called something else." },
        { characterId: "romeo", text: "I take you at your word! Call me your love, and I'll have a new name. From now on, I'm not Romeo." },
        { characterId: "juliet", text: "Who's there, hiding in the dark and listening to my private thoughts?" },
        { characterId: "romeo", text: "My name is hateful to myself, because it is an enemy to you." },
        { characterId: "juliet", text: "If you love me, swear it. But don't swear by the moon—the moon is always changing, and I don't want your love to be that inconsistent." },
        { characterId: "romeo", text: "What should I swear by?" },
        { characterId: "juliet", text: "Don't swear at all. Or, swear by your gracious self, and I'll believe you." },
        { characterId: "juliet", text: "If your love is honorable and you want to marry me, send me word tomorrow. I'll send a messenger to you." },
        { characterId: "romeo", text: "So thrives my soul—" }
      ]
    },
    {
      id: "act2-scene3",
      title: "Friar Lawrence's Cell",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Ffriar_cell.png",
      backgroundDescription: "A quiet monastery room filled with plants and herbs.",
      dialogue: [
        { text: "Romeo visits Friar Lawrence early in the morning.", style: "italic" },
        { characterId: "friar_lawrence", text: "Good morning! Why are you up so early? It's usually only old men or troubled people who can't sleep." },
        { characterId: "romeo", text: "I haven't been in bed. I've been having a much better time than sleeping." },
        { characterId: "friar_lawrence", text: "Were you with Rosaline?" },
        { characterId: "romeo", text: "Rosaline? I've forgotten that name. I've been with my enemy's daughter. We love each other, and we want you to marry us today." },
        { characterId: "friar_lawrence", text: "Holy Saint Francis! What a change! Is Rosaline forgotten so quickly? Young men's love seems to be in their eyes, not their hearts." },
        { characterId: "romeo", text: "She loves me back; Rosaline didn't." },
        { characterId: "friar_lawrence", text: "Come on, I'll help you. This marriage might be the thing that turns your families' hatred into pure love." }
      ]
    },
    {
      id: "act2-scene4",
      title: "The Messenger",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street.png",
      backgroundDescription: "A street in Verona during the day.",
      dialogue: [
        { characterId: "mercutio", text: "Where on earth is Romeo? Did he come home last night?" },
        { characterId: "benvolio", text: "Not to his father's house. I spoke to his servant." },
        { characterId: "mercutio", text: "That pale, cold-hearted girl Rosaline is driving him crazy. And now Tybalt has sent a letter to his father's house challenging him to a duel." },
        { text: "Romeo enters, looking happy.", style: "italic" },
        { characterId: "mercutio", text: "Here comes Romeo! Look at him, he's back to his old self." },
        { text: "The Nurse and her servant Peter enter.", style: "italic" },
        { characterId: "nurse", text: "I'm looking for a young gentleman named Romeo." },
        { characterId: "romeo", text: "I am Romeo." },
        { characterId: "nurse", text: "I need to speak with you in private.", style: "italic" },
        { text: "The others leave.", style: "italic" },
        { characterId: "nurse", text: "My young lady sent me. If you are leading her into a fool's paradise, it would be a very wicked thing to do." },
        { characterId: "romeo", text: "Tell her to find a way to come to Friar Lawrence's cell this afternoon. We will be married there." },
        { characterId: "nurse", text: "This afternoon, sir? She'll be there." }
      ]
    },
    {
      id: "act2-scene5",
      title: "Juliet's Wait",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_garden.png",
      backgroundDescription: "Capulet's garden.",
      dialogue: [
        { characterId: "juliet", text: "The clock struck nine when I sent the Nurse, and she promised to be back in half an hour. It's now twelve!" },
        { characterId: "juliet", text: "If she had the pulse and passion of youth, she'd move as fast as a ball. But old people often move like they're dead—slow, heavy, and pale as lead." },
        { text: "The Nurse enters, looking exhausted.", style: "italic" },
        { characterId: "juliet", text: "Oh honey Nurse, what news? Did you see him?" },
        { characterId: "nurse", text: "I'm so tired... my bones ache... what a journey I've had!" },
        { characterId: "juliet", text: "I'd give you my bones if you'd just give me the news! Please, speak!" },
        { characterId: "nurse", text: "Do you have permission to go to confession today?" },
        { characterId: "juliet", text: "Yes!" },
        { characterId: "nurse", text: "Then hurry to Friar Lawrence's cell. There is a husband waiting to make you a wife." }
      ]
    },
    {
      id: "act2-scene6",
      title: "The Secret Wedding",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Ffriar_cell.png",
      backgroundDescription: "The Friar's cell, a small stone room.",
      dialogue: [
        { characterId: "friar_lawrence", text: "May the heavens bless this holy act, so we don't regret it later." },
        { characterId: "romeo", text: "Amen. No matter what happens, it can't outweigh the joy I feel looking at her." },
        { characterId: "friar_lawrence", text: "These sudden, intense passions often have violent ends. Love moderately; that's the key to a long-lasting relationship." },
        { text: "Juliet enters.", style: "italic" },
        { characterId: "juliet", text: "Good evening to my holy confessor." },
        { characterId: "romeo", text: "Juliet, if you're as happy as I am, tell me about it." },
        { characterId: "juliet", text: "My love is so great that I can't even put it into words. Those who can count their wealth are poor; my love has grown so much I cannot sum up even half of it." },
        { characterId: "friar_lawrence", text: "Come with me, and we'll make this quick. I won't leave you alone until the church makes you husband and wife." }
      ]
    }
  ]
};

// project-sync-marker
