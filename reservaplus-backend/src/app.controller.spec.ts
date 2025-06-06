import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();

      expect(result).toMatchObject({
        success: true,
        message: 'ReservaPlus API is running!',
        version: '1.0.0',
      });
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getStatus', () => {
    it('should return system status', () => {
      const result = appController.getStatus();

      expect(result).toMatchObject({
        success: true,
        data: {
          uptime: expect.any(Number),
          environment: expect.any(String),
          version: '1.0.0',
          node: expect.any(String),
        },
      });
      expect(result).toHaveProperty('timestamp');
    });
  });
});
