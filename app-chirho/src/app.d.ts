// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

declare global {
	namespace App {
		interface Locals { reviewerChirho: string | null; }
		interface Platform {
			env: {
				DB_CHIRHO: D1Database;
				R2_CHIRHO: R2Bucket;
				HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO?: string;
				HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO?: string;
				HOTTP_REVIEW_SESSION_SECRET_CHIRHO?: string;
				REVIEW_LOGIN_LIMITER_CHIRHO?: { limit(optionsChirho: { key: string }): Promise<{ success: boolean }> };
			};
			context: ExecutionContext;
		}
	}
}

export {};
