import { NovelMetadata } from '../../types';

export const NOVELS_METADATA: NovelMetadata[] = [
  {
    id: 'great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: '1925',
    description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Fgreat-gatsby%2Fgatsby_mansion_interior.png',
    accentColor: '#d97706',
    homepage: 'https://www.gutenberg.org/ebooks/64317',
    stylePrompt: 'High quality, detailed, atmospheric lighting, period-accurate 1920s style, art deco influence.',
    abridgedEstimate: '15 min',
    unabridgedEstimate: '4 hours',
    genre: 'Drama'
  },
  {
    id: 'pride-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    description: 'The story of the lively Elizabeth Bennet and her complicated relationship with the wealthy Mr. Darcy.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Fpride-prejudice%2Flongbourn_estate.png',
    accentColor: '#db2777',
    stylePrompt: 'High quality, detailed, atmospheric lighting, Regency era style, early 19th century England, elegant oil painting aesthetic.',
    abridgedEstimate: '25 min',
    unabridgedEstimate: '10 hours',
    genre: 'Romance'
  },
  {
    id: 'romeo-juliet',
    title: 'Romeo and Juliet',
    author: 'William Shakespeare',
    year: '1597',
    description: 'The classic tragedy of two young star-crossed lovers whose deaths ultimately reconcile their feuding families.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Fromeo-juliet%2Fdefault.png',
    accentColor: '#dc2626',
    homepage: 'https://www.gutenberg.org/ebooks/1513',
    stylePrompt: 'High quality, detailed, atmospheric lighting, Italian Renaissance style, painterly aesthetic, dramatic shadows, romantic and tragic mood.',
    abridgedEstimate: '20 min',
    unabridgedEstimate: '3 hours',
    genre: 'Tragedy'
  },
  {
    id: '1984',
    title: 'Nineteen Eighty-Four',
    author: 'George Orwell',
    year: '1949',
    description: 'A dystopian social science fiction novel and cautionary tale about totalitarianism and surveillance.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2F1984%2Fdefault.png',
    accentColor: '#1f2937',
    stylePrompt: 'High quality, detailed, dystopian aesthetic, brutalist architecture, surveillance culture, gritty street level, dark and moody atmosphere, social realism influence.',
    genre: 'Dystopian'
  },
  {
    id: 'crime-punishment',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    year: '1866',
    description: 'The mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student in Saint Petersburg.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Fcrime-punishment%2Fdefault.png',
    accentColor: '#7f1d1d',
    stylePrompt: 'High quality, detailed, 19th century Saint Petersburg, grime and psychological tension, dramatic shadows, oil painting style, somber and intense mood.',
    genre: 'Literary Fiction'
  },
  {
    id: 'the-trial',
    title: 'The Trial',
    author: 'Franz Kafka',
    year: '1925',
    description: 'The story of Josef K., a man arrested and prosecuted by a remote, inaccessible authority, with the nature of his crime revealed neither to him nor to the reader.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Fthe-trial%2Fdefault.png',
    accentColor: '#4b5563',
    stylePrompt: 'High quality, detailed, expressionist style, stark shadows, bureaucratic nightmare, surreal architecture, black and white aesthetic with deep contrast.',
    abridgedEstimate: '35 min',
    unabridgedEstimate: '7 hours',
    genre: 'Expressionist'
  },
  {
    id: 'aesop-fables',
    title: "Aesop's Fables",
    author: 'Aesop',
    year: '6th Century BCE',
    description: 'A collection of fables credited to Aesop, a slave and storyteller believed to have lived in ancient Greece.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Faesop-fables%2Fdefault.png',
    accentColor: '#065f46',
    homepage: 'https://www.gutenberg.org/ebooks/28',
    stylePrompt: 'High quality, detailed, ancient Greek style, illustrative, fable aesthetic, woodcut influence.',
    abridgedEstimate: '20 min',
    unabridgedEstimate: '2 hours',
    genre: 'Fable',
    allowedVersions: ['unabridged']
  },
  {
    id: 'animal-farm',
    title: 'Animal Farm',
    author: 'George Orwell',
    year: '1945',
    description: 'A satirical allegorical novella that tells the story of a group of farm animals who rebel against their human farmer.',
    coverImage: 'https://picsum.photos/seed/animalfarm/400/600',
    accentColor: '#b91c1c',
    homepage: 'https://gutenberg.net.au/ebooks01/0100011h.html',
    stylePrompt: 'High quality, detailed, propaganda poster style influence, social realism, rustic farm aesthetic, dramatic shadows.',
    abridgedEstimate: '15 min',
    unabridgedEstimate: '3 hours',
    genre: 'Satire'
  },
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    year: '1865',
    description: 'A young girl named Alice falls through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures.',
    coverImage: '/api/s3/get?key=backgrounds%2Ffallbacks%2Falice-wonderland%2Frabbit_hole.png',
    accentColor: '#0ea5e9',
    homepage: 'https://www.gutenberg.org/ebooks/11',
    stylePrompt: 'High quality, detailed, whimsical, surreal Victorian aesthetic, vibrant colors, dreamlike atmosphere, John Tenniel influence.',
    abridgedEstimate: '20 min',
    unabridgedEstimate: '3 hours',
    genre: 'Fantasy'
  }
];

// project-sync-marker
