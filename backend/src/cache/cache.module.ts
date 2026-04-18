import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis({
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password') || undefined,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          keepAlive: 10000,
          lazyConnect: false,
        });

        client.on('connect', () => console.log('✅ Redis connected'));
        client.on('error', (err) =>
          console.error('❌ Redis error:', err.message),
        );

        return client;
      },
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class CacheModule {}
