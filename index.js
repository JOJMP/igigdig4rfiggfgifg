// index.js (исправленная версия)
const PLUGIN_NAME = 'memorySearch';

// Настройки по умолчанию
const defaultSettings = {
    enabled: false,
    serverUrl: 'http://127.0.0.1:8765',
};

// Загружаем настройки или создаем дефолтные
function loadSettings() {
    if (!extensionSettings[PLUGIN_NAME]) {
        extensionSettings[PLUGIN_NAME] = { ...defaultSettings };
    }
    return extensionSettings[PLUGIN_NAME];
}

// Регистрирует функцию search_history в ST
function registerTool() {
    const settings = loadSettings();
    const context = SillyTavern.getContext();

    // Удаляем старую версию функции, если была
    try {
        context.unregisterFunctionTool('search_history');
    } catch (e) { /* Игнорируем, если нечего удалять */ }

    context.registerFunctionTool({
        name: 'search_history',
        displayName: 'Memory Search',
        description: 'Ищи в долговременной памяти информацию о прошлых событиях, которая нужна для ответа.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Ключевая тема или поисковый запрос.',
                },
            },
            required: ['query'],
        },
        // Это и есть та самая функция, которую вызовет ST
        action: async (args) => {
            const query = args.query;
            const endpoint = settings.serverUrl.replace(/\/+$/, '') + '/search';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query }),
                });

                if (!response.ok) {
                    throw new Error(`Ошибка сети: ${response.status}`);
                }

                const data = await response.json();
                // Возвращаем строку с результатами, которая попадет в контекст модели
                return JSON.stringify(data);
            } catch (error) {
                console.error('[MemorySearch] Ошибка поиска:', error);
                return 'Ошибка при обращении к памяти.';
            }
        },
    });
}

// Запуск расширения
export async function load() {
    const settings = loadSettings();
    if (settings.enabled) {
        registerTool();
    }
}

// Выгрузка расширения
export async function unload() {
    try {
        SillyTavern.getContext().unregisterFunctionTool('search_history');
    } catch (e) { /* Игнорируем */ }
}

// Обработчик изменения настроек
export function onSettingsChanged() {
    const settings = loadSettings();
    if (settings.enabled) {
        registerTool();
    } else {
        try {
            SillyTavern.getContext().unregisterFunctionTool('search_history');
        } catch (e) { /* Игнорируем */ }
    }
}
