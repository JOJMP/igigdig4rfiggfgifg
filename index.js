// index.js — финальная рабочая версия без import

const FUNCTION_TOOLS_SETTING_KEY = 'customFunctionCallTools';

const toolDefinition = {
    name: 'search_history',
    description: 'Поиск информации о прошлых событиях по смыслу. Возвращает только факты, релевантные текущему запросу.',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Тема, вопрос или ключевые слова для поиска.'
            }
        },
        required: ['query']
    },
    url: '',   // заполнится из настроек
    method: 'POST'
};

function syncTool() {
    const settings = extensionSettings.memorySearch;
    if (!settings) return;

    if (!settings.enabled) {
        removeTool();
        return;
    }

    const baseUrl = settings.serverUrl.replace(/\/+$/, '');
    const tool = { ...toolDefinition, url: baseUrl + '/search' };
    upsertTool(tool);
}

function upsertTool(tool) {
    let tools = JSON.parse(localStorage.getItem(FUNCTION_TOOLS_SETTING_KEY) || '[]');
    tools = tools.filter(t => t.name !== tool.name);
    tools.push(tool);
    localStorage.setItem(FUNCTION_TOOLS_SETTING_KEY, JSON.stringify(tools));

    // Оповещаем ST, что настройки изменились
    window.dispatchEvent(new CustomEvent('extensionSettingsUpdated', {
        detail: { settingKey: FUNCTION_TOOLS_SETTING_KEY }
    }));
}

function removeTool() {
    let tools = JSON.parse(localStorage.getItem(FUNCTION_TOOLS_SETTING_KEY) || '[]');
    tools = tools.filter(t => t.name !== 'search_history');
    localStorage.setItem(FUNCTION_TOOLS_SETTING_KEY, JSON.stringify(tools));
    window.dispatchEvent(new CustomEvent('extensionSettingsUpdated', {
        detail: { settingKey: FUNCTION_TOOLS_SETTING_KEY }
    }));
}

export async function load() {
    syncTool();
}

export async function unload() {
    removeTool();
}

export function onSettingsChanged() {
    syncTool();
}