require("dotenv").config();
import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { UserResovlver } from "./resolvers/user";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import session from "express-session";
import express from "express";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Context } from "./types/Context";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { PostResovlver } from "./resolvers/post";
import cors from "cors";
import { Upvote } from "./entities/Upvote";
import { buildDataLoader } from "./utils/dataLoaders";
import path from "path";

const main = async () => {
  const connection = await createConnection({
    type: "postgres",
    ...(__prod__
      ? { url: process.env.DATABASE_URL }
      : {
          database: "reddit",
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
        }),

    logging: true,
    ...(__prod__
      ? {
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
          ssl: true,
        }
      : {}),
    ...(__prod__ ? {} : { synchronize: true }),
    entities: [User, Post, Upvote],
    migrations: [path.join(__dirname, "/migrations/*")],
  });

  if (__prod__) await connection.runMigrations();
  const app = express();

  app.use(
    cors({
      origin: __prod__
        ? process.env.CORS_ORIGIN_PROD
        : process.env.CORS_ORIGIN_DEV,
      credentials: true,
    })
  );
  let mongoUrl: string = `mongodb+srv://${process.env.SESSION_USERNAME}:${process.env.SESSION_PASSWORD}@cluster0.qd4hm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

  await mongoose.connect(mongoUrl);
  console.log("mongoDB connected");

  app.set("trust proxy", 1);
  app.use(
    session({
      name: COOKIE_NAME,
      store: MongoStore.create({ mongoUrl }),
      cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true, // front end cannot access cookie
        secure: __prod__, //cookie only works in https
        sameSite: "lax", // protect against CSRF
        domain: __prod__ ? '.vercel.app' : undefined
      },
      secret: process.env.SESSION_SECRET as string,
      saveUninitialized: false, // dont save empty session
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResovlver, PostResovlver],
      validate: false,
    }),
    context: ({ req, res }): Context => ({
      req,
      res,
      connection,
      dataLoaders: buildDataLoader(),
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: ["http://localhost:3000"],
    },
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(
      `Server started on port ${PORT}. GraphQL server started on localhost:${PORT}${apolloServer.graphqlPath}`
    )
  );
};

main().catch((err) => console.log(err));
