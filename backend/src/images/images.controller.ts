// src/images/images.controller.ts
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { ImagesService } from './images.service';

@ApiTags('Images')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'fields/:fieldId/images', version: '1' })
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image for a field' })
  @ApiParam({ name: 'fieldId', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        caption: { type: 'string', example: 'Germination at day 14' },
        setCover: {
          type: 'boolean',
          example: false,
          description: 'Set as the field cover image',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('caption') caption?: string,
    @Query('setCover') setCover?: string,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.imagesService.upload(
      fieldId,
      file,
      caption,
      setCover === 'true',
      user!,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all images for a field' })
  @ApiParam({ name: 'fieldId', type: String })
  findAll(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.imagesService.findByField(fieldId, user);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a field image' })
  @ApiParam({ name: 'fieldId', type: String })
  @ApiParam({ name: 'imageId', type: String })
  remove(
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.imagesService.remove(imageId, user);
  }
}
