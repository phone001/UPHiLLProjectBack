import { BadRequestException, Body, Controller, Delete, Get, ParseIntPipe, Post, Put, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { signupSchema, signinSchema, findidSchema, duplication, findpwSchema, updatePwSchema, updateNkSchema, pointStackSchema } from 'src/dto/user.dto';
import { Response, Request } from 'express';
import { UserInterceptor } from './interceptor/user.interceptor';
import { SignUpPipe, SignInPipe } from 'src/pipe/user.pipe';
import { z } from 'zod';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

type signupDTO = z.infer<typeof signupSchema>;
type signinDTO = z.infer<typeof signinSchema>;
type dupliCDTO = z.infer<typeof duplication>;
type findidDTO = z.infer<typeof findidSchema>;
type findpwDTO = z.infer<typeof findpwSchema>;
type updaPwDTO = z.infer<typeof updatePwSchema>;
type updaNkDTO = z.infer<typeof updateNkSchema>;
type pointSDTO = z.infer<typeof pointStackSchema>;

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // 회원가입
  @Post("signup")
  @ApiTags("user")
  @ApiOperation({ summary: "회원가입" })
  @ApiConsumes("application/json")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        userName: { type: "string" },
        nickName: { type: "string" },
        birthDate: { type: "string" },
        phoneNumber: { type: "string" },
        password: { type: "string" },
        checkPassword: { type: "string" }
      }
    }
  })
  async signup(@Body(SignUpPipe) signup: signupDTO, @Res() res: Response) {
    try {
      // console.log('signup');
      const result = await this.userService.signup(signup);
      // console.log(result, "result");
      res.send(result);
    } catch (error) {
      // console.error(error);
      throw new BadRequestException(error);
    }
  }

  // 로그인
  @Post("signin")
  @ApiTags("user")
  @ApiOperation({ summary: "로그인" })
  @ApiConsumes("application/json")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" }
      }
    }
  })
  async signin(@Body(SignInPipe) signin: signinDTO, @Res() res: Response) {
    try {
      console.log('signin');
      const _result = await this.userService.signin(signin);

      console.log(_result, '_result');

      const result = {
        email: _result.email,
        nickName: _result.nickName,
        image: _result.avatar.product.image,
        point: _result.point,
        auth: _result.authcode.auth
      }

      const token = this.userService.userToken(result);

      const date = new Date();
      date.setTime(date.getTime() + (5 * 60 * 60 * 1000));

      res.cookie('token', token, { httpOnly: true, expires: date, sameSite: 'none', secure: true, path: '/', domain: '127.0.0.1' });
      res.json(result)

    } catch (error) {
      // console.error(error.response.response, 'controller error');
      if (error.response.response === 2) {
        throw new BadRequestException('비밀번호가 맞지 않습니다.');
      }
      throw new BadRequestException('없는 유저 입니다.');
    }
  }

  // 카카오 로그인
  @Get("kakao")
  @ApiTags("kakao")
  @UseGuards(AuthGuard("kakao"))
  kakaoLogin() { }

  // 카카오 콜백
  @Get("kakao/callback")
  @ApiTags("kakao")
  @UseGuards(AuthGuard("kakao"))
  async kakaoLoginCallback(@Req() req: any, @Res() res: Response) {
    try {
      const date = new Date();

      const { user } = req;

      const random1 = Math.floor(Math.random() * 9000) + 1000;
      const random2 = Math.floor(Math.random() * 9000) + 1000;

      const phoneNumber = '010' + '-' + random1 + '-' + random2
      console.log(phoneNumber, 'phoneNumber')

      const findID = await this.userService.findKakao(user.id);

      // console.log(findID, 'findID')

      if (!findID) {
        await this.userService.signup({
          email: user.id,
          userName: user.username,
          nickName: user._json.properties.nickname,
          birthDate: "2005-01-21",
          phoneNumber,
          password: "",
        })
      }

      const findID2 = await this.userService.findKakao(user.id);

      // console.log(findID2, 'findID2');

      const payload = {
        email: findID2.email,
        nickName: findID2.nickName,
        image: findID2.avatar.product.image,
        point: findID2.point,
        auth: findID2.authcode.auth
      }

      const token = this.userService.userToken(payload);
      date.setMinutes(date.getMinutes() + 30);
      res.cookie("token", token, { httpOnly: true, expires: date })
      res.redirect('http://127.0.0.1:3000/main');

    } catch (error) {
      console.error(error);
      throw new BadRequestException('Kakao Controller Error')
    }
  }

  // 아이디 또는 닉네임 또는 휴대폰 중복검사
  @Post("duplication")
  @UseInterceptors(UserInterceptor)
  @ApiTags("user")
  @ApiOperation({ summary: "아이디 또는 닉네임 중복 검사" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string" },
        data: { type: "string" }
      }
    }
  })
  async duplication(@Body() duplication: dupliCDTO) {
    const data = await this.userService.duplication(duplication);
    console.log(data, 'controller');
    return data;
  }

  // 아이디 찾기
  @Post("findid")
  @ApiTags("user")
  @ApiOperation({ summary: "아이디 찾기" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        phoneNumber: { type: "string" }
      }
    }
  })
  async findId(@Body() findid: findidDTO) {
    const data = await this.userService.findId(findid)
    console.log(data);
    return data;
  }

  // 비밀번호 찾기
  @Post("findpw")
  @ApiTags("user")
  @ApiOperation({ summary: "비밀번호 찾기" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string" }
      }
    }
  })
  async findpw(@Body() findpw: findpwDTO) {
    const data = await this.userService.findPw(findpw);
    return data;
  }

  // 비밀번호 변경
  @Put("findpassword")
  @ApiTags("user")
  @ApiOperation({ summary: "비밀번호 변경" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        password: { type: "string" },
        checkpassword: { type: "string" }
      }
    }
  })
  async updatePw(@Body() updatepw: updaPwDTO, @Req() req: Request) {
    try {
      const { cookies: { token } } = req
      const data = await this.userService.updatePw(updatepw, token);

      console.log(data, 'controller');
      return data;
    } catch (error) {
      console.error(error)
    }
  }

  // 닉네임 변경
  @Put("nickName")
  @ApiTags("user")
  @ApiOperation({ summary: "닉네임 변경" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        nickName: { type: "string" }
      }
    }
  })
  async updateNk(@Body() updateNk: updaNkDTO, @Req() req: Request) {
    const { cookies: { token } } = req
    const data = await this.userService.updateNk(updateNk, token);
    console.log(data, 'controller');

    return data;
  }

  // 로그아웃
  @Post("logout")
  @ApiTags("user")
  @ApiOperation({ summary: "로그아웃" })
  async logout(@Res() res: Response) {
    try {
      res.clearCookie('token');
      res.redirect('http:127.0.0.1:3000');
    } catch (error) {
      throw new BadRequestException("Logout Error");
    }
  }

  // 회원 탈퇴
  @Delete("delete")
  @ApiTags("user")
  @ApiOperation({ summary: "회원 탈퇴" })
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    try {
      const { cookies: { token } } = req

      if (!token) {
        throw new BadRequestException('토큰이 없습니다.')
      }

      await this.userService.deleteUser(token);

      res.clearCookie('token');
      res.redirect('http://127.0.0.1:3000');
    } catch (error) {
      throw new BadRequestException(error, 'deleteUser')
    }
  }

  @Post("pointstack")
  @ApiTags("user")
  @ApiOperation({ summary: "포인트 적립" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        point: { type: "number" }
      }
    }
  })
  async pointStack(@Body() addPoint: pointSDTO, @Req() req: Request) {
    try {
      // console.log(addPoint, 'controller');
      const { cookies: { token } } = req;
      const data = await this.userService.pointStack(addPoint, token);
      console.log(data, 'controller pointStack');
      return data;
    } catch (error) {
      console.error(error, 'constroller pointstack')
      throw new BadRequestException('pointStack Error')
    }
  }

  @Post("userinfo")
  async getUserInfo(@Req() req: Request) {
    try {
      const { cookies: { token } } = req;
      return await this.userService.getUserInfo(token);
    } catch (error) {
      console.error(error);
    }
  }

  @Get("order")
  async getMyOrder(@Query("page", ParseIntPipe) page: number, @Req() req: Request) {
    try {
      const { cookies: { token } } = req;
      return await this.userService.getMyOrder(page, token);
    } catch (error) {
      console.error(error);
    }
  }

  @Get("token")
  async isToken(@Req() req: Request, @Res() res: Response) {
    const { cookies: { token } } = req;

    if (!token) {
      return res.redirect('http://127.0.0.1:3000');
    }

    res.send('정상 로그인 되어 있으시네요 !');
  }
}
