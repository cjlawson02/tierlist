import type { SerializedTierItem } from './types';
import { MAX_NAME_LEN, MAX_TEXT_LEN, TIER_COLORS } from './types';

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

const DATA_IMAGE = /^data:image\/[\w+.-]+;(base64|charset=utf-8),/i;

export function sanitizeColor(color: string, fallback: string): string {
	if (HEX_COLOR.test(color)) {
		return color;
	}
	const rgb = RGB_COLOR.exec(color);
	if (rgb) {
		const channels = [rgb[1], rgb[2], rgb[3]].map(Number);
		if (channels.every((value) => value >= 0 && value <= 255)) {
			return color;
		}
	}
	return fallback;
}

export function sanitizeImageSrc(src: unknown): string | null {
	if (typeof src !== 'string' || !DATA_IMAGE.test(src)) {
		return null;
	}
	return src;
}

export function sanitizeName(name: unknown, fallback: string): string {
	if (typeof name !== 'string') {
		return fallback.slice(0, MAX_NAME_LEN);
	}
	const trimmed = name.trim();
	return (trimmed || fallback).slice(0, MAX_NAME_LEN);
}

export function defaultTierColor(index: number): string {
	return TIER_COLORS[index % TIER_COLORS.length];
}

export function sanitizeTextContent(text: unknown): string | null {
	if (typeof text !== 'string') {
		return null;
	}
	const trimmed = text.trim();
	if (!trimmed) {
		return null;
	}
	return trimmed.slice(0, MAX_TEXT_LEN);
}

function sanitizeSerializedTierItem(
	value: unknown,
	label: string,
): SerializedTierItem {
	if (typeof value === 'string') {
		const src = sanitizeImageSrc(value);
		if (!src) {
			throw new Error(
				`Invalid image in ${label}. Only embedded data:image URLs are supported.`,
			);
		}
		return src;
	}
	if (!value || typeof value !== 'object') {
		throw new Error(`Invalid item in ${label}.`);
	}
	const record = value as Record<string, unknown>;
	if (record.kind !== 'text' || typeof record.text !== 'string') {
		throw new Error(`Invalid item in ${label}.`);
	}
	const text = sanitizeTextContent(record.text);
	if (!text) {
		throw new Error(`Invalid text in ${label}.`);
	}
	return { kind: 'text', text };
}

export function sanitizeStringArray(values: unknown, label: string): string[] {
	if (!Array.isArray(values)) {
		throw new Error(`Invalid ${label}.`);
	}
	const result: string[] = [];
	for (const value of values) {
		const src = sanitizeImageSrc(value);
		if (!src) {
			throw new Error(
				`Invalid image in ${label}. Only embedded data:image URLs are supported.`,
			);
		}
		result.push(src);
	}
	return result;
}

export function sanitizeTierItemArray(
	values: unknown,
	label: string,
): SerializedTierItem[] {
	if (!Array.isArray(values)) {
		throw new Error(`Invalid ${label}.`);
	}
	return values.map((value, index) =>
		sanitizeSerializedTierItem(value, `${label}[${String(index)}]`),
	);
}
