-- Keep the platform's existing exposed schemas and add the Awareness API.
alter role authenticator
  set pgrst.db_schemas = 'public, graphql_public, awareness';

notify pgrst, 'reload config';
