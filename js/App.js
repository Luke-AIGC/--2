/**
 * 主应用控制器
 * 负责协调各个模块的初始化、配置和生命周期管理
 * 作为整个抽卡系统的入口点和协调中心
 */
import StudentDataManager from './modules/StudentDataManager.js';
import CardDrawEngine from './modules/CardDrawEngine.js';
import UIRenderer from './modules/UIRenderer.js';
import EventHandler from './modules/EventHandler.js';

class App {
  constructor() {
    // 应用状态
    this.isInitialized = false;
    this.isRunning = false;
    
    // 模块实例
    this.modules = {
      studentDataManager: null,
      cardDrawEngine: null,
      uiRenderer: null,
      eventHandler: null
    };
    
    // 应用配置
    this.config = {
      // 学生数据配置
      studentData: {
        defaultCount: 30,
        enableCustomData: true,
        autoSave: true
      },
      
      // 抽卡配置
      cardDraw: {
        mode: 'random', // random, weighted, sequential
        enableAnimation: true,
        animationDuration: 1000,
        rarityWeights: {
          'N': 0.7,   // 70% 普通卡
          'R': 0.25,  // 25% 稀有卡
          'SR': 0.05  // 5% 超稀有卡
        }
      },
      
      // UI配置
      ui: {
        theme: 'default',
        enableSoundEffects: false,
        enableKeyboardShortcuts: true,
        enableTouchGestures: true,
        performanceMode: 'balanced' // low, balanced, high
      },
      
      // 调试配置
      debug: {
        enabled: false,
        logLevel: 'info', // debug, info, warn, error
        showPerformanceMetrics: false
      }
    };
    
    // 性能监控
    this.performance = {
      startTime: 0,
      initTime: 0,
      renderTime: 0,
      metrics: []
    };
    
    // 错误处理
    this.errorHandler = {
      maxRetries: 3,
      retryDelay: 1000,
      errors: []
    };
  }

