import dts from 'npm:rollup-plugin-dts@^6.3.0';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  input: './scripts/types.d.ts',
  output: {
    file: './src/utils/.mvs-types-raw.d.ts',
    format: 'es',
  },
  plugins: [
    dts({
      respectExternal: true,
      compilerOptions: {
        preserveSymlinks: false,
      },
    }),
  ],
};
