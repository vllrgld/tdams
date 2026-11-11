export function mappingModelLabel(model: string): string {
    switch (model) {
        case 'openai/gpt-oss-120b':
            return 'GPT-OSS 120B (Groq)';
        case 'openai/gpt-oss-20b':
            return 'GPT-OSS 20B (Groq)';
        case 'global.amazon.nova-2-lite-v1:0':
            return 'Nova 2 Lite (Amazon Bedrock)';
        default:
            return model;
    }
}

export function resolveMappingModel(
    models: string[],
    selected: string,
): string {
    return models.includes(selected) ? selected : (models[0] ?? '');
}
