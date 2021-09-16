
import { CreatePostInput } from '../types/CreatePostInput'
import { Resolver, Mutation, Arg, Query, ID, UseMiddleware} from 'type-graphql'
import { PostMutationResponse } from '../types/PostMutationResponse'
import { Post } from '../entities/Post'
import { UpdatePostInput } from '../types/UpdatePostInput'
import { checkAuth } from '../middleware/checkAuth'



@Resolver()
export class PostResovlver{
    @Mutation(_return => PostMutationResponse)
    @UseMiddleware(checkAuth)
    async createPost(
        @Arg('createPostInput') {title, text}: CreatePostInput
    ):Promise<PostMutationResponse>{
        
        try {
            const newPost = await Post.create({
                title,
                text
            })

            await newPost.save()
            return {
                code: 200,
                success: true,
                message: 'Post created',
                post: newPost
            }
    
        } catch (err) {
            console.log(err)
            return {
                code: 500,
                success: false,
                message: `Internal server error ${err.message}`,
            
            }
        }
      
    }
    @Query(_return => [Post], {nullable: true})
    async posts():Promise<Post[] | null>{
        try {
            return await Post.find()
        } catch (err) {
           console.log(err)
           return null 
        }
    }

    @Query(_return => Post, {nullable: true})
    async post(
        @Arg('id', _type => ID) id: number
    ): Promise<Post|undefined | null>{

        try {
            const post = await Post.findOne(id)
            return post
        } catch (err) {
            console.log(err)
           return null
        }
    }

    @Mutation(_return => PostMutationResponse)
    @UseMiddleware(checkAuth)
    async updatePost(
        @Arg('updatePostInput') {id, title, text}: UpdatePostInput
    ):Promise<PostMutationResponse>{
        try {
            const foundPost = await Post.findOne(id)
            if(!foundPost){
                return {
                    code: 400, 
                    success: false,
                    message: 'Post not found'
                }
            }

            foundPost.title = title
            foundPost.text = text
            await foundPost.save()
            return {
                code: 200,
                success: true,
                message: "Post changed successfully",
                post: foundPost
            }
            
        } catch (err) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${err.message}`,
            
            }
        }
    }

    @Mutation(_return => PostMutationResponse)
    @UseMiddleware(checkAuth)
    async deletePost(
        @Arg('id', _type => ID) id: number
       
    ): Promise<PostMutationResponse>{
        
        try {

           
            const foundPost  = await Post.findOne(id)
            if(!foundPost){
                return {
                    code: 400, 
                    success: false,
                    message: 'Post not found'
                }
            }

           await Post.delete({id})
            return{
                code: 200, 
                success: true,
                message: "post deleted successfully",
                
            }

        } catch (err) {
            return {
                code: 500,
                success: false,
                message: `Internal server error ${err.message}`,
            
            }
            
        }
    }
}