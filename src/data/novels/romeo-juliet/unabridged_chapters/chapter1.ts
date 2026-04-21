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
        { text: "Two households, both alike in dignity," },
        { text: "In fair Verona, where we lay our scene," },
        { text: "From ancient grudge break to new mutiny," },
        { text: "Where civil blood makes civil hands unclean." },
        { text: "From forth the fatal loins of these two foes" },
        { text: "A pair of star-cross'd lovers take their life;" },
        { text: "Whose misadventur'd piteous overthrows" },
        { text: "Doth with their death bury their parents' strife." },
        { text: "The fearful passage of their death-mark'd love," },
        { text: "And the continuance of their parents' rage," },
        { text: "Which, but their children's end, nought could remove," },
        { text: "Is now the two hours' traffic of our stage;" },
        { text: "The which if you with patient ears attend," },
        { text: "What here shall miss, our toil shall strive to mend." }
      ]
    },
    {
      id: "act1-scene1",
      title: "Scene I. A public place.",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street.png",
      backgroundDescription: "A bustling street in Verona.",
      dialogue: [
        { text: "Enter Sampson and Gregory, of the house of Capulet, armed with swords and bucklers.", style: "italic" },
        { characterId: "sampson", text: "Gregory, o' my word, we'll not carry coals." },
        { characterId: "gregory", text: "No, for then we should be colliers." },
        { characterId: "sampson", text: "I mean, an we be in choler, we'll draw." },
        { characterId: "gregory", text: "Ay, while you live, draw your neck out o' the collar." },
        { characterId: "sampson", text: "I strike quickly, being moved." },
        { characterId: "gregory", text: "But thou art not quickly moved to strike." },
        { characterId: "sampson", text: "A dog of the house of Montague moves me." },
        { characterId: "gregory", text: "To move is to stir; and to be valiant is to stand: therefore, if thou art moved, thou runn'st away." },
        { characterId: "sampson", text: "A dog of that house shall move me to stand: I will take the wall of any man or maid of Montague's." },
        { characterId: "gregory", text: "That shows thee a weak slave; for the weakest goes to the wall." },
        { text: "Enter Abraham and Balthasar.", style: "italic" },
        { characterId: "sampson", text: "Draw thy tool! here comes two of the house of the Montagues." },
        { characterId: "gregory", text: "My naked weapon is out: quarrel, I will back thee." },
        { characterId: "sampson", text: "Let us take the law of our sides; let them begin." },
        { characterId: "gregory", text: "I will frown as I pass by, and let them take it as they list." },
        { characterId: "sampson", text: "Nay, as they dare. I will bite my thumb at them; which is a disgrace to them, if they bear it." },
        { characterId: "abraham", text: "Do you bite your thumb at us, sir?" },
        { characterId: "sampson", text: "I do bite my thumb, sir." },
        { characterId: "abraham", text: "Do you bite your thumb at us, sir?" },
        { characterId: "sampson", text: "[Aside to Gregory] Is the law of our side, if I say ay?", style: "italic" },
        { characterId: "gregory", text: "No." },
        { characterId: "sampson", text: "No, sir, I do not bite my thumb at us, sir, but I bite my thumb, sir." }
      ]
    },
    {
      id: "act1-scene2",
      title: "Scene II. A Street.",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fverona_street_dusk.png",
      backgroundDescription: "A street in Verona at dusk.",
      dialogue: [
        { text: "Enter Capulet, Paris, and a Servant.", style: "italic" },
        { characterId: "capulet", text: "But Montague is bound as well as I, In penalty alike; and 'tis not hard, I think, For men so old as we to keep the peace." },
        { characterId: "paris", text: "Of honourable reckoning are you both; And pity 'tis you liv'd at odds so long. But now, my lord, what say you to my suit?" },
        { characterId: "capulet", text: "But saying o'er what I have said before: My child is yet a stranger in the world; She hath not seen the change of fourteen years, Let two more summers wither in their pride, Ere we may think her ripe to be a bride." },
        { characterId: "paris", text: "Younger than she are happy mothers made." },
        { characterId: "capulet", text: "And too soon marr'd are those so early made. The earth hath swallow'd all my hopes but she, She is the hopeful lady of my earth: But woo her, gentle Paris, get her heart, My will to her consent is but a part; An she agree, within her scope of choice Lies my consent and fair according voice." }
      ]
    },
    {
      id: "act1-scene3",
      title: "Scene III. Room in Capulet’s House.",
      background: "/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fcapulet_house_interior.png",
      backgroundDescription: "A luxurious room in the Capulet house.",
      dialogue: [
        { text: "Enter Lady Capulet and Nurse.", style: "italic" },
        { characterId: "lady_capulet", text: "Nurse, where's my daughter? call her forth to me." },
        { characterId: "nurse", text: "Now, by my maidenhead, at twelve year old, I bade her come. What, lamb! what, ladybird! God forbid! Where's this girl? What, Juliet!" },
        { text: "Enter Juliet.", style: "italic" },
        { characterId: "juliet", text: "How now! who calls?" },
        { characterId: "nurse", text: "Your mother." },
        { characterId: "juliet", text: "Madam, I am here. What is your will?" },
        { characterId: "lady_capulet", text: "This is the matter:—Nurse, give leave awhile, We must talk in secret:—nurse, come back again; I have remember'd me, thou'st hear our counsel. Thou know'st my daughter's of a pretty age." },
        { characterId: "nurse", text: "Faith, I can tell her age unto an hour." },
        { characterId: "lady_capulet", text: "She's not fourteen." }
      ]
    }
  ]
};

// project-sync-marker
