import crypto from "crypto";
import fs from "fs";

export const generateEnv = (envValues) => {
  let isDockerCompose = envValues.runOption === "docker-compose";
  let dbPort = isDockerCompose ? 3307 : 3306;
  let platformUrl = isDockerCompose ? "http://host.docker.internal:8000" : "http://localhost:8000";
  const websearchEnabled = envValues.serpApiKey !== null && envValues.serpApiKey !== "";

  const envDefinition = getEnvDefinition(envValues, isDockerCompose, dbPort, platformUrl, websearchEnabled);

  const envFileContent = generateEnvFileContent(envDefinition);
  saveEnvFile(envFileContent);
}

const getEnvDefinition = (envValues, isDockerCompose, dbPort, platformUrl, websearchEnabled) => {
  return {
    "Deployment Environment": {
      NODE_ENV: "development"
    },
    "NextJS": {
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:8000",
      PLATFORM_URL: platformUrl,
      NEXT_PUBLIC_FORCE_AUTH: false
    },
    "Websearch": {
      NEXT_PUBLIC_WEB_SEARCH_ENABLED: websearchEnabled,
    },
    "Next Auth config": {
      NEXTAUTH_SECRET: generateAuthSecret(),
      NEXTAUTH_URL: "http://localhost:3000"
    },
    "Auth providers (Use if you want to get out of development mode sign-in)": {
      GOOGLE_CLIENT_ID: "***",
      GOOGLE_CLIENT_SECRET: "***",
      GITHUB_CLIENT_ID: "***",
      GITHUB_CLIENT_SECRET: "***",
      DISCORD_CLIENT_SECRET: "***",
      DISCORD_CLIENT_ID: "***"
    },
    "Backend": {
      REWORKD_PLATFORM_FF_MOCK_MODE_ENABLED: false,
      REWORKD_PLATFORM_OPENAI_API_KEY: envValues.OpenAIApiKey || "<change me>",
      REWORKD_PLATFORM_FRONTEND_URL: "http://localhost:3000",
      REWORKD_PLATFORM_RELOAD: true,
      REWORKD_PLATFORM_OPENAI_API_BASE: "https://api.openai.com/v1",
      REWORKD_PLATFORM_SERP_API_KEY: envValues.serpApiKey || "<change me>",
      REWORKD_PLATFORM_REPLICATE_API_KEY: envValues.replicateApiKey || "<change me>",
    },
    "Database (Backend)": {
      REWORKD_PLATFORM_DATABASE_USER: "reworkd_platform",
      REWORKD_PLATFORM_DATABASE_PASSWORD: "reworkd_platform",
      REWORKD_PLATFORM_DATABASE_HOST: "db",
      REWORKD_PLATFORM_DATABASE_PORT: dbPort,
      REWORKD_PLATFORM_DATABASE_NAME: "reworkd_platform",
      REWORKD_PLATFORM_DATABASE_URL: "mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}",
    },
    "Database (Frontend)": {
      DATABASE_USER: "reworkd_platform",
      DATABASE_PASSWORD: "reworkd_platform",
      DATABASE_HOST: "db",
      DATABASE_PORT: dbPort,
      DATABASE_NAME: "reworkd_platform",
      DATABASE_URL: "mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
    },
  }
}

const generateEnvFileContent = (config) => {
  let configFile = '';

  Object.entries(config).forEach(([section, variables]) => {
    configFile += `# ${ section }:\n`;
    Object.entries(variables).forEach(([key, value]) => {
      configFile += `${ key }="${ value }"\n`;
    });
    configFile += '\n';
  });

  return configFile.trim();
}

const generateAuthSecret = () => {
  const length = 32;
  const buffer = crypto.randomBytes(length);
  return buffer.toString('base64');
}

const ENV_PATH = '../next/.env'
const BACKEND_ENV_PATH = '../platform/.env'

export const doesEnvFileExist = () => {
  return fs.existsSync(ENV_PATH);
}


// Read the existing env file, test if it is missing any keys or contains any extra keys
export const testEnvFile = () => {
  const data = fs.readFileSync(ENV_PATH, 'utf8');

  // Make a fake definition to compare the keys of
  const envDefinition = getEnvDefinition({}, "", "", "", "")

  const lines = data.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
  const envKeysFromFile = lines.map(line => line.split('=')[0]);

  const envKeysFromDef = Object.entries(envDefinition).flatMap(([section, entries]) => Object.keys(entries));

  const missingFromFile = envKeysFromDef.filter(key => !envKeysFromFile.includes(key));
  const missingFromDef = envKeysFromFile.filter(key => !envKeysFromDef.includes(key));

  if (missingFromFile.length === 0 && missingFromDef.length === 0) {
    console.log('Environment is synced. Shutting down :)');
  } else {
    if (missingFromFile.length > 0) {
      console.log('Your ./next/.env is missing the following keys:', missingFromFile);
    }
    if (missingFromDef.length > 0) {
      console.log('Your ./next/.env contains the following extra keys:', missingFromDef);
    }

    console.log("We recommend deleting your env and restarting this script.")
  }
}

export const saveEnvFile = (envFileContent) => {
  fs.writeFileSync(ENV_PATH, envFileContent);
  fs.writeFileSync(BACKEND_ENV_PATH, envFileContent);
}





