import apiClient from './apiClient'

export interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  publishedAt: string
  imageUrl?: string
  sourceName: string
  sourceUrl: string
}

export interface NewsResponse {
  items: NewsItem[]
  page: number
  pageSize: number
  totalCount: number
}

export const newsService = {
  getAll: (page = 1, pageSize = 10, query?: string) =>
    apiClient.get<NewsResponse>('/news', {
      params: { page, pageSize, ...(query && { query }) },
    }),

  getLatest: async (limit = 4) => {
    const res = await apiClient.get<NewsResponse | NewsItem[]>('/news', {
      params: { page: 1, pageSize: limit },
    })
    // Normalize response - backend'den { items: [...] } ya da [...] gelebilir
    const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
    return { ...res, data: items }
  },
}
