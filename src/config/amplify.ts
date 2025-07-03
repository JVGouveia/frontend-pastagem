import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'sa-east-1_QDwdNXKOk',
      userPoolClientId: '3bgkb3pesh56mqco8vqcmnl6tr',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        phone: false,
        username: true
      }
    }
  },
  API: {
    REST: {
      api: {
        endpoint: 'http://192.168.56.103:8080',
        region: 'sa-east-1'
      }
    }
  }
};

export default config; 