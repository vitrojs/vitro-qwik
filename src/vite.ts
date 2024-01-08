export function qwikVitro(): any {
  const OPTIMIZE_DEPS = ['vitro', 'vitro/jsx-runtime', 'vitro/jsx-dev-runtime']
  const DEDUPE = ['vitro']

  return {
    name: 'vite-plugin-qwik-vitro',
    config() {
      return {
        resolve: {
          dedupe: DEDUPE,
        },
        optimizeDeps: {
          include: OPTIMIZE_DEPS,
        },
      }
    },
  }
}
