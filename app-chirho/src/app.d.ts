// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

declare global {
	namespace App {
		interface Platform {
			env: {
				DB_CHIRHO: D1Database;
				R2_CHIRHO: R2Bucket;
			};
			context: ExecutionContext;
		}
	}
}

export {};