  /**
   * 初始化应用
   * @param {Object} customConfig - 自定义配置（可选）
   */
  async initialize(customConfig = {}) {
    try {
      // 安全获取性能时间
      this.performance.startTime = this.getPerformanceTime();
      
      console.log('🚀 开始初始化课堂问答抽卡系统...');
      
      // 合并配置
      this.mergeConfig(customConfig);
      
      // 设置错误处理
      this.setupErrorHandling();
      
      // 检查浏览器兼容性
      this.checkBrowserCompatibility();
      
      // 初始化模块
      await this.initializeModules();
      
      // 配置模块
      this.configureModules();
      
      // 连接模块
      this.connectModules();
      
      // 初始化UI
      await this.initializeUI();
      
      // 加载数据
      await this.loadInitialData();
      
      // 启动应用
      this.start();
      
      this.performance.initTime = this.getPerformanceTime() - this.performance.startTime;
      this.isInitialized = true;
      
      console.log(`✅ 系统初始化完成，耗时 ${this.performance.initTime.toFixed(2)}ms`);
      
      // 触发初始化完成事件
      // this.dispatchEvent('app-initialized', {
      //   initTime: this.performance.initTime,
      //   config: this.config
      // });
      console.log('🔔 应用初始化完成事件 (暂时禁用)');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * 合并配置
   * @param {Object} customConfig - 自定义配置
   */
  mergeConfig(customConfig) {
    // 深度合并配置对象
    this.config = this.deepMerge(this.config, customConfig);
    
    if (this.config.debug.enabled) {
      console.log('📋 应用配置:', this.config);
    }
  }

  /**
   * 深度合并对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的对象
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 设置全局错误处理
   */
  setupErrorHandling() {
    // 捕获未处理的错误
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, 'JavaScript Error');
    });
    
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
    });
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility() {
    const missingFeatures = [];
    
    // 检查基本功能
    if (typeof Promise === 'undefined') missingFeatures.push('Promise');
    if (typeof fetch === 'undefined') missingFeatures.push('fetch');
    if (typeof localStorage === 'undefined') missingFeatures.push('localStorage');
    if (typeof window.addEventListener === 'undefined') missingFeatures.push('addEventListener');
    
    // 检查DOM API - 修复 Illegal invocation 错误
    if (typeof document.querySelector === 'undefined') missingFeatures.push('querySelector');
    
    // 安全检查 classList 支持
    try {
      if (typeof Element !== 'undefined' && Element.prototype && !('classList' in Element.prototype)) {
        missingFeatures.push('classList');
      }
    } catch (error) {
      console.warn('classList 检查失败，假设支持:', error);
    }
    
    if (missingFeatures.length > 0) {
      throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
    }
    
    // 检查ES6模块支持
    try {
      if (typeof HTMLScriptElement !== 'undefined' && HTMLScriptElement.prototype && !('noModule' in HTMLScriptElement.prototype)) {
        console.warn('⚠️ 浏览器可能不完全支持ES6模块');
      }
    } catch (error) {
      console.warn('ES6模块支持检查失败:', error);
    }
  }

  /**
   * 初始化所有模块
   */
  async initializeModules() {
    console.log('📦 初始化模块...');
    
    try {
      // 按依赖顺序初始化模块
      
      // 1. 数据管理器（无依赖）
      this.modules.studentDataManager = new StudentDataManager();
      console.log('✓ 学生数据管理器已创建');
      
      // 2. 抽卡引擎（依赖数据管理器）
      this.modules.cardDrawEngine = new CardDrawEngine();
      console.log('✓ 抽卡引擎已创建');
      
      // 3. UI渲染器（无依赖）
      this.modules.uiRenderer = new UIRenderer();
      console.log('✓ UI渲染器已创建');
      
      // 4. 事件处理器（依赖所有其他模块）
      this.modules.eventHandler = new EventHandler();
      console.log('✓ 事件处理器已创建');
      
    } catch (error) {
      console.error('❌ 模块初始化失败:', error);
      throw new Error(`模块初始化失败: ${error.message}`);
    }
  }

  /**
   * 配置各个模块
   */
  configureModules() {
    console.log('⚙️ 配置模块...');
    
    // 配置数据管理器
    if (this.modules.studentDataManager) {
      // 可以在这里设置数据管理器的配置
    }
    
    // 配置抽卡引擎
    if (this.modules.cardDrawEngine) {
      this.modules.cardDrawEngine.setDrawMode(this.config.cardDraw.mode);
      this.modules.cardDrawEngine.setRarityWeights(this.config.cardDraw.rarityWeights);
    }
    
    // 配置UI渲染器
    if (this.modules.uiRenderer) {
      // 设置动画配置
      this.modules.uiRenderer.animationConfig.cardDrawDuration = this.config.cardDraw.animationDuration;
      
      // 根据性能模式调整配置
      switch (this.config.ui.performanceMode) {
        case 'low':
          this.modules.uiRenderer.performanceConfig.enableVirtualization = true;
          this.modules.uiRenderer.performanceConfig.maxVisibleCards = 20;
          break;
        case 'high':
          this.modules.uiRenderer.performanceConfig.enableVirtualization = false;
          this.modules.uiRenderer.performanceConfig.maxVisibleCards = 100;
          break;
        default: // balanced
          this.modules.uiRenderer.performanceConfig.maxVisibleCards = 50;
          break;
      }
    }
    
    // 配置事件处理器
    if (this.modules.eventHandler) {
      // 设置触摸手势
      this.modules.eventHandler.touchConfig.enabled = this.config.ui.enableTouchGestures;
    }
  }

  /**
   * 连接各个模块
   */
  connectModules() {
    console.log('🔗 连接模块...');
    
    // CardDrawEngine 已经在构造时接收了 studentDataManager，无需额外设置
    // 验证模块连接状态
    if (this.modules.cardDrawEngine && this.modules.studentDataManager) {
      console.log('✓ 抽卡引擎与数据管理器已连接');
    }
    
    // 初始化事件处理器，传入所有模块引用
    if (this.modules.eventHandler) {
      this.modules.eventHandler.initialize({
        studentDataManager: this.modules.studentDataManager,
        cardDrawEngine: this.modules.cardDrawEngine,
        uiRenderer: this.modules.uiRenderer
      });
    }
  }

  /**
   * 初始化UI
   */
  async initializeUI() {
    console.log('🎨 初始化UI...');
    
    const renderStart = performance.now();
    
    try {
      // 等待DOM加载完成
      await this.waitForDOM();
      
      // 初始化UI渲染器
      this.modules.uiRenderer.initialize();
      
      // 显示占位符
      this.modules.uiRenderer.showPlaceholder();
      
      this.performance.renderTime = performance.now() - renderStart;
      console.log(`✓ UI初始化完成，耗时 ${this.performance.renderTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ UI初始化失败:', error);
      throw error;
    }
  }

  /**
   * 等待DOM加载完成
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * 加载初始数据
   */
  async loadInitialData() {
    console.log('📊 加载初始数据...');
    
    try {
      // 尝试从本地存储加载数据
      const savedData = this.loadFromLocalStorage();
      
      if (savedData && savedData.students && savedData.students.length > 0) {
        // 使用保存的数据
        this.modules.studentDataManager.importData(savedData);
        console.log(`✓ 从本地存储加载了 ${savedData.students.length} 个学生数据`);
      } else {
        // 使用默认数据
        this.modules.studentDataManager.initializeDefaultData(this.config.studentData.defaultCount);
        console.log(`✓ 初始化了 ${this.config.studentData.defaultCount} 个默认学生数据`);
      }
      
      // 渲染初始卡片
      const allStudents = this.modules.studentDataManager.getAllStudents();
      this.modules.uiRenderer.renderCards(allStudents);
      
      // 更新剩余数量
      const availableCount = this.modules.studentDataManager.getAvailableStudents().length;
      this.modules.uiRenderer.updateRemainingCount(availableCount);
      
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      // 使用默认数据作为后备
      this.modules.studentDataManager.initializeDefaultData(this.config.studentData.defaultCount);
    }
  }

  /**
   * 从本地存储加载数据
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('cardDrawSystem');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('本地存储数据解析失败:', error);
      return null;
    }
  }

  /**
   * 保存数据到本地存储
   */
  saveToLocalStorage() {
    if (!this.config.studentData.autoSave) return;
    
    try {
      const data = this.modules.studentDataManager.exportData();
      localStorage.setItem('cardDrawSystem', JSON.stringify(data));
      
      if (this.config.debug.enabled) {
        console.log('✓ 数据已保存到本地存储');
      }
    } catch (error) {
      console.warn('保存到本地存储失败:', error);
    }
  }

  /**
   * 启动应用
   */
  start() {
    if (this.isRunning) {
      console.warn('应用已在运行中');
      return;
    }
    
    console.log('🎯 启动应用...');
    
    // 设置自动保存
    if (this.config.studentData.autoSave) {
      this.setupAutoSave();
    }
    
    // 设置性能监控
    if (this.config.debug.showPerformanceMetrics) {
      this.setupPerformanceMonitoring();
    }
    
    // 监听应用级事件
    this.setupAppEventListeners();
    
    this.isRunning = true;
    console.log('✅ 应用启动成功');
    
    // 触发启动完成事件
    this.dispatchEvent('app-started');
  }

  /**
   * 设置自动保存
   */
  setupAutoSave() {
    // 监听数据变化事件
    document.addEventListener('card-drawn', () => {
      this.saveToLocalStorage();
    });
    
    // 定期保存（每5分钟）
    setInterval(() => {
      this.saveToLocalStorage();
    }, 5 * 60 * 1000);
    
    // 页面卸载前保存
    window.addEventListener('beforeunload', () => {
      this.saveToLocalStorage();
    });
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    // 每10秒收集一次性能指标
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);
  }

  /**
   * 收集性能指标
   * @returns {Object} 性能数据
   */
  collectPerformanceMetrics() {
    const currentTime = this.getPerformanceTime();
    
    // 收集内存使用情况
    let memoryInfo = {};
    if (performance.memory) {
      memoryInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    
    const metrics = {
      uptime: currentTime - this.performance.startTime,
      initTime: this.performance.initTime,
      errorCount: this.performance.errorCount,
      memory: memoryInfo,
      timestamp: new Date().toISOString()
    };
    
    // 记录性能指标
    this.performance.metrics.push(metrics);
    
    // 保持最近100条记录
    if (this.performance.metrics.length > 100) {
      this.performance.metrics.shift();
    }
    
    if (this.config.debug.enabled) {
      console.log('📊 性能指标:', metrics);
    }
    
    return metrics;
  }

  /**
   * 设置应用级事件监听
   */
  setupAppEventListeners() {
    // 监听卡片抽取事件
    document.addEventListener('card-drawn', (event) => {
      if (this.config.debug.enabled) {
        console.log('🎴 卡片已抽取:', event.detail);
      }
    });
    
    // 监听错误事件
    document.addEventListener('app-error', (event) => {
      this.handleApplicationError(event.detail);
    });
  }

  /**
   * 处理全局错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  handleGlobalError(error, context) {
    const errorInfo = {
      message: error.message || '未知错误',
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errorHandler.errors.push(errorInfo);
    
    console.error(`❌ ${context}:`, error);
    
    // 触发错误事件
    this.dispatchEvent('app-error', errorInfo);
    
    // 尝试恢复
    this.attemptRecovery(error, context);
  }

  /**
   * 处理应用错误
   * @param {Object} errorInfo - 错误信息
   */
  handleApplicationError(errorInfo) {
    // 显示用户友好的错误消息
    if (this.modules.eventHandler) {
      this.modules.eventHandler.showMessage('系统出现错误，正在尝试恢复...', 'error');
    }
    
    // 记录错误（可以发送到服务器）
    if (this.config.debug.enabled) {
      console.error('应用错误详情:', errorInfo);
    }
  }

  /**
   * 处理初始化错误
   * @param {Error} error - 初始化错误
   */
  handleInitializationError(error) {
    // 显示初始化失败页面
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif;">
        <div style="text-align: center; max-width: 500px; padding: 20px;">
          <h1 style="font-size: 3em; margin-bottom: 20px;">😵</h1>
          <h2 style="margin-bottom: 20px;">系统初始化失败</h2>
          <p style="margin-bottom: 30px; line-height: 1.6;">
            抱歉，课堂问答抽卡系统无法正常启动。<br>
            请刷新页面重试，或联系技术支持。
          </p>
          <button onclick="location.reload()" style="background: #fff; color: #667eea; border: none; padding: 12px 24px; border-radius: 25px; font-size: 16px; cursor: pointer; font-weight: bold;">
            刷新页面
          </button>
          <details style="margin-top: 30px; text-align: left;">
            <summary style="cursor: pointer; margin-bottom: 10px;">错误详情</summary>
            <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; overflow: auto; font-size: 12px;">${error.stack || error.message}</pre>
          </details>
        </div>
      </div>
    `;
  }

  /**
   * 尝试错误恢复
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  attemptRecovery(error, context) {
    // 简单的恢复策略
    switch (context) {
      case 'JavaScript Error':
        // 对于JS错误，尝试重新初始化UI
        if (this.modules.uiRenderer) {
          try {
            this.modules.uiRenderer.initialize();
          } catch (e) {
            console.error('UI恢复失败:', e);
          }
        }
        break;
        
      case 'Unhandled Promise Rejection':
        // 对于Promise错误，记录但不中断应用
        console.warn('Promise被拒绝，但应用继续运行');
        break;
    }
  }

  /**
   * 分发自定义事件
   * @param {string} eventName - 事件名称
   * @param {Object} detail - 事件详情
   */
  /**
   * 安全获取性能时间
   * @returns {number} 性能时间戳
   */
  getPerformanceTime() {
    // 修复 Illegal invocation 错误：确保在正确的上下文中调用 performance.now()
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      try {
        return performance.now.call(performance);
      } catch (error) {
        console.warn('Performance.now() 调用失败，回退到 Date.now():', error);
        return Date.now();
      }
    }
    return Date.now();
  }

  /**
   * 触发自定义事件
   * @param {string} eventName - 事件名称
   * @param {Object} detail - 事件详情
   */
  dispatchEvent(eventName, detail = {}) {
    try {
      console.log(`🔔 分发事件: ${eventName}`, detail);
      
      // 使用更兼容的事件创建方式
      let event;
      if (typeof CustomEvent === 'function') {
        event = new CustomEvent(eventName, { detail });
      } else if (document.createEvent) {
        // 兼容旧浏览器
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, false, false, detail);
      } else {
        console.warn('浏览器不支持自定义事件');
        return;
      }
      
      if (document && typeof document.dispatchEvent === 'function') {
        document.dispatchEvent(event);
        console.log(`✅ 事件分发成功: ${eventName}`);
      } else {
        console.warn('document.dispatchEvent 不可用');
      }
    } catch (error) {
      console.error('❌ 事件分发失败:', error);
      console.error('事件名称:', eventName);
      console.error('事件详情:', detail);
    }
  }

  /**
   * 获取应用状态
   * @returns {Object} 应用状态信息
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      config: this.config,
      performance: this.performance,
      modules: Object.keys(this.modules).reduce((status, key) => {
        status[key] = this.modules[key] !== null;
        return status;
      }, {}),
      errors: this.errorHandler.errors.length
    };
  }

  /**
   * 重启应用
   */
  async restart() {
    console.log('🔄 重启应用...');
    
    try {
      // 停止应用
      this.stop();
      
      // 清理模块
      this.cleanup();
      
      // 重新初始化
      await this.initialize();
      
      console.log('✅ 应用重启成功');
    } catch (error) {
      console.error('❌ 应用重启失败:', error);
      throw error;
    }
  }

  /**
   * 停止应用
   */
  stop() {
    if (!this.isRunning) {
      console.warn('应用未在运行');
      return;
    }
    
    console.log('⏹️ 停止应用...');
    
    // 保存数据
    this.saveToLocalStorage();
    
    this.isRunning = false;
    console.log('✅ 应用已停止');
    
    // 触发停止事件
    this.dispatchEvent('app-stopped');
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('🧹 清理资源...');
    
    // 清理各个模块
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.destroy === 'function') {
        module.destroy();
      }
    });
    
    // 重置模块引用
    this.modules = {
      studentDataManager: null,
      cardDrawEngine: null,
      uiRenderer: null,
      eventHandler: null
    };
    
    // 清理性能数据
    this.performance.metrics = [];
    
    // 清理错误记录
    this.errorHandler.errors = [];
    
    this.isInitialized = false;
    console.log('✅ 资源清理完成');
  }

  /**
   * 销毁应用
   */
  destroy() {
    console.log('💥 销毁应用...');
    
    this.stop();
    this.cleanup();
    
    console.log('✅ 应用已销毁');
  }
}

// 创建全局应用实例
const app = new App();

// 自动初始化（当DOM加载完成时）
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.initialize();
  } catch (error) {
    console.error('应用启动失败:', error);
  }
});

// 导出应用实例（用于调试和扩展）
window.CardDrawApp = app;

export default App;