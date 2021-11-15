import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/alert";
import { Box, Flex, Heading } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import React from "react";
import { limit } from "..";
import Layout from "../../components/Layout";
import {
  PostDocument,
  PostQuery,
  PostsIdDocument,
  PostsIdQuery,
  usePostQuery,
} from "../../generated/graphql";
import { addApolloState, initializeApollo } from "../../lib/apolloClient";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import PostDeleteEdit from "../../components/PostDeleteEdit";

const Post = () => {
  const router = useRouter();
  const { data, loading, error } = usePostQuery({
    variables: {
      id: router.query.id as string,
    },
  });
  if (loading) {
    return (
      <Layout>
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      </Layout>
    );
  }

  if (error || !data?.post)
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{error ? error.message : "Post not found!"}</AlertTitle>
        </Alert>
        <Box mt={4}>
          <NextLink href="/">
            <Button>Back to Homepage</Button>
          </NextLink>
        </Box>
      </Layout>
    );
  return (
    <Layout>
      <>
        <Heading mb={4}>{data.post.title}</Heading>
        <Box mb={4}>{data.post.text}</Box>
        <Flex mt={4} alignItems="center"  justifyContent="space-between">
          <PostDeleteEdit postId={data.post.id} postUserId={data.post.user.id}/>
          <NextLink href="/">
            <Button>Back to Homepage</Button>
          </NextLink>
        </Flex>
      </>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  /*
       [
            {params: {id: "number"}},
       ]
    */
  const applloClient = initializeApollo();
  const { data } = await applloClient.query<PostsIdQuery>({
    query: PostsIdDocument,
    variables: { limit },
  });

  return {
    paths: data.posts!.paginatedPosts.map((post) => ({
      params: { id: `${post.id}` },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<
  { [key: string]: any },
  { id: string }
> = async ({ params }) => {
  const apolloClient = initializeApollo();
  await apolloClient.query<PostQuery>({
    query: PostDocument,
    variables: {
      id: params?.id,
    },
  });
  return addApolloState(apolloClient, { props: {} });
};
export default Post;
