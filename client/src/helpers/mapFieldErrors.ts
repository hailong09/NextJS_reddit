import { FieldError } from "../generated/graphql";

export const mapFieldErrors = (errors: FieldError[]): {[key:string]: any} => {
    return errors.reduce((acc, err) => {
        return {
            ...acc, 
            [err.field]: err.message
        }
    }, {})
}