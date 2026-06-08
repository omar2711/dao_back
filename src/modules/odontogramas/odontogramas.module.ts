import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Odontograma } from './entities/odontograma.entity';
import { OdontogramasService } from './services/odontogramas.service';
import { OdontogramasController } from './controllers/odontogramas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Odontograma])],
  controllers: [OdontogramasController],
  providers: [OdontogramasService],
  exports: [OdontogramasService],
})
export class OdontogramasModule {}
