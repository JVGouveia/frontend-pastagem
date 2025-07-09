/**
 * Utilitário para fazer requisições GraphQL com tratamento de erros melhorado
 */

interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

export class GraphQLClient {
  private endpoint: string;
  
  constructor(endpoint: string = '/graphql') {
    this.endpoint = endpoint;
  }

  async request<T = any>(query: string, variables?: any): Promise<T> {
    try {
      console.log('GraphQL Request:', {
        endpoint: this.endpoint,
        query: query.substring(0, 100) + '...',
        variables
      });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({
          query: query.trim(),
          variables: variables || {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}\nDetalhes: ${errorText}`);
      }

      const responseData = await response.text();
      let result: GraphQLResponse<T>;

      try {
        result = JSON.parse(responseData);
      } catch (parseError) {
        console.error('JSON Parse Error:', {
          parseError,
          responseData: responseData.substring(0, 500)
        });
        throw new Error(`Erro ao fazer parse da resposta JSON: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}\nResposta: ${responseData}`);
      }

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL Errors:', result.errors);
        throw new Error(`Erro GraphQL: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data) {
        console.error('No data in GraphQL response:', result);
        throw new Error('Resposta GraphQL não contém dados');
      }

      console.log('GraphQL Success:', {
        dataKeys: result.data ? Object.keys(result.data) : []
      });

      return result.data;
    } catch (error) {
      console.error('GraphQL Request Failed:', {
        endpoint: this.endpoint,
        error: error instanceof Error ? error.message : error,
        query: query.substring(0, 100) + '...',
        variables
      });
      throw error;
    }
  }
}

export const graphqlClient = new GraphQLClient();
