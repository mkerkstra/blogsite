export type Book = {
  title: string;
  author: string;
  year?: number;
  url?: string;
  note?: string;
};

/**
 * Resolve a "where to find this book" link. If the entry has a curated
 * `url` (author site, publisher page, Staff Eng book landing, etc.),
 * use that. Otherwise fall back to a BookPeople search — Austin's
 * local independent bookstore. Supports the local indie and dodges
 * Amazon.
 */
export function bookLink(book: Book): string {
  if (book.url) return book.url;
  const query = encodeURIComponent(`${book.title} ${book.author}`);
  return `https://bookpeople.com/search?q=${query}`;
}

export type ReadingShelf = {
  id: "engineering" | "fiction" | "history";
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
      {
        title: "A Pattern Language",
        author: "Christopher Alexander",
        year: 1977,
        url: "https://bookpeople.com/book/9780195019193",
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
        url: "https://bookpeople.com/book/9781607962731",
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
      {
        title: "The Killer Angels",
        author: "Michael Shaara",
        year: 1974,
        note: "Gettysburg, told from the minds of the men who fought it.",
      },
    ],
  },
  {
    id: "history",
    label: "History",
    books: [
      {
        title: "Alexander Hamilton",
        author: "Ron Chernow",
        year: 2004,
      },
      {
        title: "Mark Twain",
        author: "Ron Chernow",
        year: 2025,
      },
    ],
  },
];
