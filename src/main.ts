import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const dotenv = require('dotenv')
import { join } from 'path';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: join(__dirname, "..", ".env.production") })
} else {
  dotenv.config({ path: join(__dirname, "..", ".env.develop") })
}

// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? "../.env.production" : "../.env.develop"
// })
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [process.env.HOST],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
  })

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle("UPHiLL API")
    .setDescription("UPHiLL API문서")
    .addTag("kakao")
    .addTag("user")
    .addTag("shop")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    ).build();
  // Swagger 설정

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(4000);
}

bootstrap();