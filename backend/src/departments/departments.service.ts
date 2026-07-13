import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  create(data: { name: string; code: string; description?: string; parentId?: string }) {
    return this.prisma.department.create({ data });
  }

  delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
