import console from 'node:console';
import process from 'node:process';

import schema, { Chainfile } from '@chainfile/schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

function getChainfile(): Chainfile {
  const CHAINFILE_JSON = process.env.CHAINFILE_JSON;
  if (CHAINFILE_JSON === undefined) {
    throw new Error('CHAINFILE_JSON is not defined, cannot start @chainfile/agent.');
  }

  const chainfile = JSON.parse(CHAINFILE_JSON);
  console.log(`Chainfile:`);
  console.log(JSON.stringify(chainfile, null, 2));

  const ajv = new Ajv();
  addFormats(ajv);

  const validateFunction = ajv.compile(schema);
  if (validateFunction(chainfile)) {
    return chainfile as Chainfile;
  }

  throw new Error(`Invalid Chainfile: ${ajv.errorsText(validateFunction.errors)}`);
}

const chainfile = getChainfile();

export const createContext = async () => {
  return {
    chainfile: chainfile,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;