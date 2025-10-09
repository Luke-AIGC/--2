/**
 * UI渲染模块
 * 负责卡片的渲染、动画效果和界面状态更新
 * 提供高性能的DOM操作和流畅的用户体验
 */
class UIRenderer {
  constructor() {
    // DOM元素引用
    this.elements = {
      cardsContainer: null,
      drawnDisplay: null,
      remainingCount: null,
      drawBtn: null,
      resetBtn: null
    };
    
    // 渲染状态
    this.isRendering = false;
    this.animationQueue = [];
    
    // 卡片布局配置
    this.layoutConfig = {
      radius: 200,
      centerOffset: { x: 0, y: 0 },
      cardSize: { width: 120, height: 160 },
      maxCardsPerRow: 12
    };
    
    // 动画配置
    this.animationConfig = {
      cardDrawDuration: 1000,
      cardFlipDuration: 600,
      resultShowDuration: 600,
      staggerDelay: 50
    };
    
    // 性能优化配置
    this.performanceConfig = {
      useDocumentFragment: true,
      enableVirtualization: false,
      maxVisibleCards: 50
    };
  }

  /**
   * 初始化UI渲染器
   * 获取DOM元素引用并设置初始状态
   */
  initialize() {
    // 获取DOM元素引用
    this.elements.cardsContainer = document.getElementById('cardsContainer');
    this.elements.drawnDisplay = document.getElementById('drawnDisplay');
    this.elements.remainingCount = document.getElementById('remainingCount');
    this.elements.drawBtn = document.getElementById('drawBtn');
    this.elements.resetBtn = document.getElementById('resetBtn');
    
    // 验证必要元素是否存在
    this.validateElements();
    
    // 设置容器尺寸
    this.setupContainerDimensions();
    
    // 初始化性能监控
    this.initPerformanceMonitoring();
  }

