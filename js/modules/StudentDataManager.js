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
   * 使用真实学生姓名和本地头像图片
   */
  initializeDefaultData() {
    // 预定义的学生姓名列表（与images目录中的图片文件完全对应）
    this.studentNames = [
      // 真实学生姓名（与images目录中的图片文件对应）
      '丁俊博', '丁宇哲', '丁旭尧', '严晨瑞', '刘子轩', '刘易涵', '刘舒雅', 
      '吴岳阳', '喻言', '孙成梦', '张恒溢', '张烨琪', '彭特', '徐仁予', 
      '徐天佑', '徐嫣然', '方梓晨', '方瑜博', '方警妤', '方诗熳', '曾彦宇', 
      '李东霖', '李妙言', '李宇涵', '李诗璇', '李鑫悦', '李雨滋', '杨果', 
      '沈文轩', '熊梓嫣', '王俊杰', '王津瑜', '王润邦', '纪怀瑾', '罗昕怡', 
      '罗昕玥', '肖旭东', '胡楚昀', '胡诗雨', '蒋铭', '蔡国斌', '许锦程', 
      '谢雄涛', '谭钰泷', '陈泽扬', '陈浩东', '高夕乐', '高语', '龚泓菘'
    ];

    this.students = Array.from({length: this.defaultStudentCount}, (_, i) => {
      const name = this.studentNames[i] || `同学${i + 1}`;
      return {
        id: i + 1,
        name: name,
        // 使用本地图片路径，支持多种格式，如果不存在则使用默认头像
        avatar: this.getStudentAvatar(name),
        // 稀有度等级 (普通、稀有、超稀有)
        rarity: this.generateRarity(),
        // 是否已被抽中
        isDrawn: false,
        // 抽中时间戳
        drawnAt: null
      };
    });
  }

  /**
   * 获取学生头像路径
   * 智能匹配本地图片文件，支持多种格式
   * @param {string} name - 学生姓名
   * @returns {string} 头像路径
   */
  /**
   * 获取学生头像路径
   * 根据学生姓名返回对应的头像图片路径
   * @param {string} name - 学生姓名
   * @returns {string} 头像图片路径
   */
  getStudentAvatar(name) {
    // 所有学生头像都是jpg格式，直接返回对应路径
    return `./images/${name}.jpg`;
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