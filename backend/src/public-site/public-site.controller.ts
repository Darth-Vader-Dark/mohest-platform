import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/create-institution.dto';
import { CreateScholarshipDto, UpdateScholarshipDto } from './dto/create-scholarship.dto';
import { CreateNewsArticleDto, UpdateNewsArticleDto } from './dto/create-news-article.dto';
import { CreateLeaderDto, UpdateLeaderDto } from './dto/create-leader.dto';
import { CreatePublicDownloadDto, UpdatePublicDownloadDto } from './dto/create-public-download.dto';
import { CreateGalleryItemDto, UpdateGalleryItemDto } from './dto/create-gallery-item.dto';

function scholarshipData(dto: CreateScholarshipDto | UpdateScholarshipDto) {
  const mode = dto.applicationMode || 'none';
  return {
    title: dto.title,
    description: dto.description || null,
    fields: dto.fields,
    level: dto.level || null,
    country: dto.country,
    status: dto.status || 'Open',
    applicationMode: mode,
    link: mode === 'link' ? dto.link || null : null,
    pdfUrl: mode === 'pdf' ? dto.pdfUrl || null : null,
    deadline: dto.deadline ? new Date(dto.deadline) : null,
    sortOrder: dto.sortOrder ?? 0,
  };
}

function normalizeCategory(value?: string): string {
  if (!value) return 'university';
  const map: Record<string, string> = {
    University: 'university',
    university: 'university',
    Technical: 'institute',
    'Technical / Vocational': 'institute',
    institute: 'institute',
    College: 'community_college',
    community_college: 'community_college',
  };
  return map[value] ?? value.toLowerCase().replace(/\s+/g, '_');
}

const ALLOWED_CATEGORIES = new Set(['university', 'institute', 'community_college']);

function safeCategoryFilter(category?: string): string | undefined {
  if (!category) return undefined;
  const normalized = normalizeCategory(category);
  return ALLOWED_CATEGORIES.has(normalized) ? normalized : undefined;
}

// Public GET routes have no auth guards — they serve the public website.
// Write routes (POST/PUT/DELETE) require ICT administrator permissions.

@ApiTags('public-site')
@Controller('public-site')
export class PublicSiteController {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Institutions
  // ---------------------------------------------------------------------------

