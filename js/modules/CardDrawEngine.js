/**
 * 抽卡核心逻辑模块
 * 负责抽卡算法实现、抽卡状态管理和抽卡历史记录
 * 支持多种抽卡模式和权重设置
 */
class CardDrawEngine {
  constructor(studentDataManager) {
    // 学生数据管理器引用
    this.studentDataManager = studentDataManager;
    
    // 抽卡历史记录
    this.drawHistory = [];
    
    // 抽卡状态
    this.isDrawing = false;
    
    // 抽卡模式配置
    this.drawModes = {
      RANDOM: 'random',           // 完全随机
      WEIGHTED: 'weighted',       // 权重抽卡
      SEQUENTIAL: 'sequential'    // 顺序抽卡
    };
    
    // 当前抽卡模式
    this.currentMode = this.drawModes.RANDOM;
    
    // 权重配置（用于权重抽卡模式）
    this.rarityWeights = {
      'N': 1.0,   // 普通卡片权重
      'R': 0.5,   // 稀有卡片权重（更难抽中）
      'SR': 0.1   // 超稀有卡片权重（最难抽中）
    };
    
    // 事件监听器
    this.eventListeners = {
      'draw-start': [],
      'draw-complete': [],
      'draw-error': [],
      'reset-complete': []
    };
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 执行抽卡操作
   * @returns {Promise<Object>} 抽卡结果
   */
  async drawCard() {
    // 检查是否正在抽卡
    if (this.isDrawing) {
      throw new Error('正在抽卡中，请稍候...');
    }

    // 获取可用学生列表
    const availableStudents = this.studentDataManager.getAvailableStudents();
    
    if (availableStudents.length === 0) {
      const error = new Error('没有可抽取的卡片了！');
      this.emit('draw-error', { error });
      throw error;
    }

    try {
      // 设置抽卡状态
      this.isDrawing = true;
      this.emit('draw-start', { availableCount: availableStudents.length });

      // 根据当前模式执行抽卡
      let selectedStudent;
      switch (this.currentMode) {
        case this.drawModes.WEIGHTED:
          selectedStudent = this.weightedDraw(availableStudents);
          break;
        case this.drawModes.SEQUENTIAL:
          selectedStudent = this.sequentialDraw(availableStudents);
          break;
        default:
          selectedStudent = this.randomDraw(availableStudents);
      }

      // 标记学生为已抽中
      this.studentDataManager.markStudentAsDrawn(selectedStudent.id);

      // 记录抽卡历史
      const drawRecord = {
        student: selectedStudent,
        timestamp: new Date().toISOString(),
        mode: this.currentMode,
        remainingCount: availableStudents.length - 1
      };
      this.drawHistory.push(drawRecord);

      // 模拟抽卡动画延迟
      await this.simulateDrawDelay();

      // 触发抽卡完成事件
      this.emit('draw-complete', {
        student: selectedStudent,
        drawRecord,
        remainingCount: availableStudents.length - 1
      });

      return {
        success: true,
        student: selectedStudent,
        drawRecord,
        remainingCount: availableStudents.length - 1
      };

    } catch (error) {
      this.emit('draw-error', { error });
      throw error;
    } finally {
      // 重置抽卡状态
      this.isDrawing = false;
    }
  }

  /**
   * 随机抽卡算法
   * @param {Array} availableStudents - 可用学生列表
   * @returns {Object} 被选中的学生
   */
  randomDraw(availableStudents) {
    const randomIndex = Math.floor(Math.random() * availableStudents.length);
    return availableStudents[randomIndex];
  }

  /**
   * 权重抽卡算法
   * 根据稀有度设置不同的抽中概率
   * @param {Array} availableStudents - 可用学生列表
   * @returns {Object} 被选中的学生
   */
  weightedDraw(availableStudents) {
    // 计算总权重
    const totalWeight = availableStudents.reduce((sum, student) => {
      return sum + (this.rarityWeights[student.rarity] || 1);
    }, 0);

    // 生成随机数
    let random = Math.random() * totalWeight;

    // 根据权重选择学生
    for (const student of availableStudents) {
      const weight = this.rarityWeights[student.rarity] || 1;
      random -= weight;
      if (random <= 0) {
        return student;
      }
    }

    // 兜底返回最后一个学生
    return availableStudents[availableStudents.length - 1];
  }

  /**
   * 顺序抽卡算法
   * 按照学生ID顺序抽取
   * @param {Array} availableStudents - 可用学生列表
   * @returns {Object} 被选中的学生
   */
  sequentialDraw(availableStudents) {
    // 按ID排序并返回第一个
    const sortedStudents = availableStudents.sort((a, b) => a.id - b.id);
    return sortedStudents[0];
  }

  /**
   * 模拟抽卡延迟（用于动画效果）
   * @returns {Promise} 延迟Promise
   */
  simulateDrawDelay() {
    return new Promise(resolve => {
      // 随机延迟500-1500毫秒，增加抽卡的紧张感
      const delay = 500 + Math.random() * 1000;
      setTimeout(resolve, delay);
    });
  }

  /**
   * 重置抽卡系统
   * 清空抽卡历史并重置所有学生状态
   */
  reset() {
    // 重置学生状态
    this.studentDataManager.resetAllStudents();
    
    // 清空抽卡历史
    this.drawHistory = [];
    
    // 重置抽卡状态
    this.isDrawing = false;
    
    // 触发重置完成事件
    this.emit('reset-complete', {
      totalStudents: this.studentDataManager.getAllStudents().length
    });
  }

  /**
   * 设置抽卡模式
   * @param {string} mode - 抽卡模式
   */
  setDrawMode(mode) {
    if (Object.values(this.drawModes).includes(mode)) {
      this.currentMode = mode;
    } else {
      throw new Error(`无效的抽卡模式: ${mode}`);
    }
  }

  /**
   * 获取当前抽卡模式
   * @returns {string} 当前抽卡模式
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * 设置稀有度权重
   * @param {Object} weights - 权重配置对象
   */
  setRarityWeights(weights) {
    this.rarityWeights = { ...this.rarityWeights, ...weights };
  }

  /**
   * 获取抽卡历史
   * @param {number} limit - 限制返回数量（可选）
   * @returns {Array} 抽卡历史记录
   */
  getDrawHistory(limit = null) {
    const history = [...this.drawHistory].reverse(); // 最新的在前
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 获取抽卡统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const studentStats = this.studentDataManager.getStatistics();
    const historyStats = this.analyzeDrawHistory();
    
    return {
      ...studentStats,
      ...historyStats,
      currentMode: this.currentMode,
      isDrawing: this.isDrawing
    };
  }

  /**
   * 分析抽卡历史
   * @returns {Object} 历史分析结果
   */
  analyzeDrawHistory() {
    if (this.drawHistory.length === 0) {
      return {
        totalDraws: 0,
        averageDrawTime: 0,
        rarityDistribution: {},
        drawsByMode: {}
      };
    }

    // 计算稀有度分布
    const rarityDistribution = this.drawHistory.reduce((acc, record) => {
      const rarity = record.student.rarity;
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});

    // 计算模式分布
    const drawsByMode = this.drawHistory.reduce((acc, record) => {
      acc[record.mode] = (acc[record.mode] || 0) + 1;
      return acc;
    }, {});

    // 计算平均抽卡间隔
    let averageDrawTime = 0;
    if (this.drawHistory.length > 1) {
      const times = this.drawHistory.map(record => new Date(record.timestamp).getTime());
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      averageDrawTime = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return {
      totalDraws: this.drawHistory.length,
      averageDrawTime: Math.round(averageDrawTime / 1000), // 转换为秒
      rarityDistribution,
      drawsByMode
    };
  }

  /**
   * 检查是否可以抽卡
   * @returns {Object} 检查结果
   */
  canDraw() {
    const availableStudents = this.studentDataManager.getAvailableStudents();
    
    return {
      canDraw: !this.isDrawing && availableStudents.length > 0,
      isDrawing: this.isDrawing,
      availableCount: availableStudents.length,
      reason: this.isDrawing ? '正在抽卡中' : 
              availableStudents.length === 0 ? '没有可抽取的卡片' : null
    };
  }

  /**
   * 预览下一次抽卡可能的结果（仅用于调试）
   * @returns {Array} 可能的抽卡结果列表
   */
  previewNextDraw() {
    const availableStudents = this.studentDataManager.getAvailableStudents();
    
    if (availableStudents.length === 0) {
      return [];
    }

    // 根据当前模式返回可能的结果
    switch (this.currentMode) {
      case this.drawModes.SEQUENTIAL:
        return [availableStudents.sort((a, b) => a.id - b.id)[0]];
      case this.drawModes.WEIGHTED:
        // 返回按权重排序的前几个可能结果
        return availableStudents
          .sort((a, b) => (this.rarityWeights[b.rarity] || 1) - (this.rarityWeights[a.rarity] || 1))
          .slice(0, 5);
      default:
        // 随机模式返回所有可能结果
        return availableStudents;
    }
  }
}

// 导出模块
export default CardDrawEngine;