/* @jsxImportSource @builder.io/qwik */
import {
	RenderOnce,
	Signal,
	SkipRender,
	Slot,
	component$,
	createContextId,
	implicit$FirstArg,
	isSignal,
	noSerialize,
	useContextProvider,
	useContext as useQwikContext,
	useSignal,
	useStylesScoped$,
	useTask$,
	type NoSerialize,
	type QRL,
} from '@builder.io/qwik'

import { isBrowser, isServer } from '@builder.io/qwik/build'
import { observable, render } from 'vitro'

import { main, splitProps, useWakeupSignal } from './slot'

import { ObservableReadonly, isObservable } from 'vitro'
import type { FunctionComponent, QwikifyOptions, QwikifyProps } from './types'

const defaultContextId = createContextId<{}>('qwikify')

export function qwikifyQrl<PROPS extends {}>(
	vitroCmp$: QRL<FunctionComponent<PROPS & { children?: any }>>,
	opts?: QwikifyOptions,
) {
	return component$(
		(
			props: QwikifyProps<{
				[K in keyof PROPS]: PROPS[K] extends ObservableReadonly<infer V>
					? Readonly<Signal<V>>
					: PROPS[K]
			}>,
		) => {
			const { scopeId } = useStylesScoped$(
				`q-slot{display:none} q-slotc,q-slotc>q-slot{display:contents}`,
			)

			let contextId = opts?.context || defaultContextId

			if (contextId === defaultContextId) {
				useContextProvider(contextId, {})
			}

			const contextValue = useQwikContext(contextId)

			const hostRef = useSignal<Element>()
			const slotRef = useSignal<Element>()
			const vitroCmp = useSignal<NoSerialize<FunctionComponent<PROPS>>>()
			const dispose = useSignal<NoSerialize<() => void>>()
			const [wakeup] = useWakeupSignal(props, opts)

			const { qwikHostProps, qwikClientProps } = splitProps(props)

			const qwikClientPropsSignal =
				useSignal<Record<string, any>>(qwikClientProps)

			const vitroPropsSignal = useSignal<Record<string, any>>()

			const Host = opts?.tagName ?? ('qwik-vitro' as any)

			useTask$(({ track }) => {
				track(wakeup)
				for (const key in qwikClientProps) {
					const val = qwikClientProps[key]
					if (isSignal(val)) {
						track(val)
					}
				}

				if (isServer) return

				const vitroProps = vitroPropsSignal.value

				if (!vitroProps) {
					// first pass
					const props: Record<string, any> = {}
					for (const key in qwikClientPropsSignal.value) {
						const val = qwikClientPropsSignal.value[key]
						props[key] = isSignal(val) ? observable(val.value) : val
					}
					vitroPropsSignal.value = noSerialize(props)
				} else {
					// on qwik props signal change
					for (const key in vitroProps) {
						const val = vitroProps[key]
						if (isObservable(val)) {
							val(qwikClientPropsSignal.value[key].value)
						}
					}
				}
			})

			// Task takes cares of updates and partial hydration
			useTask$(async ({ track, cleanup }) => {
				const isWakeup = track(wakeup)
				const hostEl = track(hostRef)
				if (!isBrowser) {
					return
				}

				if (!isWakeup) return

				if (!hostEl) return

				const VitroComp = await vitroCmp$.resolve()

				console.log('vitroCmp getted')
				vitroCmp.value = noSerialize(VitroComp)

				// dispose prev render
				dispose.value?.()

				const disposeFn = render(
					main({
						contextValue: contextValue,
						slotEl: slotRef.value,
						scopeId: scopeId,
						RootCmp: vitroCmp.value,
						props: vitroPropsSignal.value ?? {},
						qwikClientPropsSignal: qwikClientPropsSignal,
					}),
					hostRef.value,
				)
				dispose.value = noSerialize(disposeFn)

				cleanup(() => {
					dispose.value?.()
				})
			})
			return (
				<RenderOnce>
					<Host
						{...qwikHostProps}
						ref={(el: Element) => {
							hostRef.value = el
						}}
					>
						{SkipRender}
					</Host>
					<q-slot ref={slotRef}>
						<Slot></Slot>
					</q-slot>
				</RenderOnce>
			)
		},
	)
}

export const qwikify$ = /*#__PURE__*/ implicit$FirstArg(qwikifyQrl)
