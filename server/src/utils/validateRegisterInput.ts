import { RegisterInput } from "../types/RegisterInput";

export const validateRegisterInput = (resgisterInput: RegisterInput) => {
    

    if(!resgisterInput.email.includes("@")){
        return {
            message: 'InvalidEmail',
            errors:[
                {field: 'email', message: 'Email must include @ symbol'}
            ]
        }
    }

    if(resgisterInput.username.includes("@")){
        return {
            message: 'InvalidUsername',
            errors:[
                {field:'username', message: "username must not include @"}
            ]
        }
    }

    if(resgisterInput.username.length <= 2){
        return {
            message: 'InvalidUsername',
            errors: [
                {field:'username', message: 'Length must be greater than 2'}
            ]
        }
    }

    if(resgisterInput.password.length <= 2){
        return {
            message: 'InvalidPassword',
            errors: [
                {field:'password', message: 'Length must be greater than 2'}
            ]
        }
    }

    return null
}