/* @jsxImportSource @builder.io/qwik */
import {
	RenderOnce,
	Signal,
	SkipRender,
	Slot,
	component$,
	implicit$FirstArg,
	isSignal,
	noSerialize,
	useSignal,
	useStylesScoped$,
	useTask$,
	type NoSerialize,
	type QRL,
} from '@builder.io/qwik'

import { isBrowser, isServer } from '@builder.io/qwik/build'
import * as client from './client'
import { main, splitProps, useWakeupSignal } from './slot'

import { ObservableReadonly, isObservable } from 'vitro'
import type { FunctionComponent, QwikifyOptions, QwikifyProps } from './types'

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
				for (const key in qwikClientProps) {
					const val = qwikClientProps[key]
					if (isSignal(val)) {
						track(val)
					}
				}

				if (isServer) return

				const vitroProps = vitroPropsSignal.value

				if (!vitroProps) {
					const props: Record<string, any> = {}
					for (const key in qwikClientPropsSignal.value) {
						const val = qwikClientPropsSignal.value[key]
						props[key] = isSignal(val) ? client.signal(val.value) : val
					}
					vitroPropsSignal.value = noSerialize(props)
				} else {
					for (const key in vitroProps) {
						const val = vitroProps[key]
						if (isObservable(val)) {
							val(qwikClientPropsSignal.value[key].value)
						}
					}
				}
			})

			// Task takes cares of updates and partial hydration
			useTask$(
				async ({ track, cleanup }) => {
					const isWakeup = track(wakeup)

					if (!isBrowser) {
						return
					}

					if (!isWakeup) return

					const VitroComp = await vitroCmp$.resolve()

					vitroCmp.value = noSerialize(VitroComp)

					// Root props update
					if (hostRef.value) {
						dispose.value?.()
						const disposeFn = client.render(
							main(
								slotRef.value,
								scopeId,
								vitroCmp.value,
								vitroPropsSignal.value ?? {},
								qwikClientPropsSignal,
							),
							hostRef.value,
						)
						dispose.value = noSerialize(disposeFn)
					}

					cleanup(() => {
						dispose.value?.()
					})
				},
			)
			return (
				<RenderOnce>
					<Host
						{...qwikHostProps}
						ref={(el: Element) => {
							if (isBrowser) {
								hostRef.value = el
								queueMicrotask(() => {
									const disposeFn = client.render(
										main(
											slotRef.value,
											scopeId,
											vitroCmp.value,
											props,
											qwikClientPropsSignal,
										),
										el,
									)
									dispose.value = noSerialize(disposeFn)
								})
							} else {
								hostRef.value = el
							}
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
