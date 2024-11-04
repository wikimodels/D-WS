export type InsertOneResult = { inserted: boolean; insertedId?: string };
export type InsertManyResult = { inserted: boolean; insertedCount?: number };
export type DeleteResult = { deleted: boolean; deletedCount?: number };
export type ModifyResult = { modified: boolean; modifiedCount?: number };
