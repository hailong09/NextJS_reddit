import { NetworkStatus } from "@apollo/client";
import { Button } from "@chakra-ui/button";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import { GetServerSideProps, GetServerSidePropsContext} from "next";
import NextLink from "next/link";
import Layout from "../components/Layout";
import PostEdit from "../components/PostDeleteEdit";
import UpvoteSection from "../components/UpvoteSection";
import { PostsDocument, usePostsQuery } from "../generated/graphql";
import { addApolloState, initializeApollo } from "../lib/apolloClient";
export const limit = 3;
const Index = () => {
  
  const { data, loading, fetchMore, networkStatus } = usePostsQuery({
    variables: {
      limit,
    },
    // component rendered by this query will rerender when networkStatus changes(fetchMore)
    notifyOnNetworkStatusChange: true,
  });
  const loadingMorePosts = networkStatus === NetworkStatus.fetchMore;
  const loadMorePosts = () =>
    fetchMore({
      variables: {
        cursor: data?.posts?.cursor,
      },
    });

  return (
    <>
      <Layout>
        {loading && !loadingMorePosts ? (
          <Flex justifyContent="center" alignItems="center" minH="100vh">
            <Spinner />
          </Flex>
        ) : (
          <Stack spacing={8}>
            {data?.posts?.paginatedPosts.map((post) => (
              <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                <UpvoteSection post={post} />
                <Box flex={1}>
                  <NextLink href={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize="xl">{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {post.user.username}</Text>
                  <Flex align="center">
                    <Text mt={4}>{post.textSnippet}</Text>
                    <Box ml="auto">
                      <PostEdit postId={post.id} postUserId={post.user.id} />
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Stack>
        )}
        {data?.posts?.hasMore && (
          <Flex>
            <Button
              m="auto"
              my={8}
              isLoading={loadingMorePosts}
              onClick={loadMorePosts}
            >
              {loadingMorePosts ? "Loading" : "Show more"}
            </Button>
          </Flex>
        )}
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
 
  const apolloClient = initializeApollo({headers: context.req.headers});
  await apolloClient.query({
    query: PostsDocument,
    variables: {
      limit,
    },
  });

  return addApolloState(apolloClient, {
    props: {},
  });
};
export default Index;
