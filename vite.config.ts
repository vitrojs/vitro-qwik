import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import dts from 'vite-plugin-dts'

export default defineConfig(() => {
  return {
    build: {
      minify: false,
      target: 'es2020',
      lib: {
        entry: ['./src/index.qwik.ts', './src/vite.ts'],
        formats: ['es', 'cjs'],
        fileName: (format, entryName) =>
          `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
      },
      rollupOptions: {
        external: ['voby', 'voby/jsx-runtime', 'voby/jsx-dev-runtime'],
      },
    },
    plugins: [qwikVite(), dts()],
  }
})
