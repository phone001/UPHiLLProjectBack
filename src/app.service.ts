import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuthCode } from './model/AuthCode.Model';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { User } from './model/User.Model';
import { Product } from './model/Product.Model';
import { Avatar } from './model/Avatar.Model';
@Injectable()
export class AppService {
  constructor(@InjectModel(AuthCode) private authcode: typeof AuthCode,
    private sequelize: Sequelize, private config: ConfigService,
    @InjectModel(User) private user: typeof User,
    @InjectModel(Product) private product: typeof Product,
    @InjectModel(Avatar) private avatar: typeof Avatar
  ) {
    const init = async () => {
      const adminID = this.config.get("ADMIN_USER_ID") as string;
      const adminPW = this.config.get("ADMIN_USER_PASSWORD") as string;
      this.initAdminCode();
      await this.initAdminUser(adminID, adminPW);
      await this.initAtavar(adminID);
    }
    init();
  }

  /**
   * 초기 관리자 유저의 설정
   */
  async initAdminUser(email: string, password: string) {
    try {
      const adminPW = await hash(password, 10);
      const admin = await this.user.findOne({ where: { email } });
      if (!admin) {
        await this.user.create({
          email: email,
          password: adminPW,
          auth: 2,
          phoneNumber: '02-0000-0000',
          nickName: '관리자'
        })
      }
    } catch (error) {
      console.log(error);
    }
  }
  /**
   * 초기 관리자 유저에 관한 권한 코드 설정
   */
  initAdminCode() {
    try {
      this.authcode.findAll().then((result) => {
        if (result.length === 0) {
          const content = readFileSync(join(__dirname, "static", "sql", "AuthInit.sql"), { encoding: 'utf8' });
          this.sequelize.query(content.toString());
        }
      }).catch((error) => {
        console.error("에러발생", error);
      })
    } catch (error) {
      console.error(error)
    }
  }
  /**
   * 초기 아바타 생성
   */
  async initAtavar(email: string) {
    const pData = await this.product.findOne({ where: { name: "initAvatar" } });
    if (!pData)
      await this.product.create({
        name: 'initAvatar',
        price: 0,
        image: "/img/user.png",
        type: 'avatar',
      })
    const pData2 = await this.product.findOne({ where: { name: "initAvatar" } });
    const avatarData = await this.avatar.findOne({ where: { email } });
    if (!avatarData)
      await this.avatar.create({ email, productid: pData2.id });
  }
}

