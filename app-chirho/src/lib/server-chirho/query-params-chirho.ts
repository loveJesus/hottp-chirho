// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { error } from '@sveltejs/kit';

function numericParamErrorChirho(nameChirho: string, messageChirho: string): never {
	error(400, `${nameChirho} ${messageChirho}`);
}

export function parseRequiredPositiveIntParamChirho(
	valueChirho: string | null | undefined,
	nameChirho: string
): number {
	const parsedChirho = Number(valueChirho);
	if (!Number.isSafeInteger(parsedChirho) || parsedChirho <= 0) {
		numericParamErrorChirho(nameChirho, 'must be a positive integer');
	}
	return parsedChirho;
}

export function parseOptionalPositiveIntParamChirho(
	valueChirho: string | null | undefined,
	nameChirho: string
): number | null {
	if (valueChirho === null || valueChirho === undefined || valueChirho === '') {
		return null;
	}
	return parseRequiredPositiveIntParamChirho(valueChirho, nameChirho);
}

export function parseBoundedNonnegativeIntParamChirho(
	valueChirho: string | null | undefined,
	nameChirho: string,
	defaultValueChirho: number,
	maxValueChirho: number
): number {
	if (valueChirho === null || valueChirho === undefined || valueChirho === '') {
		return defaultValueChirho;
	}
	const parsedChirho = Number(valueChirho);
	if (!Number.isSafeInteger(parsedChirho) || parsedChirho < 0) {
		numericParamErrorChirho(nameChirho, 'must be a nonnegative integer');
	}
	if (parsedChirho > maxValueChirho) {
		numericParamErrorChirho(nameChirho, `must be at most ${maxValueChirho}`);
	}
	return parsedChirho;
}

export function parseBoundedPositiveIntParamChirho(
	valueChirho: string | null | undefined,
	nameChirho: string,
	defaultValueChirho: number,
	maxValueChirho: number
): number {
	if (valueChirho === null || valueChirho === undefined || valueChirho === '') {
		return defaultValueChirho;
	}
	const parsedChirho = Number(valueChirho);
	if (!Number.isSafeInteger(parsedChirho) || parsedChirho <= 0) {
		numericParamErrorChirho(nameChirho, 'must be a positive integer');
	}
	if (parsedChirho > maxValueChirho) {
		numericParamErrorChirho(nameChirho, `must be at most ${maxValueChirho}`);
	}
	return parsedChirho;
}
