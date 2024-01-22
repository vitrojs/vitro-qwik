import {
	$,
	Signal,
	isSignal,
	useOnDocument,
	useSignal,
	useTask$,
	untrack as qwikUntrack,
} from '@builder.io/qwik'
import { isServer } from '@builder.io/qwik/build'
import {
	createElement,
	isObservable,
	untrack as vitroUntrack,
	useEffect,
} from 'vitro'
import type { QwikifyOptions, QwikifyProps } from './types'

export function main(
	slotEl: Element | undefined,
	scopeId: string,
	RootCmp: any,
	props: any,
	qwikClientPropsSignal: Signal<Record<string, any>>,
): JSX.Element {
	useEffect(() => {
		for (const key in props) {
			const val = props[key]

			if (isObservable(val)) {
				const qv = qwikUntrack(() => qwikClientPropsSignal.value[key].value)
				const vv = val()
				if (qv !== vv) {
					qwikClientPropsSignal.value[key].value = vv
				}
			}
		}
	})
	return vitroUntrack(() => {
		return createElement(RootCmp, {
			...props,
			children: createElement(SlotElement, {
				slotEl,
				scopeId,
			}),
		})
	})
}
const SlotElement = (props: {
	slotEl: Element | undefined
	scopeId: string
}) => {
	const mount = (el: Element) => {
		props.slotEl && el.appendChild(props.slotEl)
	}

	// @ts-expect-error since q-slotc is not a standard element, we will get error
	return createElement('q-slotc', {
		class: props.scopeId,
		suppressHydrationWarning: true,
		dangerouslySetInnerHTML: { __html: '<!--SLOT-->' },
		ref: mount,
	})
}

export const getVitroProps = (
	props: Record<string, any>,
): Record<string, any> => {
	const obj: Record<string, any> = {}
	Object.keys(props).forEach((key) => {
		if (!key.startsWith(HOST_PREFIX)) {
			const normalizedKey = key.endsWith('$') ? key.slice(0, -1) : key
			obj[normalizedKey] = props[key]
		}
	})
	return obj
}

export const splitProps = (props: Record<string, any>) => {
	const qwikHostProps: Record<string, any> = {}
	const qwikClientProps: Record<string, any> = {}

	for (const key in props) {
		const val = props[key]
		if (key.startsWith(HOST_PREFIX)) {
			qwikHostProps[key.slice(HOST_PREFIX.length)] = val
		} else {
			if (!key.startsWith(HOST_PREFIX) && !key.startsWith('client:')) {
				if (isSignal(val)) {
					qwikClientProps[key] = val
				}

				const normalizedKey = key.endsWith('$') ? key.slice(0, -1) : key
				qwikClientProps[normalizedKey] = val
			}
		}
	}
	return { qwikHostProps, qwikClientProps }
}

export const useWakeupSignal = (
	props: QwikifyProps<{}>,
	opts: QwikifyOptions = {},
) => {
	const signal = useSignal(false)
	const activate = $(() => (signal.value = true))
	if (isServer) {
		if (props['client:load']) {
			useOnDocument('qinit', activate)
		} else if (props['client:idle']) {
			useOnDocument('qidle', activate)
		}

		const wakeup = props['client:signal']
		if (wakeup) {
			useTask$(({ track }) => {
				const isWakeup = track(wakeup)
				if (isWakeup) {
					signal.value = true
				}
			})
		}
	}
	return [signal, activate] as const
}

const HOST_PREFIX = 'host:'
