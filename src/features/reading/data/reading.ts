export type Book = {
  title: string;
  author: string;
  year?: number;
  url?: string;
  note?: string;
};

export type ReadingShelf = {
  id: "engineering" | "fiction";
  label: string;
  blurb?: string;
  books: Book[];
};

export const reading: ReadingShelf[] = [
  {
    id: "engineering",
    label: "Engineering",
    blurb: "Books I keep reaching for when the architecture decisions get hard.",
    books: [
      {
        title: "The Staff Engineer's Path",
        author: "Will Larson",
        year: 2022,
        url: "https://staffeng.com/book",
        note: "The most practical map of the staff-level technical track I've found. Re-read it whenever I'm reframing a quarter.",
      },
      {
        title: "An Elegant Puzzle",
        author: "Will Larson",
        year: 2019,
        url: "https://lethain.com/elegant-puzzle/",
        note: "Companion to The Staff Engineer's Path, but more about the org and people problems. Foundational.",
      },
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        year: 2017,
        url: "https://dataintensive.net/",
        note: "Required reading for anyone touching distributed systems. The 2023 Postgres/PostGIS migration story owes this book a lot.",
      },
    ],
  },
  {
    id: "fiction",
    label: "Fiction",
    blurb: "Sci-fi I keep coming back to.",
    books: [
      {
        title: "Foundation trilogy",
        author: "Isaac Asimov",
        year: 1951,
        note: "Foundation, Foundation and Empire, Second Foundation. Civilizational-scale planning is its own kind of engineering.",
      },
      {
        title: "Remembrance of Earth's Past",
        author: "Cixin Liu",
        year: 2008,
        note: "The Three-Body Problem and its sequels. Hard sci-fi that re-frames how I think about scale.",
      },
      {
        title: "Do Androids Dream of Electric Sheep?",
        author: "Philip K. Dick",
        year: 1968,
        note: "Tighter than Blade Runner. Reads differently every decade.",
      },
    ],
  },
];
