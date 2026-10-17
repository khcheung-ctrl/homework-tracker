// Firebase 初始化設定
const firebaseConfig = {
  apiKey: "AIzaSyA5YYncT7-6_003kZh1Iq0zoreOVk2og50",
  authDomain: "homework-tracker-971ef.firebaseapp.com",
  projectId: "homework-tracker-971ef",
  storageBucket: "homework-tracker-971ef.firebasestorage.app",
  messagingSenderId: "640761164042",
  appId: "1:640761164042:web:097643fafa0e943831caf3",
  measurementId: "G-W3Y7MH62EC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Alpine.js 主程式邏輯
function app() {
  return {
    user: null,
    isDarkMode: false,
    currentTab: 'homework',
    currentTheme: 'indigo', // 預設主題色彩

    classes: ['3A', '3B'],
    currentClass: '3A',
    newClassName: '',
    selectedHomeworkId: null,
    selectedQuizId: null,

    // 座位規格 (自訂行列規模)
    seatingGridRows: 5,
    seatingGridCols: 6,
    seatingAssignments: {}, // { "3A": { "studentId": { r: 1, c: 2 } } }

    batchInputText: '',
    showCategoryModal: false,
    showQuizConfigModal: false,
    showStudentModal: false,
    showIncidentModal: false,
    showStudentProfileModal: false,
    showSeatingRuleModal: false,
    showGridConfigModal: false,

    profileStudent: null,
    chartInstance: null,

    presetCategories: ['未帶計算機', '未帶課本', '未帶功課', '課堂生事', '遲到'],
    newCategoryName: '',

    quizConfig: { passPct: 60 },

    // 可選主題顏色選單 (高對比色調)
    themeOptions: [
      { key: 'indigo', name: '經典靛藍', color: '#4f46e5', headerBg: 'bg-indigo-600 dark:bg-indigo-900', btnBg: 'bg-indigo-600 text-white shadow-md' },
      { key: 'sky', name: '天空湛藍', color: '#0284c7', headerBg: 'bg-sky-600 dark:bg-sky-900', btnBg: 'bg-sky-600 text-white shadow-md' },
      { key: 'emerald', name: '翡翠碧綠', color: '#059669', headerBg: 'bg-emerald-600 dark:bg-emerald-900', btnBg: 'bg-emerald-600 text-white shadow-md' },
      { key: 'purple', name: '高雅紫羅蘭', color: '#7c3aed', headerBg: 'bg-purple-600 dark:bg-purple-900', btnBg: 'bg-purple-600 text-white shadow-md' },
      { key: 'rose', name: '熱情玫瑰紅', color: '#e11d48', headerBg: 'bg-rose-600 dark:bg-rose-900', btnBg: 'bg-rose-600 text-white shadow-md' },
      { key: 'amber', name: '琥珀暖橙', color: '#d97706', headerBg: 'bg-amber-600 dark:bg-amber-900', btnBg: 'bg-amber-600 text-white shadow-md' }
    ],

    students: [
      { id: 's1', class: '3A', no: '01', name: '張小明', isTall: false, frontRow: false, backRow: false, avoidIds: [] },
      { id: 's2', class: '3A', no: '02', name: '李大衛', isTall: true, frontRow: false, backRow: false, avoidIds: [] }
    ],
    homeworks: [{ id: 'h1', class: '3A', title: '工作紙5' }],
    quizzes: [{ id: 'q1', class: '3A', title: '單元一小測', maxScore: 20 }],
    records: {}, 
    quizScores: {},
    incidents: [],

    newIncident: { studentId: '', date: new Date().toISOString().split('T')[0], category: '未帶計算機', note: '' },

    initApp() {
      if (localStorage.getItem('theme') === 'dark') {
        this.isDarkMode = true;
        document.documentElement.classList.add('dark');
      }
      const savedTheme = localStorage.getItem('colorTheme');
      if (savedTheme) this.currentTheme = savedTheme;

      auth.onAuthStateChanged(u => {
        this.user = u;
        if (u) {
          this.loadDataFromFirebase();
        }
      });
    },

    switchTab(tab) {
      this.currentTab = tab;
      if (tab === 'quiz') {
        this.$nextTick(() => {
          setTimeout(() => this.refreshChart(), 100);
        });
      }
    },

    loginGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(e => alert("登入失敗: " + e.message));
    },

    logoutGoogle() {
      auth.signOut();
    },

    async loadDataFromFirebase() {
      if (!this.user) return;
      try {
        const doc = await db.collection('homework_trackers').doc(this.user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.classes) this.classes = data.classes;
          if (data.currentTheme) this.currentTheme = data.currentTheme;
          if (data.presetCategories) this.presetCategories = data.presetCategories;
          if (data.quizConfig) this.quizConfig = data.quizConfig;
          if (data.students) this.students = data.students;
          if (data.homeworks) this.homeworks = data.homeworks;
          if (data.quizzes) this.quizzes = data.quizzes;
          if (data.records) this.records = data.records;
          if (data.quizScores) this.quizScores = data.quizScores;
          if (data.incidents) this.incidents = data.incidents;
          if (data.seatingAssignments) this.seatingAssignments = data.seatingAssignments;
          if (data.seatingGridRows) this.seatingGridRows = data.seatingGridRows;
          if (data.seatingGridCols) this.seatingGridCols = data.seatingGridCols;

          this.autoSelectFirstHomework();
          this.autoSelectFirstQuiz();
        }
      } catch (e) {
        console.error("載入失敗", e);
      }
    },

    async saveDataToFirebase() {
      if (!this.user) return;
      try {
        await db.collection('homework_trackers').doc(this.user.uid).set({
          classes: this.classes,
          currentTheme: this.currentTheme,
          presetCategories: this.presetCategories,
          quizConfig: this.quizConfig,
          students: this.students,
          homeworks: this.homeworks,
          quizzes: this.quizzes,
          records: this.records,
          quizScores: this.quizScores,
          incidents: this.incidents,
          seatingAssignments: this.seatingAssignments,
          seatingGridRows: this.seatingGridRows,
          seatingGridCols: this.seatingGridCols
        }, { merge: true });
      } catch (e) {
        console.error("同步失敗", e);
      }
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    },

    // 主題色彩相關
    setThemeColor(key) {
      this.currentTheme = key;
      localStorage.setItem('colorTheme', key);
      this.saveDataToFirebase();
    },

    getThemeHeaderClass() {
      const option = this.themeOptions.find(t => t.key === this.currentTheme);
      return option ? option.headerBg : 'bg-indigo-600 dark:bg-indigo-900';
    },

    getThemeButtonClass() {
      const option = this.themeOptions.find(t => t.key === this.currentTheme);
      return option ? option.btnBg : 'bg-indigo-600 text-white shadow-md';
    },

    // 個人學生綜合檔案卡
    openStudentProfile(studentId) {
      const s = this.students.find(st => st.id === studentId);
      if (s) {
        this.profileStudent = s;
        this.showStudentProfileModal = true;
      }
    },

    getStudentHomeworkRate(studentId) {
      const classHws = this.currentHomeworks;
      if (classHws.length === 0) return 0;
      const done = classHws.filter(hw => this.getStatus(studentId, hw.id) === 'completed').length;
      return Math.round((done / classHws.length) * 100);
    },

    getStudentIncidents(studentId) {
      return this.incidents.filter(i => i.studentId === studentId);
    },

    // 座位表與智慧排位演算法
    smartRandomizeSeats() {
      const students = this.currentStudents;
      const R = this.seatingGridRows;
      const C = this.seatingGridCols;
      if (students.length > R * C) {
        alert(`全班人數 (${students.length}) 超過座位容量 (${R * C})，請先增加行或列數！`);
        return;
      }

      let slots = [];
      for (let r = 1; r <= R; r++) {
        for (let c = 1; c <= C; c++) {
          slots.push({ r, c });
        }
      }

      let bestAssignment = null;
      let foundValid = false;

      for (let attempt = 0; attempt < 2000; attempt++) {
        let shuffledSlots = [...slots].sort(() => Math.random() - 0.5);
        let currentAssignment = {};
        let gridMatrix = {};
        let valid = true;

        for (let i = 0; i < students.length; i++) {
          const st = students[i];
          const slot = shuffledSlots[i];

          // 條件 1: 高個子避開第 1, 2 行
          if (st.isTall && slot.r <= 2) { valid = false; break; }
          // 條件 2: 需前排同學限制在第 1, 2 行
          if (st.frontRow && slot.r > 2) { valid = false; break; }
          // 條件 3: 需後排同學限制在倒數兩行
          if (st.backRow && slot.r < (R - 1)) { valid = false; break; }

          currentAssignment[st.id] = slot;
          gridMatrix[`${slot.r}_${slot.c}`] = st.id;
        }

        if (!valid) continue;

        // 條件 4: 矛盾同學不能相鄰 (前後左右)
        for (let st of students) {
          const pos = currentAssignment[st.id];
          if (!pos) continue;

          const avoidList = st.avoidIds || [];
          if (avoidList.length === 0) continue;

          const neighbors = [
            `${pos.r - 1}_${pos.c}`, `${pos.r + 1}_${pos.c}`,
            `${pos.r}_${pos.c - 1}`, `${pos.r}_${pos.c + 1}`
          ];

          for (let nKey of neighbors) {
            const neighborId = gridMatrix[nKey];
            if (neighborId && avoidList.includes(neighborId)) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }

        if (valid) {
          bestAssignment = currentAssignment;
          foundValid = true;
          break;
        }
      }

      if (foundValid) {
        if (!this.seatingAssignments) this.seatingAssignments = {};
        this.seatingAssignments[this.currentClass] = bestAssignment;
        this.saveDataToFirebase();
        alert('✨ 智慧排位成功！已完全滿足高個子、前/後排優先及矛盾同學避開等條件。');
      } else {
        alert('⚠️ 嘗試 2000 次後未能完全滿足所有嚴格限制，建議稍微放寬部分同學的避開條件！');
      }
    },

    getSeatStudent(r, c) {
      const classAssignments = (this.seatingAssignments && this.seatingAssignments[this.currentClass]) || {};
      const studentId = Object.keys(classAssignments).find(sId => {
        const pos = classAssignments[sId];
        return pos && pos.r === r && pos.c === c;
      });
      return this.students.find(s => s.id === studentId);
    },

    toggleAvoidStudent(student, targetId) {
      if (!student.avoidIds) student.avoidIds = [];
      if (student.avoidIds.includes(targetId)) {
        student.avoidIds = student.avoidIds.filter(id => id !== targetId);
      } else {
        student.avoidIds.push(targetId);
      }
    },

    exportSeatingToExcel() {
      const R = this.seatingGridRows;
      const C = this.seatingGridCols;
      let rows = [];

      for (let r = 1; r <= R; r++) {
        let rowData = {};
        for (let c = 1; c <= C; c++) {
          const st = this.getSeatStudent(r, c);
          rowData[`第 ${c} 列`] = st ? `${st.no ? st.no + ' ' : ''}${st.name}` : '(空位)';
        }
        rows.push(rowData);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `${this.currentClass} 座位表`);
      XLSX.writeFile(wb, `${this.currentClass}_課室座位表.xlsx`);
    },

    printSeatingChart() {
      window.print();
    },

    // Chart.js 成績分佈圖
    refreshChart() {
      const q = this.getSelectedQuiz();
      if (!q) return;

      const canvas = document.getElementById('quizChartCanvas');
      if (!canvas) return;

      const scores = this.currentStudents.map(s => this.getQuizScore(q.id, s.id)).filter(v => v !== '' && v !== undefined);
      const counts = [0, 0, 0, 0, 0]; // 不及格, 及格, 中等, 良好, 優秀

      scores.forEach(s => {
        const pct = (s / q.maxScore) * 100;
        if (pct >= 90) counts[4]++;
        else if (pct >= 80) counts[3]++;
        else if (pct >= 70) counts[2]++;
        else if (pct >= 60) counts[1]++;
        else counts[0]++;
      });

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['不及格 (<60%)', '及格 (60-69%)', '中等 (70-79%)', '良好 (80-89%)', '優秀 (≥90%)'],
          datasets: [{
            label: '人數',
            data: counts,
            backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#3b82f6', '#10b981'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    },

    // 測驗成績縱向貫穿分欄 (1-5 在左，6-10 在右)
    getLeftColumnStudents() {
      const all = this.getSortedStudents();
      const half = Math.ceil(all.length / 2);
      return all.slice(0, half);
    },

    getRightColumnStudents() {
      const all = this.getSortedStudents();
      const half = Math.ceil(all.length / 2);
      return all.slice(half);
    },

    // 班別與類別管理
    addClass() {
      if (this.newClassName && !this.classes.includes(this.newClassName)) {
        this.classes.push(this.newClassName);
        this.currentClass = this.newClassName;
        this.newClassName = '';
        this.autoSelectFirstHomework();
        this.autoSelectFirstQuiz();
        this.saveDataToFirebase();
      }
    },

    removeClass(cls) {
      if (this.classes.length <= 1) return alert('至少需保留一個班別');
      this.classes = this.classes.filter(c => c !== cls);
      if (this.currentClass === cls) this.currentClass = this.classes[0];
      this.autoSelectFirstHomework();
      this.autoSelectFirstQuiz();
      this.saveDataToFirebase();
    },

    addCategory() {
      if (this.newCategoryName && !this.presetCategories.includes(this.newCategoryName)) {
        this.presetCategories.push(this.newCategoryName);
        this.newCategoryName = '';
        this.saveDataToFirebase();
      }
    },

    removeCategory(idx) {
      this.presetCategories.splice(idx, 1);
      this.saveDataToFirebase();
    },

    calcBatchCount() {
      return this.batchInputText.split('\n').filter(l => l.trim()).length;
    },

    processBatchStudents() {
      if (!this.batchInputText.trim()) return;
      const lines = this.batchInputText.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const parts = trimmed.split(/\s+/);
        let no = '';
        let name = trimmed;
        if (parts.length > 1 && !isNaN(parts[0])) {
          no = parts[0];
          name = parts.slice(1).join(' ');
        } else {
          no = (idx + 1).toString().padStart(2, '0');
        }
        this.students.push({ id: 's_' + Date.now() + Math.random().toString(36).substr(2, 4), class: this.currentClass, no, name, isTall: false, frontRow: false, backRow: false, avoidIds: [] });
      });
      this.batchInputText = '';
      this.saveDataToFirebase();
      alert('學生名單已成功導入！');
    },

    get currentStudents() {
      return this.students.filter(s => s.class === this.currentClass);
    },

    getSortedStudents() {
      return [...this.currentStudents].sort((a, b) => parseInt(a.no || 0) - parseInt(b.no || 0));
    },

    addNewStudentInput() {
      const nextNo = (this.currentStudents.length + 1).toString().padStart(2, '0');
      this.students.push({ id: 's_' + Date.now(), class: this.currentClass, no: nextNo, name: '', isTall: false, frontRow: false, backRow: false, avoidIds: [] });
    },

    removeStudent(id) {
      if (confirm('確定要刪除這位學生嗎？')) {
        this.students = this.students.filter(s => s.id !== id);
        this.saveDataToFirebase();
      }
    },

    autoResequenceStudentNos() {
      const sorted = this.getSortedStudents();
      sorted.forEach((s, idx) => {
        s.no = (idx + 1).toString().padStart(2, '0');
      });
      this.saveDataToFirebase();
    },

    // 功課相關邏輯
    get currentHomeworks() {
      return this.homeworks.filter(h => h.class === this.currentClass);
    },

    getSelectedHomework() {
      return this.homeworks.find(h => h.id === this.selectedHomeworkId) || this.currentHomeworks[0];
    },

    autoSelectFirstHomework() {
      if (this.currentHomeworks.length > 0) {
        this.selectedHomeworkId = this.currentHomeworks[0].id;
      } else {
        this.selectedHomeworkId = null;
      }
    },

    addHomeworkPrompt() {
      const title = prompt('請輸入功課名稱：');
      if (title) {
        const newHw = { id: 'h_' + Date.now(), class: this.currentClass, title };
        this.homeworks.push(newHw);
        this.selectedHomeworkId = newHw.id;
        this.saveDataToFirebase();
      }
    },

    editHomeworkName() {
      const hw = this.getSelectedHomework();
      if (!hw) return;
      const newTitle = prompt('請輸入新的功課名稱：', hw.title);
      if (newTitle) {
        hw.title = newTitle;
        this.saveDataToFirebase();
      }
    },

    deleteCurrentHomework() {
      const hw = this.getSelectedHomework();
      if (!hw) return;
      if (confirm(`確定要刪除功課「${hw.title}」嗎？`)) {
        this.homeworks = this.homeworks.filter(h => h.id !== hw.id);
        this.autoSelectFirstHomework();
        this.saveDataToFirebase();
      }
    },

    getStatus(studentId, hwId) {
      const key = `${studentId}_${hwId}`;
      return this.records[key] || 'missing';
    },

    setStatus(studentId, hwId, status) {
      const key = `${studentId}_${hwId}`;
      this.records[key] = status;
      this.saveDataToFirebase();
    },

    setAllStatus(status) {
      const hw = this.getSelectedHomework();
      if (!hw) return;
      this.currentStudents.forEach(s => {
        const key = `${s.id}_${hw.id}`;
        this.records[key] = status;
      });
      this.saveDataToFirebase();
    },

    getHomeworkStats() {
      const hw = this.getSelectedHomework();
      if (!hw) return { completed: 0, missing: 0, correction: 0, pending: 0, absent: 0 };
      
      let completed = 0, missing = 0, correction = 0, pending = 0, absent = 0;
      this.currentStudents.forEach(s => {
        const st = this.getStatus(s.id, hw.id);
        if (st === 'completed') completed++;
        else if (st === 'missing') missing++;
        else if (st === 'correction') correction++;
        else if (st === 'pending') pending++;
        else if (st === 'absent') absent++;
      });
      return { completed, missing, correction, pending, absent };
    },

    copyMissingNames() {
      const hw = this.getSelectedHomework();
      if (!hw) return;
      const missingStudents = this.getSortedStudents().filter(s => this.getStatus(s.id, hw.id) === 'missing');
      if (missingStudents.length === 0) {
        alert('全班已交齊！沒有未交學生。');
        return;
      }
      const names = missingStudents.map(s => `${s.no ? s.no + ' ' : ''}${s.name}`).join('\n');
      navigator.clipboard.writeText(names).then(() => {
        alert(`已成功複製未交學生名單到剪貼簿（共 ${missingStudents.length} 人）！`);
      });
    },

    // 測驗相關邏輯
    get currentQuizzes() {
      return this.quizzes.filter(q => q.class === this.currentClass);
    },

    getSelectedQuiz() {
      return this.quizzes.find(q => q.id === this.selectedQuizId) || this.currentQuizzes[0];
    },

    autoSelectFirstQuiz() {
      if (this.currentQuizzes.length > 0) {
        this.selectedQuizId = this.currentQuizzes[0].id;
      } else {
        this.selectedQuizId = null;
      }
    },

    addQuizPrompt() {
      const title = prompt('請輸入測驗名稱 (例如: 單元二小測)：');
      if (title) {
        const newQ = { id: 'q_' + Date.now(), class: this.currentClass, title, maxScore: 100 };
        this.quizzes.push(newQ);
        this.selectedQuizId = newQ.id;
        this.saveDataToFirebase();
        this.$nextTick(() => setTimeout(() => this.refreshChart(), 100));
      }
    },

    editQuizPrompt() {
      const q = this.getSelectedQuiz();
      if (!q) return;
      const newTitle = prompt('請輸入新的測驗名稱：', q.title);
      if (newTitle) {
        q.title = newTitle;
        this.saveDataToFirebase();
      }
    },

    updateQuizMaxScore(val) {
      const q = this.getSelectedQuiz();
      if (!q) return;
      q.maxScore = Number(val) || 100;
      this.saveDataToFirebase();
      this.refreshChart();
    },

    deleteCurrentQuiz() {
      const q = this.getSelectedQuiz();
      if (!q) return;
      if (confirm(`確定要刪除測驗「${q.title}」嗎？`)) {
        this.quizzes = this.quizzes.filter(item => item.id !== q.id);
        this.autoSelectFirstQuiz();
        this.saveDataToFirebase();
        this.refreshChart();
      }
    },

    getQuizScore(quizId, studentId) {
      const key = `${quizId}_${studentId}`;
      return this.quizScores[key] !== undefined ? this.quizScores[key] : '';
    },

    setQuizScore(quizId, studentId, val) {
      const key = `${quizId}_${studentId}`;
      if (val === '') {
        delete this.quizScores[key];
      } else {
        this.quizScores[key] = Number(val);
      }
      this.saveDataToFirebase();
    },

    getQuizScorePct(quizId, studentId) {
      const score = this.getQuizScore(quizId, studentId);
      const q = this.getSelectedQuiz();
      if (score === '' || !q || !q.maxScore) return '-';
      return `${((score / q.maxScore) * 100).toFixed(0)}%`;
    },

    get quizStats() {
      const q = this.getSelectedQuiz();
      if (!q) return { avg: 0, avgPct: '0.0', passRate: 0, max: 0, min: 0, count: 0 };

      const scores = this.currentStudents.map(s => this.getQuizScore(q.id, s.id)).filter(v => v !== '' && v !== undefined);
      if (scores.length === 0) return { avg: 0, avgPct: '0.0', passRate: 0, max: 0, min: 0, count: 0 };

      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = (sum / scores.length).toFixed(1);
      const avgPct = ((avg / q.maxScore) * 100).toFixed(1);
      const passScore = (q.maxScore * this.quizConfig.passPct) / 100;
      const passCount = scores.filter(s => s >= passScore).length;

      return {
        avg,
        avgPct,
        passRate: Math.round((passCount / scores.length) * 100),
        max: Math.max(...scores),
        min: Math.min(...scores),
        count: scores.length
      };
    },

    // 總覽頁面各狀態篩選方法 (五欄全滿)
    getCompletedHomeworks(studentId) {
      return this.currentHomeworks.filter(hw => this.getStatus(studentId, hw.id) === 'completed');
    },

    getMissingHomeworks(studentId) {
      return this.currentHomeworks.filter(hw => this.getStatus(studentId, hw.id) === 'missing');
    },

    getCorrectionHomeworks(studentId) {
      return this.currentHomeworks.filter(hw => this.getStatus(studentId, hw.id) === 'correction');
    },

    getPendingHomeworks(studentId) {
      return this.currentHomeworks.filter(hw => this.getStatus(studentId, hw.id) === 'pending');
    },

    getAbsentHomeworks(studentId) {
      return this.currentHomeworks.filter(hw => this.getStatus(studentId, hw.id) === 'absent');
    },

    // 課堂事件
    get currentIncidents() {
      const studentIds = this.currentStudents.map(s => s.id);
      return this.incidents.filter(i => studentIds.includes(i.studentId));
    },

    getStudentName(id) {
      const s = this.students.find(st => st.id === id);
      return s ? `${s.no || ''} ${s.name}` : '未知學生';
    },

    saveIncident() {
      if (!this.newIncident.studentId) return;
      this.incidents.push({ id: 'inc_' + Date.now(), ...this.newIncident });
      this.showIncidentModal = false;
      this.newIncident.note = '';
      this.saveDataToFirebase();
    },

    deleteIncident(id) {
      this.incidents = this.incidents.filter(i => i.id !== id);
      this.saveDataToFirebase();
    },

    // JSON 備份與匯入
    exportJSON() {
      const data = {
        classes: this.classes,
        currentTheme: this.currentTheme,
        presetCategories: this.presetCategories,
        quizConfig: this.quizConfig,
        students: this.students,
        homeworks: this.homeworks,
        quizzes: this.quizzes,
        records: this.records,
        quizScores: this.quizScores,
        incidents: this.incidents,
        seatingAssignments: this.seatingAssignments,
        seatingGridRows: this.seatingGridRows,
        seatingGridCols: this.seatingGridCols
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `課堂管理系統備份_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    },

    importJSON(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (confirm('匯入 JSON 將會覆蓋目前的數據，確定繼續嗎？')) {
            if (data.classes) this.classes = data.classes;
            if (data.currentTheme) this.currentTheme = data.currentTheme;
            if (data.presetCategories) this.presetCategories = data.presetCategories;
            if (data.quizConfig) this.quizConfig = data.quizConfig;
            if (data.students) this.students = data.students;
            if (data.homeworks) this.homeworks = data.homeworks;
            if (data.quizzes) this.quizzes = data.quizzes;
            if (data.records) this.records = data.records;
            if (data.quizScores) this.quizScores = data.quizScores;
            if (data.incidents) this.incidents = data.incidents;
            if (data.seatingAssignments) this.seatingAssignments = data.seatingAssignments;
            if (data.seatingGridRows) this.seatingGridRows = data.seatingGridRows;
            if (data.seatingGridCols) this.seatingGridCols = data.seatingGridCols;

            this.saveDataToFirebase();
            alert('備份資料已成功還原！');
          }
        } catch (err) {
          alert('JSON 檔案格式錯誤，無法解析！');
        }
      };
      reader.readAsText(file);
    },

    // Excel 報表匯出
    exportToExcel() {
      const wb = XLSX.utils.book_new();

      const hwData = this.currentStudents.map(s => {
        const row = { '學號': s.no || '', '姓名': s.name };
        this.currentHomeworks.forEach(hw => {
          const st = this.getStatus(s.id, hw.id);
          row[`功課: ${hw.title}`] = st === 'completed' ? '已完成' : st === 'missing' ? '未交' : st === 'correction' ? '待改正' : st === 'pending' ? '待補交' : '缺席';
        });
        this.currentQuizzes.forEach(q => {
          row[`測驗: ${q.title}`] = this.getQuizScore(q.id, s.id);
        });
        return row;
      });
      const ws1 = XLSX.utils.json_to_sheet(hwData);
      XLSX.utils.book_append_sheet(wb, ws1, "功課與測驗總表");

      const incData = this.currentIncidents.map(i => ({
        '日期': i.date,
        '學生': this.getStudentName(i.studentId),
        '事件項目': i.category,
        '備註': i.note
      }));
      const ws2 = XLSX.utils.json_to_sheet(incData);
      XLSX.utils.book_append_sheet(wb, ws2, "課堂事件紀錄");

      XLSX.writeFile(wb, `課堂管理系統報表_${this.currentClass}.xlsx`);
    }
  }
}
