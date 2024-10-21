import { BadRequestException, Injectable, Put, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Avatar } from 'src/model/Avatar.Model';
import { Product } from 'src/model/Product.Model';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/model/User.Model';
import { Order } from 'src/model/Order.model';
import { AuthCode } from 'src/model/AuthCode.Model';
import { rmSync, readFileSync } from 'fs'
import { Sequelize } from 'sequelize-typescript';
import { join } from 'path';

const ItemCount = 12;

@Injectable()
export class ShopService {
    constructor(@InjectModel(Product) private product: typeof Product,
        @InjectModel(Avatar) private avatar: typeof Product,
        @InjectModel(User) private user: typeof User,
        @InjectModel(Order) private order: typeof Order,
        private jwt: JwtService
    ) { }


    /**
     * 특정 상품의 총 갯수 조회
     * @param type 
     * @returns 
     */
    async getPage(type: string) {
        try {
            const totalPage = Math.ceil(await this.product.count({ where: { type } }) / ItemCount);
            return totalPage;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }


    /**
     * 타입에 따른 모든 상품리스트
     * @param type
     * @returns productList || null
     */
    async findAll(type: string, page = 1 as number, token: string) {
        try {
            console.log(process.env.JWT_KEY)
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            return await this.product.findAll({
                where: { type },
                offset: Number((page - 1) * ItemCount),
                limit: ItemCount,
                include: [{
                    model: Order,
                    required: false,
                    where: { email }
                }]
            });
        } catch (error) {
            console.error(error);
            return null;
        }
    }
    /**
     * 유저가 보유한 상품
     * @param type
     * @returns productList || null
     */
    async myStorage(type: string, page = 1 as number, usage: boolean, token: string) {
        try {
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });

            const data = await this.order.findAll({
                where: { email, usage },
                offset: Number((page - 1) * ItemCount),
                limit: ItemCount,
                include: [{
                    model: Product,
                    where: { type },
                }],
            });
            console.log(data)
            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * 조회한 상품의 상세내용
     * @param id 
     * @returns 
     */
    async findOne(id: number) {
        try {
            return await this.product.findOne({ where: { id } });
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * 관리자에 의한 상품 추가
     * 요청한 유저가 관리자 권한이 없다면 에러
     * @param body 
     * @param file 
     */
    async createProduct(token: string, body: any, file: Express.Multer.File) {
        try {
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            // 권한 확인
            const isAdmin = await this.authCheck(email);
            if (!isAdmin) {
                throw new UnauthorizedException("current user is not admin");
            }
            body.image = `/imgs/${file.filename}`
            await this.product.create(body);
            console.log("success insert");
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * 관리자의 상품 변경
     * 이미지에 관한 정보가 없을 수 있다
     * @param body
     * @Param file
     * @returns boolean
     */
    async updateProduct(body: any, token: string, file?: Express.Multer.File) {
        try {
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            // 권한 확인
            const isAdmin = await this.authCheck(email);
            if (!isAdmin) {
                throw new UnauthorizedException("current user is not admin");
            }
            if (file) {
                body.image = "/img/" + file.filename;
            }
            await this.product.update(body, { where: { id: body.productId } });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }
    /**
     * 관리되지 않는 상품을 삭제
     * @param id 
     * @returns boolean
     */
    async deleteProduct(id: number, token: string): Promise<boolean> {
        try {
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            // 권한 확인
            // const isAdmin = await this.authCheck(email);
            // if (!isAdmin) {
            //     throw new UnauthorizedException("current user is not admin");
            // }
            await this.order.destroy({ where: { email, productid: id } });
            await this.product.destroy({ where: { id } });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * 상품 구매에 의해 사용자 포인트 차감과 구매내역 추가
     * @param token 
     * @param productId 
     * @returns 
     */
    async buy(token: string, productId: number): Promise<boolean> {
        try {
            const { email } = this.tokenVerify(token);

            const date = new Date();
            console.log(productId)
            const { dataValues: userInfo } = await this.user.findOne({ where: { email } });
            const { dataValues: productInfo } = await this.product.findOne({ where: { id: productId } });
            console.log(productInfo.id)
            // 상품 구매에 의한 사용자 포인트 차감
            await this.user.update({ point: parseInt(userInfo.point) - parseInt(productInfo.price) }, { where: { email } })

            // 구매내역 추가
            await this.order.create({
                email,
                data: date,
                productid: productInfo.id,
                price: parseInt(productInfo.price),
            })

            return true;
        } catch (error) {
            console.log(error);
            return false
        }
    }

    /**
     * 토큰 복호화
     * @param token 
     * @returns 
     */
    tokenVerify(token: string): any {
        try {
            const userInfo = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            return userInfo;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async authCheck(email: string) {
        try {
            // 권한 확인
            const { authcode: { auth } } = await this.user.findOne({ where: { email }, include: [AuthCode] })
            console.log(auth)
            if (parseInt(auth) !== 2) {
                return false
            }
            return true
        } catch (error) {
            console.error(error);
        }
    }
    async setUsage(orderId: number) {
        this.order.update({ usage: true }, { where: { id: orderId } })
    }

    /**
     * 착용중인 아바타 변경
     * @param token 
     * @param productid 
     */
    async setAvatar(token: string, productid: number) {
        try {
            console.log(process.env.JWT_KEY, "!!!!")
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });

            // 기존 착용중인 아바타 조회
            const data = await this.order.findOne({
                where: { email, usage: true },
                include: [{
                    model: Product,
                    where: { type: 'avatar' }
                }]
            })

            console.log(data)
            // 착용중인 아바타가 있으면 착용해제
            if (data) {
                const { id } = data;
                await this.order.update({ usage: false }, { where: { id } });
            }
            await this.avatar.update({ productid }, { where: { email } })
            await this.order.update({ usage: true }, { where: { email, productid } })
            console.log("변경완료");
        } catch (error) {
            console.error(error)
        }
    }
}
