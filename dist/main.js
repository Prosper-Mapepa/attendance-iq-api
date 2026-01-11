"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    try {
        console.log('Starting application...');
        console.log('Environment:', process.env.NODE_ENV || 'development');
        console.log('Port:', process.env.PORT || 3002);
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log'],
        });
        const corsOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(origin => {
                return origin.trim().replace(/\/+$/, '');
            })
            : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
        console.log('CORS origins configured:', corsOrigins);
        app.enableCors({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                const normalizedOrigin = origin.replace(/\/+$/, '');
                if (corsOrigins.includes(normalizedOrigin)) {
                    callback(null, true);
                }
                else {
                    console.warn(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.getHttpAdapter().get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });
        console.log('Health endpoint registered');
        const config = new swagger_1.DocumentBuilder()
            .setTitle('AttendIQ API')
            .setDescription('API for classroom attendance management with QR + OTP system')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, document);
        const port = process.env.PORT || 3002;
        console.log(`Starting server on port ${port}...`);
        await app.listen(port, '0.0.0.0');
        console.log(`✅ Application is running on: http://0.0.0.0:${port}`);
        console.log(`✅ Swagger documentation: http://0.0.0.0:${port}/api`);
        console.log(`✅ Health check available at: http://0.0.0.0:${port}/health`);
    }
    catch (error) {
        console.error('❌ Failed to start application:', error);
        console.error('Error details:', error instanceof Error ? error.stack : error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map