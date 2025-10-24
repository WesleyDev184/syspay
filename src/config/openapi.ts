import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export async function openApiConfig(app: INestApplication<any>) {
  const config = new DocumentBuilder()
    .setTitle('SysPay API')
    .setDescription(
      'Toda request sendo um sucesso vai ter esse padrão de dados ou single ou list, o que mostra em cada requisição e o data do objeto.\n\n' +
        '### Formatos Padrões dos Dados (single/List)\n' +
        '```json\n' +
        '{\n' +
        '  "status": "success",\n' +
        '  "mensagem": "Exemplo",\n' +
        '  "data": {}\n' +
        '}\n' +
        '{\n' +
        '  "status": "success",\n' +
        '  "mensagem": "Exemplo",\n' +
        '  "count": 1\n' +
        '  "data": []\n' +
        '}\n' +
        '```',
    )
    .setVersion('1.0')
    .build();

  const doc = SwaggerModule.createDocument(app, config);

  app.use(
    '/docs',
    apiReference({
      theme: 'deepSpace',
      content: doc,
    }),
  );
}
