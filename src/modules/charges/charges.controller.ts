import { AUTH, AuthType } from '@config/auth/auth.provider';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Session,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { ApiResponse } from '@shared/dto/api-response.dto';
import { AuthGuard, UserSession } from '@thallesp/nestjs-better-auth';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { QueryChargeDto } from './dto/query-charge.dto';
import { ChargeResponseDto } from './dto/response-charge.dto';
import { UpdateChargeStatusDto } from './dto/update-charge.dto';

@ApiTags('Charges')
@Controller('charges')
export class ChargesController {
  constructor(
    private readonly chargesService: ChargesService,
    @Inject(AUTH) private readonly auth: AuthType,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar uma nova cobrança',
    description:
      'Cria uma nova cobrança vinculada a um cliente existente. Suporta PIX, Cartão de Crédito e Boleto Bancário.',
  })
  @ApiBody({ type: CreateChargeDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Cobrança criada com sucesso',
    type: ChargeResponseDto,
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Dados inválidos ou método de pagamento sem dados específicos',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @SwaggerApiResponse({
    status: 409,
    description: 'Chave de idempotência já utilizada',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  @ApiForbiddenResponse({ description: 'Sem permissão para criar cobranças' })
  async create(
    @Body() createChargeDto: CreateChargeDto,
    @Session() session: UserSession,
  ): Promise<ApiResponse<ChargeResponseDto>> {
    const result = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          payment: ['create'],
        },
      },
    });

    if (!result.success) {
      throw new ForbiddenException(
        'Você não tem permissão para criar cobranças',
      );
    }

    const charge = await this.chargesService.create(createChargeDto);
    return ApiResponse.success('Cobrança criada com sucesso', charge);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Listar cobranças',
    description:
      'Lista todas as cobranças com possibilidade de filtros por usuário, status e método de pagamento.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Lista de cobranças',
    type: [ChargeResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  @ApiForbiddenResponse({
    description: 'Sem permissão para visualizar cobranças',
  })
  async findAll(
    @Query() queryDto: QueryChargeDto,
    @Session() session: UserSession,
  ) {
    const result = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          payment: ['listAll'],
        },
      },
    });

    if (!result.success) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar cobranças',
      );
    }

    return this.chargesService.findAll(queryDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Buscar cobrança por ID',
    description:
      'Retorna os detalhes de uma cobrança específica incluindo dados do método de pagamento.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cobrança',
    type: String,
    format: 'uuid',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Cobrança encontrada',
    type: ChargeResponseDto,
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Cobrança não encontrada',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  @ApiForbiddenResponse({
    description: 'Sem permissão para visualizar cobranças',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ) {
    const result = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          payment: ['list'],
        },
      },
    });

    const isAdmin = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        role: 'admin',
        permissions: {
          payment: ['listAll'],
        },
      },
    });

    // Se for admin, pode ver qualquer cobrança, senão só as suas
    if (isAdmin.success) {
      return this.chargesService.findOne(id);
    } else if (result.success) {
      const res = await this.chargesService.findOne(id);
      const validUser = res.userId === session.user.id;
      if (!validUser) {
        throw new ForbiddenException(
          'Você não tem permissão para visualizar esta cobrança',
        );
      }
      return res;
    }

    throw new ForbiddenException(
      'Você não tem permissão para visualizar esta cobrança',
    );
  }
  @Patch(':id/status')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Atualizar status da cobrança',
    description:
      'Atualiza o status de uma cobrança. Valida transições permitidas (ex: PENDING → PAID, PAID → REFUNDED).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cobrança',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateChargeStatusDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
    type: ChargeResponseDto,
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Transição de status inválida',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Cobrança não encontrada',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  @ApiForbiddenResponse({
    description: 'Sem permissão para atualizar cobranças',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateChargeStatusDto,
    @Session() session: UserSession,
  ) {
    const result = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          payment: ['update'],
        },
      },
    });

    if (!result.success) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar cobranças',
      );
    }

    return this.chargesService.updateStatus(id, updateDto);
  }
}
