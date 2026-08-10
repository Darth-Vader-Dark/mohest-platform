import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOCUMENT_MIME = new Set(['application/pdf']);

/** Convert a Multer memory-storage file to a data-URI string.
 *  The returned string is safe to save directly in any String/Text DB column
 *  and to use as <img src="…"> or <a href="…"> in the browser.
 */
function toDataUri(file: Express.Multer.File): string {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

function imageInterceptor() {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIME.has(file.mimetype)) {
        cb(new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
        return;
      }
      cb(null, true);
    },
  });
}

function documentInterceptor() {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!DOCUMENT_MIME.has(file.mimetype)) {
        cb(new BadRequestException('Only PDF documents are allowed.'), false);
        return;
      }
      cb(null, true);
    },
  });
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post('leader-photo')
  @ApiOperation({ summary: 'Upload a leadership profile photo (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageInterceptor())
  uploadLeaderPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.');
    return { url: toDataUri(file) };
  }

  @Post('employee-photo')
  @ApiOperation({ summary: 'Upload an employee profile photo (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageInterceptor())
  uploadEmployeePhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.');
    return { url: toDataUri(file) };
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload a PDF document (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(documentInterceptor())
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No PDF file provided.');
    return {
      url: toDataUri(file),
      size: file.size,
      label: 'PDF',
    };
  }

  @Post('gallery-photo')
  @ApiOperation({ summary: 'Upload a gallery photo (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageInterceptor())
  uploadGalleryPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.');
    return { url: toDataUri(file) };
  }

  @Post('news-image')
  @ApiOperation({ summary: 'Upload a cover image for a news article (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageInterceptor())
  uploadNewsImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.');
    return { url: toDataUri(file) };
  }

  @Post('hr-signature')
  @ApiOperation({ summary: 'Upload an HR authorizing signature image (stored as Base64 in DB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageInterceptor())
  uploadHrSignature(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.');
    return { url: toDataUri(file) };
  }
}
