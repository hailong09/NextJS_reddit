import { Context } from "../types/Context";
import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-errors";

export const checkAuth:MiddlewareFn<Context> = ({ context:{req}}, next) => {
    if(! req.session.userId){
        throw new AuthenticationError("Not Authenticated to perform GraphQL operations")

    }

    return next()
}