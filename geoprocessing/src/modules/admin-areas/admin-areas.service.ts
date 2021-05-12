import { Injectable, Logger, Inject } from '@nestjs/common';
import { TileService, TileRequest } from 'src/modules/tile/tile.service';
import { ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminArea } from 'src/modules/admin-areas/admin-areas.geo.entity';
import { BBox } from 'geojson';

export class TileSpecification extends TileRequest {
  @ApiProperty()
  @Min(0)
  @Max(2)
  @IsInt()
  @Transform((value) => Number.parseInt(value))
  level!: number;
}

/**
 * @todo add validation for bbox
 */
export class AdminAreasFilters {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform((value: string): BBox => JSON.parse(value))
  bbox?: BBox;

  @IsOptional()
  @IsString()
  guid: string;
}

@Injectable()
export class AdminAreasService {
  private readonly logger: Logger = new Logger(AdminAreasService.name);
  constructor(
    @InjectRepository(AdminArea)
    private readonly adminAreasRepository: Repository<AdminArea>,
    @Inject(TileService)
    private readonly tileService: TileService,
  ) {}

  buildAdminAreaWhereQuery(level: number, filters?: AdminAreasFilters): string {
    let whereQuery = '';
    if (level === 0) {
      whereQuery = `gid_0 IS NOT NULL AND gid_1 IS NULL AND gid_2 IS NULL`;
      if (filters?.guid) {
        whereQuery += ` AND gid_0 = '${filters?.guid}'`;
      }
      if (filters?.bbox) {
        whereQuery += ` AND the_geom && ST_MakeEnvelope(${filters?.bbox}, 4326)`;
      }
    }
    if (level === 1) {
      whereQuery = `gid_1 IS NOT NULL AND gid_2 IS NULL AND gid_0 != 'ATA'`;
      if (filters?.guid) {
        whereQuery += ` AND gid_0 = '${filters?.guid}'`;
      }
      if (filters?.bbox) {
        whereQuery += ` AND the_geom && ST_MakeEnvelope(${filters?.bbox}, 4326)`;
      }
    }
    if (level === 2) {
      whereQuery = `gid_2 IS NOT NULL`;
      if (filters?.guid) {
        whereQuery += ` AND  gid_1 = '${filters?.guid}'`;
      }
      if (filters?.bbox) {
        whereQuery += ` AND the_geom && ST_MakeEnvelope(${filters?.bbox}, 4326)`;
      }
    }
    return whereQuery;
  }

  /**
   * @todo get attributes from Entity, based on user selection
   */
  public findTile(
    tileSpecification: TileSpecification,
    filters?: AdminAreasFilters,
  ): Promise<Buffer> {
    const { z, x, y, level } = tileSpecification;
    const attributes = 'name_0, name_1, name_2';
    const table = this.adminAreasRepository.metadata.tableName;
    const customQuery = this.buildAdminAreaWhereQuery(level, filters);
    return this.tileService.getTile({
      z,
      x,
      y,
      table,
      customQuery,
      attributes,
    });
  }
}
