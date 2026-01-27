import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // Tạo slug từ title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Kiểm tra slug unique
  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.news.findFirst({
        where: {
          slug: finalSlug,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) break;

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  async getAllNews(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    is_published?: boolean;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { excerpt: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.is_published !== undefined) {
      where.is_published = params.is_published;
    }

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getNewsById(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    return news;
  }

  async getNewsBySlug(slug: string) {
    const news = await this.prisma.news.findUnique({
      where: { slug },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với slug: ${slug}`);
    }

    // Tăng lượt xem
    await this.prisma.news.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return news;
  }

  async createNews(dto: CreateNewsDto) {
    // Tạo slug nếu chưa có
    let slug = dto.slug || this.generateSlug(dto.title);
    if (slug === 'temp-slug' || !slug) {
      slug = this.generateSlug(dto.title);
    }

    // Đảm bảo slug unique
    slug = await this.ensureUniqueSlug(slug);

    const newsData: any = {
      title: dto.title,
      slug,
      excerpt: dto.excerpt,
      content: dto.content,
      author: dto.author,
      category: dto.category,
      image: dto.image,
      is_published: dto.is_published || false,
    };

    if (dto.is_published && !newsData.published_at) {
      newsData.published_at = new Date();
    }

    return this.prisma.news.create({
      data: newsData,
    });
  }

  async updateNews(id: string, dto: UpdateNewsDto) {
    const existing = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    const updateData: any = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
      // Nếu đổi title và không có slug mới, tự động tạo slug mới
      if (!dto.slug) {
        updateData.slug = await this.ensureUniqueSlug(
          this.generateSlug(dto.title),
          id
        );
      }
    }

    if (dto.slug !== undefined && dto.slug !== 'temp-slug') {
      updateData.slug = await this.ensureUniqueSlug(dto.slug, id);
    }

    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.author !== undefined) updateData.author = dto.author;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.image !== undefined) updateData.image = dto.image;

    if (dto.is_published !== undefined) {
      updateData.is_published = dto.is_published;
      // Nếu publish lần đầu, set published_at
      if (dto.is_published && !existing.published_at) {
        updateData.published_at = new Date();
      }
    }

    return this.prisma.news.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteNews(id: string) {
    const existing = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    return this.prisma.news.delete({
      where: { id },
    });
  }
}
