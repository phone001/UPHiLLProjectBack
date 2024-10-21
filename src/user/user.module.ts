import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { KaKaoStrategy } from './kakao.strategy';
import { ConfigModule } from '@nestjs/config';
import { User } from 'src/model/User.Model';
import { Avatar } from 'src/model/Avatar.Model';
import { AuthCode } from 'src/model/AuthCode.Model';
import { Order } from 'src/model/Order.model';
import { Product } from 'src/model/Product.Model';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SequelizeModule.forFeature([User, Avatar, AuthCode, Order, Product]),
  JwtModule.register({
    secret: process.env.JWT_KEY,
    signOptions: {
      expiresIn: "30m"
    }
  })],
  controllers: [UserController],
  providers: [UserService, {
    provide: "KAKAO_STRATEGY",
    useClass: KaKaoStrategy
  }],
})
export class UserModule { }
