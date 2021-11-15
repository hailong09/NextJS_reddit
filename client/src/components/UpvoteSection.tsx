import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex } from "@chakra-ui/layout";
import { IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  PostWithUserInfoFragment,
  useVoteMutation,
  VoteType,
} from "../generated/graphql";

interface UpvoteSectionProps {
  post: PostWithUserInfoFragment;
}

enum VoteTypeValue {
  Upvote = 1,
  DownVote = -1,
}
const UpvoteSection = ({ post }: UpvoteSectionProps) => {
  
  const [loadingState, setLoadingState] = useState<
    "upvote" | "downvote" | "notLoading"
  >("notLoading");
  const [vote, { loading }] = useVoteMutation();
  const upvote = async (postId: string) => {
    
      setLoadingState("upvote");
      await vote({
        variables: {
          postId: Number(postId),
          voteType: VoteType.Upvote,
        },
      });
      setLoadingState("notLoading");
    
  };

  const downvote = async (postId: string) => {
  
      setLoadingState("downvote");
      await vote({
        variables: {
          postId: Number(postId),
          voteType: VoteType.Downvote,
        },
      });
      setLoadingState("notLoading");
  
  };
  return (
    <Flex direction="column" alignItems="center" mr={4}>
      <IconButton
        icon={<ChevronUpIcon />}
        aria-label="upvote"
        onClick={
          post.isVoted === VoteTypeValue.Upvote
            ? undefined
            : upvote.bind(this, post.id)
        }
        isLoading={loading && loadingState === "upvote"}
        colorScheme={
          post.isVoted === VoteTypeValue.Upvote ? "green" : undefined
        }
      />
      {post.points}
      <IconButton
        icon={<ChevronDownIcon />}
        aria-label="downvote"
        onClick={
          post.isVoted === VoteTypeValue.DownVote
            ? undefined
            : downvote.bind(this, post.id)
        }
        isLoading={loading && loadingState === "downvote"}
        colorScheme={
          post.isVoted === VoteTypeValue.DownVote ? "red" : undefined
        }
      />
    </Flex>
  );
};

export default UpvoteSection;
