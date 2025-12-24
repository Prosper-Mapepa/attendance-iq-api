import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('Starting application...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', process.env.PORT || 3002);
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Enable CORS
    const corsOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
      
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Health check endpoint - register early, before database connection
    app.getHttpAdapter().get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    console.log('Health endpoint registered');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AttendIQ API')
    .setDescription('API for classroom attendance management with QR + OTP system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3002;
    console.log(`Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Application is running on: http://0.0.0.0:${port}`);
    console.log(`✅ Swagger documentation: http://0.0.0.0:${port}/api`);
    console.log(`✅ Health check available at: http://0.0.0.0:${port}/health`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

bootstrap();

