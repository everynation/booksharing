export const ROUTES = {
  HOME: "Home",
  BOOKS: "Books",
  ADD_BOOK: "AddBook",
  AUTH: "Auth",
  MY_LIBRARY: "MyLibrary",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const isProtectedRoute = (route: AppRoute) => route === ROUTES.MY_LIBRARY || route === ROUTES.ADD_BOOK;
