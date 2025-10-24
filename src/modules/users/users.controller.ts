import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  OmitType,
} from '@nestjs/swagger';
import { ApiListResponse, ApiResponse } from '@shared/dto/api-response.dto';
import { AuthGuard, UserSession } from '@thallesp/nestjs-better-auth';
import { Request, Response } from 'express';
import { AUTH, AuthType } from '../../config/auth/auth.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserQueryDto, ListUsersQueryDto } from './dto/query.dto';
import {
  AuthResponseDto,
  ResponseUserDto,
  ResponseUserErrorDto,
  ResponseUserListDto,
  ResponseUserWithSessionDto,
  SessionDto,
} from './dto/reponse-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(@Inject(AUTH) private readonly auth: AuthType) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar novo usuário',
    description:
      'Cria uma nova conta de usuário no sistema e retorna um token de autenticação. O usuário será automaticamente autenticado após o registro.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou email já cadastrado',
    type: ResponseUserErrorDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    type: ResponseUserErrorDto,
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<AuthResponseDto>> {
    // Usa a API do better-auth que automaticamente configura os cookies
    const result = await this.auth.api.signUpEmail({
      body: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        image: createUserDto.image,
        rememberMe: createUserDto.rememberMe,
        document: createUserDto.document,
        phoneNumber: createUserDto.phoneNumber,
      },
      asResponse: true,
    });

    // Copia os cookies da resposta do better-auth para a resposta HTTP
    const setCookieHeader = result.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('set-cookie', setCookieHeader);
    }

    // Converte a resposta para JSON
    const data = await result.json();

    // Monta a resposta usando o construtor
    const authResponse = new AuthResponseDto({
      token: data.token,
      user: data.user,
    });

    return ApiResponse.success('Usuário registrado com sucesso', authResponse);
  }

  // rota para admin criar um novo usuario
  @Post('create-client')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Criar novo Cliente',
    description:
      'Permite que administradores criem novos clientes no sistema. Requer autenticação com permissões de administrador.',
  })
  @ApiBody({ type: OmitType(CreateUserDto, ['rememberMe'] as const) })
  @ApiCreatedResponse({
    description: 'Cliente criado com sucesso',
    type: ResponseUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou email já cadastrado',
    type: ResponseUserErrorDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ResponseUserErrorDto,
  })
  async createByAdmin(
    @Req() req: Request,
    @Body() createUserDto: CreateUserDto,
    @Query() query: CreateUserQueryDto,
  ): Promise<ApiResponse<ResponseUserDto>> {
    const result = await this.auth.api.createUser({
      headers: {
        cookie: req.headers.cookie || '',
      },
      body: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        data: {
          document: createUserDto.document,
          image: createUserDto.image,
          phoneNumber: createUserDto.phoneNumber,
        },
        role: query.role,
      },
    });

    const userDto = new ResponseUserDto(result.user);
    return ApiResponse.success('Cliente criado com sucesso', userDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fazer login',
    description:
      'Autentica um usuário existente usando email e senha. Retorna um token de autenticação e define cookies de sessão.',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Credenciais inválidas ou dados incorretos',
    type: ResponseUserErrorDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Email ou senha incorretos',
    type: ResponseUserErrorDto,
  })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<AuthResponseDto>> {
    // Usa a API do better-auth para fazer login
    const result = await this.auth.api.signInEmail({
      body: {
        email: loginUserDto.email,
        password: loginUserDto.password,
        rememberMe: loginUserDto.rememberMe,
      },
      asResponse: true,
    });

    if (!result.ok) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Copia os cookies da resposta do better-auth para a resposta HTTP
    const setCookieHeader = result.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('set-cookie', setCookieHeader);
    }

    // Converte a resposta para JSON
    const data = await result.json();

    // Monta a resposta usando o construtor
    const authResponse = new AuthResponseDto({
      token: data.token,
      user: data.user,
    });

    return ApiResponse.success('Login realizado com sucesso', authResponse);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Fazer logout',
    description:
      'Encerra a sessão atual do usuário autenticado. Remove os cookies de autenticação e invalida o token.',
  })
  @ApiOkResponse({
    description: 'Logout realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout realizado com sucesso' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado - Token inválido ou expirado',
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<ApiResponse<void>> {
    const result = await this.auth.api.signOut({
      headers: {
        cookie: req.headers.cookie || '',
      },
      asResponse: true,
    });

    // Copia os cookies da resposta do better-auth para a resposta HTTP
    const setCookieHeader = result.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('set-cookie', setCookieHeader);
    }

    return ApiResponse.success('Logout realizado com sucesso');
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Lista todos os usuários do sistema com suporte a paginação, ordenação e filtragem. ' +
      'É possível filtrar por campos específicos, ordenar por diferentes critérios e paginar os resultados. ' +
      'Requer autenticação.',
  })
  @ApiOkResponse({ type: ResponseUserListDto })
  async findAll(
    @Req() req: Request,
    @Query() query: ListUsersQueryDto,
    @Session() session: UserSession,
  ): Promise<ApiListResponse<ResponseUserDto>> {
    const isAdmin = await this.auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        role: 'admin',
        permissions: {
          user: ['list'],
        },
      },
    });

    if (!isAdmin.success) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar usuários',
      );
    }

    const result = await this.auth.api.listUsers({
      headers: {
        cookie: req.headers.cookie || '',
      },
      query: {
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
        filterField: query.filterField,
        filterValue: query.filterValue,
        filterOperator: query.filterOperator,
      },
    });

    const users = result.users.map((user) => new ResponseUserDto(user));
    return ApiListResponse.success('Usuários recuperados com sucesso', users);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description:
      'Retorna os dados completos do usuário atualmente autenticado, incluindo informações da sessão ativa. ' +
      'Este endpoint permite que o usuário consulte seu próprio perfil e dados de sessão.',
  })
  @ApiOkResponse({ type: ResponseUserWithSessionDto })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async findOne(
    @Session() session: UserSession,
  ): Promise<ApiResponse<ResponseUserWithSessionDto>> {
    const user = new ResponseUserDto(session.user);
    const sessionData = session.session
      ? new SessionDto(session.session)
      : null;

    const response = new ResponseUserWithSessionDto(user, sessionData);
    return ApiResponse.success('Perfil recuperado com sucesso', response);
  }

  @Patch()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Atualizar dados do usuário',
    description:
      'Atualiza as informações do usuário autenticado. É possível atualizar nome, imagem, documento e telefone. ' +
      'Todos os campos são opcionais, permitindo atualizações parciais. Requer autenticação.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuário atualizado com sucesso' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async update(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<void>> {
    await this.auth.api.updateUser({
      headers: {
        cookie: req.headers.cookie || '',
      },
      body: {
        name: updateUserDto.name,
        image: updateUserDto.image,
        document: updateUserDto.document,
        phoneNumber: updateUserDto.phoneNumber,
      },
    });

    return ApiResponse.success('Usuário atualizado com sucesso');
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Excluir usuário',
    description:
      'Remove permanentemente o usuário autenticado do sistema. ' +
      'É necessário fornecer a senha atual para confirmar a exclusão. ' +
      'Esta ação é irreversível e todas as sessões ativas serão invalidadas.',
  })
  @ApiBody({
    type: DeleteUserDto,
  })
  @ApiOkResponse({
    description: 'Usuário removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuário removido com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async remove(
    @Req() req: Request,
    @Body() body: DeleteUserDto,
  ): Promise<ApiResponse<void>> {
    const result = await this.auth.api.deleteUser({
      body: {
        password: body.password,
      },
      headers: {
        cookie: req.headers.cookie || '',
      },
    });

    return ApiResponse.success(result.message);
  }
}
