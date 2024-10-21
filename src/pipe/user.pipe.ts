import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { signinSchema, signupSchema } from "src/dto/user.dto";

// 회원가입
export class SignUpPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        try {
            console.log(value);
            // DTO에서 가져온 스키마로 유효성 검사
            signupSchema.parse(value);
            return value;
        } catch (error) {
            console.log(error)
            throw new BadRequestException(error, 'SignUpPipe');
        }
    }
}

// 로그인
export class SignInPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        try {
            console.log(value);
            // DTO에서 가져온 스키마로 유효성 검사
            signinSchema.parse(value);
            return value;
        } catch (error) {
            throw new BadRequestException(error, 'SignInPipe');
        }
    }
}