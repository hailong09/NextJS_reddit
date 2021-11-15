import { IconButton } from "@chakra-ui/button";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Box } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import {
  PaginatedPosts,
  useDeletePostMutation,
  useMeQuery,
} from "../generated/graphql";
import { useRouter } from "next/router";
import { Reference } from "@apollo/client";
interface PostEditDeleteButton {
  postId: string;
  postUserId: string;
}

const PostDeleteEdit = ({ postId, postUserId }: PostEditDeleteButton) => {
  const { data: meData } = useMeQuery();
  const router = useRouter();
  const [deletePost] = useDeletePostMutation();
  const onDeletePost = async (postId: string) => {
    await deletePost({
      variables: {
        id: postId,
      },
      update(cache, result) {
        if (result.data?.deletePost.success) {
          cache.modify({
            fields: {
              posts(
                existing: Pick<
                  PaginatedPosts,
                  "__typename" | "cursor" | "hasMore" | "totalCount"
                > & { paginatedPosts: Reference[] }
              ) {
                const newPosts = {
                  ...existing,
                  totalCount: existing.totalCount - 1,
                  paginatedPosts: existing.paginatedPosts.filter(
                    (p) => p.__ref !== `Post:${postId}`
                  ),
                };

                return newPosts;
              },
            },
          });
        }
      },
    });

    if(router.route !== "/"){
      router.replace("/");
    }
  };

  if (meData?.me?.id !== postUserId) {
    return null;
  }
  return (
    <Box>
      <NextLink href={`/post/edit/${postId}`}>
        <IconButton icon={<EditIcon />} aria-label="edit" mr={4} />
      </NextLink>

      <IconButton
        icon={<DeleteIcon />}
        aria-label="delete"
        colorScheme="red"
        onClick={onDeletePost.bind(this, postId as string)}
      />
    </Box>
  );
};

export default PostDeleteEdit;
