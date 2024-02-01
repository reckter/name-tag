import { MongoClient } from 'mongodb'
export const mongoClient = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017/")
export const MONGO_DB = "name-tag"