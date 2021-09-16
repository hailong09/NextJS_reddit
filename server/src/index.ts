require('dotenv').config()
import 'reflect-metadata'
import {createConnection} from 'typeorm'
import { User } from './entities/User'
import { Post } from './entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import { UserResovlver } from './resolvers/user'
import mongoose from 'mongoose'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import express from 'express'
import { COOKIE_NAME, __prod__ } from './constants'
import { Context } from './types/Context'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { PostResovlver } from './resolvers/post'
import cors from 'cors'

const main = async () => {
    await createConnection({
        type:'postgres',
        database: 'reddit',
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: true,
        synchronize: true,
        entities: [User,Post]
     

    })

    const app = express()

    app.use(cors({
        origin:'http://localhost:3000',
        credentials: true
    }))
    let mongoUrl: string = `mongodb+srv://hldo:${process.env.SESSION_PASSWORD}@cluster0.qd4hm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

    await mongoose.connect(mongoUrl)
    console.log("mongoDB connected")
    
    app.set('trust proxy', 1)
    app.use(session({
        name: COOKIE_NAME,
        store: MongoStore.create({mongoUrl}),
        cookie: {
            maxAge: 1000 * 60 *60,
            httpOnly: true, // front end cannot access cookie
            secure: __prod__, //cookie only works in https
            sameSite: 'lax', // protect against CSRF
            
            
        },
        secret: process.env.SESSION_SECRET as string,
        saveUninitialized: false, // dont save empty session 
        resave: false,
        
    }))

    // const apolloServer = new ApolloServer({
    //     schema: await buildSchema({resolvers:[HelloResolver, UserResovlver ], validate: false}),
    //     context: ({req, res}): Context=> ({req, res}),
        
    // })


    // const PORT = process.env.PORT || 5000
    // apolloServer.listen({port: PORT}).then(({url}) => {
    //     console.log(`Server started at ${url}`)
    // })

    const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, UserResovlver, PostResovlver],
			validate: false
		}),
		context: ({ req, res }): Context => ({
			req,
			res,
			
		}),
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
        
	})

	await apolloServer.start()

	apolloServer.applyMiddleware({app, cors: {
        credentials: true,
        origin:['http://localhost:3000']
    }})

	const PORT = process.env.PORT || 4000
	app.listen(PORT, () =>
		console.log(
			`Server started on port ${PORT}. GraphQL server started on localhost:${PORT}${apolloServer.graphqlPath}`
		)
	)
}

main().catch(err => console.log(err))