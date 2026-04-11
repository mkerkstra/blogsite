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
    books: [
      {
        title: "The Staff Engineer's Path",
        author: "Will Larson",
        year: 2022,
        url: "https://staffeng.com/book",
      },
      {
        title: "An Elegant Puzzle",
        author: "Will Larson",
        year: 2019,
        url: "https://lethain.com/elegant-puzzle/",
      },
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        year: 2017,
        url: "https://dataintensive.net/",
      },
    ],
  },
  {
    id: "fiction",
    label: "Fiction",
    books: [
      {
        title: "Foundation trilogy",
        author: "Isaac Asimov",
        year: 1951,
      },
      {
        title: "Remembrance of Earth's Past",
        author: "Cixin Liu",
        year: 2008,
        note: "The Three-Body Problem and its sequels.",
      },
      {
        title: "Do Androids Dream of Electric Sheep?",
        author: "Philip K. Dick",
        year: 1968,
      },
    ],
  },
];
