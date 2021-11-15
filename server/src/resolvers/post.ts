import { CreatePostInput } from "../types/CreatePostInput";
import {
  Resolver,
  Mutation,
  Arg,
  Query,
  ID,
  UseMiddleware,
  FieldResolver,
  Root,
  Int,
  Ctx,
} from "type-graphql";
import { PostMutationResponse } from "../types/PostMutationResponse";
import { Post } from "../entities/Post";
import { UpdatePostInput } from "../types/UpdatePostInput";
import { checkAuth } from "../middleware/checkAuth";
import { User } from "../entities/User";
import { PaginatedPosts } from "../types/PaginatedPosts";
import { LessThanOrEqual } from "typeorm";
import { Context } from "../types/Context";
import { VoteType } from "../types/VoteType";
import { registerEnumType } from "type-graphql";
import { UserInputError } from "apollo-server-errors";
import { Upvote } from "../entities/Upvote";

registerEnumType(VoteType, {
  name: "VoteType", // this one is mandatory
});
@Resolver((_of) => Post)
export class PostResovlver {
  @FieldResolver((_return) => String)
  textSnippet(@Root() { text }: Post) {
    return text.substring(0, 50);
  }

  @FieldResolver((_return) => User)
  async user(
    @Root() root: Post,
    @Ctx() { dataLoaders: { userLoader } }: Context
  ) {
    return await userLoader.load(root.userId);
  }

  @FieldResolver((_return) => Int)
  async isVoted(
    @Root() root: Post,
    @Ctx() { req, dataLoaders: { voteTypeLoader } }: Context
  ) {
    if (!req.session.userId) return 0;
    // const existingVote = await Upvote.findOne({
    //   postId: root.id,
    //   userId: req.session.userId,
    // });

    const existingVote = await voteTypeLoader.load({
      postId: root.id,
      userId: req.session.userId,
    });
    return existingVote ? existingVote.value : 0;
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async createPost(
    @Arg("createPostInput") { title, text }: CreatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const newPost = await Post.create({
        title,
        text,
        userId: req.session.userId,
      });

      await newPost.save();
      return {
        code: 200,
        success: true,
        message: "Post created",
        post: newPost,
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
  @Query((_return) => PaginatedPosts, { nullable: true })
  async posts(
    @Arg("limit", (_type) => Int) limits: number,
    @Arg("cursor", { nullable: true }) cursor?: string
  ): Promise<PaginatedPosts | null> {
    try {
      const totalPostCount = await Post.count();
      const realLimit = Math.min(10, limits);

      const findOptions: { [key: string]: any } = {
        order: {
          createdAt: "DESC",
        },
        take: realLimit,
      };
      let lastPost: Post[] = [];
      if (cursor) {
        findOptions.where = {
          createdAt: LessThanOrEqual(cursor),
        };

        lastPost = await Post.find({
          order: {
            createdAt: "ASC",
          },
          take: 1,
        });
      }

      const posts = await Post.find(findOptions);

      return {
        cursor: posts[posts.length - 1].createdAt,
        totalCount: totalPostCount,
        hasMore: cursor
          ? posts[posts.length - 1].createdAt.toString() !==
            lastPost[0].createdAt.toString()
          : posts.length !== totalPostCount,
        paginatedPosts: posts,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query((_return) => Post, { nullable: true })
  async post(
    @Arg("id", (_type) => ID) id: number
  ): Promise<Post | undefined | null> {
    try {
      const post = await Post.findOne(id);
      return post;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async updatePost(
    @Arg("updatePostInput") { id, title, text }: UpdatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const foundPost = await Post.findOne(id);
      if (!foundPost) {
        return {
          code: 400,
          success: false,
          message: "Post not found",
        };
      }

      if (foundPost.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized",
        };
      }

      foundPost.title = title;
      foundPost.text = text;
      await foundPost.save();
      return {
        code: 200,
        success: true,
        message: "Post changed successfully",
        post: foundPost,
      };
    } catch (err) {
      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async deletePost(
    @Arg("id", (_type) => ID) id: number,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const foundPost = await Post.findOne(id);
      if (!foundPost) {
        return {
          code: 400,
          success: false,
          message: "Post not found",
        };
      }

      if (foundPost.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized",
        };
      }

      await Upvote.delete({postId: id})

      await Post.delete({ id });
      return {
        code: 200,
        success: true,
        message: "post deleted successfully",
      };
    } catch (err) {
      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async vote(
    @Arg("postId", (_type) => Int) postId: number,
    @Arg("voteType", (_type) => VoteType) voteVal: VoteType,
    @Ctx()
    {
      req: {
        session: { userId },
      },
      connection,
    }: Context
  ): Promise<PostMutationResponse> {
    return await connection.transaction(async (transactionEntityManager) => {
      // check if post exists
      let post = await transactionEntityManager.findOne(Post, postId);
      if (!post) {
        throw new UserInputError("Post not found");
      }

      // check if user has voted or not
      const existingVote = await transactionEntityManager.findOne(Upvote, {
        postId,
        userId,
      });

      if (existingVote && existingVote.value !== voteVal) {
        await transactionEntityManager.save(Upvote, {
          ...existingVote,
          value: voteVal,
        });

        post = await transactionEntityManager.save(Post, {
          ...post,
          points: post.points + 2 * voteVal,
        });
      }

      if (!existingVote) {
        const newVote = transactionEntityManager.create(Upvote, {
          userId,
          postId,
          value: voteVal,
        });

        await transactionEntityManager.save(newVote);
        post.points = post.points + voteVal;
        post = await transactionEntityManager.save(post);
      }

      return {
        code: 200,
        success: true,
        message: "Post voted!",
        post,
      };
    });
  }
}
