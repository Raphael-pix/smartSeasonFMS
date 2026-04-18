import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';
import { AppConfig } from '@/config/configuration';
import { FieldsService } from '@/fields/fields.service';
import { JwtUser } from '@/auth/types/request-user.type';

const IMAGE_SELECT = {
  id: true,
  fieldId: true,
  url: true,
  caption: true,
  createdAt: true,
  uploadedBy: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly maxSizeBytes: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldsService: FieldsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(
      this.config.get('supabase.url', { infer: true }),
      this.config.get('supabase.publishableKey', { infer: true }),
    );

    this.bucket = this.config.get('supabase.storageBucket', { infer: true });
    this.maxSizeBytes =
      this.config.get('upload.maxFileSizeMb', { infer: true }) * 1024 * 1024;
    this.allowedMimeTypes = this.config.get('upload.allowedMimeTypes', {
      infer: true,
    });
  }

  async upload(
    fieldId: string,
    file: Express.Multer.File,
    caption: string | undefined,
    setCover: boolean,
    user: JwtUser,
  ) {
    await this.fieldsService.findOne(fieldId, user);

    this.validateFile(file);

    const ext = this.extFromMime(file.mimetype);
    const storagePath = `fields/${fieldId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logger.error(`Storage upload failed: ${uploadError.message}`);
      throw new InternalServerErrorException('Image upload failed');
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucket).getPublicUrl(storagePath);

    const image = await this.prisma.fieldImage.create({
      data: {
        fieldId,
        url: publicUrl,
        caption: caption ?? null,
        uploadedById: user.id,
      },
      select: IMAGE_SELECT,
    });

    if (setCover) {
      await this.prisma.field.update({
        where: { id: fieldId },
        data: { coverImageUrl: publicUrl },
      });
    }

    return image;
  }

  async findByField(fieldId: string, user: JwtUser) {
    await this.fieldsService.findOne(fieldId, user);

    return this.prisma.fieldImage.findMany({
      where: { fieldId },
      select: IMAGE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(imageId: string, user: JwtUser) {
    const image = await this.prisma.fieldImage.findUnique({
      where: { id: imageId },
      select: { id: true, url: true, fieldId: true },
    });

    if (!image) {
      throw new BadRequestException(`Image ${imageId} not found`);
    }

    await this.fieldsService.findOne(image.fieldId, user);

    const storagePath = this.pathFromUrl(image.url);

    if (storagePath) {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([storagePath]);

      if (error) {
        this.logger.warn(
          `Storage delete failed for ${storagePath}: ${error.message}`,
        );
      }
    }

    await this.prisma.fieldImage.delete({ where: { id: imageId } });

    return { message: 'Image deleted successfully' };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxSizeBytes / 1024 / 1024}MB`,
      );
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mime] ?? 'jpg';
  }

  private pathFromUrl(url: string): string | null {
    const match = url.match(/fields\/[^/]+\/[^?]+/);
    return match ? match[0] : null;
  }
}
