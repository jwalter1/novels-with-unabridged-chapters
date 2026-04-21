import { Chapter } from '../../../../types';

export const chapter3: Chapter = {
  id: 3,
  title: "Act III",
  scenes: [
    {
      id: "act3-scene1",
      title: "The Fatal Fight",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_square.png",
      backgroundDescription: "A hot afternoon in a Verona square.",
      dialogue: [
        { characterId: "benvolio", text: "Mercutio, let's go inside. It's hot, and the Capulets are out. If we meet them, we'll definitely end up in a fight." },
        { characterId: "mercutio", text: "You're always complaining about people being argumentative, but you're just as bad!" },
        { text: "Tybalt enters with others.", style: "italic" },
        { characterId: "tybalt", text: "I'm looking for Romeo. Mercutio, you're friends with him, right?" },
        { characterId: "mercutio", text: "Friends? You make it sound like we're a band of performers. Here's my 'instrument' that will make you dance!", style: "italic" },
        { text: "Romeo enters.", style: "italic" },
        { characterId: "tybalt", text: "Romeo, the only name I have for you is this: you're a villain." },
        { characterId: "romeo", text: "Tybalt, I have a reason to love you that lets me ignore your insult. I'm not a villain, and I've never done anything to hurt you." },
        { characterId: "tybalt", text: "That doesn't make up for the insults you've given me. Draw your sword!" },
        { characterId: "romeo", text: "I swear, I've never insulted you. I value the name Capulet as much as my own. Please, put your sword away." },
        { characterId: "mercutio", text: "This is pathetic submission! Tybalt, you rat-catcher, will you fight me instead?" },
        { text: "Mercutio and Tybalt fight. Romeo tries to break it up. Tybalt stabs Mercutio under Romeo's arm and runs away.", style: "italic" },
        { characterId: "mercutio", text: "I'm hurt. A curse on both your families! Why did you get between us? I was hurt under your arm." },
        { characterId: "romeo", text: "I thought I was helping." },
        { characterId: "mercutio", text: "Ask for me tomorrow, and you'll find me a 'grave' man. Curse your families!", style: "italic" },
        { text: "Mercutio dies. Tybalt returns. Romeo, in a rage, fights and kills Tybalt.", style: "italic" },
        { characterId: "benvolio", text: "Romeo, run! The Prince is coming, and you'll be sentenced to death if you're caught!" },
        { characterId: "romeo", text: "Oh, I am fortune's fool!" }
      ]
    },
    {
      id: "act3-scene2",
      title: "Hard Truths",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fjuliet_chamber.png",
      backgroundDescription: "Juliet's room, filled with soft light as she waits for nightfall.",
      dialogue: [
        { characterId: "juliet", text: "Hurry up, night, so I can see Romeo! I'm so excited to be with my husband." },
        { text: "The Nurse enters, crying and wringing her hands.", style: "italic" },
        { characterId: "nurse", text: "He's dead! He's dead! We are ruined, lady!" },
        { characterId: "juliet", text: "Is Romeo dead? Did he kill himself?" },
        { characterId: "nurse", text: "No, Tybalt is dead! Romeo killed him, and now Romeo is banished from Verona." },
        { characterId: "juliet", text: "Oh God! Did Romeo's hand shed Tybalt's blood? How can such a beautiful face hide such a cruel heart?" },
        { characterId: "nurse", text: "There's no trust or honesty in men. Shame on Romeo!" },
        { characterId: "juliet", text: "Don't you dare speak ill of him! He is my husband. If he hadn't killed Tybalt, Tybalt would have killed him. But 'banished'... that word is worse than ten thousand Tybalts being killed." },
        { characterId: "nurse", text: "Go to your room. I know where Romeo is hiding. I'll bring him to you tonight to say goodbye." }
      ]
    },
    {
      id: "act3-scene3",
      title: "Romeo's Grief",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Ffriar_cell.png",
      backgroundDescription: "The Friar's cell.",
      dialogue: [
        { characterId: "friar_lawrence", text: "Romeo, come out. The Prince has announced your punishment." },
        { characterId: "romeo", text: "What is it? Death?" },
        { characterId: "friar_lawrence", text: "He's being merciful. It's not death, but banishment from Verona." },
        { characterId: "romeo", text: "Banishment is worse than death! To be away from Juliet is like being in hell." },
        { characterId: "friar_lawrence", text: "You're being ungrateful. The law threatened death, but the Prince turned it into exile. You should be happy!" },
        { text: "The Nurse arrives.", style: "italic" },
        { characterId: "nurse", text: "Juliet is just like you—crying and sobbing all the time." },
        { characterId: "romeo", text: "Tell me, Friar, where is the part of my body where my name lives? I want to cut it out!", style: "italic" },
        { characterId: "friar_lawrence", text: "Stop! Are you a man or a beast? You have Juliet, you are alive, and you are only banished. Go to her tonight, but leave before morning for Mantua. We'll find a way to bring you back once the families have made peace." }
      ]
    },
    {
      id: "act3-scene4",
      title: "A Sudden Match",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_house_interior.png",
      backgroundDescription: "A room in the Capulet house, late at night.",
      dialogue: [
        { characterId: "capulet", text: "Things have been so sad with Tybalt's death that we haven't had time to talk to Juliet about your proposal, Paris." },
        { characterId: "paris", text: "I understand. Sadness doesn't leave much room for romance." },
        { characterId: "capulet", text: "I'll tell you what. I'm sure my daughter will do whatever I say. We'll have the wedding on Thursday." },
        { characterId: "paris", text: "Thursday? I wish Thursday were tomorrow!" },
        { characterId: "capulet", text: "It's a deal then. A small ceremony, just family and friends, so people don't think we don't care about Tybalt. Go and tell Juliet the news." }
      ]
    },
    {
      id: "act3-scene5",
      title: "The Final Goodbye",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fjuliet_chamber.png",
      backgroundDescription: "Juliet's bedroom at dawn.",
      dialogue: [
        { text: "Romeo and Juliet have spent the night together. It's now morning.", style: "italic" },
        { characterId: "juliet", text: "Are you leaving already? It's not yet day. That was the nightingale, not the lark." },
        { characterId: "romeo", text: "It was the lark, the messenger of the morning. I must go and live, or stay and die." },
        { characterId: "juliet", text: "Go, then! It's getting lighter and lighter." },
        { characterId: "romeo", text: "Lighter for the world, but darker for our sorrows." },
        { text: "Romeo leaves. Lady Capulet enters.", style: "italic" },
        { characterId: "lady_capulet", text: "Juliet, stop crying about Tybalt. I have good news: your father has arranged for you to marry Count Paris this Thursday." },
        { characterId: "juliet", text: "I will not marry him! I'd rather marry Romeo, whom you know I 'hate', than Paris!" },
        { text: "Lord Capulet enters and explodes in anger.", style: "italic" },
        { characterId: "capulet", text: "What? You refuse? You ungrateful girl! You will be at that church on Thursday, even if I have to drag you there myself!" },
        { characterId: "capulet", text: "If you don't marry him, don't ever look me in the face again. I'll kick you out of the house and let you starve!" }
      ]
    }
  ]
};
