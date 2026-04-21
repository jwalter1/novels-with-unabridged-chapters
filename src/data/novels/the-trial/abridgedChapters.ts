import { Chapter } from '../../../types';

export const abridgedChapters: Chapter[] = [
  {
    id: 1,
    title: "Arrest",
    scenes: [
      {
        id: "ch1-s1",
        title: "Sudden Arrest",
        background: "arrest_room",
        dialogue: [
          { text: "Someone must have slandered Josef K., for one morning, without having done anything truly wrong, he was arrested." },
          { text: "His landlady's cook, who always brought him his breakfast at eight, failed to appear on this occasion." },
          { characterId: "josef_k", text: "That never happened before." },
          { text: "K. waited a little longer, watching from his pillow the old woman living opposite, who was watching him with an inquisitiveness quite unusual for her." },
          { text: "Then, both hungry and disconcerted, he rang the bell." },
          { text: "Instantly there was a knock at the door and a man he had never seen before in the house came in." },
          { characterId: "willem", text: "You rang?" },
          { characterId: "josef_k", text: "Who are you? And where is Anna with my breakfast?" },
          { characterId: "willem", text: "Anna? She is not coming." },
          { characterId: "josef_k", text: "And why is that? Who gave you permission to enter my room?" },
          { characterId: "willem", text: "I am here to inform you that you are under arrest." },
          { characterId: "josef_k", text: "Under arrest? For what? What have I done?" },
          { characterId: "willem", text: "We are not authorized to tell you that. Go to your room and wait." }
        ]
      },
      {
        id: "ch1-s2",
        title: "The Second Guard",
        background: "arrest_room",
        dialogue: [
          { text: "K. wanted at least to see who was in the next room and how Mrs. Grubach was justifying this interference." },
          { text: "He opened the door and found a second man, Franz, sitting at the table eating a piece of bread and butter." },
          { characterId: "franz", text: "Stay where you are! You're not allowed to leave this room until we say so." },
          { characterId: "josef_k", text: "But this is my apartment. I am a respected man, a First Procurator at the Bank!" },
          { characterId: "franz", text: "Your position at the bank is of no consequence to the Law." },
          { characterId: "willem", text: "Franz is right. You are under arrest, that is all. It is a decision that has been made by a higher authority." },
          { characterId: "josef_k", text: "What authority? Show me your credentials." },
          { characterId: "willem", text: "We don't carry credentials. We are merely the messengers." }
        ]
      },
      {
        id: "ch1-s3",
        title: "The Inspector",
        background: "default",
        dialogue: [
          { text: "K. was eventually summoned to see the Inspector, who had set up an office in Miss Bürstner's room." },
          { characterId: "inspector", text: "You are Josef K.?" },
          { characterId: "josef_k", text: "I am. And I expect an explanation for this outrage." },
          { characterId: "inspector", text: "I cannot give you an explanation, as the proceedings have only just begun. But you are to be set free for the time being." },
          { characterId: "josef_k", text: "Free? If I am under arrest, how can I be free?" },
          { characterId: "inspector", text: "The arrest is of a special nature. You are to go about your business as usual. You are to go to the bank today." },
          { characterId: "josef_k", text: "Go to the bank? In this state?" },
          { characterId: "inspector", text: "Yes. The Law does not interfere with your professional duties. Not yet." }
        ]
      },
      {
        id: "ch1-s4",
        title: "Conversation with Mrs. Grubach",
        background: "default",
        dialogue: [
          { text: "After the guards and the Inspector left, K. sought out his landlady, Mrs. Grubach." },
          { characterId: "mrs_grubach", text: "Oh, Mr. K., I am so sorry about what happened this morning. I had no idea..." },
          { characterId: "josef_k", text: "Do you know who those men were, Mrs. Grubach?" },
          { characterId: "mrs_grubach", text: "They seemed like polite enough young men, in their own way. But they were very firm." },
          { characterId: "josef_k", text: "They were invaders! They ate my breakfast!" },
          { characterId: "mrs_grubach", text: "It's a terrible thing, to be arrested. But perhaps it's just a mistake? A clerical error?" },
          { characterId: "josef_k", text: "A mistake that involves the entire police force? I doubt it." }
        ]
      },
      {
        id: "ch1-s5",
        title: "Waiting for Miss Bürstner",
        background: "default",
        dialogue: [
          { text: "K. felt he needed to apologize to Miss Bürstner for the intrusion into her room." },
          { text: "He waited up late for her return." },
          { characterId: "miss_burstner", text: "Mr. K.? What are you doing up so late?" },
          { characterId: "josef_k", text: "I wanted to apologize. My arrest... they used your room for the interrogation." },
          { characterId: "miss_burstner", text: "Your arrest? What a strange thing to say. Are you joking?" },
          { characterId: "josef_k", text: "I wish I were. It was quite a scene. One of them even ate my breakfast." },
          { characterId: "miss_burstner", text: "Well, no harm done to me. But you look tired, Mr. K. You should rest." }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "First Cross-Examination",
    scenes: [
      {
        id: "ch2-s1",
        title: "Finding the Court",
        background: "alleyway",
        dialogue: [
          { text: "K. had been told to present himself for a cross-examination. He was given an address but no room number." },
          { text: "He found himself in a poor neighborhood, wandering through high tenement buildings." },
          { characterId: "josef_k", text: "How can a court of law be located here, among these laundries and workshops?" },
          { text: "He went from door to door, pretending to look for a joiner named Lanz to avoid suspicion." },
          { characterId: "josef_k", text: "Does a joiner named Lanz live here?" },
          { text: "He was directed higher and higher, until he reached the very top floor of one building." }
        ]
      },
      {
        id: "ch2-s2",
        title: "The Courtroom",
        background: "courtroom",
        dialogue: [
          { text: "K. stepped into a large, crowded room. It was packed with men in black coats, all peering at him." },
          { text: "At the far end, on a small platform, sat the Examining Magistrate." },
          { characterId: "examining_magistrate", text: "You should have been here an hour and five minutes ago." },
          { characterId: "josef_k", text: "Whether I am late or not, I am here now." },
          { text: "A murmur of disapproval went through the crowd." },
          { characterId: "examining_magistrate", text: "You are a house painter?" },
          { characterId: "josef_k", text: "No. I am a First Procurator at a large bank." },
          { text: "This time, the laughter from one side of the room was balanced by silence from the other." }
        ]
      },
      {
        id: "ch2-s3",
        title: "K.'s Defence",
        background: "courtroom",
        dialogue: [
          { characterId: "josef_k", text: "What is happening here is not a trial! It is a mockery of justice!" },
          { characterId: "josef_k", text: "I was arrested without cause, interrogated in my nightshirt, and now I am brought to this attic!" },
          { text: "The Magistrate looked at his notebook, indifferent to K.'s outburst." },
          { characterId: "examining_magistrate", text: "You are merely making things worse for yourself." },
          { characterId: "josef_k", text: "Worse? How could it be worse than this bureaucratic nightmare?" },
          { text: "Suddenly, a scream rang out from the back of the room. A man and a woman were struggling in the corner." },
          { text: "The Magistrate ignored the disturbance, but the crowd's attention was diverted." }
        ]
      },
      {
        id: "ch2-s4",
        title: "Leaving the Court",
        background: "alleyway",
        dialogue: [
          { text: "Disgusted by the proceedings, K. pushed his way out of the room." },
          { characterId: "examining_magistrate", text: "I must inform you that you have today deprived yourself of the benefit of an interrogation." },
          { characterId: "josef_k", text: "You can keep your interrogations! I will not return to this place!" },
          { text: "He hurried down the stairs, feeling the heavy atmosphere of the building clinging to him." },
          { characterId: "josef_k", text: "What kind of court is this, that operates in secret in the attics of the poor?" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "In the Empty Interrogation Chamber",
    scenes: [
      {
        id: "ch3-s1",
        title: "The Courtroom Revisited",
        background: "courtroom",
        dialogue: [
          { text: "The following Sunday, K. returned to the building, though he had received no formal summons." },
          { text: "He found the courtroom empty, but the washerwoman he had seen before was there." },
          { characterId: "washerwoman", text: "Are you looking for the session? There is no session today." },
          { characterId: "josef_k", text: "I see. And these books? Are these the law books?" },
          { text: "K. looked at the books on the platform. They were not law books, but cheap, dirty novels." },
          { characterId: "josef_k", text: "This is the filth they study here?" }
        ]
      },
      {
        id: "ch3-s2",
        title: "The Student",
        background: "courtroom",
        dialogue: [
          { text: "A young man, Berthold, appeared. He was a law student and clearly had an arrangement with the court." },
          { characterId: "student", text: "You must be the man who made such a scene last week. The Magistrate was not pleased." },
          { characterId: "josef_k", text: "And why should I care if he was pleased? The whole system is corrupt." },
          { characterId: "student", text: "You don't understand the power of the Court. It is vast and ancient." },
          { text: "The student picked up the washerwoman and began to carry her away, as if by right." },
          { characterId: "josef_k", text: "Put her down! This is indecent!" },
          { characterId: "washerwoman", text: "It's alright, Mr. K. It's just the way things are here." }
        ]
      },
      {
        id: "ch3-s3",
        title: "The Court Offices",
        background: "bureaucratic_office",
        dialogue: [
          { text: "K. followed them into a labyrinth of corridors that served as the court offices." },
          { text: "The air was thick and stifling. Many other defendants were waiting on benches, their faces pale and exhausted." },
          { characterId: "josef_k", text: "Why is everyone so quiet? Why do they look so defeated?" },
          { text: "He spoke to one of them, who barely looked up." },
          { characterId: "josef_k", text: "How long have you been waiting here?" },
          { text: "The man just shook his head. 'Years. Decades. Who can tell?'" },
          { text: "K. felt a wave of dizziness. The narrow halls seemed to be closing in on him." }
        ]
      },
      {
        id: "ch3-s4",
        title: "Escape to the Fresh Air",
        background: "alleyway",
        dialogue: [
          { text: "K. had to be helped out of the building by a court official. He felt humiliated by his own weakness." },
          { text: "As soon as he reached the street, the dizziness vanished." },
          { characterId: "josef_k", text: "I must be careful. This place... it saps your strength before you even know it's happening." },
          { text: "He looked back at the ordinary-looking tenement building, hiding its dark secret in the attic." }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Miss Bürstner's Friend",
    scenes: [
      {
        id: "ch4-s1",
        title: "The Locked Door",
        background: "default",
        dialogue: [
          { text: "K. tried several times to speak with Miss Bürstner again, but she seemed to be avoiding him." },
          { text: "Her door remained closed, and he felt a growing sense of frustration." },
          { characterId: "josef_k", text: "Is she afraid of me? Or is she involved with the Court too?" }
        ]
      },
      {
        id: "ch4-s2",
        title: "Miss Montag",
        background: "default",
        dialogue: [
          { text: "One day, he was met by another woman, Miss Montag, who claimed to speak for Miss Bürstner." },
          { characterId: "miss_montag", text: "I am staying with Miss Bürstner for a while. She is quite overwhelmed." },
          { characterId: "josef_k", text: "I only wish to speak with her for a moment. To explain certain things." },
          { characterId: "miss_montag", text: "She knows everything she needs to know. It would be better if you left her alone." },
          { characterId: "josef_k", text: "And who are you to decide that? You are a stranger in this house." },
          { characterId: "miss_montag", text: "I am her friend. And I can see that your presence is a burden to her." }
        ]
      },
      {
        id: "ch4-s3",
        title: "A Sense of Isolation",
        background: "default",
        dialogue: [
          { text: "K. realized that his social world was beginning to crumble under the weight of the trial." },
          { text: "Even Mrs. Grubach seemed more distant, more formal." },
          { characterId: "josef_k", text: "The arrest... it's like a stain. People see it on me, even if they don't know what it is." }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "The Whipper",
    scenes: [
      {
        id: "ch5-s1",
        title: "The Junk Room",
        background: "bureaucratic_office",
        dialogue: [
          { text: "Walking through a corridor at the bank, K. heard a low moaning coming from a junk room." },
          { text: "He opened the door and was horrified by what he saw." },
          { text: "Franz and Willem, the two guards who had arrested him, were there, stripped to the waist." },
          { text: "Standing over them was a man in dark leather—the Whipper." },
          { characterId: "josef_k", text: "What is this? What have they done?" },
          { characterId: "whipper", text: "They are being punished. They complained about the food they ate at your apartment." },
          { characterId: "josef_k", text: "Punished? Because of me? But I don't want them punished!" }
        ]
      },
      {
        id: "ch5-s2",
        title: "K.'s Intervention",
        background: "bureaucratic_office",
        dialogue: [
          { characterId: "willem", text: "Help us, Mr. K.! You are an influential man! Tell them it's not our fault!" },
          { characterId: "franz", text: "We were only following orders! The system is to blame, not us!" },
          { characterId: "josef_k", text: "Listen to me! I will pay you! I will give you anything you want, just let them go!" },
          { characterId: "whipper", text: "The Law does not accept bribes. The punishment must be carried out." },
          { text: "The Whipper raised his lash and the screaming began again." },
          { characterId: "josef_k", text: "I can't watch this! I can't be part of this!" },
          { text: "He slammed the door shut, but the sounds of the whip continued to haunt him." }
        ]
      },
      {
        id: "ch5-s3",
        title: "The Next Day",
        background: "bureaucratic_office",
        dialogue: [
          { text: "The next morning, K. passed the same door. Driven by a morbid curiosity, he opened it again." },
          { text: "To his horror, the scene was exactly as he had left it. The Whipper, the guards, the screams." },
          { characterId: "josef_k", text: "It's still happening? Is it a loop? Or is time standing still in that room?" },
          { text: "He ordered a clerk to clean out the junk room, but he knew the shadows would remain." }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "K.'s Uncle — Leni",
    scenes: [
      {
        id: "ch6-s1",
        title: "Uncle Karl Arrives",
        background: "default",
        dialogue: [
          { text: "K.'s Uncle Karl, a country landowner, arrived at the bank in a state of high agitation." },
          { characterId: "uncle_karl", text: "Josef! What is this I hear? A trial? An arrest? Do you want to ruin the family name?" },
          { characterId: "josef_k", text: "It's nothing, Uncle. A misunderstanding. A minor legal matter." },
          { characterId: "uncle_karl", text: "Nothing? Minor? You are talking about the Court! Even in the country, we have heard of its reach." },
          { characterId: "uncle_karl", text: "We must act at once. I know a man—Lawyer Huld. He is an old friend of the Magistrate." }
        ]
      },
      {
        id: "ch6-s2",
        title: "Lawyer Huld",
        background: "default",
        dialogue: [
          { text: "They went to a dark, gloomy house where Huld lived." },
          { text: "The lawyer was bedridden, surrounded by a mountain of dossiers." },
          { characterId: "lawyer_huld", text: "Ah, Karl. And this must be the famous Josef K. Yes, I have already heard of your case." },
          { characterId: "josef_k", text: "Everyone seems to have heard of it except me." },
          { characterId: "lawyer_huld", text: "That is the nature of the Law. It is silent until it strikes. But I can help you. I have connections." },
          { text: "As the lawyer and Karl spoke, a young woman, Leni, entered the room." }
        ]
      },
      {
        id: "ch6-s3",
        title: "Leni",
        background: "default",
        dialogue: [
          { text: "Leni beckoned K. into the next room while the men were talking." },
          { characterId: "leni", text: "You must be very brave, to face the Court like this." },
          { characterId: "josef_k", text: "I don't feel brave. I feel confused." },
          { characterId: "leni", text: "Confused is good. The Court likes it when you are confused. It makes you... vulnerable." },
          { text: "She took his hand and looked at him with an intensity that both attracted and repelled him." },
          { characterId: "leni", text: "I like you, Josef. I like all the defendants. There is something about them—a certain light in their eyes." },
          { characterId: "josef_k", text: "The light of desperation, I suppose." }
        ]
      },
      {
        id: "ch6-s4",
        title: "The Uncle's Wrath",
        background: "default",
        dialogue: [
          { text: "Hours later, when K. emerged from the room with Leni, his uncle was waiting at the street door." },
          { characterId: "uncle_karl", text: "You fool! You stayed in there with that girl while I was pleading your case!" },
          { characterId: "uncle_karl", text: "You have insulted the lawyer! You are throwing away your life for a moment of distraction!" },
          { characterId: "josef_k", text: "Uncle, I was only..." },
          { characterId: "uncle_karl", text: "Silence! You are a disgrace! Don't come to me when the gallows are ready!" }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Lawyer — Manufacturer — Painter",
    scenes: [
      {
        id: "ch7-s1",
        title: "Despair at the Bank",
        background: "bureaucratic_office",
        dialogue: [
          { text: "K. found it increasingly difficult to concentrate on his work at the bank." },
          { text: "His rivals were watching him, sensing his weakness." },
          { characterId: "josef_k", text: "I must take control of my own case. Huld is doing nothing. He just talks in circles." },
          { text: "A manufacturer, a client of the bank, approached him with a surprising tip." },
          { characterId: "manufacturer", text: "I hear you have a case before the Court. You should see Titorelli, the painter." },
          { characterId: "josef_k", text: "A painter? What could he possibly know about the Law?" },
          { characterId: "manufacturer", text: "He paints the portraits of the judges. He knows their secrets. He knows how the system truly works." }
        ]
      },
      {
        id: "ch7-s2",
        title: "Titorelli's Studio",
        background: "default",
        dialogue: [
          { text: "K. found Titorelli in a tiny, stifling room in another dilapidated building." },
          { text: "The room was surrounded by identical-looking little girls who mocked K. as he entered." },
          { characterId: "titorelli", text: "Ah, another defendant. You want to know if I can get you an acquittal?" },
          { characterId: "josef_k", text: "Is that possible? A real acquittal?" },
          { characterId: "titorelli", text: "There are three kinds of acquittal. Definite acquittal, ostensible acquittal, and protraction." },
          { characterId: "josef_k", text: "Tell me about the first one." },
          { characterId: "titorelli", text: "Definite acquittal? I've never seen one. It's a legend. Something that exists only in the history of the Law." }
        ]
      },
      {
        id: "ch7-s3",
        title: "Ostensible Acquittal and Protraction",
        background: "default",
        dialogue: [
          { characterId: "titorelli", text: "Ostensible acquittal means you are free for now, but the case can be reopened at any moment. You must always be ready to be rearrested." },
          { characterId: "josef_k", text: "And protraction?" },
          { characterId: "titorelli", text: "Protraction keeps the trial at its lowest level. You keep moving from office to office, avoiding the final judgment." },
          { characterId: "josef_k", text: "So there is no real escape? Just a lifelong delay?" },
          { characterId: "titorelli", text: "Exactly. The Law never lets go. But it can be... managed." },
          { text: "K. left the studio feeling even more burdened than before, his arms full of identical landscape paintings Titorelli had forced him to buy." }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "The Merchant Block",
    scenes: [
      {
        id: "ch8-s1",
        title: "Another Defendant",
        background: "default",
        dialogue: [
          { text: "At the lawyer's house, K. met the businessman Block." },
          { text: "Block looked like a ghost of a man, thin and trembling." },
          { characterId: "josef_k", text: "How long have you been a client of Huld's?" },
          { characterId: "block", text: "Five years. I have five different lawyers. I have spent my entire fortune on the case." },
          { characterId: "josef_k", text: "And what is the result?" },
          { characterId: "block", text: "One must be patient. One must be humble. The Court values humility above all else." }
        ]
      },
      {
        id: "ch8-s2",
        title: "Block's Humiliation",
        background: "default",
        dialogue: [
          { text: "Leni led K. into the bedroom, where Huld was holding court from his bed." },
          { text: "To K.'s disgust, the lawyer made Block crawl on the floor like a dog to show his devotion." },
          { characterId: "lawyer_huld", text: "You see, Josef? This is what it takes. This is the path you must follow if you want any hope." },
          { characterId: "josef_k", text: "I will never crawl for you! I am here to dismiss you!" },
          { characterId: "lawyer_huld", text: "Dismiss me? You are throwing away your only shield against the shadow of the gallows!" },
          { characterId: "josef_k", text: "I would rather face the shadow alone than with a man who delights in the misery of others." }
        ]
      },
      {
        id: "ch8-s3",
        title: "Leaving the Lawyer",
        background: "alleyway",
        dialogue: [
          { text: "K. walked out into the cold night air. He had severed his ties with the legal world, but he felt no lighter." },
          { characterId: "josef_k", text: "I have my own strength. I will write my own defence. I will prove my innocence to the world." },
          { text: "But the silence of the city felt like the silence of the judges, waiting for his first mistake." }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "In the Cathedral",
    scenes: [
      {
        id: "ch9-s1",
        title: "The Meeting",
        background: "cathedral",
        dialogue: [
          { text: "K. was assigned to show an Italian client around the city's cathedral." },
          { text: "The Italian never showed up, and K. found himself alone in the dark, empty church as a storm began to brew outside." },
          { text: "Suddenly, he heard his name called from the pulpit." },
          { characterId: "chaplain", text: "Josef K.!" },
          { characterId: "josef_k", text: "Who is there?" },
          { characterId: "chaplain", text: "I am the prison chaplain. I have been sent here to speak with you." }
        ]
      },
      {
        id: "ch9-s2",
        title: "Before the Law",
        background: "cathedral",
        dialogue: [
          { characterId: "chaplain", text: "You are deluding yourself about the Court. You search for help from strangers, but the help must come from within." },
          { characterId: "chaplain", text: "Listen to the parable of the Law." },
          { text: "The chaplain told the story of a man from the country who sought entry to the Law, but was blocked by a gatekeeper." },
          { text: "The man waited his whole life for permission to enter, and only at the moment of his death did the gatekeeper tell him: 'This entrance was meant only for you. I am now going to go and shut it.'" },
          { characterId: "josef_k", text: "So the man was deceived? The gatekeeper was cruel?" },
          { characterId: "chaplain", text: "It is not necessary to accept everything as true, one must only accept it as necessary." },
          { characterId: "josef_k", text: "Then lie becomes the universal principle." }
        ]
      },
      {
        id: "ch9-s3",
        title: "The Final Warning",
        background: "cathedral",
        dialogue: [
          { characterId: "chaplain", text: "The Court wants nothing from you. It receives you when you come and it dismisses you when you go." },
          { characterId: "josef_k", text: "Wait! Don't leave me here in the dark!" },
          { text: "The chaplain descended from the pulpit and disappeared into the shadows." },
          { characterId: "josef_k", text: "Is there no one left to hear me? Is the door closed for me too?" }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "The End",
    scenes: [
      {
        id: "ch10-s1",
        title: "The Arrival",
        background: "default",
        dialogue: [
          { text: "On the eve of his thirty-first birthday, two men in frock coats arrived at K.'s room." },
          { text: "They were pale and fat, like actors or mediocre singers." },
          { characterId: "josef_k", text: "So you have come for me at last." },
          { text: "They led him out of the house. K. briefly saw Miss Bürstner, or someone who looked like her, vanishing around a corner." },
          { characterId: "josef_k", text: "It's better this way. I will not struggle." }
        ]
      },
      {
        id: "ch10-s2",
        title: "The Quarry",
        background: "alleyway",
        dialogue: [
          { text: "They led him to a small, deserted quarry outside the city." },
          { text: "They laid him on the ground and rested his head against a stone." },
          { text: "One of the men took out a long, thin, double-edged butcher's knife." },
          { text: "K. saw a light in a window in the distance. Was it a friend? Was there still hope? Someone who wanted to help?" },
          { characterId: "josef_k", text: "Where is the Judge whom I never saw? Where is the High Court, to which I never penetrated?" },
          { text: "One of the men held K.'s throat while the other thrust the knife into his heart and turned it twice." },
          { characterId: "josef_k", text: "Like a dog!" },
          { text: "It was as if the shame of it should outlive him." },
          { text: "THE END", style: "italic" }
        ]
      }
    ]
  }
];

// project-sync-marker
