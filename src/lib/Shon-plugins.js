

import fs from 'fs'
import path from 'path'
import { theme, chalk, logger } from './Shon-logger.js'
/**
 * @typedef {Object} PluginConfig
 * @property {string} name - Nama command (tanpa prefix)
 * @property {string[]} alias - Array alias untuk command
 * @property {string} category - Kategori plugin (owner, main, utility, fun, dll)
 * @property {string} description - Deskripsi singkat command
 * @property {string} usage - Cara penggunaan command
 * @property {string} example - Contoh penggunaan command
 * @property {boolean} isOwner - Apakah command khusus owner
 * @property {boolean} isPremium - Apakah command khusus premium user
 * @property {boolean} isGroup - Apakah command hanya untuk group
 * @property {boolean} isPrivate - Apakah command hanya untuk private chat
 * @property {boolean} isAdmin - Apakah command memerlukan admin group
 * @property {boolean} isBotAdmin - Apakah bot harus jadi admin
 * @property {number} cooldown - Cooldown dalam detik
 * @property {number} limit - Jumlah limit yang digunakan per eksekusi
 * @property {boolean} isEnabled - Apakah plugin aktif
 */

/**
 * @typedef {Object} Plugin
 * @property {PluginConfig} config - Konfigurasi plugin
 * @property {PluginHandler} handler - Fungsi handler plugin
 */

/**
 * @callback PluginHandler
 * @param {Object} m - Serialized message object
 * @param {Object} params - Parameter tambahan
 * @param {Object} params.sock - Socket connection Baileys
 * @param {Object} params.store - Data store
 * @param {Object} params.config - Bot configuration
 * @param {Object} params.plugins - All loaded plugins
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} PluginStore
 * @property {Map<string, Plugin>} commands - Map command name ke plugin
 * @property {Map<string, string>} aliases - Map alias ke command name
 * @property {Map<string, Plugin[]>} categories - Map category ke array plugins
 */

/**
 * Collection untuk menyimpan semua plugins
 * @type {PluginStore}
 */
const pluginStore = {
    commands: new Map(),
    aliases: new Map(),
    categories: new Map()
};

/**
 * Default config untuk plugin
 * @type {PluginConfig}
 */
const defaultConfig = {
    name: '',
    alias: [],
    category: 'uncategorized',
    description: 'No description',
    usage: '',
    example: '',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    isBotAdmin: false,
    cooldown: 3,
    limit: 1,
    isEnabled: true
};

/**
 * Memuat satu plugin dari file
 * @param {string} filePath - Path ke file plugin
 * @returns {Plugin|null} Plugin object atau null jika gagal
 * @example
 * const plugin = await loadPlugin('./plugins/main/ping.js');
 */
import { pathToFileURL } from 'url';


async function loadPlugin(filePath, bustCache = false) {
    try {
        const fileUrl = pathToFileURL(path.resolve(filePath)).href + (bustCache ? '?t=' + Date.now() : '');
        let plugin = await import(fileUrl);

        if ((!plugin.config || !plugin.handler) && plugin.default) {
            plugin = plugin.default;
        }

        if (!plugin.config || !plugin.handler) {
            return null;
        }

        if (typeof plugin.handler !== 'function') {
            return null;
        }

        let pInfo = {
            config: { ...defaultConfig, ...plugin.config },
            handler: plugin.handler,
            filePath: filePath
        };

        if (!pInfo.config.name) {
            pInfo.config.name = path.basename(filePath, path.extname(filePath));
        }

        return pInfo;
    } catch (error) {
        const fileName = path.basename(filePath);
        if (process.env.DEBUG_PLUGINS === 'true' || true) {
            console.error(`[Plugin] Failed: ${fileName} - ${error.message}`);
        }
        return null;
    }
}

/**
 * Mendaftarkan plugin ke store
 * @param {Plugin} plugin - Plugin untuk didaftarkan
 * @returns {boolean} True jika berhasil
 */
function registerPlugin(plugin) {
    if (!plugin || !plugin.config || !plugin.config.name) {
        return false;
    }
    
    const { name, alias, category } = plugin.config;
    
    const names = Array.isArray(name) ? name : [name];
    const primaryName = names[0].toLowerCase();
    
    for (const n of names) {
        pluginStore.commands.set(n.toLowerCase(), plugin);
    }
    
    if (Array.isArray(alias)) {
        for (const a of alias) {
            pluginStore.aliases.set(a.toLowerCase(), primaryName);
        }
    }
    

    const categoryLower = category.toLowerCase();
    if (!pluginStore.categories.has(categoryLower)) {
        pluginStore.categories.set(categoryLower, []);
    }
    pluginStore.categories.get(categoryLower).push(plugin);
    
    return true;
}

