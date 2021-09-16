import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/dist/client/router";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import NextLink from 'next/link'
import {
  LoginInput,
  MeDocument,
  MeQuery,
  useLoginMutation,
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useCheckAuth } from "../utils/useCheckAuth";
import { useToast } from "@chakra-ui/react";
const Login = () => {
  const router = useRouter();
  const { data: authData, loading: authLoading } = useCheckAuth();
  const initialValues: LoginInput = { usernameOrEmail: "", password: "" };
  const [loginUser, { error }] = useLoginMutation();
  const toast = useToast();
  const onLoginSubmit = async (
    values: LoginInput,
    { setErrors }: FormikHelpers<LoginInput>
  ) => {
    const response = await loginUser({
      variables: {
        loginInput: values,
      },
      update(cache, result) {
        if (result.data?.login.success) {
          cache.writeQuery<MeQuery>({
            query: MeDocument,
            data: {
              me: result.data?.login.user,
            },
          });
        }
      },
    });

    if (response.data?.login.errors) {
      setErrors(mapFieldErrors(response.data.login.errors));
    } else if (response.data?.login.user) {
      toast({
        title: "Logged in successfully",
        description: `Welcome, ${response.data.login.user?.username}!!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      router.push("/");
    }
  };

  return (
    <>
      {authLoading || (!authLoading && authData?.me) ? (
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Wrapper>
          {error && <p>Failed to register</p>}
          <Formik initialValues={initialValues} onSubmit={onLoginSubmit}>
            {({ isSubmitting }) => (
              <Form>
              
                  <InputField
                    name="usernameOrEmail"
                    placeholder="Username or Email"
                    label="Username/Email"
                    type="text"
                  />

                  <Box mt={4}>
                    <InputField
                      name="password"
                      placeholder="Password"
                      label="Password"
                      type="password"
                    />
                  </Box>
                  <Flex mt={2}>
                    <NextLink href='/forgot-password'>
                      <Link ml='auto'>Forgot Password</Link>
                    </NextLink>
                  </Flex>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    mt={4}
                    isLoading={isSubmitting}
                  >
                    Login
                  </Button>
                
              </Form>
            )}
          </Formik>
        </Wrapper>
      )}
    </>
  );
};

export default Login;
