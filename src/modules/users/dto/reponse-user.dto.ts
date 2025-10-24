import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'usr_01H2Z0...',
  })
  id?: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Maria Silva' })
  name!: string;

  @ApiProperty({ description: 'Email address', example: 'maria@example.com' })
  email!: string;

  @ApiProperty({
    description: 'Whether email is verified',
    required: false,
    example: false,
  })
  emailVerified?: boolean;

  @ApiProperty({
    description: 'URL to avatar image',
    required: false,
    nullable: true,
    example: null,
  })
  image?: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    required: false,
    type: String,
    example: new Date().toISOString(),
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    required: false,
    type: String,
    example: new Date().toISOString(),
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Role assigned to user',
    required: false,
    nullable: true,
    example: 'user',
  })
  role?: string | null;

  @ApiProperty({
    description: 'Whether the user is banned',
    required: false,
    nullable: true,
    example: false,
  })
  banned?: boolean | null;

  @ApiProperty({
    description: 'Reason for ban',
    required: false,
    nullable: true,
    example: null,
  })
  banReason?: string | null;

  @ApiProperty({
    description: 'Ban expiration date',
    required: false,
    nullable: true,
    type: String,
    example: null,
  })
  banExpires?: Date | null;

  constructor(data: Partial<ResponseUserDto>) {
    this.id = data.id;
    this.name = data.name ?? '';
    this.email = data.email ?? '';
    this.emailVerified = data.emailVerified;
    this.image = data.image;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.role = data.role;
    this.banned = data.banned;
    this.banReason = data.banReason;
    this.banExpires = data.banExpires;
  }
}

export class ResponseUserErrorDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Invalid input data',
  })
  message: string;
}

export class ResponseUserListDto {
  @ApiProperty({ description: 'List of users', type: [ResponseUserDto] })
  users: ResponseUserDto[];

  constructor(users: Partial<ResponseUserDto>[] = [], count = 0) {
    this.users = users.map((u) => new ResponseUserDto(u));
  }
}

export class SessionDto {
  @ApiProperty({
    description: 'Session unique identifier',
    example: '77cb19e2-c72b-468a-af4a-a09da9649ffb',
  })
  id: string;

  @ApiProperty({
    description: 'Authentication token',
    example: 'TVxGrA8AkuAazVpbbwGxv18PA6BsGzxx',
  })
  token: string;

  @ApiProperty({
    description: 'Session expiration date',
    type: String,
    example: '2025-10-28T01:44:59.558Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
    type: String,
    example: '2025-10-21T01:44:59.558Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session last update timestamp',
    type: String,
    example: '2025-10-21T01:44:59.558Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'IP address from where session was created',
    example: '192.168.1.1',
  })
  ipAddress: string;

  @ApiProperty({
    description: 'User agent from where session was created',
    example: 'Mozilla/5.0...',
  })
  userAgent: string;

  @ApiProperty({
    description: 'User ID associated with this session',
    example: 'a6c69fe0-e2b1-496f-b5e1-83e7d812b626',
  })
  userId: string;

  @ApiProperty({
    description: 'ID of user who impersonated this session',
    required: false,
    nullable: true,
    example: null,
  })
  impersonatedBy?: string | null;

  constructor(data: Partial<SessionDto>) {
    this.id = data.id ?? '';
    this.token = data.token ?? '';
    this.expiresAt = data.expiresAt ?? new Date();
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    this.ipAddress = data.ipAddress ?? '';
    this.userAgent = data.userAgent ?? '';
    this.userId = data.userId ?? '';
    this.impersonatedBy = data.impersonatedBy;
  }
}

export class ResponseUserWithSessionDto {
  @ApiProperty({ description: 'User data', type: ResponseUserDto })
  user: ResponseUserDto;

  @ApiProperty({
    description: 'Session data with authentication token and metadata',
    required: false,
    type: SessionDto,
    nullable: true,
    example: {
      id: '77cb19e2-c72b-468a-af4a-a09da9649ffb',
      token: 'TVxGrA8AkuAazVpbbwGxv18PA6BsGzxx',
      expiresAt: '2025-10-28T01:44:59.558Z',
      createdAt: '2025-10-21T01:44:59.558Z',
      updatedAt: '2025-10-21T01:44:59.558Z',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      userId: 'a6c69fe0-e2b1-496f-b5e1-83e7d812b626',
      impersonatedBy: null,
    },
  })
  session?: SessionDto | null;

  constructor(user: ResponseUserDto, session?: SessionDto | null) {
    this.user = user;
    this.session = session;
  }
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication token',
    example: 'eWUo0CLnuj8LmcEkiVCwFSkXDvzAdPFk',
  })
  token: string;

  @ApiProperty({
    description: 'User data',
    type: ResponseUserDto,
  })
  user: ResponseUserDto;

  constructor(data: { token: string; user: any }) {
    this.token = data.token;
    this.user = new ResponseUserDto(data.user);
  }
}