function printPluginTable(plugins) {
    if (!plugins.length) return;

    // =====[ HELPERS ]=====
    const safeStr = (val) => {
        if (Array.isArray(val)) return val[0] || '';
        return String(val || '');
    };

    const percent = (count, total) => {
        return ((count / total) * 100).toFixed(0);
    };

    const bar = (count, total, size = 14) => {
        const filled = Math.round((count / total) * size);
        return '█'.repeat(filled) + '░'.repeat(size - filled);
    };

    const avg = (total, count) => {
        return (total / count).toFixed(1);
    };

    // =====[ GROUPING ]=====
    const grouped = plugins.reduce((acc, plugin) => {
        const category = safeStr(plugin.category);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // =====[ SORTING ]=====
    const sortedCategories = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1]);

    const TOTAL_PLUGINS = plugins.length;
    const TOTAL_CATEGORIES = sortedCategories.length;

    // =====[ SPLIT ]=====
    const TOP_LIMIT = 8;
    const topCategories = sortedCategories.slice(0, TOP_LIMIT);
    const remainingCategories = sortedCategories.slice(TOP_LIMIT);

    const remainingTotal = remainingCategories
        .reduce((sum, [, count]) => sum + count, 0);

    const [topName, topCount] = sortedCategories[0] || ['-', 0];

    const avgPerCategory = avg(TOTAL_PLUGINS, TOTAL_CATEGORIES);

    // =====[ WIDTH ]=====
    const maxCategoryLength = Math.max(
        ...topCategories.map(([cat]) => cat.length),
        10
    );

    const COL_CAT = maxCategoryLength + 2;

    // =====[ HEADER ]=====
    console.log('');
    console.log(`  ${theme.tag('📊 Plugin System Report')}`);

    console.log(
        `  ${theme.primary(TOTAL_PLUGINS)} ${theme.dim('plugins')} ${theme.border('│')} ` +
        `${theme.primary(TOTAL_CATEGORIES)} ${theme.dim('categories')} ${theme.border('│')} ` +
        `${theme.dim('avg')} ${theme.accent(avgPerCategory)}`
    );

    console.log(
        `  ${theme.dim('top')} ${theme.accent(topName)} ` +
        `${theme.dim(`(${percent(topCount, TOTAL_PLUGINS)}%)`)}`
    );

    console.log(theme.border('  ' + '─'.repeat(64)));

    // =====[ TABLE HEADER ]=====
    console.log(
        `  ${theme.dim('#'.padEnd(3))}` +
        `${theme.dim('Category'.padEnd(COL_CAT))}` +
        `${theme.dim('Count'.padStart(6))} ` +
        `${theme.dim('%'.padStart(4))} ` +
        `${theme.dim('Distribution')}`
    );

    console.log(theme.border('  ' + '─'.repeat(64)));

    // =====[ ROWS ]=====
    topCategories.forEach(([cat, count], i) => {
        const rank = `#${i + 1}`;
        const isTop = i === 0;

        const line =
            `${theme.dim(rank.padEnd(3))}` +
            `${isTop ? '🔥 ' : '  '}` +
            `${theme.dim(cat.padEnd(COL_CAT))}` +
            `${theme.accent(String(count).padStart(6))} ` +
            `${theme.dim(percent(count, TOTAL_PLUGINS).padStart(3) + '%')} ` +
            `${theme.primary(bar(count, TOTAL_PLUGINS))}`;

        console.log('  ' + line);
    });

    // =====[ REMAINING ]=====
    if (remainingCategories.length > 0) {
        console.log(theme.border('  ' + '─'.repeat(64)));

        console.log(
            `  ${theme.dim('.. ')}` +
            `${theme.dim('Others'.padEnd(COL_CAT))}` +
            `${theme.accent(String(remainingTotal).padStart(6))} ` +
            `${theme.dim(percent(remainingTotal, TOTAL_PLUGINS).padStart(3) + '%')} ` +
            `${theme.primary(bar(remainingTotal, TOTAL_PLUGINS))}`
        );
    }

    console.log('');
}

/**
 * Memuat semua plugins dari directory
 * @param {string} pluginsDir - Path ke directory plugins
 * @returns {number} Jumlah plugin yang berhasil dimuat
 * @example
 * const count = loadPlugins('./Shon-plugins');
 * console.log(`Loaded ${count} plugins`);
 */
