import { createRequire } from 'node:module';
import { checkRateLimit } from '@vercel/firewall';
import { createAssistantHandler } from '../server/assistant/handler.mjs';

const require = createRequire(import.meta.url);
const {getContext, hasSlide} = require('../server/assistant/context.cjs');

// Web-standard handler: helpers and corpus stay outside api/ to avoid extra routes.
export default {fetch: createAssistantHandler({checkRateLimit, getContext, hasSlide})};
