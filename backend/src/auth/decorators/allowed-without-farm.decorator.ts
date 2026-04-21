import { SetMetadata } from '@nestjs/common';

export const ALLOW_WITHOUT_FARM_KEY = 'allowWithoutFarm';

export const AllowWithoutFarm = () => SetMetadata(ALLOW_WITHOUT_FARM_KEY, true);