  @Get('institutions')
  @ApiOperation({ summary: 'List institutions (public)' })
  async findInstitutions(@Query('category') category?: string) {
    const safeCategory = safeCategoryFilter(category);
    return this.prisma.institution.findMany({
      where: safeCategory ? { category: safeCategory } : {},
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('institutions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create institution' })
  async createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.prisma.institution.create({
      data: {
        name: dto.name,
        location: dto.location,
        state: dto.state,
        category: normalizeCategory(dto.category),
        type: dto.type || null,
        established: dto.established ?? null,
        status: dto.status || 'Accredited',
        website: dto.website || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Put('institutions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update institution' })
  async updateInstitution(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInstitutionDto) {
    return this.prisma.institution.update({
      where: { id },
      data: {
        name: dto.name,
        location: dto.location,
        state: dto.state,
        category: normalizeCategory(dto.category),
        type: dto.type || null,
        established: dto.established ?? null,
        status: dto.status || 'Accredited',
        website: dto.website || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Delete('institutions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete institution' })
  async deleteInstitution(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.institution.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Scholarships
  // ---------------------------------------------------------------------------

  @Get('scholarships')
  @ApiOperation({ summary: 'List scholarships (public)' })
  async findScholarships() {
    return this.prisma.scholarship.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Post('scholarships')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create scholarship' })
  async createScholarship(@Body() dto: CreateScholarshipDto) {
    return this.prisma.scholarship.create({
      data: scholarshipData(dto),
    });
  }

  @Put('scholarships/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update scholarship' })
  async updateScholarship(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScholarshipDto) {
    return this.prisma.scholarship.update({
      where: { id },
      data: scholarshipData(dto),
    });
  }

  @Delete('scholarships/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete scholarship' })
  async deleteScholarship(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.scholarship.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // News Articles
  // ---------------------------------------------------------------------------

  @Get('news-articles')
  @ApiOperation({ summary: 'List news articles (public)' })
  async findNewsArticles() {
    return this.prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
    });
  }

  @Post('news-articles')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create news article' })
  async createNewsArticle(@Body() dto: CreateNewsArticleDto) {
    return this.prisma.newsArticle.create({
      data: {
        title: dto.title,
        excerpt: dto.excerpt || null,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        isLead: dto.isLead === true,
        thumbStyle: dto.thumbStyle || null,
        link: dto.link || null,
      },
    });
  }

  @Put('news-articles/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update news article' })
  async updateNewsArticle(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNewsArticleDto) {
    return this.prisma.newsArticle.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt || null,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        isLead: dto.isLead === true,
        thumbStyle: dto.thumbStyle || null,
        link: dto.link || null,
      },
    });
  }

  @Delete('news-articles/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete news article' })
  async deleteNewsArticle(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.newsArticle.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Leaders
  // ---------------------------------------------------------------------------

  @Get('leaders')
  @ApiOperation({ summary: 'List leaders (public)' })
  async findLeaders() {
    return this.prisma.leader.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Post('leaders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create leader' })
  async createLeader(@Body() dto: CreateLeaderDto) {
    return this.prisma.leader.create({
      data: {
        name: dto.name,
        title: dto.title,
        directorate: dto.directorate || null,
        bio: dto.bio || null,
        photoUrl: dto.photoUrl || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Put('leaders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update leader' })
  async updateLeader(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeaderDto) {
    return this.prisma.leader.update({
      where: { id },
      data: {
        name: dto.name,
        title: dto.title,
        directorate: dto.directorate || null,
        bio: dto.bio || null,
        photoUrl: dto.photoUrl || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Delete('leaders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete leader' })
  async deleteLeader(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.leader.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Downloads (forms & documents)
  // ---------------------------------------------------------------------------

  @Get('downloads')
  @ApiOperation({ summary: 'List downloads' })
  async findDownloads(
    @Query('category') category?: string,
    @Query('all') all?: string,
  ) {
    const allowed = new Set(['form', 'guideline', 'policy', 'statement', 'other']);
    const safeCategory = category && allowed.has(category) ? category : undefined;
    const showAll = all === 'true';
    return this.prisma.publicDownload.findMany({
      where: {
        ...(showAll ? {} : { isPublished: true }),
        // When no specific category requested, exclude statements (media-center only)
        ...(safeCategory
          ? { category: safeCategory }
          : { NOT: { category: 'statement' } }),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  @Post('downloads')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create download' })
  async createDownload(@Body() dto: CreatePublicDownloadDto) {
    return this.prisma.publicDownload.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        category: dto.category || 'form',
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize ?? null,
        fileLabel: dto.fileLabel || 'PDF',
        sortOrder: dto.sortOrder ?? 0,
        isPublished: dto.isPublished !== false,
      },
    });
  }

  @Put('downloads/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update download' })
  async updateDownload(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePublicDownloadDto) {
    return this.prisma.publicDownload.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description || null,
        category: dto.category || 'form',
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize ?? null,
        fileLabel: dto.fileLabel || 'PDF',
        sortOrder: dto.sortOrder ?? 0,
        isPublished: dto.isPublished !== false,
      },
    });
  }

  @Delete('downloads/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete download' })
  async deleteDownload(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.publicDownload.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Gallery items (media centre event photography)
  // ---------------------------------------------------------------------------

  @Get('gallery-items')
  @ApiOperation({ summary: 'List gallery items (public)' })
  async findGalleryItems() {
    return this.prisma.galleryItem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Get('gallery-items/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all gallery items (incl. unpublished)' })
  async findAllGalleryItems() {
    return this.prisma.galleryItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Post('gallery-items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create gallery item' })
  async createGalleryItem(@Body() dto: CreateGalleryItemDto) {
    return this.prisma.galleryItem.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isPublished: dto.isPublished !== false,
      },
    });
  }

  @Put('gallery-items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update gallery item' })
  async updateGalleryItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.prisma.galleryItem.update({
      where: { id },
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isPublished: dto.isPublished !== false,
      },
    });
  }

  @Delete('gallery-items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete gallery item' })
  async deleteGalleryItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.galleryItem.delete({ where: { id } });
  }
}
