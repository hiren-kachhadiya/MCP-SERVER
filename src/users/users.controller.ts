import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

class CreateUserDto {
  /** Full name of the user */ name: string;
  /** Contact email */ email: string;
}

class User {
  id: string; name: string; email: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  private users: User[] = [];

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'Array of users', type: [User] })
  findAll(): User[] { return this.users; }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id', description: 'Returns user details' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  findOne(@Param('id') id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created', type: User })
  create(@Body() dto: CreateUserDto): User {
    const u = { id: String(Date.now()), ...dto };
    this.users.push(u); return u;
  }
}
