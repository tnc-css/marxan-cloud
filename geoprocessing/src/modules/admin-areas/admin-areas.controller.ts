import { Controller, Get, Param, Header, Res, Query } from '@nestjs/common';
import { AdminAreasService, AdminAreaLevelFilters } from './admin-areas.service';
import { apiGlobalPrefixes } from 'src/api.config';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';


import { Response } from 'express';

@Controller(`${apiGlobalPrefixes.v1}`)
export class AdminAreasController {
  constructor(public service: AdminAreasService) {}

  @ApiOperation({
    description: 'Get tile for administrative areas within a given country.',
  })
  @ApiParam({
    name: 'z',
    description: 'The zoom level ranging from 0 - 20',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'x',
    description: 'The tile x offset on Mercator Projection',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'y',
    description: 'The tile y offset on Mercator Projection',
    type: Number,
    required: true,
  })
  @ApiParam({
    name: 'level',
    description:
      'Specific level to filter the administrative areas (0, 1 or 2)',
    type: Number,
    required: true,
    example: '1'
  })
  @ApiQuery({
    name: 'guid',
    description:
      'Parent country of administrative areas in ISO code',
    type: String,
    required: false,
    example: 'BRA.1',
  })
  @Get('/administrative-areas/:level/preview/tiles/:z/:x/:y.mvt')
  @Header('Content-Type', 'application/x-protobuf')
  @Header('Content-Disposition', 'attachment')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Content-Encoding', 'gzip')
  async getTile(
    @Param('z') z: number,
    @Param('x') x: number,
    @Param('y') y: number,
    @Param('level') level: AdminAreaLevelFilters,
    @Query('guid') guid: string,
    @Res() response: Response,
  ): Promise<Object> {
    const tile: Buffer = await this.service.findTile(
      z,
      x,
      y,
      level,
    );
    return response.send(tile);
  }
}
