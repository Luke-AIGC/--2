/**
 * 学生数据管理模块
 * 负责管理学生信息数据，提供数据访问接口
 * 支持数据的增删改查操作
 */
class StudentDataManager {
  constructor() {
    // 学生数据存储
    this.students = [];
    // 默认学生数量
    this.defaultStudentCount = 49;
    
    // 事件监听器系统
    this.eventListeners = {
      'data-updated': [],
      'data-imported': [],
      'student-added': [],
      'student-removed': [],
      'student-drawn': [],
      'data-reset': []
    };
    
    // 初始化默认数据
    this.initializeDefaultData();
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    } else {
      console.warn(`未知事件类型: ${event}`);
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
   * @param {Object} data - 事件数据
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback({ detail: data });
        } catch (error) {
          console.error(`事件处理器执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 初始化默认学生数据
   * 为每个学生生成唯一的ID、姓名和头像
   */
  initializeDefaultData() {
    this.students = Array.from({length: this.defaultStudentCount}, (_, i) => ({
      id: i + 1,
      name: `学生${i + 1}号`,
      // 使用 DiceBear API 生成随机头像，每个学号对应一个固定头像
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
      // 稀有度等级 (普通、稀有、超稀有)
      rarity: this.generateRarity(),
      // 是否已被抽中
      isDrawn: false,
      // 抽中时间戳
      drawnAt: null
    }));
  }

  /**
   * 生成卡片稀有度
   * 90% 普通(N), 9% 稀有(R), 1% 超稀有(SR)
   */
  generateRarity() {
    const random = Math.random();
    if (random < 0.01) return 'SR'; // 1% 超稀有
    if (random < 0.10) return 'R';  // 9% 稀有
    return 'N'; // 90% 普通
  }

  /**
   * 获取所有学生数据
   * @returns {Array} 学生数据数组
   */
  getAllStudents() {
    return [...this.students]; // 返回副本，避免外部修改
  }

  /**
   * 根据ID获取学生信息
   * @param {number} id - 学生ID
   * @returns {Object|null} 学生信息对象或null
   */
  getStudentById(id) {
    return this.students.find(student => student.id === id) || null;
  }

  /**
   * 获取未被抽中的学生列表
   * @returns {Array} 未被抽中的学生数组
   */
  getAvailableStudents() {
    return this.students.filter(student => !student.isDrawn);
  }

  /**
   * 获取已被抽中的学生列表
   * @returns {Array} 已被抽中的学生数组
   */
  getDrawnStudents() {
    return this.students.filter(student => student.isDrawn);
  }

  /**
   * 标记学生为已抽中
   * @param {number} id - 学生ID
   * @returns {boolean} 操作是否成功
   */
  markStudentAsDrawn(id) {
    const student = this.getStudentById(id);
    if (student && !student.isDrawn) {
      student.isDrawn = true;
      student.drawnAt = new Date().toISOString();
      
      // 触发学生被抽中事件
      this.emit('student-drawn', {
        student: { ...student },
        timestamp: student.drawnAt
      });
      
      // 触发数据更新事件
      this.emit('data-updated', {
        type: 'student-drawn',
        studentId: id,
        timestamp: student.drawnAt
      });
      
      return true;
    }
    return false;
  }

  /**
   * 重置所有学生状态
   * 将所有学生标记为未抽中
   */
  resetAllStudents() {
    this.students.forEach(student => {
      student.isDrawn = false;
      student.drawnAt = null;
    });
    
    // 触发数据重置事件
    this.emit('data-reset', {
      timestamp: new Date().toISOString(),
      totalStudents: this.students.length
    });
    
    // 触发数据更新事件
    this.emit('data-updated', {
      type: 'reset',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 添加新学生
   * @param {string} name - 学生姓名
   * @param {string} avatar - 头像URL（可选）
   * @returns {Object} 新添加的学生对象
   */
  addStudent(name, avatar = null) {
    const newId = Math.max(...this.students.map(s => s.id)) + 1;
    const newStudent = {
      id: newId,
      name: name,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newId}`,
      rarity: this.generateRarity(),
      isDrawn: false,
      drawnAt: null
    };
    
    this.students.push(newStudent);
    return newStudent;
  }

  /**
   * 删除学生
   * @param {number} id - 学生ID
   * @returns {boolean} 操作是否成功
   */
  removeStudent(id) {
    const index = this.students.findIndex(student => student.id === id);
    if (index !== -1) {
      this.students.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 更新学生信息
   * @param {number} id - 学生ID
   * @param {Object} updates - 要更新的字段
   * @returns {boolean} 操作是否成功
   */
  updateStudent(id, updates) {
    const student = this.getStudentById(id);
    if (student) {
      Object.assign(student, updates);
      return true;
    }
    return false;
  }

  /**
   * 批量导入学生数据
   * @param {Array} studentsData - 学生数据数组
   * @returns {boolean} 操作是否成功
   */
  importStudents(studentsData) {
    try {
      // 验证数据格式
      if (!Array.isArray(studentsData)) {
        throw new Error('学生数据必须是数组格式');
      }

      // 清空现有数据
      this.students = [];

      // 导入新数据
      studentsData.forEach((data, index) => {
        const student = {
          id: data.id || (index + 1),
          name: data.name || `学生${index + 1}号`,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${index + 1}`,
          rarity: data.rarity || this.generateRarity(),
          isDrawn: false,
          drawnAt: null
        };
        this.students.push(student);
      });

      // 触发数据导入事件
      this.emit('data-imported', {
        studentsCount: this.students.length,
        timestamp: new Date().toISOString()
      });

      // 触发数据更新事件
      this.emit('data-updated', {
        type: 'import',
        studentsCount: this.students.length,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('导入学生数据失败:', error);
      return false;
    }
  }

  /**
   * 导出学生数据
   * @returns {Array} 学生数据数组
   */
  exportStudents() {
    return this.students.map(student => ({
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      rarity: student.rarity
    }));
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息对象
   */
  getStatistics() {
    const total = this.students.length;
    const drawn = this.getDrawnStudents().length;
    const available = total - drawn;
    
    const rarityCount = this.students.reduce((acc, student) => {
      acc[student.rarity] = (acc[student.rarity] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      drawn,
      available,
      rarityDistribution: rarityCount,
      drawRate: total > 0 ? (drawn / total * 100).toFixed(1) : 0
    };
  }

  /**
   * 验证数据完整性
   * @returns {Object} 验证结果
   */
  validateData() {
    const issues = [];
    
    // 检查重复ID
    const ids = this.students.map(s => s.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      issues.push(`发现重复ID: ${duplicateIds.join(', ')}`);
    }

    // 检查必要字段
    this.students.forEach(student => {
      if (!student.name || !student.avatar) {
        issues.push(`学生ID ${student.id} 缺少必要信息`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// 导出模块
export default StudentDataManager;