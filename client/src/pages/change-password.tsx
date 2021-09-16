import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Form, Formik, FormikHelpers } from "formik";
import router, { useRouter } from "next/router";
import { useState } from "react";
import NextLink from "next/link";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  ChangePasswordInput,
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useCheckAuth } from "../utils/useCheckAuth";
import { Spinner } from "@chakra-ui/spinner";
import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/alert";

const ChangePassword = () => {
  const { data: authData, loading: authLoading } = useCheckAuth();
  const { query } = useRouter();
  const [tokenError, setTokenError] = useState("");
  const initialValues: ChangePasswordInput = { newPassword: "" };
  const [changePasswordUser] = useChangePasswordMutation();
  const onChangePassword = async (
    values: ChangePasswordInput,
    { setErrors }: FormikHelpers<ChangePasswordInput>
  ) => {
    if (query.userId && query.token) {
      const resp = await changePasswordUser({
        variables: {
          changePasswordInput: values,
          userId: query.userId as string,
          token: query.token as string,
        },
        update(cache, result) {
          if (result.data?.changePassword.success) {
            cache.writeQuery<MeQuery>({
              query: MeDocument,
              data: {
                me: result.data?.changePassword.user,
              },
            });
          }
        },
      });

      if (resp.data?.changePassword.errors) {
        const fieldErrors = mapFieldErrors(resp.data.changePassword.errors);
        if ("token" in fieldErrors) {
          setTokenError(fieldErrors.token);
        }

        setErrors(fieldErrors);
      } else if (resp.data?.changePassword.user) {
        router.push("/");
      }
    }
  };
  return (
    <>
      {authLoading || (!authLoading && authData?.me) ? (
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : !query.token || !query.userId ? (
        <Wrapper>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Invalid password change request</AlertTitle>
          </Alert>
          <Flex mt={2}>
            <NextLink href="/login">
              <Link ml="auto">Back to login</Link>
            </NextLink>
          </Flex>
        </Wrapper>
      ) : (
        <Wrapper>
          <Formik initialValues={initialValues} onSubmit={onChangePassword}>
            {
              ({ isSubmitting }) => (
                <Form>
                  <InputField
                    name="newPassword"
                    placeholder="New password"
                    label="New password"
                    type="password"
                  />
                  {tokenError && (
                    <Flex>
                      <Box color="red">{tokenError}</Box>
                      <NextLink href="/forgot-password">
                        <Link>Back to forgot password</Link>
                      </NextLink>
                    </Flex>
                  )}
                  <Button
                    type="submit"
                    colorScheme="teal"
                    mt={4}
                    isLoading={isSubmitting}
                  >
                    Reset Password
                  </Button>
                </Form>
              )
              //   )
            }
          </Formik>
        </Wrapper>
      )}
    </>
  );
};

export default ChangePassword;
