/**
 * 事件处理模块
 * 负责用户交互事件处理和模块间通信协调
 * 采用事件驱动架构，确保模块间的松耦合
 */
class EventHandler {
  constructor() {
    // 事件监听器映射
    this.eventListeners = new Map();
    
    // 模块引用
    this.modules = {
      studentDataManager: null,
      cardDrawEngine: null,
      uiRenderer: null
    };
    
    // 事件状态
    this.isProcessing = false;
    this.eventQueue = [];
    
    // 键盘快捷键配置
    this.keyboardShortcuts = {
      'Space': 'draw',
      'Enter': 'draw',
      'KeyR': 'reset',
      'Escape': 'cancel'
    };
    
    // 触摸事件配置
    this.touchConfig = {
      enabled: true,
      swipeThreshold: 50,
      tapTimeout: 300
    };
    
    // 事件防抖配置
    this.debounceConfig = {
      draw: 1000,    // 抽卡防抖1秒
      reset: 500,    // 重置防抖0.5秒
      resize: 250    // 窗口调整防抖0.25秒
    };
    
    // 防抖定时器
    this.debounceTimers = new Map();
  }

  /**
   * 初始化事件处理器
   * @param {Object} modules - 模块实例对象
   */
  initialize(modules) {
    this.modules = { ...this.modules, ...modules };
    
    // 绑定DOM事件
    this.bindDOMEvents();
    
    // 绑定模块事件
    this.bindModuleEvents();
    
    // 绑定键盘事件
    this.bindKeyboardEvents();
    
    // 绑定触摸事件
    this.bindTouchEvents();
    
    // 绑定窗口事件
    this.bindWindowEvents();
    
    console.log('事件处理器初始化完成');
  }

