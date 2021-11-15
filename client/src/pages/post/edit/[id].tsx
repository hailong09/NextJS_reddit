import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { Box, Flex } from "@chakra-ui/layout";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../../components/Layout";
import {
  UpdatePostInput,
  useMeQuery,
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import NextLink from "next/link";
import { Spinner } from "@chakra-ui/spinner";
import { Form, Formik } from "formik";
import InputField from "../../../components/InputField";
const PostEdit = () => {
  const router = useRouter();
  const postId = router.query.id as string;
  const { data: meData, loading: meLoading } = useMeQuery();
  const { data, loading: postLoading } = usePostQuery({
    variables: { id: postId },
  });

  const [updatePost, _] = useUpdatePostMutation();
  const onUpdatePost = async (values: Omit<UpdatePostInput, "id">) => {
    await updatePost({
      variables: {
        updatePostInput: {
          id: postId,
          ...values,
        },
      },
    });

    router.back();
  };
  if (meLoading || postLoading) {
    return (
      <Layout>
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Post not found</AlertTitle>
        </Alert>
        <Box>
          <NextLink href="/">
            <Button>Back to Homepage</Button>
          </NextLink>
        </Box>
      </Layout>
    );
  }
  if (
    !meLoading &&
    !postLoading &&
    meData?.me?.id !== data?.post?.userId.toString()
  ) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Unauthorized</AlertTitle>
        </Alert>
        <Box mt={4}>
          <NextLink href="/">
            <Button>Back to Homepage</Button>
          </NextLink>
        </Box>
      </Layout>
    );
  }

  const initialValues = {
    title: data.post.title,
    text: data.post.text,
  };
  return (
    <Layout>
      <Formik initialValues={initialValues} onSubmit={onUpdatePost}>
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
            <Flex justifyContent={"space-between"} alignItems={"center"} mt={4}>
              <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
                Edit Post
              </Button>
              <NextLink href="/">
                <Button>Back to home page</Button>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default PostEdit;
