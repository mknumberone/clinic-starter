// File: src/rooms/rooms.controller.ts

import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Get()
    findAll(@Query('branch_id') branchId?: string) {
        return this.roomsService.findAll(branchId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.roomsService.findOne(id);
    }

    @Post()
    create(@Body() createRoomDto: CreateRoomDto) {
        return this.roomsService.create(createRoomDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        return this.roomsService.update(id, updateRoomDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.roomsService.remove(id);
    }
}