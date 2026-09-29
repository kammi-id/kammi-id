import { db } from './db'

export type DB = typeof db
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0]
export type DBExecutor = DB | Transaction
