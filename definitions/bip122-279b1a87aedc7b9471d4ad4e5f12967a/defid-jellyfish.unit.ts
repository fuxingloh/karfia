import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaAgentContainer, KarfiaTestContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './defid-jellyfish.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('defid + whale', () => {
  let defid: KarfiaTestContainer;
  let whale: KarfiaTestContainer;

  beforeAll(() => {
    defid = testcontainers.getContainer('defid');
    whale = testcontainers.getContainer('whale');
  });

  it('should defid.rpc(getblockchaininfo)', async () => {
    const response = await defid.rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: {
        bestblockhash: '279b1a87aedc7b9471d4ad4e5f12967ab6259926cd097ade188dfcf22ebfe72a',
        chain: 'main',
        blocks: 0,
      },
    });
  });

  it('should whale.api(/v0/mainnet/tokens)', async () => {
    const response = await whale.fetch({
      path: '/v0/mainnet/tokens',
      method: 'GET',
      endpoint: 'api',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: '0',
          symbol: 'DFI',
        }),
      ]),
    });
  });
});

describe('karfia-agent', () => {
  let agent: KarfiaAgentContainer;

  beforeAll(() => {
    agent = testcontainers.getKarfiaAgent();
  });

  it('should get karfia-agent/deployment', async () => {
    const result = await agent.getDeployment();
    expect(result).toMatchObject({
      deploymentId: testcontainers.getDeploymentId(),
      definitionId: definition.id,
      caip2: definition.caip2,
      name: definition.name,
    });
  });

  it('should get karfia-agent/definition', async () => {
    const result = await agent.getDefinition();
    const expected = {
      ...definition,
      $schema: undefined,
    };
    delete expected.$schema;
    expect(result).toMatchObject(expected);
  });

  it('should get karfia-agent/probes/startup', async () => {
    const response = await agent.probe('startup');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      ok: true,
    });
  });

  it('should get karfia-agent/probes/liveness', async () => {
    const response = await agent.probe('liveness');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      ok: true,
    });
  });

  it('should get karfia-agent/probes/readiness', async () => {
    const response = await agent.probe('readiness');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      containers: {
        defid: {
          ok: true,
        },
        whale: {
          ok: true,
        },
      },
      ok: true,
    });
  });
});
