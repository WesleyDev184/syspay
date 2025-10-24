import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../shared/database/database.service';
import { CreateChargeDto, PaymentMethod } from './dto/create-charge.dto';
import { QueryChargeDto } from './dto/query-charge.dto';
import { ChargeResponseDto, ChargeStatus } from './dto/response-charge.dto';
import { UpdateChargeStatusDto } from './dto/update-charge.dto';

@Injectable()
export class ChargesService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Converte dados do Prisma para DTO de resposta
   * (converte Decimal para number)
   */
  private toResponseDto(charge: any): ChargeResponseDto {
    return {
      ...charge,
      amount: Number(charge.amount),
      pixData: charge.pixData,
      creditCardData: charge.creditCardData
        ? {
            ...charge.creditCardData,
            installmentAmount: Number(charge.creditCardData.installmentAmount),
          }
        : null,
      boletoData: charge.boletoData,
    };
  }

  async create(createChargeDto: CreateChargeDto) {
    // Validar que o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: createChargeDto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar idempotência
    if (createChargeDto.idempotencyKey) {
      const existingCharge = await this.prisma.charge.findUnique({
        where: { idempotencyKey: createChargeDto.idempotencyKey },
        include: {
          pixData: true,
          creditCardData: true,
          boletoData: true,
        },
      });

      if (existingCharge) {
        throw new BadRequestException({ message: 'Cobrança já existente' });
      }
    }

    // Validar dados específicos do método de pagamento
    this.validatePaymentMethodData(createChargeDto);

    // Criar a cobrança com os dados específicos
    try {
      const charge = await this.prisma.charge.create({
        data: {
          amount: new Prisma.Decimal(createChargeDto.amount),
          currency: createChargeDto.currency || 'BRL',
          paymentMethod: createChargeDto.paymentMethod,
          status: 'PENDING',
          description: createChargeDto.description,
          idempotencyKey: createChargeDto.idempotencyKey,
          userId: createChargeDto.userId,
          expiresAt: this.calculateExpirationDate(createChargeDto),
          // Incluir dados específicos do método de pagamento
          ...(createChargeDto.paymentMethod === PaymentMethod.PIX &&
            createChargeDto.pixData && {
              pixData: {
                create: {
                  pixKey: createChargeDto.pixData.pixKey,
                  expiresAt: new Date(createChargeDto.pixData.expiresAt),
                  // Aqui você integraria com um provedor de PIX real
                  qrCode: this.generateMockPixQRCode(),
                  emvCode: this.generateMockPixEmvCode(),
                },
              },
            }),
          ...(createChargeDto.paymentMethod === PaymentMethod.CREDIT_CARD &&
            createChargeDto.creditCardData && {
              creditCardData: {
                create: {
                  cardHolderName: createChargeDto.creditCardData.cardHolderName,
                  cardLastDigits: createChargeDto.creditCardData.cardLastDigits,
                  cardBrand: createChargeDto.creditCardData.cardBrand,
                  installments:
                    createChargeDto.creditCardData.installments || 1,
                  installmentAmount: new Prisma.Decimal(
                    createChargeDto.amount /
                      (createChargeDto.creditCardData.installments || 1),
                  ),
                  cardToken: createChargeDto.creditCardData.cardToken,
                },
              },
            }),
          ...(createChargeDto.paymentMethod === PaymentMethod.BOLETO &&
            createChargeDto.boletoData && {
              boletoData: {
                create: {
                  dueDate: new Date(createChargeDto.boletoData.dueDate),
                  // Aqui você integraria com um provedor de boleto real
                  barcode: this.generateMockBoletoBarcode(),
                  digitableLine: this.generateMockBoletoDigitableLine(),
                  boletoUrl: this.generateMockBoletoUrl(),
                },
              },
            }),
        },
        include: {
          pixData: true,
          creditCardData: true,
          boletoData: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.toResponseDto(charge);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Chave de idempotência já utilizada');
      }
      throw error;
    }
  }

  async findAll(queryDto: QueryChargeDto) {
    const where: Prisma.ChargeWhereInput = {};

    if (queryDto.userId) {
      where.userId = queryDto.userId;
    }

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.paymentMethod) {
      where.paymentMethod = queryDto.paymentMethod;
    }

    const charges = await this.prisma.charge.findMany({
      where,
      include: {
        pixData: true,
        creditCardData: true,
        boletoData: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return charges.map((charge) => this.toResponseDto(charge));
  }

  async findOne(id: string) {
    const charge = await this.prisma.charge.findUnique({
      where: { id },
      include: {
        pixData: true,
        creditCardData: true,
        boletoData: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    return this.toResponseDto(charge);
  }

  async updateStatus(id: string, updateDto: UpdateChargeStatusDto) {
    const charge = await this.findOne(id);

    // Validar transições de status permitidas
    this.validateStatusTransition(
      charge.status as ChargeStatus,
      updateDto.status,
    );

    const updatedCharge = await this.prisma.charge.update({
      where: { id },
      data: {
        status: updateDto.status,
        paidAt: updateDto.status === ChargeStatus.PAID ? new Date() : undefined,
      },
      include: {
        pixData: true,
        creditCardData: true,
        boletoData: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.toResponseDto(updatedCharge);
  }

  private validatePaymentMethodData(dto: CreateChargeDto): void {
    switch (dto.paymentMethod) {
      case PaymentMethod.PIX:
        if (!dto.pixData) {
          throw new BadRequestException(
            'Dados do PIX são obrigatórios quando o método é PIX',
          );
        }
        break;
      case PaymentMethod.CREDIT_CARD:
        if (!dto.creditCardData) {
          throw new BadRequestException(
            'Dados do cartão de crédito são obrigatórios quando o método é CREDIT_CARD',
          );
        }
        break;
      case PaymentMethod.BOLETO:
        if (!dto.boletoData) {
          throw new BadRequestException(
            'Dados do boleto são obrigatórios quando o método é BOLETO',
          );
        }
        break;
    }
  }

  private calculateExpirationDate(dto: CreateChargeDto): Date | undefined {
    switch (dto.paymentMethod) {
      case PaymentMethod.PIX:
        return dto.pixData ? new Date(dto.pixData.expiresAt) : undefined;
      case PaymentMethod.BOLETO:
        return dto.boletoData ? new Date(dto.boletoData.dueDate) : undefined;
      default:
        return undefined;
    }
  }

  private validateStatusTransition(
    currentStatus: ChargeStatus,
    newStatus: ChargeStatus,
  ): void {
    const allowedTransitions: Record<ChargeStatus, ChargeStatus[]> = {
      [ChargeStatus.PENDING]: [
        ChargeStatus.PAID,
        ChargeStatus.FAILED,
        ChargeStatus.EXPIRED,
        ChargeStatus.CANCELLED,
      ],
      [ChargeStatus.PAID]: [ChargeStatus.REFUNDED],
      [ChargeStatus.FAILED]: [],
      [ChargeStatus.EXPIRED]: [],
      [ChargeStatus.CANCELLED]: [],
      [ChargeStatus.REFUNDED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Não é possível alterar status de ${currentStatus} para ${newStatus}`,
      );
    }
  }

  // Métodos mock para simular integração com provedores
  private generateMockPixQRCode(): string {
    return `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}520400005303986`;
  }

  private generateMockPixEmvCode(): string {
    return `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865802BR`;
  }

  private generateMockBoletoBarcode(): string {
    return '23793381286000123456789012345678901234';
  }

  private generateMockBoletoDigitableLine(): string {
    return '23793.38128 60001.234567 89012.345678 9 01234567890123';
  }

  private generateMockBoletoUrl(): string {
    return `https://boleto.example.com/${crypto.randomUUID()}`;
  }
}
