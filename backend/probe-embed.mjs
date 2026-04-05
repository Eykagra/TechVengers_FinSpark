import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const key = process.env.NVIDIA_API_KEY_LLAMA3_2_NEMORETRIEVER_EMBED
  || process.env.NVIDIA_API_KEY_EMBED
  || process.env.NVIDIA_API_KEY;

const client = new OpenAI({
  apiKey: key,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const models = [
  'nvidia/llama-3.2-nemoretriever-300m-embed-v1',
  'llama-3_2-nemoretriever-300m-embed-v1',
  'nv-embed-v1',
];

for (const model of models) {
  try {
    const result = await client.embeddings.create({
      model,
      input: ['credit bureau score'],
      encoding_format: 'float',
      input_type: 'query',
    });
    const len = result?.data?.[0]?.embedding?.length || 0;
    console.log(`${model}: OK len=${len}`);
  } catch (error) {
    console.log(`${model}: FAIL ${error?.message || String(error)}`);
  }
}
