import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('medications')
@Controller('medications') // Đường dẫn sẽ là: /api/medications
@UseGuards(JwtAuthGuard)
export class MedicationsController {
    constructor(private readonly medicationsService: MedicationsService) { }

    @Post()
    create(@Body() createDto: CreateMedicationDto) {
        return this.medicationsService.create(createDto);
    }

    @Get() // GET /api/medications
    findAll() {
        return this.medicationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.medicationsService.findOne(id);
    }

    @Put(':id') // PUT /api/medications/:id
    update(@Param('id') id: string, @Body() updateDto: UpdateMedicationDto) {
        return this.medicationsService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.medicationsService.remove(id);
    }
}