async function loadPlugins(pluginsDir) {
    pluginStore.commands.clear();
    pluginStore.aliases.clear();
    pluginStore.categories.clear();
    
    let loadedCount = 0;
    const loadedPlugins = [];
    
    if (!fs.existsSync(pluginsDir)) {
        console.warn(`[Plugin] Plugins directory not found: ${pluginsDir}`);
        return 0;
    }
    
    const categories = fs.readdirSync(pluginsDir);
    
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category);
        
        if (!fs.statSync(categoryPath).isDirectory()) {
            if (category.endsWith('.js') && category !== '_index.js') {
                const plugin = await loadPlugin(categoryPath);
                if (plugin && registerPlugin(plugin)) {
                    loadedCount++;
                    loadedPlugins.push({
                        name: plugin.config.name,
                        category: 'uncategorized'
                    });
                }
            }
            continue;
        }
        
        const files = fs.readdirSync(categoryPath);
        
        for (const file of files) {
            if (!file.endsWith('.js') || file.startsWith('_')) continue;
            
            const filePath = path.join(categoryPath, file);
            const plugin = await loadPlugin(filePath);
            
            if (plugin) {
                if (!plugin.config.category || plugin.config.category === 'uncategorized') {
                    plugin.config.category = category;
                }
                
                if (registerPlugin(plugin)) {
                    loadedCount++;
                    loadedPlugins.push({
                        name: plugin.config.name,
                        category: plugin.config.category
                    });
                }
            }
        }
    }
    
    printPluginTable(loadedPlugins);
    return loadedCount;
}

/**
 * Mendapatkan plugin berdasarkan nama atau alias
 * @param {string} name - Nama command atau alias
 * @returns {Plugin|null} Plugin object atau null jika tidak ditemukan
 * @example
 * const plugin = getPlugin('menu');
 * if (plugin) {
 *   await plugin.handler(m, { sock, config });
 * }
 */
function getPlugin(name) {
    if (!name) return null;
    
    const nameLower = name.toLowerCase();
    
    if (pluginStore.commands.has(nameLower)) {
        return pluginStore.commands.get(nameLower);
    }
    
    if (pluginStore.aliases.has(nameLower)) {
        const commandName = pluginStore.aliases.get(nameLower);
        return pluginStore.commands.get(commandName);
    }
    
    return null;
}

/**
 * Mendapatkan semua plugins dalam kategori tertentu
 * @param {string} category - Nama kategori
 * @returns {Plugin[]} Array plugins dalam kategori
 * @example
 * const ownerPlugins = getPluginsByCategory('owner');
 */
function getPluginsByCategory(category) {
    if (!category) return [];
    return pluginStore.categories.get(category.toLowerCase()) || [];
}

/**
 * Mendapatkan semua kategori yang ada
 * @returns {string[]} Array nama kategori
 * @returns {string[]} Array nama kategori
 */
function getCategories() {
    return Array.from(pluginStore.categories.keys());
}

/**
 * Mendapatkan semua plugins
 * @returns {Plugin[]} Array semua plugins
 */
function getAllPlugins() {
    return Array.from(pluginStore.commands.values());
}

/**
 * Mendapatkan total jumlah plugins
 * @returns {number} Total plugins
 */
function getPluginCount() {
    return pluginStore.commands.size;
}

/**
 * Mendapatkan semua nama command dan alias as array (Cached)
 * @returns {string[]}
 */
function getAllCommandNames() {
    return [
        ...pluginStore.commands.keys(),
        ...pluginStore.aliases.keys()
    ]
}

/**
 * Mendapatkan daftar command per kategori untuk menu
 * @returns {Object<string, string[]>} Object dengan key kategori dan value array command names
 */
function getCommandsByCategory() {
    const result = {};
    
    for (const [category, plugins] of pluginStore.categories.entries()) {
        result[category] = [];
        for (const p of plugins) {
            if (!p.config.isEnabled) continue;
            const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
            result[category].push(...names);
        }
    }
    
    return result;
}

/**
 * Mendapatkan info plugin untuk help
 * @param {string} name - Nama command
 * @returns {Object|null} Info plugin atau null
 */
function getPluginInfo(name) {
    const plugin = getPlugin(name);
    if (!plugin) return null;
    
    const { config } = plugin;
    
    return {
        name: config.name,
        alias: config.alias,
        category: config.category,
        description: config.description,
        usage: config.usage,
        example: config.example,
        isOwner: config.isOwner,
        isPremium: config.isPremium,
        cooldown: config.cooldown
    };
}

/**
 * Reload single plugin
 * @param {string} name - Nama command untuk reload
 * @returns {boolean} True jika berhasil
 */
function reloadPlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin || !plugin.filePath) return false;
    
    const category = plugin.config.category;
    
    pluginStore.commands.delete(name.toLowerCase());
    
    for (const alias of (plugin.config.alias || [])) {
        pluginStore.aliases.delete(alias.toLowerCase());
    }
    
    const categoryPlugins = pluginStore.categories.get(category.toLowerCase());
    if (categoryPlugins) {
        const index = categoryPlugins.findIndex(p => p.config.name === name);
        if (index !== -1) {
            categoryPlugins.splice(index, 1);
        }
    }
    
    const newPlugin = loadPlugin(plugin.filePath);
    if (newPlugin && registerPlugin(newPlugin)) {
        console.log(`[Plugin] Reloaded: ${name}`);
        return true;
    }
    
    return false;
}

/**
 * Disable plugin
 * @param {string} name - Nama command untuk disable
 * @returns {boolean} True jika berhasil
 */
function disablePlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin) return false;
    
    plugin.config.isEnabled = false;
    return true;
}

/**
 * Enable plugin
 * @param {string} name - Nama command untuk enable
 * @returns {boolean} True jika berhasil
 */
function enablePlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin) return false;
    
    plugin.config.isEnabled = true;
    return true;
}

/**
 * Cek apakah plugin aktif
 * @param {string} name - Nama command
 * @returns {boolean} True jika plugin aktif
 */
function isPluginEnabled(name) {
    const plugin = getPlugin(name);
    return plugin ? plugin.config.isEnabled : false;
}

async function hotReloadPlugin(filePath) {
    let primaryName = '';
    try {
        const plugin = await loadPlugin(filePath, true);
        if (!plugin) {
            return { success: false, error: 'Failed to load plugin' };
        }
        
        const names = Array.isArray(plugin.config.name) ? plugin.config.name : [plugin.config.name];
        const primaryName = names[0].toLowerCase();
        
        const existingPlugin = pluginStore.commands.get(primaryName);
        if (existingPlugin) {
            const oldCategory = existingPlugin.config.category?.toLowerCase();
            pluginStore.commands.delete(primaryName);
            
            for (const alias of (existingPlugin.config.alias || [])) {
                pluginStore.aliases.delete(alias.toLowerCase());
            }
            
            const categoryPlugins = pluginStore.categories.get(oldCategory);
            if (categoryPlugins) {
                const index = categoryPlugins.findIndex(p => {
                    const pNames = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
                    return pNames[0].toLowerCase() === primaryName;
                });
                if (index !== -1) {
                    categoryPlugins.splice(index, 1);
                }
            }
        }
        
        if (registerPlugin(plugin)) {
            logger.success(`Hot Reload`,`Plugin ${primaryName} berhasil di-reload`);
            return { success: true, name: primaryName };
        }
        
        return { success: false, error: 'Failed to register plugin' };
    } catch (error) {
        logger.error(`Hot Reload`,`Plugin ${primaryName} gagal di-reload`);
        return { success: false, error: error.message };
    }
}

function unloadPlugin(name) {
    try {
        const nameLower = name.toLowerCase();
        let plugin = pluginStore.commands.get(nameLower);
        
        if (!plugin) {
            const commandName = pluginStore.aliases.get(nameLower);
            if (commandName) {
                plugin = pluginStore.commands.get(commandName);
            }
        }
        
        if (!plugin) {
            return { success: false, error: 'Plugin not found' };
        }
        
        const names = Array.isArray(plugin.config.name) ? plugin.config.name : [plugin.config.name];
        const primaryName = names[0].toLowerCase();
        const category = plugin.config.category?.toLowerCase();
        
        for (const n of names) {
            pluginStore.commands.delete(n.toLowerCase());
        }
        
        for (const alias of (plugin.config.alias || [])) {
            pluginStore.aliases.delete(alias.toLowerCase());
        }
        
        const categoryPlugins = pluginStore.categories.get(category);
        if (categoryPlugins) {
            const index = categoryPlugins.findIndex(p => {
                const pNames = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
                return pNames[0].toLowerCase() === primaryName;
            });
            if (index !== -1) {
                categoryPlugins.splice(index, 1);
            }
        }
        
        if (plugin.filePath) {
            try {
                // require.cache removed
            } catch {}
        }
        
        console.log(`[Unload] Plugin unloaded: ${primaryName}`);
        return { success: true, name: primaryName };
    } catch (error) {
        console.error(`[Unload] Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

export { loadPlugin, loadPlugins, registerPlugin, getPlugin, getPluginsByCategory, getCategories, getAllPlugins, getPluginCount, getCommandsByCategory, getPluginInfo, reloadPlugin, disablePlugin, enablePlugin, isPluginEnabled, hotReloadPlugin, unloadPlugin, pluginStore, defaultConfig, getAllCommandNames }