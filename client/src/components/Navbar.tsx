import { Box, Flex, Heading, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import {
  MeDocument,
  MeQuery,
  useLogoutMutation,
  useMeQuery,
} from "../generated/graphql";
import { Button } from "@chakra-ui/button";

const Navbar = () => {
  const { data, loading: useMeLoading } = useMeQuery();
  const [logout, { loading: logOutLoad }] = useLogoutMutation();
  const Handlelogout = async () => {
    await logout({
      update(cache, result) {
        if (result.data?.logout) {
          cache.writeQuery<MeQuery>({
            query: MeDocument,
            data: {
              me: null,
            },
          });
        }
      },
    });
  };
  let body;
  if (useMeLoading) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Button onClick={Handlelogout} isLoading={logOutLoad}>
        Logout
      </Button>
    );
  }
  return (
    <Box bg="tan" p={4}>
      <Flex maxW={800} justifyContent="space-between" m="auto" align="center">
        <NextLink href="/">
          <Heading>Reddit</Heading>
        </NextLink>
        <Box>{body}</Box>
      </Flex>
    </Box>
  );
};

export default Navbar;
