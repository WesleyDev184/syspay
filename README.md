# Sistema de Pagamentos

Sistema de gerenciamento de pagamentos desenvolvido com NestJS, Prisma e PostgreSQL, suportando múltiplos métodos de pagamento (PIX, Cartão de Crédito e Boleto).

## Iniciando o Sistema

### Pré-requisitos

- Docker
- Docker Compose

### Passos para Inicialização

1. **Inicie os containers com Docker Compose**

```bash
docker compose up -d
```

Este comando irá:

- Criar e iniciar o container do PostgreSQL
- Criar e iniciar o container da aplicação NestJS
- Executar as migrations do Prisma automaticamente

2. **Verifique se os containers estão rodando**

```bash
docker compose ps
```

3. **Acesse a aplicação**

- API: `http://localhost:5000/api`
- Documentação Swagger: `http://localhost:5000/docs`

### Comandos Úteis

```bash
# Parar os containers
docker compose down

# Ver logs da aplicação
docker compose logs -f app

# Ver logs do banco de dados
docker compose logs -f db

# Reconstruir os containers
docker compose up -d --build
```

---

## Estrutura do Banco de Dados

O sistema utiliza PostgreSQL com Prisma ORM. Abaixo está a explicação detalhada do schema e seus relacionamentos.

### Modelos e Relacionamentos

#### **User (Usuário)**

Representa os usuários do sistema (clientes que realizam pagamentos).

**Campos principais:**

- `id`: Identificador único (UUID)
- `name`: Nome do usuário
- `email`: Email único do usuário
- `document`: CPF/CNPJ (único)
- `phoneNumber`: Telefone (único)
- `role`: Papel/função do usuário
- `banned`: Status de banimento
- `emailVerified`, `phoneNumberVerified`: Status de verificação

**Relacionamentos:**

- **1:N com Session**: Um usuário pode ter várias sessões ativas
- **1:N com Account**: Um usuário pode ter várias contas vinculadas (para diferentes provedores de autenticação)
- **1:N com Charge**: Um usuário pode ter várias cobranças associadas

---

#### **Session (Sessão)**

Gerencia as sessões de autenticação dos usuários.

**Campos principais:**

- `token`: Token único da sessão
- `expiresAt`: Data de expiração
- `ipAddress`: Endereço IP da sessão
- `userAgent`: Informações do navegador/cliente
- `impersonatedBy`: Para casos de representação de usuário (admin)

**Relacionamentos:**

- **N:1 com User**: Cada sessão pertence a um usuário (com cascade delete)

---

#### **Account (Conta)**

Armazena informações de contas de autenticação de diferentes provedores (OAuth, email/senha, etc.).

**Campos principais:**

- `accountId`: ID da conta no provedor
- `providerId`: Identificador do provedor (Google, GitHub, etc.)
- `accessToken`, `refreshToken`: Tokens OAuth
- `password`: Senha criptografada (para autenticação local)

**Relacionamentos:**

- **N:1 com User**: Cada conta pertence a um usuário (com cascade delete)

---

#### **Verification (Verificação)**

Gerencia códigos de verificação para email, telefone, reset de senha, etc.

**Campos principais:**

- `identifier`: Identificador (email, telefone)
- `value`: Código/token de verificação
- `expiresAt`: Data de expiração

---

#### **Charge (Cobrança)**

**Modelo principal** que representa uma cobrança/transação no sistema.

**Campos principais:**

- `amount`: Valor da cobrança (Decimal com 2 casas decimais)
- `currency`: Moeda (BRL, USD, EUR)
- `paymentMethod`: Método de pagamento (PIX, CREDIT_CARD, BOLETO)
- `status`: Status da cobrança (PENDING, PAID, FAILED, EXPIRED, CANCELLED, REFUNDED)
- `description`: Descrição opcional
- `idempotencyKey`: Chave única para evitar cobranças duplicadas
- `paidAt`: Data do pagamento
- `expiresAt`: Data de expiração

**Relacionamentos:**

- **N:1 com User**: Cada cobrança pertence a um usuário (com cascade delete)
- **1:1 com PixPayment**: Dados específicos se o método for PIX (opcional)
- **1:1 com CreditCardPayment**: Dados específicos se o método for Cartão (opcional)
- **1:1 com BoletoPayment**: Dados específicos se o método for Boleto (opcional)

**Índices:**

- `userId`: Para buscas rápidas por usuário
- `status`: Para filtrar por status
- `idempotencyKey`: Para garantir unicidade

---

#### **PixPayment (Pagamento PIX)**

Armazena dados específicos para pagamentos via PIX.

**Campos principais:**

- `pixKey`: Chave PIX utilizada
- `qrCode`: URL do QR Code
- `qrCodeBase64`: Imagem do QR Code em Base64
- `emvCode`: Código EMV (PIX Copia e Cola)
- `expiresAt`: Data de expiração do PIX

**Relacionamentos:**

- **1:1 com Charge**: Relacionamento único com uma cobrança (com cascade delete)

---

#### **CreditCardPayment (Pagamento Cartão de Crédito)**

Armazena dados específicos para pagamentos via Cartão de Crédito.

**Campos principais:**

- `cardHolderName`: Nome do titular
- `cardLastDigits`: Últimos 4 dígitos (para exibição segura)
- `cardBrand`: Bandeira (Visa, Mastercard, etc.)
- `installments`: Número de parcelas
- `installmentAmount`: Valor de cada parcela
- `cardToken`: Token do gateway de pagamento (não armazena dados sensíveis)

**Relacionamentos:**

- **1:1 com Charge**: Relacionamento único com uma cobrança (com cascade delete)

---

#### **BoletoPayment (Pagamento Boleto)**

Armazena dados específicos para pagamentos via Boleto Bancário.

**Campos principais:**

- `barcode`: Código de barras
- `digitableLine`: Linha digitável
- `boletoUrl`: URL para visualizar/baixar o boleto
- `dueDate`: Data de vencimento

**Relacionamentos:**

- **1:1 com Charge**: Relacionamento único com uma cobrança (com cascade delete)

---

### Diagrama de Relacionamentos (Resumo)

```
User (1) ──────< (N) Session
 (1)
  │
  ├─────< (N) Account
  │
  └─────< (N) Charge
              │
              ├───── (1:1) PixPayment
              │
              ├───── (1:1) CreditCardPayment
              │
              └───── (1:1) BoletoPayment
```

### Enums

**ChargeStatus:** Estados de uma cobrança

- `PENDING`: Aguardando pagamento
- `PAID`: Pago
- `FAILED`: Falhou
- `EXPIRED`: Expirado
- `CANCELLED`: Cancelado
- `REFUNDED`: Reembolsado

**PaymentMethod:** Métodos de pagamento disponíveis

- `PIX`: Pagamento instantâneo
- `CREDIT_CARD`: Cartão de crédito
- `BOLETO`: Boleto bancário

**Currency:** Moedas suportadas

- `BRL`: Real brasileiro
- `USD`: Dólar americano
- `EUR`: Euro

---

## Tecnologias Utilizadas

- **NestJS**: Framework Node.js para construção de aplicações server-side
- **Prisma**: ORM moderno para Node.js e TypeScript
- **PostgreSQL**: Banco de dados relacional
- **Docker**: Containerização da aplicação
- **TypeScript**: Linguagem tipada baseada em JavaScript
