import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { signupSchema, signinSchema, findidSchema, duplication, findpwSchema, updatePwSchema, kakaoIdSchema, updateNkSchema, pointStackSchema } from 'src/dto/user.dto';
import { User } from 'src/model/User.Model';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import sequelize from 'sequelize';
import { Avatar } from 'src/model/Avatar.Model';
import { Product } from 'src/model/Product.Model';
import { AuthCode } from 'src/model/AuthCode.Model';
import { Order } from 'src/model/Order.model';

type signupDTO = z.infer<typeof signupSchema>;
type signinDTO = z.infer<typeof signinSchema>;
type dupliCDTO = z.infer<typeof duplication>;
type findidDTO = z.infer<typeof findidSchema>;
type findpwDTO = z.infer<typeof findpwSchema>;
type updaPwDTO = z.infer<typeof updatePwSchema>;
type updaNkDTO = z.infer<typeof updateNkSchema>;
type kakaoIDTO = z.infer<typeof kakaoIdSchema>;
type pointSDTO = z.infer<typeof pointStackSchema>;

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(Avatar) private readonly avatar: typeof Avatar,
        @InjectModel(Order) private readonly order: typeof Order,
        private readonly jwt: JwtService) { }

    // 유저 회원가입
    async signup(signupUser: signupDTO) {
        try {
            const { email, userName, nickName, birthDate, phoneNumber, password } = signupUser;

            const birth = new Date(birthDate);
            const today = new Date();

            if (birth > today) {
                throw new BadRequestException('생년월일은 오늘 이전이어야 합니다.')
            }

            const salt = 10;
            const hashedPassword = await bcrypt.hash(password, salt);
            // console.log(hashedPassword);
            const userData = await this.userModel.create({
                email, userName, nickName, birthDate, phoneNumber, password: hashedPassword
            })
            await this.avatar.create({ email });
            return userData;

        } catch (error) {
            // console.error(error);
            console.log("signup service error");
        }
    }

    // 유저 로그인
    async signin(signinUser: signinDTO) {
        const { email, password } = signinUser;

        try {
            const user = await this.userModel.findOne({
                where: { email }, include: [{
                    model: Avatar,
                    include: [Product]
                }, {
                    model: AuthCode,
                    as: 'authcode'
                }]
            });

            const upw = await bcrypt.compare(password, user.password);

            if (upw === false) {
                throw new BadRequestException(2);
            }

            return user;

        } catch (error) {
            throw new BadRequestException(error, "service error")
        }
    }

    /**
     * 아이디 또는 닉네임 또는 연락처 중복 검사
     * @param user.userid
     * @param user.nickname
     * @param user.phoneNumber
     * @returns userid, nickname, phoneNumber
     */
    async duplication(user: dupliCDTO) {
        const Op = sequelize.Op

        const { email = null, nickName = null, phoneNumber = null } = user;

        const data = await this.userModel.findOne({ where: { [Op.or]: [{ email }, { nickName }, { phoneNumber }] } });

        console.log(data, 'data')

        if (data) {
            if (email) {
                throw new BadRequestException("아이디가 중복 되었습니다.")
            }

            if (nickName) {
                throw new BadRequestException("닉네임이 중복 되었습니다.")
            }

            if (phoneNumber) {
                throw new BadRequestException("연락처가 중복 되었습니다.")
            }
        }

        return null;
    }

    // 아이디 찾기 (휴대폰 번호로 조회)
    async findId(user: findidDTO) {
        const { phoneNumber } = user
        const data = await this.userModel.findOne({ where: { phoneNumber } })

        if (data) {
            return data.dataValues.email;
        }
        return null;
    }

    // 비밀번호 찾기
    async findPw(user: findpwDTO) {
        const { email } = user;
        const data = await this.userModel.findOne({ where: { email } });

        if (data) {
            return true
        }
        return false;
    }

    // 비밀번호 변경
    async updatePw(user: updaPwDTO, token: string) {
        try {
            const { password } = user
            const { email } = this.jwt.verify(token)

            const salt = 10;
            const hashedPassword = await bcrypt.hash(password, salt);
            console.log(hashedPassword, 'hash');
            const data = await this.userModel.update({ password: hashedPassword }, { where: { email } })
            console.log(data, 'service');
            return data;
        } catch (error) {
            console.error(error)
        }
    }

    // 닉네임 변경
    async updateNk(user: updaNkDTO, token: string) {
        const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY })
        const { nickName } = user;
        const data = await this.userModel.update({ nickName }, { where: { email } })
        console.log(data);

        return data;
    }

    // 회원 탈퇴
    async deleteUser(token: string) {
        try {
            const { email } = this.jwt.verify(token);

            const result = await this.userModel.destroy({ where: { email } })

            if (result === 0) {
                throw new BadRequestException('유저를 찾을 수 없습니다.')
            }

            return result;
        }
        catch (error) {
            throw new BadRequestException(error, 'deleteUser');
        }
    }

    // 카카오 아이디 조회
    async findKakao(user: kakaoIDTO) {
        try {
            // const kakaoID = await this.userModel.findOne({ where: { email: user } });
            const kakaoID = await this.userModel.findOne({
                where: { email: user }, include: [{
                    model: Avatar,
                    include: [Product]
                }, {
                    model: AuthCode,
                    as: 'authcode'
                }]
            });
            return kakaoID;
        }
        catch (error) {
            throw new BadRequestException('findKakao Error')
        }
    }

    // 포인트 적립
    async pointStack(addPoint: pointSDTO, token: string) {
        try {
            const { point } = addPoint;
            const { email } = this.jwt.verify(token);

            const user = await this.userModel.findOne({ where: { email } })

            let userPoint = user.point || 0;
            userPoint += point;
            // console.log(userPoint, 'userPoint')

            const AddPoint = await this.userModel.update({ point: userPoint }, { where: { email } })
            // console.log(AddPoint, 'service pointStack');

            return AddPoint;

        } catch (error) {
            console.error(error, 'pointStack Service Error');
            throw new BadRequestException('pointStack Error')
        }
    }

    // 유저 토큰
    userToken(token: object) {
        // 토큰 생성
        return this.jwt.sign(token, { expiresIn: 60 * 30 * 1000, secret: process.env.JWT_KEY });
    }

    // 토큰 복호화
    verifyToken(jwt: string) {
        return this.jwt.verify(jwt);
    }

    // 토큰이 있는지 체크
    isToken(token: string) {
        if (!token) {
            return '토큰이 없어용'
        }
        return token;
    }

    async getUserInfo(token: string) {
        try {
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY });
            const data = await this.userModel.findOne({
                attributes: ["email", "nickName", "point"],
                where: { email },
                include: [{
                    model: AuthCode,
                    attributes: ["auth"],
                    as: "authcode"
                }, {
                    model: Avatar,
                    include: [{
                        model: Product,
                        attributes: ["image"]
                    }]
                }
                ],
            });
            const obj = {
                email: data.email,
                nickName: data.nickName,
                point: data.point,
                auth: data.authcode.auth,
                image: data.avatar.product.image
            };
            // console.log(obj)
            return obj;
        } catch (error) {
            console.error(error);
        }
    }
    /**
     * 유저의 구매항목을 조회
     * @param token 
     */
    async getMyOrder(page: number, token: string) {
        try {
            const itemCount = 12;
            const { email } = this.jwt.verify(token, { secret: process.env.JWT_KEY })
            const data = await this.order.findAll({
                where: { email },
                order: [["createdAt", "desc"]],
                offset: Number((page - 1) * itemCount),
                limit: itemCount,
                include: [{
                    model: Product,
                }]
            })
            console.log(data);
            return data;
        } catch (error) {
            console.error(error);
            return error;
        }
    }
}
