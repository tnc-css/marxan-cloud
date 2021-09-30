import { Command } from '@nestjs-architects/typed-cqrs';
import { ProjectId } from './project.id';

export class SetProjectGridFromShapefile extends Command<void> {
  constructor(public readonly projectId: ProjectId) {
    super();
  }
}