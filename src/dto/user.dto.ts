import { z } from "zod";

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
const userNameRegex = /^[a-zA-Z가-힣\s-]{2,10}$/;
const nickNameRegex = /^[a-zA-Z가-힣0-9]{1,5}$/;
const birthDateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const phoneNumberRegex = /^01([0|1|6|7|8|9])-([0-9]{3,4})-([0-9]{4})$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

export const signupSchema = z.object({
    email: z.string().regex(emailRegex),
    userName: z.string().regex(userNameRegex),
    nickName: z.string().regex(nickNameRegex),
    birthDate: z.string().regex(birthDateRegex),
    phoneNumber: z.string().regex(phoneNumberRegex),
    password: z.string().regex(passwordRegex),
    checkPassword: z.string().regex(passwordRegex)
})

export const signinSchema = z.object({
    email: z.string().regex(emailRegex),
    password: z.string().regex(passwordRegex)
})

export const duplication = z.object({
    email: z.string().regex(emailRegex).nullable(),
    nickName: z.string().regex(nickNameRegex).nullable(),
    phoneNumber: z.string().regex(phoneNumberRegex)
})

export const findidSchema = z.object({
    phoneNumber: z.string().regex(phoneNumberRegex)
})

export const findpwSchema = z.object({
    email: z.string().regex(emailRegex)
})

export const updatePwSchema = z.object({
    password: z.string().regex(passwordRegex)
})

export const updateNkSchema = z.object({
    nickName: z.string().regex(nickNameRegex)
})

export const kakaoIdSchema = z.object({
    email: z.string()
})

export const pointStackSchema = z.object({
    point: z.number()
})