  /**
   * 验证DOM元素是否存在
   */
  validateElements() {
    const missingElements = [];
    
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        missingElements.push(key);
      }
    });
    
    if (missingElements.length > 0) {
      throw new Error(`缺少必要的DOM元素: ${missingElements.join(', ')}`);
    }
  }

  /**
   * 设置容器尺寸
   */
  setupContainerDimensions() {
    if (this.elements.cardsContainer) {
      const rect = this.elements.cardsContainer.getBoundingClientRect();
      this.layoutConfig.centerOffset.x = rect.width / 2;
      this.layoutConfig.centerOffset.y = rect.height / 2;
    }
  }

  /**
   * 渲染卡片列表
   * @param {Array} students - 学生数据数组
   */
  renderCards(students) {
    if (this.isRendering) {
      console.warn('正在渲染中，跳过此次渲染请求');
      return;
    }

    this.isRendering = true;
    
    try {
      // 清空容器
      this.clearContainer(this.elements.cardsContainer);
      
      // 过滤未抽中的学生
      const availableStudents = students.filter(student => !student.isDrawn);
      
      if (availableStudents.length === 0) {
        this.renderEmptyState();
        return;
      }
      
      // 使用文档片段优化性能
      const fragment = this.performanceConfig.useDocumentFragment ? 
        document.createDocumentFragment() : null;
      
      // 渲染每张卡片
      availableStudents.forEach((student, index) => {
        const cardElement = this.createCardElement(student, index, availableStudents.length);
        
        if (fragment) {
          fragment.appendChild(cardElement);
        } else {
          this.elements.cardsContainer.appendChild(cardElement);
        }
      });
      
      // 一次性添加到DOM
      if (fragment) {
        this.elements.cardsContainer.appendChild(fragment);
      }
      
      // 触发入场动画
      this.animateCardsEntrance(availableStudents.length);
      
    } catch (error) {
      console.error('渲染卡片时发生错误:', error);
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * 创建单张卡片元素
   * @param {Object} student - 学生数据
   * @param {number} index - 卡片索引
   * @param {number} total - 总卡片数
   * @returns {HTMLElement} 卡片DOM元素
   */
  createCardElement(student, index, total) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.studentId = student.id;
    card.dataset.index = index;
    
    // 计算卡片位置
    const position = this.calculateCardPosition(index, total);
    const rotation = this.calculateCardRotation(index, total);
    
    // 设置卡片样式
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
    card.style.transform = `rotate(${rotation}deg)`;
    card.style.zIndex = index;
    card.style.setProperty('--rotation', `${rotation}deg`);
    
    // 创建卡片内容
    card.innerHTML = this.createCardHTML(student);
    
    return card;
  }

  /**
   * 创建卡片HTML内容
   * @param {Object} student - 学生数据
   * @returns {string} HTML字符串
   */
  createCardHTML(student) {
    const rarityText = this.getRarityText(student.rarity);
    const rarityStars = this.getRarityStars(student.rarity);
    
    return `
      <div class="card-inner">
        <div class="card-front">
          <div class="text-white text-6xl mb-2">❓</div>
          <div class="text-white text-xs font-bold">MYSTERY</div>
        </div>
        <div class="card-back">
          <div class="rarity-badge">${rarityStars} ${rarityText}</div>
          <img src="${student.avatar}" alt="${student.name}" class="avatar mb-2" loading="lazy">
          <div class="text-gray-800 text-xs font-bold text-center px-1">${student.name}</div>
          <div class="text-purple-600 text-lg font-bold mt-1">No.${student.id}</div>
        </div>
      </div>
    `;
  }

  /**
   * 计算卡片位置
   * @param {number} index - 卡片索引
   * @param {number} total - 总卡片数
   * @returns {Object} 位置坐标 {x, y}
   */
  calculateCardPosition(index, total) {
    const { radius, centerOffset, cardSize } = this.layoutConfig;
    
    // 扇形排列算法
    const angle = (index / total) * Math.PI - Math.PI / 2;
    const x = centerOffset.x + Math.cos(angle) * radius - cardSize.width / 2;
    const y = centerOffset.y + Math.sin(angle) * radius * 0.5 - cardSize.height / 2;
    
    return { x, y };
  }

  /**
   * 计算卡片旋转角度
   * @param {number} index - 卡片索引
   * @param {number} total - 总卡片数
   * @returns {number} 旋转角度
   */
  calculateCardRotation(index, total) {
    return (index - total / 2) * 2;
  }

  /**
   * 显示抽中的卡片
   * @param {Object} student - 被抽中的学生
   * @param {Object} options - 显示选项
   */
  showDrawnCard(student, options = {}) {
    const { showAnimation = true, duration = this.animationConfig.resultShowDuration } = options;
    
    // 清空显示区域
    this.clearContainer(this.elements.drawnDisplay);
    
    // 创建结果卡片
    const resultCard = this.createResultCard(student);
    
    if (showAnimation) {
      // 添加入场动画
      resultCard.style.opacity = '0';
      resultCard.style.transform = 'scale(0.8) rotateY(90deg)';
      
      this.elements.drawnDisplay.appendChild(resultCard);
      
      // 触发动画
      requestAnimationFrame(() => {
        resultCard.style.transition = `all ${duration}ms ease-out`;
        resultCard.style.opacity = '1';
        resultCard.style.transform = 'scale(1) rotateY(0deg)';
      });
    } else {
      this.elements.drawnDisplay.appendChild(resultCard);
    }
    
    // 添加特效
    this.addSpecialEffects(resultCard, student.rarity);
  }

  /**
   * 创建结果卡片元素
   * @param {Object} student - 学生数据
   * @returns {HTMLElement} 结果卡片元素
   */
  createResultCard(student) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    const rarityText = this.getRarityText(student.rarity);
    const rarityStars = this.getRarityStars(student.rarity);
    
    resultCard.innerHTML = `
      <div class="star-decoration" style="top: 10px; left: 20px; font-size: 24px;">⭐</div>
      <div class="star-decoration" style="top: 10px; right: 20px; font-size: 24px; animation-delay: 0.3s;">⭐</div>
      <div class="star-decoration" style="bottom: 20px; left: 30px; font-size: 20px; animation-delay: 0.6s;">✨</div>
      <div class="star-decoration" style="bottom: 20px; right: 30px; font-size: 20px; animation-delay: 0.9s;">✨</div>
      
      <img src="${student.avatar}" alt="${student.name}" class="result-avatar" loading="lazy">
      
      <div class="z-10 mt-4 text-center">
        <div class="text-gray-500 text-sm mb-1">恭喜抽中</div>
        <div class="text-3xl font-bold text-gray-800 mb-2">${student.name}</div>
        <div class="inline-block bg-purple-600 text-white px-4 py-2 rounded-full text-xl font-bold mb-3">
          学号 ${student.id}
        </div>
        <div class="text-gray-600 text-sm">请这位同学回答问题 🎤</div>
      </div>
      
      <div class="absolute bottom-4 text-xs text-gray-400">
        ${rarityStars} ${rarityText} ${rarityStars}
      </div>
    `;
    
    return resultCard;
  }

  /**
   * 添加特殊效果
   * @param {HTMLElement} element - 目标元素
   * @param {string} rarity - 稀有度
   */
  addSpecialEffects(element, rarity) {
    // 根据稀有度添加不同的特效
    switch (rarity) {
      case 'SR':
        this.addGoldenGlow(element);
        this.addFloatingParticles(element);
        break;
      case 'R':
        this.addSilverGlow(element);
        break;
      default:
        // 普通卡片无特殊效果
        break;
    }
  }

  /**
   * 添加金色光效
   * @param {HTMLElement} element - 目标元素
   */
  addGoldenGlow(element) {
    element.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6), 0 20px 60px rgba(0,0,0,0.4)';
    element.style.animation = 'goldenPulse 2s ease-in-out infinite';
    
    // 添加CSS动画（如果不存在）
    this.addCSSAnimation('goldenPulse', `
      0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 20px 60px rgba(0,0,0,0.4); }
      50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.8), 0 20px 60px rgba(0,0,0,0.4); }
    `);
  }

  /**
   * 添加银色光效
   * @param {HTMLElement} element - 目标元素
   */
  addSilverGlow(element) {
    element.style.boxShadow = '0 0 20px rgba(192, 192, 192, 0.6), 0 20px 60px rgba(0,0,0,0.4)';
  }

  /**
   * 添加浮动粒子效果
   * @param {HTMLElement} element - 目标元素
   */
  addFloatingParticles(element) {
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: gold;
        border-radius: 50%;
        pointer-events: none;
        animation: float ${2 + Math.random() * 2}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      element.appendChild(particle);
    }
    
    // 添加浮动动画
    this.addCSSAnimation('float', `
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
      50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
    `);
  }

  /**
   * 动态添加CSS动画
   * @param {string} name - 动画名称
   * @param {string} keyframes - 关键帧定义
   */
  addCSSAnimation(name, keyframes) {
    const styleId = `animation-${name}`;
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `@keyframes ${name} { ${keyframes} }`;
      document.head.appendChild(style);
    }
  }

  /**
   * 卡片入场动画
   * @param {number} cardCount - 卡片数量
   */
  animateCardsEntrance(cardCount) {
    const cards = this.elements.cardsContainer.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = `${card.style.transform} scale(0.8)`;
      
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        card.style.opacity = '1';
        card.style.transform = card.style.transform.replace('scale(0.8)', 'scale(1)');
      }, index * this.animationConfig.staggerDelay);
    });
  }

  /**
   * 执行抽卡动画
   * @param {HTMLElement} cardElement - 被抽中的卡片元素
   * @returns {Promise} 动画完成Promise
   */
  animateCardDraw(cardElement) {
    return new Promise((resolve) => {
      // 添加选中样式
      cardElement.classList.add('selected-card');
      
      // 动画完成后移除样式
      setTimeout(() => {
        cardElement.classList.remove('selected-card');
        resolve();
      }, this.animationConfig.cardDrawDuration);
    });
  }

  /**
   * 更新剩余卡片数量显示
   * @param {number} count - 剩余数量
   */
  updateRemainingCount(count) {
    if (this.elements.remainingCount) {
      // 添加数字变化动画
      this.elements.remainingCount.style.transform = 'scale(1.2)';
      this.elements.remainingCount.textContent = count;
      
      setTimeout(() => {
        this.elements.remainingCount.style.transform = 'scale(1)';
      }, 200);
    }
  }

  /**
   * 设置按钮状态
   * @param {string} buttonId - 按钮ID
   * @param {boolean} enabled - 是否启用
   * @param {string} text - 按钮文本（可选）
   */
  setButtonState(buttonId, enabled, text = null) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = !enabled;
      
      if (enabled) {
        button.classList.remove('loading');
      } else {
        button.classList.add('loading');
      }
      
      if (text) {
        const textElement = button.querySelector('span:last-child');
        if (textElement) {
          textElement.textContent = text;
        }
      }
    }
  }

  /**
   * 显示空状态
   */
  renderEmptyState() {
    this.clearContainer(this.elements.cardsContainer);
    
    const emptyState = document.createElement('div');
    emptyState.className = 'text-white text-2xl text-center';
    emptyState.innerHTML = `
      <div class="text-6xl mb-4">🎉</div>
      <div>所有卡片已抽完！</div>
      <div class="text-lg mt-2">点击重置按钮开始新一轮</div>
    `;
    
    this.elements.cardsContainer.appendChild(emptyState);
  }

  /**
   * 显示占位符
   */
  showPlaceholder() {
    this.clearContainer(this.elements.drawnDisplay);
    
    const placeholder = document.createElement('div');
    placeholder.className = 'text-white text-2xl text-center';
    placeholder.id = 'placeholder';
    placeholder.innerHTML = `
      <div class="text-4xl mb-2">🎴</div>
      点击下方"随机抽卡"按钮开始
    `;
    
    this.elements.drawnDisplay.appendChild(placeholder);
  }

  /**
   * 清空容器
   * @param {HTMLElement} container - 要清空的容器
   */
  clearContainer(container) {
    if (container) {
      // 使用高性能的清空方法
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }

  /**
   * 获取稀有度文本
   * @param {string} rarity - 稀有度代码
   * @returns {string} 稀有度文本
   */
  getRarityText(rarity) {
    const rarityMap = {
      'N': 'NORMAL',
      'R': 'RARE',
      'SR': 'SUPER RARE'
    };
    return rarityMap[rarity] || 'NORMAL';
  }

  /**
   * 获取稀有度星级
   * @param {string} rarity - 稀有度代码
   * @returns {string} 星级字符串
   */
  getRarityStars(rarity) {
    const starsMap = {
      'N': '★',
      'R': '★★',
      'SR': '★★★'
    };
    return starsMap[rarity] || '★';
  }

  /**
   * 初始化性能监控
   */
  initPerformanceMonitoring() {
    // 监控渲染性能
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 16) { // 超过一帧的时间
          console.warn(`渲染性能警告: ${entry.name} 耗时 ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * 响应式布局调整
   */
  handleResize() {
    this.setupContainerDimensions();
    // 重新计算卡片位置（如果需要）
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    // 清理性能监控
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // 清空动画队列
    this.animationQueue = [];
    
    // 重置状态
    this.isRendering = false;
  }
}

// 导出模块
export default UIRenderer;