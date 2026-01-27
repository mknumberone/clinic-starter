import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tin tức (Public GET, có thể filter)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'is_published', required: false, type: Boolean })
  async getAllNews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('is_published') is_published?: string,
  ) {
    return this.newsService.getAllNews({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      category,
      is_published: is_published === 'true' ? true : is_published === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết tin tức theo ID' })
  async getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy chi tiết tin tức theo slug (Public)' })
  async getNewsBySlug(@Param('slug') slug: string) {
    return this.newsService.getNewsBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo bài viết mới (Admin only)' })
  async createNews(@Body(ValidationPipe) dto: CreateNewsDto) {
    return this.newsService.createNews(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật bài viết (Admin only)' })
  async updateNews(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateNewsDto,
  ) {
    return this.newsService.updateNews(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa bài viết (Admin only)' })
  async deleteNews(@Param('id') id: string) {
    return this.newsService.deleteNews(id);
  }
}
