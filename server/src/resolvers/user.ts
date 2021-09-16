import argon2 from "argon2";
import { User } from "../entities/User";
import { Resolver, Mutation, Arg, Ctx, Query } from "type-graphql";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { LoginInput } from "../types/LoginInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constants";
import { ForgotPasswordInput } from "../types/ForgotPasswordInput";
import { sendEmail } from "../utils/sendEmail";
import { Tokenmodel } from "../model/Token";
import { v4 as uuidv4 } from "uuid";
import { ChangePasswordInput } from "../types/ChangePasswordInput";

@Resolver()
export class UserResovlver {
  @Query((_return) => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | null | undefined> {
    if (!req.session.userId) return null;
    const user = await User.findOne(req.session.userId);
    return user;
  }
  @Mutation((_return) => UserMutationResponse)
  async register(
    @Arg("registerInput") registerInput: RegisterInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    const validate = validateRegisterInput(registerInput);
    if (validate !== null) {
      return {
        code: 400,
        success: false,
        ...validate,
      };
    }

    const { username, email, password } = registerInput;
    try {
      const existingUser = await User.findOne({
        where: [{ username }, { email }],
      });
      if (existingUser)
        return {
          code: 400,
          success: false,
          message: "User/email existed",
          errors: [
            {
              field: existingUser.username === username ? "username" : email,
              message: `Username/email existed`,
            },
          ],
        };

      const hashedPassword = await argon2.hash(password);
      const newUser = User.create({
        username,
        password: hashedPassword,
        email,
      });

      const user = await newUser.save();
      req.session.userId = user.id;
      return {
        code: 200,
        success: true,
        message: "Registing user successfully",
        user,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => UserMutationResponse)
  async login(
    @Arg("loginInput") { usernameOrEmail, password }: LoginInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      const existingUser = await User.findOne(
        usernameOrEmail.includes("@")
          ? { email: usernameOrEmail }
          : { username: usernameOrEmail }
      );
      if (!existingUser) {
        return {
          code: 400,
          success: false,
          message: "User not found",
          errors: [
            {
              field: "usernameOrEmail",
              message: "Username or email incorrect",
            },
          ],
        };
      }

      const passwordValid = await argon2.verify(
        existingUser.password,
        password
      );

      if (!passwordValid) {
        return {
          code: 400,
          success: false,
          message: "Wrong password",
          errors: [{ field: "password", message: "Wrong password" }],
        };
      }
      //Create session and return cookie
      req.session.userId = existingUser.id;

      return {
        code: 200,
        success: true,
        message: "Logged  in successfully",
        user: existingUser,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => Boolean)
  async logout(@Ctx() { req, res }: Context): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((err) => {
        if (err) {
          console.log("session error", err);
          resolve(false);
        }

        resolve(true);
      });
    });
  }

  @Mutation((_return) => Boolean)
  async forgotPassword(
    @Arg("forgotPasswordInput") forgotPasswordInput: ForgotPasswordInput
  ): Promise<boolean> {
    const user = await User.findOne({ email: forgotPasswordInput.email });
    if (!user) return true;
    const resetToken = uuidv4();
    const hashedResetToken = await argon2.hash(resetToken);
    //if there is already token then delete the previous one
    await Tokenmodel.findOneAndDelete({ userId: `${user.id}` });
    //save token to db
    await new Tokenmodel({
      userId: `${user.id}`,
      token: hashedResetToken,
    }).save();
    //send reset password link to use via email
    await sendEmail(
      forgotPasswordInput.email,
      `<a href="http://localhost:3000/change-password?token=${resetToken}&userId=${user.id}">Reset Password</a>`
    );
    return true;
  }

  @Mutation((_return) => UserMutationResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("userId") userId: string,
    @Arg("changePasswordInput") changePasswordInput: ChangePasswordInput,
    @Ctx() {req}: Context
  ): Promise<UserMutationResponse> {
    if (changePasswordInput.newPassword.length <= 2) {
      return {
        code: 400,
        success: false,
        message: "Invalid Password",
        errors: [
          { field: "newPassword", message: "Length must be greater that 2" },
        ],
      };
    }

    try {
      const resetPassword = await Tokenmodel.findOne({ userId });
      if (!resetPassword) {
        return {
          code: 400,
          success: false,
          message: "Invalid or expried password reset token",
          errors: [
            {
              field: "token",
              message: "Invalid or expried password reset token",
            },
          ],
        };
      }

      const resetPasswordTokenValid = argon2.verify(resetPassword.token, token)

      if(!resetPasswordTokenValid){
        return {
          code: 400,
          success: false,
          message: "Invalid or expried password reset token",
          errors: [
            {
              field: "token",
              message: "Invalid or expried password reset token",
            },
          ],
        };
      }
      const userIdNum = parseInt(userId)
      const user = await User.findOne(userIdNum)
      if(!user){
        return {
          code: 400,
          success: false,
          message: "User no longer exists",
          errors: [
            {
              field: "token",
              message: "User no longer exists",
            },
          ],
        };
      }

      const updatedPassword = await argon2.hash(changePasswordInput.newPassword)
     
      await User.update({id: userIdNum}, {password: updatedPassword})
      await resetPassword.deleteOne()
      req.session.userId = user.id
      return {
        code: 200,
        success: true,
        message: "Password Changed!!",
        user
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }
}
