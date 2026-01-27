import axiosInstance from '@/lib/axios';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  image?: string;
  views: number;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsListResponse {
  data: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNewsDto {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  image?: string;
  is_published?: boolean;
}

export interface UpdateNewsDto {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  image?: string;
  is_published?: boolean;
}

export const newsService = {
  // Lấy danh sách tin tức
  getAllNews: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    is_published?: boolean;
  }): Promise<NewsListResponse> => {
    const response = await axiosInstance.get('/news', { params });
    return response.data;
  },

  // Lấy chi tiết tin tức theo ID
  getNewsById: async (id: string): Promise<NewsArticle> => {
    const response = await axiosInstance.get(`/news/${id}`);
    return response.data;
  },

  // Lấy chi tiết tin tức theo slug
  getNewsBySlug: async (slug: string): Promise<NewsArticle> => {
    const response = await axiosInstance.get(`/news/slug/${slug}`);
    return response.data;
  },

  // Tạo tin tức mới
  createNews: async (data: CreateNewsDto): Promise<NewsArticle> => {
    const response = await axiosInstance.post('/news', data);
    return response.data;
  },

  // Cập nhật tin tức
  updateNews: async (id: string, data: UpdateNewsDto): Promise<NewsArticle> => {
    const response = await axiosInstance.put(`/news/${id}`, data);
    return response.data;
  },

  // Xóa tin tức
  deleteNews: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/news/${id}`);
  },
};
