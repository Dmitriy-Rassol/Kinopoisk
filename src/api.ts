import axios from "axios";
export interface Movie {
  id: number;
  name?: string;
  alternativeName?: string;
  year?: number;
  description?: string;
  shortDescription?: string;
  movieLength?: number;
  ageRating?: number;
  type?: string;
  poster?: { url?: string; previewUrl?: string };
  backdrop?: { url?: string };
  rating?: { kp?: number; imdb?: number };
  genres?: { name: string }[];
  countries?: { name: string }[];
  persons?: {
    id: number;
    name?: string;
    enName?: string;
    photo?: string;
    enProfession?: string;
  }[];
}
export interface MoviePage {
  docs: Movie[];
  total: number;
  pages: number;
  page: number;
}
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.poiskkino.dev/v1.4",
  headers: { "X-API-KEY": import.meta.env.VITE_API_KEY },
  timeout: 15000,
});
export const getMovies = async (
  params: Record<string, string | number>,
  signal?: AbortSignal,
) => (await api.get<MoviePage>("/movie", { params, signal })).data;
export const searchMovies = async (
  query: string,
  page: number,
  signal?: AbortSignal,
) =>
  (
    await api.get<MoviePage>("/movie/search", {
      params: { query, page, limit: 20 },
      signal,
    })
  ).data;
export const getMovie = async (id: string, signal?: AbortSignal) =>
  (await api.get<Movie>(`/movie/${encodeURIComponent(id)}`, { signal })).data;
export const title = (movie: Movie) =>
  movie.name || movie.alternativeName || "Без названия";
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403)
      return "API отклонил запрос. Проверьте ключ и доступ к сервису.";
    if (error.response?.status === 429)
      return "Лимит запросов исчерпан. Попробуйте немного позже.";
    if (error.response?.status === 404) return "Фильм не найден.";
  }
  return "Не удалось загрузить данные. Проверьте соединение и попробуйте снова.";
}
export interface Person {
  id: number;
  name?: string;
  enName?: string;
  photo?: string;
  birthday?: string;
  death?: string;
  growth?: number;
  birthPlace?: { value: string }[];
  profession?: { value: string }[];
  facts?: { value: string }[];
  movies?: {
    id: number;
    name?: string;
    alternativeName?: string;
    rating?: number;
    description?: string;
    enProfession?: string;
  }[];
}
export interface PersonPage {
  docs: Person[];
  total: number;
  pages: number;
  page: number;
}
const peopleApi = axios.create({
  baseURL:
    import.meta.env.VITE_PERSON_API_URL || "https://api.poiskkino.dev/v1.5",
  headers: { "X-API-KEY": import.meta.env.VITE_API_KEY },
  timeout: 15000,
});
export const searchPeople = async (
  query: string,
  page: number,
  signal?: AbortSignal,
) =>
  (
    await peopleApi.get<PersonPage>("/person/search", {
      params: { query, page, limit: 20 },
      signal,
    })
  ).data;
export const getPerson = async (id: string, signal?: AbortSignal) =>
  (await peopleApi.get<Person>(`/person/${encodeURIComponent(id)}`, { signal }))
    .data;
export const personName = (person: Person) =>
  person.name || person.enName || "Имя не указано";
export const plainText = (value: string) =>
  new DOMParser().parseFromString(value, "text/html").body.textContent || "";
export async function getMovieYears(ids: number[], signal?: AbortSignal) {
  const years: Record<number, number> = {};
  const unique = [...new Set(ids)];
  for (let offset = 0; offset < unique.length; offset += 100) {
    const params = new URLSearchParams({ limit: "250", page: "1" });
    unique
      .slice(offset, offset + 100)
      .forEach((id) => params.append("id", String(id)));
    params.append("selectFields", "id");
    params.append("selectFields", "year");
    const { data } = await api.get<MoviePage>("/movie", { params, signal });
    data.docs.forEach((movie) => {
      if (movie.year) years[movie.id] = movie.year;
    });
  }
  return years;
}
