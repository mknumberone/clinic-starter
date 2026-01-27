import { Controller, Post, Get, Patch, Delete, Body, Query, UseGuards, ValidationPipe, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ImportInventoryDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryController {
    constructor(private inventoryService: InventoryService) { }

    @Post('import')
    @ApiOperation({ summary: 'Nhập kho thuốc (Cộng dồn nếu trùng lô, Tạo mới nếu khác lô)' })
    @ApiResponse({ status: 201, description: 'Nhập kho thành công' })
    async importStock(@Body(ValidationPipe) dto: ImportInventoryDto) {
        return this.inventoryService.importStock(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Xem tồn kho của chi nhánh' })
    @ApiQuery({ name: 'branchId', required: true, description: 'ID chi nhánh cần xem' })
    async getInventory(@Query('branchId') branchId: string) {
        return this.inventoryService.getBranchInventory(branchId);
    }

    @Patch(':id')
    async updateInventory(@Param('id') id: string, @Body() body: any) {
        return this.inventoryService.updateInventoryItem(id, body);
    }

    @Delete(':id')
    async deleteInventory(@Param('id') id: string) {
        return this.inventoryService.deleteInventoryItem(id);
    }
}