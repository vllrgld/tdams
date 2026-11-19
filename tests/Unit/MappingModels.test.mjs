import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    mappingModelLabel,
    resolveMappingModel,
} from '../../resources/js/pages/documents/lib/mapping-models.ts';

const gptOss = 'openai/gpt-oss-120b';
const smallerGptOss = 'openai/gpt-oss-20b';

void test('mapping options identify the model and its provider', () => {
    assert.equal(mappingModelLabel(gptOss), 'GPT-OSS 120B (Groq)');
    assert.equal(mappingModelLabel('openai/gpt-oss-20b'), 'GPT-OSS 20B (Groq)');
    assert.equal(mappingModelLabel('custom-model'), 'custom-model');
});

void test('mapping initially uses the server default and preserves a valid user choice', () => {
    assert.equal(resolveMappingModel([gptOss, smallerGptOss], ''), gptOss);
    assert.equal(
        resolveMappingModel([gptOss, smallerGptOss], smallerGptOss),
        smallerGptOss,
    );
    assert.equal(resolveMappingModel([smallerGptOss, gptOss], gptOss), gptOss);
});

void test('changed model options cannot leave the uploader using a removed model', () => {
    assert.equal(resolveMappingModel([gptOss], 'removed-model'), gptOss);
    assert.equal(resolveMappingModel([], 'removed-model'), '');
});
