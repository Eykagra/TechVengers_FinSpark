import { api } from './api';

const memoryCache = new Map();

function hashKey(prefix, payload) {
  return `${prefix}:${JSON.stringify(payload)}`;
}

function chunkText(text, maxChars = 5000) {
  if (!text || text.length <= maxChars) {
    return [text || ''];
  }

  const chunks = [];
  let offset = 0;
  while (offset < text.length) {
    const next = Math.min(text.length, offset + maxChars);
    chunks.push(text.slice(offset, next));
    offset = next;
  }
  return chunks;
}

async function withRetry(fn, retries = 2, delayMs = 300) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === retries) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs * (2 ** i)));
    }
  }
  throw lastError;
}

function mergeChunkedParse(chunks) {
  const serviceMap = new Map();
  const schemaList = [];

  chunks.forEach(chunk => {
    (chunk.services || []).forEach(service => {
      const key = `${service.name || ''}|${service.endpointPattern || ''}`;
      if (!serviceMap.has(key)) {
        serviceMap.set(key, service);
      }
    });

    (chunk.schemas || []).forEach(schema => schemaList.push(schema));
  });

  const first = chunks[0] || {};
  return {
    ...first,
    services: Array.from(serviceMap.values()),
    schemas: schemaList,
    estimatedAdapters: Array.from(serviceMap.values()).length,
  };
}

export const nimClient = {
  async parseRequirementDoc(text, tenantId, userId = 'ui_user') {
    const chunks = chunkText(text, 7000);
    const parsedChunks = [];

    for (const chunk of chunks) {
      const key = hashKey('parse', { chunk, tenantId });
      if (memoryCache.has(key)) {
        parsedChunks.push(memoryCache.get(key));
        continue;
      }

      const parsed = await withRetry(() => api.parseDocument(chunk, tenantId, userId), 2, 350);
      memoryCache.set(key, parsed);
      parsedChunks.push(parsed);
    }

    if (parsedChunks.length === 1) {
      return parsedChunks[0];
    }

    const merged = mergeChunkedParse(parsedChunks);
    return {
      ...parsedChunks[0],
      ...merged,
    };
  },

  async rankAdapters(parsedReq, adapters, tenantId) {
    const key = hashKey('rank', { services: parsedReq?.services || [], tenantId });
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    const result = await withRetry(() => api.rankAdapters(parsedReq?.services || [], tenantId), 2, 300);
    memoryCache.set(key, result);
    return result;
  },

  async generateFieldMappings(sourceSchema, targetSchema, tenantId, userId = 'ui_user') {
    const key = hashKey('mapping', { sourceSchema, targetSchema, tenantId });
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    const result = await withRetry(() => api.generateConfig(
      targetSchema.adapterId,
      targetSchema.version,
      sourceSchema,
      tenantId,
      userId,
    ), 2, 350);

    memoryCache.set(key, result);
    return result;
  },

  async generateMockPayload(config, tenantId, userId = 'ui_user') {
    const key = hashKey('mock', { configId: config?.configId, version: config?.version, tenantId });
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    const result = await withRetry(() => api.simulate(config, tenantId, userId), 2, 350);
    memoryCache.set(key, result);
    return result;
  },

  async runJudgeDemo(documentText, tenantId, userId = 'judge_demo_user') {
    const startedAt = Date.now();

    const parsed = await this.parseRequirementDoc(documentText, tenantId, userId);
    const adapters = await withRetry(() => api.getAdapters(), 1, 250);
    const rankingPayload = await this.rankAdapters(parsed, adapters, tenantId);
    const rankings = rankingPayload.rankings || [];

    if (!rankings.length) {
      throw new Error('No ranked adapters found from parsed services.');
    }

    if (!parsed?.schemas?.length) {
      throw new Error('No schemas extracted from parsed document.');
    }

    const best = rankings[0];
    const config = await this.generateFieldMappings(
      parsed.schemas[0],
      {
        adapterId: best.adapterId,
        version: best.recommendedVersion,
      },
      tenantId,
      userId,
    );

    const simulation = await this.generateMockPayload(config, tenantId, userId);
    const completedAt = Date.now();

    return {
      parsed,
      rankings,
      config,
      simulation,
      summary: {
        totalTimeMs: completedAt - startedAt,
        serviceCount: parsed.services?.length || 0,
        schemaCount: parsed.schemas?.length || 0,
        selectedAdapter: best.adapter?.name || best.adapterId,
        selectedVersion: best.recommendedVersion,
        confidence: Math.round((best.confidence || 0) * 100),
        fieldMappings: config.fieldMappings?.length || 0,
        latencyMs: simulation.latencyMs || 0,
        fieldCoverage: simulation.fieldCoverage || 0,
      },
    };
  },
};
