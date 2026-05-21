import {
	render,
	type RenderOptions,
	type RenderResult,
} from '@testing-library/react';
import userEvent, {
	type UserEvent,
	type Options,
} from '@testing-library/user-event';
import type { ReactElement } from 'react';

type RenderWithProvidersOptions = RenderOptions & {
	userEvent?: Options;
};

export function setupUser(options?: Options): UserEvent {
	return userEvent.setup(options);
}

export function renderWithProviders(
	ui: ReactElement,
	options?: RenderWithProvidersOptions,
): RenderResult & { user: UserEvent } {
	const { userEvent: userEventOptions, ...renderOptions } = options ?? {};
	const user = userEvent.setup(userEventOptions);
	return {
		user,
		...render(ui, renderOptions),
	};
}

export {
	act,
	render,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