  /**
   * 绑定DOM事件
   */
  bindDOMEvents() {
    // 抽卡按钮事件
    const drawBtn = document.getElementById('drawBtn');
    if (drawBtn) {
      drawBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDrawCard();
      });
    }
    
    // 重置按钮事件
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleReset();
      });
    }
    
    // 卡片点击事件（事件委托）
    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
      cardsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card) {
          this.handleCardClick(card);
        }
      });
    }
    
    // 设置按钮事件（如果存在）
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.handleSettings();
      });
    }
  }

  /**
   * 绑定模块事件
   */
  bindModuleEvents() {
    // 监听抽卡引擎事件
    if (this.modules.cardDrawEngine) {
      this.modules.cardDrawEngine.addEventListener('draw-start', (data) => {
        this.handleDrawStart(data);
      });
      
      this.modules.cardDrawEngine.addEventListener('draw-complete', (data) => {
        this.handleDrawComplete(data);
      });
      
      this.modules.cardDrawEngine.addEventListener('draw-error', (data) => {
        this.handleDrawError(data);
      });
      
      this.modules.cardDrawEngine.addEventListener('reset-complete', (data) => {
        this.handleResetComplete(data);
      });
    }
    
    // 监听数据管理器事件
    if (this.modules.studentDataManager) {
      this.modules.studentDataManager.addEventListener('data-updated', (data) => {
        this.handleDataUpdated(data);
      });
      
      this.modules.studentDataManager.addEventListener('data-imported', (data) => {
        this.handleDataImported(data);
      });
    }
  }

  /**
   * 绑定键盘事件
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // 防止在输入框中触发快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const action = this.keyboardShortcuts[e.code];
      if (action) {
        e.preventDefault();
        this.handleKeyboardShortcut(action, e);
      }
    });
    
    // 组合键支持
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.code) {
          case 'KeyS':
            e.preventDefault();
            this.handleSaveData();
            break;
          case 'KeyO':
            e.preventDefault();
            this.handleLoadData();
            break;
        }
      }
    });
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    if (!this.touchConfig.enabled) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;
      
      // 检测滑动手势
      if (Math.abs(deltaX) > this.touchConfig.swipeThreshold) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
      
      // 检测双击
      if (deltaTime < this.touchConfig.tapTimeout && 
          Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        this.handleDoubleTap(e);
      }
    }, { passive: true });
  }

  /**
   * 绑定窗口事件
   */
  bindWindowEvents() {
    // 窗口大小调整
    window.addEventListener('resize', () => {
      this.debounce('resize', () => {
        this.handleWindowResize();
      }, this.debounceConfig.resize);
    });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // 页面卸载前
    window.addEventListener('beforeunload', (e) => {
      this.handleBeforeUnload(e);
    });
  }

  /**
   * 处理抽卡事件
   */
  handleDrawCard() {
    if (this.isProcessing) {
      console.log('正在处理中，请稍候...');
      return;
    }
    
    this.debounce('draw', () => {
      try {
        this.isProcessing = true;
        
        // 检查是否还有可抽卡片
        const availableStudents = this.modules.studentDataManager.getAvailableStudents();
        if (availableStudents.length === 0) {
          this.showMessage('没有可抽的卡片了，请先重置！', 'warning');
          this.isProcessing = false;
          return;
        }
        
        // 执行抽卡
        this.modules.cardDrawEngine.drawCard();
        
      } catch (error) {
        console.error('抽卡处理失败:', error);
        this.showMessage('抽卡失败，请重试', 'error');
        this.isProcessing = false;
      }
    }, this.debounceConfig.draw);
  }

  /**
   * 处理重置事件
   */
  handleReset() {
    this.debounce('reset', () => {
      try {
        // 显示确认对话框
        if (confirm('确定要重置所有卡片吗？')) {
          this.modules.cardDrawEngine.reset();
        }
      } catch (error) {
        console.error('重置处理失败:', error);
        this.showMessage('重置失败，请重试', 'error');
      }
    }, this.debounceConfig.reset);
  }

  /**
   * 处理卡片点击事件
   * @param {HTMLElement} cardElement - 被点击的卡片元素
   */
  handleCardClick(cardElement) {
    const studentId = cardElement.dataset.studentId;
    if (!studentId) return;
    
    // 获取学生信息
    const student = this.modules.studentDataManager.getStudentById(studentId);
    if (!student) return;
    
    // 显示学生详情（可选功能）
    this.showStudentDetails(student);
  }

  /**
   * 处理抽卡开始事件
   * @param {Object} detail - 事件详情
   */
  handleDrawStart(detail) {
    console.log('抽卡开始:', detail);
    
    // 更新UI状态
    this.modules.uiRenderer.setButtonState('drawBtn', false, '抽卡中...');
    this.modules.uiRenderer.setButtonState('resetBtn', false);
    
    // 播放音效（如果有）
    this.playSound('draw-start');
  }

  /**
   * 处理抽卡完成事件
   * @param {Object} detail - 事件详情
   */
  /**
   * 处理抽卡完成事件
   * @param {Object} detail - 抽卡结果详情，包含学生信息和剩余数量
   */
  handleDrawComplete(detail) {
    console.log('抽卡完成:', detail);
    
    // 防护性检查：确保 detail 存在且包含必要的数据
    if (!detail) {
      console.error('抽卡完成事件缺少详情数据');
      this.isProcessing = false;
      return;
    }
    
    // 解构数据，提供默认值以防数据不完整
    const { 
      student = null, 
      remainingCount = 0,
      drawRecord = null 
    } = detail;
    
    // 检查关键数据是否存在
    if (!student) {
      console.error('抽卡完成事件缺少学生数据');
      this.isProcessing = false;
      return;
    }
    
    try {
      // 显示抽中的卡片
      this.modules.uiRenderer.showDrawnCard(student);
      
      // 更新剩余数量
      this.modules.uiRenderer.updateRemainingCount(remainingCount);
      
      // 重新渲染卡片列表（抽卡后不需要动画）
      const allStudents = this.modules.studentDataManager.getAllStudents();
      this.modules.uiRenderer.renderCards(allStudents, false);
      
      // 恢复按钮状态
      this.modules.uiRenderer.setButtonState('drawBtn', remainingCount > 0, '随机抽卡');
      this.modules.uiRenderer.setButtonState('resetBtn', true);
      
      // 播放音效（如果学生有稀有度信息）
      if (student.rarity) {
        this.playSound('draw-complete', student.rarity);
      } else {
        this.playSound('draw-complete');
      }
      
      // 触发自定义事件
      this.dispatchCustomEvent('card-drawn', { student, remainingCount, drawRecord });
      
    } catch (error) {
      console.error('处理抽卡完成事件时发生错误:', error);
      // 显示用户友好的错误信息
      this.showMessage('抽卡完成处理出现问题，请重试', 'error');
    } finally {
      // 无论如何都要重置处理状态
      this.isProcessing = false;
    }
  }

  /**
   * 处理抽卡错误事件
   * @param {Object} detail - 错误详情
   */
  handleDrawError(detail) {
    console.error('抽卡错误:', detail);
    
    // 显示错误消息
    this.showMessage(detail.message || '抽卡失败', 'error');
    
    // 恢复按钮状态
    this.modules.uiRenderer.setButtonState('drawBtn', true, '随机抽卡');
    this.modules.uiRenderer.setButtonState('resetBtn', true);
    
    // 重置处理状态
    this.isProcessing = false;
  }

  /**
   * 处理重置完成事件
   * @param {Object} detail - 事件详情
   */
  handleResetComplete(detail) {
    console.log('重置完成:', detail);
    
    // 重新渲染所有卡片（重置时需要动画）
    const allStudents = this.modules.studentDataManager.getAllStudents();
    this.modules.uiRenderer.renderCards(allStudents, true);
    
    // 显示占位符
    this.modules.uiRenderer.showPlaceholder();
    
    // 更新剩余数量
    this.modules.uiRenderer.updateRemainingCount(allStudents.length);
    
    // 恢复按钮状态
    this.modules.uiRenderer.setButtonState('drawBtn', true, '随机抽卡');
    this.modules.uiRenderer.setButtonState('resetBtn', true);
    
    // 显示成功消息
    this.showMessage('重置成功！', 'success');
    
    // 播放音效
    this.playSound('reset');
  }

  /**
   * 处理数据更新事件
   * @param {Object} detail - 数据详情
   */
  handleDataUpdated(detail) {
    console.log('数据已更新:', detail);
    
    // 重新渲染卡片（数据更新时不需要动画）
    const allStudents = this.modules.studentDataManager.getAllStudents();
    this.modules.uiRenderer.renderCards(allStudents, false);
    
    // 更新剩余数量
    const availableCount = this.modules.studentDataManager.getAvailableStudents().length;
    this.modules.uiRenderer.updateRemainingCount(availableCount);
  }

  /**
   * 处理键盘快捷键
   * @param {string} action - 动作类型
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeyboardShortcut(action, event) {
    switch (action) {
      case 'draw':
        this.handleDrawCard();
        break;
      case 'reset':
        this.handleReset();
        break;
      case 'cancel':
        this.handleCancel();
        break;
    }
  }

  /**
   * 处理滑动手势
   */
  handleSwipeRight() {
    // 右滑抽卡
    this.handleDrawCard();
  }

  handleSwipeLeft() {
    // 左滑重置（需要确认）
    this.handleReset();
  }

  /**
   * 处理双击事件
   * @param {TouchEvent} event - 触摸事件
   */
  handleDoubleTap(event) {
    // 双击快速抽卡
    this.handleDrawCard();
  }

  /**
   * 处理窗口大小调整
   */
  handleWindowResize() {
    if (this.modules.uiRenderer) {
      this.modules.uiRenderer.handleResize();
    }
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时暂停动画
      this.pauseAnimations();
    } else {
      // 页面显示时恢复动画
      this.resumeAnimations();
    }
  }

  /**
   * 处理页面卸载前事件
   * @param {BeforeUnloadEvent} event - 卸载事件
   */
  handleBeforeUnload(event) {
    // 如果有未保存的数据，提示用户
    if (this.hasUnsavedData()) {
      event.preventDefault();
      event.returnValue = '您有未保存的数据，确定要离开吗？';
    }
  }

  /**
   * 显示学生详情
   * @param {Object} student - 学生信息
   */
  showStudentDetails(student) {
    // 创建详情弹窗（简单实现）
    const modal = document.createElement('div');
    modal.className = 'student-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <img src="${student.avatar}" alt="${student.name}" class="modal-avatar">
        <h3>${student.name}</h3>
        <p>学号: ${student.id}</p>
        <p>稀有度: ${this.modules.uiRenderer.getRarityText(student.rarity)}</p>
        <p>状态: ${student.isDrawn ? '已抽中' : '未抽中'}</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定关闭事件
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 显示消息提示
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (success, warning, error, info)
   */
  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 自动移除
    setTimeout(() => {
      if (document.body.contains(messageEl)) {
        document.body.removeChild(messageEl);
      }
    }, 3000);
  }

  /**
   * 播放音效
   * @param {string} soundType - 音效类型
   * @param {string} rarity - 稀有度（可选）
   */
  playSound(soundType, rarity = null) {
    // 音效播放逻辑（需要音频文件）
    try {
      let audioFile = '';
      
      switch (soundType) {
        case 'draw-start':
          audioFile = 'sounds/draw-start.mp3';
          break;
        case 'draw-complete':
          audioFile = rarity === 'SR' ? 'sounds/draw-sr.mp3' : 
                     rarity === 'R' ? 'sounds/draw-r.mp3' : 
                     'sounds/draw-normal.mp3';
          break;
        case 'reset':
          audioFile = 'sounds/reset.mp3';
          break;
      }
      
      if (audioFile) {
        const audio = new Audio(audioFile);
        audio.volume = 0.5;
        audio.play().catch(e => {
          // 忽略音频播放失败（用户可能没有交互过）
          console.log('音频播放失败:', e.message);
        });
      }
    } catch (error) {
      console.log('音效播放失败:', error.message);
    }
  }

  /**
   * 防抖函数
   * @param {string} key - 防抖键
   * @param {Function} func - 要执行的函数
   * @param {number} delay - 延迟时间
   */
  debounce(key, func, delay) {
    // 清除之前的定时器
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  /**
   * 分发自定义事件
   * @param {string} eventName - 事件名称
   * @param {Object} detail - 事件详情
   */
  dispatchCustomEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  /**
   * 暂停动画
   */
  pauseAnimations() {
    document.body.style.animationPlayState = 'paused';
  }

  /**
   * 恢复动画
   */
  resumeAnimations() {
    document.body.style.animationPlayState = 'running';
  }

  /**
   * 检查是否有未保存数据
   * @returns {boolean} 是否有未保存数据
   */
  hasUnsavedData() {
    // 检查是否有未保存的数据变更
    return false; // 简单实现，总是返回false
  }

  /**
   * 处理取消操作
   */
  handleCancel() {
    if (this.isProcessing) {
      this.isProcessing = false;
      this.modules.uiRenderer.setButtonState('drawBtn', true, '随机抽卡');
      this.modules.uiRenderer.setButtonState('resetBtn', true);
    }
  }

  /**
   * 处理设置
   */
  handleSettings() {
    // 设置面板逻辑（待实现）
    console.log('打开设置面板');
  }

  /**
   * 处理数据保存
   */
  handleSaveData() {
    try {
      const data = this.modules.studentDataManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-data.json';
      a.click();
      
      URL.revokeObjectURL(url);
      this.showMessage('数据保存成功！', 'success');
    } catch (error) {
      console.error('保存数据失败:', error);
      this.showMessage('保存数据失败', 'error');
    }
  }

  /**
   * 处理数据加载
   */
  handleLoadData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.modules.studentDataManager.importData(data);
          this.showMessage('数据加载成功！', 'success');
        } catch (error) {
          console.error('加载数据失败:', error);
          this.showMessage('数据格式错误', 'error');
        }
      };
      reader.readAsText(file);
    });
    
    input.click();
  }

  /**
   * 销毁事件处理器
   */
  destroy() {
    // 清理所有定时器
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // 清理事件监听器
    this.eventListeners.clear();
    
    // 重置状态
    this.isProcessing = false;
    this.eventQueue = [];
  }
}

// 导出模块
export default EventHandler;