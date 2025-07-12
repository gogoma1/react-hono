import {
    integer,
    real,
    sqliteTable,
    text,
    index,
    primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const listingStatusEnum = ['draft', 'in_review', 'active', 'inactive', 'deleted'] as const;


/**
 * 마켓플레이스 상품 리스팅 테이블 (Marketplace D1 DB)
 * 판매자가 등록하는 상품의 상세 정보, 소개글, 집계 데이터 등을 저장.
 */
export const marketplaceListingsTable = sqliteTable("marketplace_listings", {
    problem_set_id: text("problem_set_id").primaryKey(), // D1-Main의 problemSetTable.problem_set_id 참조
    
    seller_id: text("seller_id").notNull(), // PG의 profile.id 참조
    price: integer("price").notNull().default(0),
    title: text("title").notNull(),
    status: text("status", { enum: listingStatusEnum }).notNull().default('draft'),
    
    introduction: text("introduction"), 
    
    average_rating: real("average_rating").notNull().default(0),
    ratings_count: integer("ratings_count").notNull().default(0),
    
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
}, (table) => ({
    sellerIdx: index("listings_seller_id_idx").on(table.seller_id), // [추천] 이름 명확화: listings_seller_id_idx
    statusIdx: index("listings_status_idx").on(table.status),     // [추천] 이름 명확화: listings_status_idx
}));

/**
 * 문제집 리뷰 테이블 (Marketplace D1 DB)
 * 상품 정보와 논리적으로 함께 위치.
 */
export const problemSetReviewsTable = sqliteTable("problem_set_reviews", {
    problem_set_id: text("problem_set_id").notNull(),
    user_id: text("user_id").notNull(), // PG의 profile.id 참조
    
    rating: integer("rating").notNull(), // 1~5
    comment: text("comment"),
    
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
}, (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.problem_set_id] }),
    // [수정] 인덱스 이름을 고유하게 변경
    problemSetIdx: index("reviews_problem_set_id_idx").on(table.problem_set_id),
}));

/**
 * 구매 기록(Log) 테이블 (Marketplace D1 DB)
 * 모든 구매 '사건'을 기록하는 불변의 로그.
 */
export const purchaseLogsTable = sqliteTable("purchase_logs", {
    log_id: text("log_id").primaryKey(), // e.g., `plog_${crypto.randomUUID()}`
    user_id: text("user_id").notNull(), // PG의 profile.id 참조
    problem_set_id: text("problem_set_id").notNull(), // D1-Main의 problem_set.id 참조
    
    amount: integer("amount").notNull(), // 결제 금액
    currency: text("currency").notNull().default('KRW'),
    payment_gateway: text("payment_gateway"), // e.g., 'stripe', 'toss_payments'
    transaction_id: text("transaction_id"), // 결제사 거래 ID
    
    purchased_at: text("purchased_at").notNull(), // 구매가 발생한 시점 (ISO 8601 문자열)
}, (table) => ({
    // [수정] 인덱스 이름을 고유하게 변경
    userIdx: index("purchases_user_id_idx").on(table.user_id),
    problemSetIdx: index("purchases_problem_set_id_idx").on(table.problem_set_id),
}));



export type MarketplaceListing = typeof marketplaceListingsTable.$inferSelect;
export type NewMarketplaceListing = typeof marketplaceListingsTable.$inferInsert;

export type ProblemSetReview = typeof problemSetReviewsTable.$inferSelect;
export type NewProblemSetReview = typeof problemSetReviewsTable.$inferInsert;

export type PurchaseLog = typeof purchaseLogsTable.$inferSelect;
export type NewPurchaseLog = typeof purchaseLogsTable.$inferInsert;