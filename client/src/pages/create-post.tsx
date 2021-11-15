import { Button } from "@chakra-ui/button";
import { Box, Flex } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { CreatePostInput, useCreatePostMutation } from "../generated/graphql";

import { useCheckAuth } from "../utils/useCheckAuth";
import NextLink from "next/link";

const CreatePost = () => {
  const router = useRouter();
  const { data: authData, loading: authLoading } = useCheckAuth();
  const initialValues: CreatePostInput = { title: "", text: "" };
  const [createPost] = useCreatePostMutation();
  const onCreatePost = async (values: CreatePostInput) => {
    await createPost({
      variables: { createPostInput: values },
      update(cache, { data }) {
        cache.modify({
          fields: {
            posts(existing) {
              
              if (data?.createPost.success && data.createPost.post) {
                // Post:new_id
                const newPostRef = cache.identify(data.createPost.post);

                const newPostsAfterCreation = {
                  ...existing,
                  totalCount: existing.totalCount + 1,
                  paginatedPosts: [
                    { __ref: newPostRef },
                    ...existing.paginatedPosts, // [{__ref: 'Post:1'}, {__ref: 'Post:2'}]
                  ],
                };

                return newPostsAfterCreation;
              }
            },
          },
        });
      },
    });
    router.push("/");
  };
  return (
    <>
      {authLoading || (!authLoading && !authData?.me) ? (
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Layout>
          <Formik initialValues={initialValues} onSubmit={onCreatePost}>
            {({ isSubmitting }) => (
              <Form>
                <InputField
                  name="title"
                  placeholder="Title"
                  label="Title"
                  type="text"
                />

                <Box mt={4}>
                  <InputField
                    textarea
                    name="text"
                    placeholder="Text"
                    label="Text"
                    type="textarea"
                  />
                </Box>
                <Flex
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  mt={4}
                >
                  <Button
                    type="submit"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                  >
                    Create Post
                  </Button>
                  <NextLink href="/">
                    <Button>Back to home page</Button>
                  </NextLink>
                </Flex>
              </Form>
            )}
          </Formik>
        </Layout>
      )}
    </>
  );
};

export default CreatePost;
