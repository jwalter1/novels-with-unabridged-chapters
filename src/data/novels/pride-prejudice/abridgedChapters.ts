import { Chapter } from '../../../types';

export const abridgedChapters: Chapter[] = [
  {
    id: 1,
    title: "Opening: Longbourn House",
    scenes: [
      {
        id: "pp-abr-1",
        title: "A Truth Universally Acknowledged",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png",
        dialogue: [
          { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife." },
          { text: "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters." },
          { characterId: "mrs-bennet", text: "My dear Mr. Bennet, have you heard that Netherfield Park is let at last?" },
          { characterId: "mr-bennet", text: "I have not." },
          { characterId: "mrs-bennet", text: "But it is. For Mrs. Long has just been here, and she told me all about it." },
          { characterId: "mr-bennet", text: "Do you not want to know who has taken it?" },
          { characterId: "mrs-bennet", text: "You want to tell me, and I have no objection to hearing it." },
          { characterId: "mrs-bennet", text: "A young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place!" },
          { characterId: "mrs-bennet", text: "What a fine thing for our girls! You must visit him immediately, Mr. Bennet." },
          { characterId: "mr-bennet", text: "I see no occasion for that. You and the girls may go, or you may send them by themselves, which perhaps will be still better..." },
          { characterId: "mr-bennet", text: "...for as you are as handsome as any of them, Mr. Bingley may like you the best of the party." },
          { characterId: "mrs-bennet", text: "My dear, you flatter me! I certainly have had my share of beauty, but I do not pretend to be anything extraordinary now." },
          { characterId: "mrs-bennet", text: "But consider your daughters! Only think what an establishment it would be for one of them! Sir William and Lady Lucas are determined to go, merely on that account." },
          { characterId: "mr-bennet", text: "I dare say Mary wishes to go as well; she is a girl of deep reflection and reads great books and makes extracts." },
          { characterId: "mary", text: "Indeed, Papa, I should like to... though I find the social requirements of such a visit to be somewhat taxing on the mind." },
          { characterId: "mrs-bennet", text: "Oh, Mary! You are always so solemn! Kitty! Lydia! Tell your father how much you want to meet him!" },
          { characterId: "lydia", text: "I don't care about his fortune, so long as he dances well! And if he brings officers with him, all the better!" },
          { characterId: "kitty", text: "Lydia, don't be so silly. But yes, Papa, we must go!" },
          { text: "Mr. Bennet was so odd a mixture of quick parts, sarcastic humour, reserve, and caprice, that the experience of three-and-twenty years had been insufficient to make his wife understand his character." }
        ]
      },
      {
        id: "pp-abr-1-2",
        title: "The Meryton Ball",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fballroom_scene.png",
        dialogue: [
          { text: "The evening of the ball at Meryton arrived. The room was crowded, the music lively, and the expectation of the new arrivals at an all-time high." },
          { characterId: "bingley", text: "I have never met with so many pleasant girls in my life as I have this evening!" },
          { characterId: "darcy", text: "You are dancing with the only handsome girl in the room." },
          { characterId: "bingley", text: "Oh! She is the most beautiful creature I ever beheld! But there is one of her sisters sitting down just behind you, who is very pretty, and I dare say very agreeable." },
          { characterId: "bingley", text: "Do let me ask my partner to introduce you." },
          { characterId: "darcy", text: "Which do you mean?" },
          { text: "Mr. Darcy turned round and looked for a moment at Elizabeth, till catching her eye, he withdrew his own and coldly said:" },
          { characterId: "darcy", text: "She is tolerable, but not handsome enough to tempt me; I am in no humour at present to give consequence to young ladies who are slighted by other men." },
          { text: "Elizabeth remained with no very cordial feelings towards him. She told the story, however, with great spirit among her friends; for she had a lively, playful disposition, which delighted in anything ridiculous." },
          { characterId: "elizabeth", text: "He is a most disagreeable man! I should be sorry indeed if I were to be liked by such a person." },
          { characterId: "jane", text: "He may be better than he appears, Lizzy. Mr. Bingley speaks highly of his character." },
          { characterId: "elizabeth", text: "That is just like you, Jane. Everyone is good in your eyes. But the man is proud, horridly proud!" }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Netherfield and Jane's Illness",
    scenes: [
      {
        id: "pp-abr-2-1",
        title: "The Rainy Journey",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png",
        dialogue: [
          { characterId: "mrs-bennet", text: "Jane! An invitation from Netherfield! You must go on horseback, for it looks like rain, and then you will have to stay the night!" },
          { characterId: "elizabeth", text: "Mother, that seems a very precarious plan." },
          { characterId: "mrs-bennet", text: "Nonsense! If she is delayed by the weather, all the better for her acquaintance with Mr. Bingley!" },
          { text: "The plan succeeded better than Mrs. Bennet could have hoped. Jane arrived at Netherfield soaked to the bone and woke the next morning with a violent cold." },
          { characterId: "jane", text: "My dear Lizzy, I find myself unable to leave my bed this morning. The Bingleys are most kind, but I miss Longbourn." },
          { characterId: "elizabeth", text: "Then I shall come to you. Since the carriage is not to be had, I shall walk." },
          { characterId: "mrs-bennet", text: "Walk! Three miles in this mud? You will not be fit to be seen when you get there!" },
          { characterId: "elizabeth", text: "I shall be very fit to see Jane—which is all I want." }
        ]
      },
      {
        id: "pp-abr-2-2",
        title: "Elizabeth at Netherfield",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_interior.png",
        dialogue: [
          { text: "Elizabeth’s arrival at Netherfield, with weary ankles, dirty stockings, and a face glowing with the warmth of exercise, was a subject of much discussion." },
          { characterId: "miss-bingley", text: "I hope, Miss Elizabeth, you have not been walking long?" },
          { characterId: "elizabeth", text: "Only from Longbourn, Miss Bingley. I was anxious for my sister." },
          { characterId: "darcy", text: "(Internal) Her eyes... they are so remarkably fine. And the exercise has given her such a brilliant complexion." },
          { characterId: "miss-bingley", text: "To walk three miles, alone, and in such dirt! It seems a most country-town indifference to decorum." },
          { characterId: "bingley", text: "It showed an affection for her sister that is very pleasing." },
          { text: "That evening, the conversation turned to the requirements of an 'accomplished woman'." },
          { characterId: "darcy", text: "I cannot boast of knowing more than half-a-dozen women, in the whole range of my acquaintance, that are really accomplished." },
          { characterId: "elizabeth", text: "I am no longer surprised at your knowing only six accomplished women. I rather wonder now at your knowing any." },
          { characterId: "darcy", text: "Are you so severe upon your own sex?" },
          { characterId: "elizabeth", text: "I never saw such capacity, and taste, and application, and elegance, as you describe, united." }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Mr. Collins and Mr. Wickham",
    scenes: [
      {
        id: "pp-abr-3-1",
        title: "The Heir of Longbourn",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_interior.png",
        dialogue: [
          { characterId: "collins", text: "I have been so fortunate as to be distinguished by the patronage of the Right Honourable Lady Catherine de Bourgh, whose bounty and beneficence has been remarkable." },
          { characterId: "mr-bennet", text: "You are very fortunate in your patroness, Mr. Collins. And I am sure she must be satisfied with the... enthusiastic... nature of your gratitude." },
          { characterId: "collins", text: "Indeed! She has her faults, but she is all affability and condescension. As for my visit here, I have come to make amends for being the heir to your estate." },
          { characterId: "collins", text: "I intend to marry one of your daughters, Mr. Bennet. Perhaps the eldest, Miss Jane?" },
          { characterId: "mrs-bennet", text: "Oh, Mr. Collins! Jane is... likely to be very soon engaged. But there is Elizabeth! She is next in age, and quite as handsome!" },
          { characterId: "collins", text: "Miss Elizabeth? Yes, she will do very well. Very well indeed." }
        ]
      },
      {
        id: "pp-abr-3-2",
        title: "Wickham's Tale",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fmeryton_village.png",
        dialogue: [
          { text: "A walk to Meryton introduced the girls to a new officer, Mr. Wickham, whose appearance and manners were far superior to any they had yet encountered." },
          { characterId: "wickham", text: "I have been connected with the Darcy family from my infancy. The late Mr. Darcy was one of the best men that ever breathed, and my truest friend." },
          { characterId: "wickham", text: "But his son... he has treated me in a manner that would be hard to believe. He withheld the living intended for me out of sheer jealousy." },
          { characterId: "elizabeth", text: "To treat you so! A man who grew up with him! Is he not held in contempt by the world?" },
          { characterId: "wickham", text: "The world is blinded by his wealth and his family name, Elizabeth." },
          { characterId: "elizabeth", text: "I had thought as much. His pride is intolerable. I shall never think well of him again." }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Proposals and Departures",
    scenes: [
      {
        id: "pp-abr-4-1",
        title: "The First Proposal",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_interior.png",
        dialogue: [
          { characterId: "collins", text: "Believe me, my dear Miss Elizabeth, that your modesty, so far from doing you any disservice, rather adds to your other perfections." },
          { characterId: "elizabeth", text: "Mr. Collins, I am very sensible of the honour of your proposals, but it is impossible for me to do otherwise than to decline them." },
          { characterId: "collins", text: "I am by no means discouraged! It is usual with young ladies to reject the addresses of the man they secretly mean to accept, when he first applies for their favour." },
          { characterId: "elizabeth", text: "Upon my word, Sir, I am not one of those young ladies! I would rather be single for the rest of my life than marry you!" },
          { characterId: "mrs-bennet", text: "Mr. Bennet! You must make Elizabeth marry him! She says she will not have him!" },
          { characterId: "mr-bennet", text: "An unhappy alternative is before you, Elizabeth. From this day you must be a stranger to one of your parents. Your mother will never see you again if you do not marry Mr. Collins, and I will never see you again if you do." }
        ]
      },
      {
        id: "pp-abr-4-2",
        title: "The Letter from London",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png",
        dialogue: [
          { text: "The winter brought cold news. The Bingleys had left Netherfield for London, with no intention of returning." },
          { characterId: "jane", text: "Mr. Bingley is gone, Lizzy. His sister writes that they are all in town, and that they expect him to marry Miss Darcy." },
          { characterId: "elizabeth", text: "It is a conspiracy, Jane! Miss Bingley sees his partiality for you and wants to stop it. She is a selfish, deceitful woman!" },
          { characterId: "jane", text: "No, Lizzy. I must have been mistaken in his feelings. It is better that I know it now." },
          { text: "To make matters worse, Charlotte Lucas—Elizabeth's closest friend—accepted the hand of Mr. Collins, merely to secure a home for herself." },
          { characterId: "charlotte", text: "I am not romantic, you know. I never was. I ask only a comfortable home; and considering Mr. Collins's character, connections, and situation in life, I am convinced that my chance of happiness with him is as fair as most people can boast." }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "The Visit to Hunsford",
    scenes: [
      {
        id: "pp-abr-5-1",
        title: "Lady Catherine's Table",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Frosings_park.png",
        dialogue: [
          { text: "Elizabeth travelled to Hunsford to visit the new Mrs. Collins. Soon, she found herself at Rosings Park, the seat of the formidable Lady Catherine de Bourgh." },
          { characterId: "lady-catherine", text: "And what is your age, Miss Bennet? You look remarkably young to be travelling alone. Have all your sisters been out at once?" },
          { characterId: "elizabeth", text: "Yes, Madam, all of them." },
          { characterId: "lady-catherine", text: "All five! At once! That is very strange! And do you play? Do you draw? Who was your governess?" },
          { characterId: "elizabeth", text: "We never had a governess, Madam." },
          { characterId: "lady-catherine", text: "No governess! How is that possible? Five girls brought up at home without a governess! I never heard of such a thing. Your mother must have been quite a slave to your education." },
          { characterId: "elizabeth", text: "Not at all, Madam. Such of us as wished to learn never wanted the means. We were always encouraged to read, and had all the masters that were necessary." }
        ]
      },
      {
        id: "pp-abr-5-2",
        title: "The Unexpected Encounter",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Frosings_park.png",
        dialogue: [
          { text: "Mr. Darcy and his cousin Colonel Fitzwilliam arrived at Rosings. To Elizabeth's surprise, Darcy began to seek her out during her daily walks in the park." },
          { characterId: "darcy", text: "You seem fond of this path, Miss Bennet." },
          { characterId: "elizabeth", text: "It is a favourite of mine. It is quiet. I did not expect to meet anyone here." },
          { characterId: "darcy", text: "I... I find the air here quite refreshing. Does your sister Jane still reside in London?" },
          { characterId: "elizabeth", text: "She does. But I fear she is not as happy there as she might be." },
          { text: "Later, Colonel Fitzwilliam let slip a devastating secret." },
          { characterId: "fitzwilliam", text: "Darcy congratulated himself on having lately saved a friend from the inconveniences of a most imprudent marriage. He would not name the parties, but I believe it was Bingley." },
          { characterId: "elizabeth", text: "(Internal) He did it! He ruined Jane's happiness based on his own pride and prejudice!" }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "The Stormy Proposal",
    scenes: [
      {
        id: "pp-abr-6-1",
        title: "In Vain I Have Struggled",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fhunsford_parsonage.png",
        dialogue: [
          { text: "Elizabeth sat alone, her heart heavy with the knowledge of Darcy's interference. Suddenly, the door opened, and Darcy himself entered the room." },
          { characterId: "darcy", text: "In vain I have struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you." },
          { text: "Elizabeth was too much surmounted by surprise to utter a word. Darcy continued, speaking of his struggles against her family's low connections and the degradation he felt in loving her." },
          { characterId: "elizabeth", text: "In such cases as this, it is, I believe, the established mode to express a sense of obligation for the sentiments avowed. I am very sensible of the honour of your proposal, but I cannot... I have never desired your good opinion, and you have certainly bestowed it most unwillingly." },
          { characterId: "darcy", text: "Is this all the reply which I am to have the honour of expecting? Might I ask why, with so little endeavour at civility, I am thus rejected?" },
          { characterId: "elizabeth", text: "I might as well inquire why, with so evident a design of offending and insulting me, you chose to tell me that you liked me against your will, against your reason, and even against your character!" },
          { characterId: "elizabeth", text: "But I have other reasons. Do you think that any consideration would tempt me to accept the man who has been the means of ruining the happiness of a most beloved sister?" },
          { characterId: "darcy", text: "And this is your opinion of me! This is the estimation in which you hold me! I thank you for explaining it so fully..." },
          { characterId: "elizabeth", text: "You are the last man in the world whom I could ever be prevailed on to marry!" }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Revelations",
    scenes: [
      {
        id: "pp-abr-7-1",
        title: "The Letter",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Frosings_park.png",
        dialogue: [
          { text: "The next morning, Darcy met Elizabeth during her walk and handed her a letter before silently departing." },
          { characterId: "darcy", text: "(Voiceover) 'Be not alarmed, Madam, on receiving this letter... but you must permit me to defend my character. Regarding your sister, I believed her heart was not touched. Regarding Mr. Wickham, he is a man of no honour. He attempted to elope with my young sister for her fortune...'" },
          { characterId: "elizabeth", text: "How despicably have I acted! I, who have prided myself on my discernment! I, who have valued myself on my abilities! Who have often disdained the generous candour of my sister..." },
          { characterId: "elizabeth", text: "Till this moment, I never knew myself." }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Pemberley",
    scenes: [
      {
        id: "pp-abr-8-1",
        title: "The Stately Home",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fpemberley_exterior.png",
        dialogue: [
          { text: "Months later, Elizabeth travelled to Derbyshire with her aunt and uncle, the Gardiners. They visited Pemberley, the estate she might have called her own." },
          { characterId: "mrs-reynolds", text: "Mr. Darcy is a very good master. He is the best landlord, and the best master, that ever lived. Not like the wild young men of nowadays, who think of nothing but themselves." },
          { characterId: "elizabeth", text: "(Internal) Can this be the same man? The man I thought so proud and arrogant?" },
          { text: "Suddenly, Mr. Darcy himself appeared from the woods. He approached them with a civility and kindness that left Elizabeth breathless." },
          { characterId: "darcy", text: "Miss Bennet... I am surprised to find you here. Will you allow me to introduce you to my sister, Georgiana, when she arrives tomorrow?" },
          { characterId: "elizabeth", text: "I... I should be honoured, Mr. Darcy." }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Chapters 46-51: The Elopement",
    scenes: [
      {
        id: "pp-abr-9",
        title: "Disgrace in the Family",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fmeryton_village.png",
        dialogue: [
          { characterId: "nick", text: "Shocking news arrives: Lydia has eloped with Wickham! The Bennet family is thrown into turmoil and disgrace." },
          { characterId: "nick", text: "Darcy secretly tracks them down and pays Wickham a massive sum to marry Lydia, saving the Bennets' reputation without seeking credit." }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Truth and Engagement",
    scenes: [
      {
        id: "pp-abr-10-1",
        title: "The Confrontation",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png",
        dialogue: [
          { text: "Lydia and Wickham were eventually 'found' and married, the secret benefactor believed to be Mr. Gardiner. But Lydia let the truth slip: Darcy had been at the wedding." },
          { characterId: "mrs-gardiner", text: "Lizzy, it was Mr. Darcy who did everything! He paid the debts, he bought the commission, he forced the marriage. And he insisted that no one should ever know." },
          { text: "Shortly after, Lady Catherine arrived at Longbourn in a fury." },
          { characterId: "lady-catherine", text: "A report of a most alarming nature has reached me! That you, Miss Elizabeth Bennet, intend to be united with my nephew, Mr. Darcy! I will not have it! He is engaged to my daughter!" },
          { characterId: "elizabeth", text: "If he is so, you can have no reason to suppose he will make an offer to me." },
          { characterId: "lady-catherine", text: "I insist on being satisfied! Will you promise never to enter into such an engagement?" },
          { characterId: "elizabeth", text: "I will make no such promise. I am only resolved to act in that manner, which will, in my own opinion, constitute my happiness, without reference to you!" }
        ]
      },
      {
        id: "pp-abr-10-2",
        title: "The Walk",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png",
        dialogue: [
          { text: "Darcy returned to Longbourn. During a walk, Elizabeth finally spoke of what she knew." },
          { characterId: "elizabeth", text: "Mr. Darcy, I am a very selfish creature; and, for the sake of relief to my own feelings, care not how much I may be wounding yours. I can no longer help thanking you for your unexampled kindness to my poor sister." },
          { characterId: "darcy", text: "If you will thank me, let it be for yourself alone. That the wish of giving happiness to you might add force to the other inducements which led me on, I shall not attempt to deny. But your family owe me nothing. Much as I respect them, I believe I thought only of you." },
          { characterId: "darcy", text: "If your feelings are still what they were last April, tell me so at once. My affections and wishes are unchanged, but one word from you will silence me on this subject for ever." },
          { characterId: "elizabeth", text: "My feelings... have undergone so material a change since that period as to make me receive with gratitude and pleasure your present assurances." }
        ]
      }
    ]
  },
  {
    id: 11,
    title: "Epilogue",
    scenes: [
      {
        id: "pp-abr-11-1",
        title: "The End",
        background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Fpemberley_exterior.png",
        dialogue: [
          { text: "Happy for all her maternal feelings was the day on which Mrs. Bennet got rid of her two most deserving daughters." },
          { characterId: "mrs-bennet", text: "Good gracious! Lord bless me! Only think! Dear Lizzy! A house in town! Everything that is charming! Three on them married! Oh, what a day!" },
          { characterId: "mr-bennet", text: "I admire all my sons-in-law highly. Wickham, perhaps, is my favourite; but I think I shall like Jane's husband quite as well as Elizabeth's." },
          { text: "And they lived, with pride tempered by love, and prejudice overcome by understanding, in the quiet beauty of Pemberley." },
          { text: "THE END", style: "italic" }
        ]
      }
    ]
  }
];
