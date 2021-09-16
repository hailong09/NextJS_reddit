import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import { Form, Formik } from "formik";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  ForgotPasswordInput,
  useForgotPasswordMutation,
} from "../generated/graphql";
import { useCheckAuth } from "../utils/useCheckAuth";
import NextLink from 'next/link'
const ForgotPassword = () => {
  const { data: authData, loading: authLoading } = useCheckAuth();
  const initialValues: ForgotPasswordInput = { email: "" };
  const [forgotPassword, { loading, data }] = useForgotPasswordMutation();
  const onForgetPassword = async (
    values: ForgotPasswordInput
    // { setErrors }: FormikHelpers<ForgotPasswordInput>
  ) => {
    await forgotPassword({
      variables: {
        forgotPasswordInput: values,
      },
    });
  };
  return (
    <>
      {authLoading || (!authLoading && authData?.me) ? (
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Wrapper>
          <Formik initialValues={initialValues} onSubmit={onForgetPassword}>
            {({ isSubmitting }) =>
              !loading && data ? (
                <Box>Please check your inbox</Box>
              ) : (
                <Form>
                  <InputField
                    name="email"
                    placeholder="Email"
                    label="Email"
                    type="email"
                  />
                    <Flex mt={2}>
                    <NextLink href='/login'>
                      <Link ml='auto'>Back to login</Link>
                    </NextLink>
                  </Flex>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    mt={4}
                    isLoading={isSubmitting}
                  >
                    Send
                  </Button>
                </Form>
              )
            }
          </Formik>
        </Wrapper>
      )}
    </>
  );
};

export default ForgotPassword;
