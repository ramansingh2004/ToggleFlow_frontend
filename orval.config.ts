import { defineConfig } from 'orval';

export default defineConfig({
  toggleflow: {
    input: {
      target:
        '../ToggleFlow/backend/openapi/dist/openapi.yaml',
    },

    output: {
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,

      override: {
        mutator: {
          path: './src/api/client/orval-client.ts',
          name: 'customInstance',
        },

        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});