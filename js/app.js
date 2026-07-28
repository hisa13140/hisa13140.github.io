/**
 * 班级管理工作台 - 核心应用逻辑
 * 支持全量数据编辑（班级信息、角色、学生、所有记录）
 */

// ===================== 数据层 =====================
const Store = {
  KEY: 'class-workbench-v2',
  data: null,
  load() {
    const saved = localStorage.getItem(this.KEY);
    if (saved) {
      try { this.data = JSON.parse(saved); } catch { this.data = null; }
    }
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    }
    // 兼容旧数据：补全 roles
    if (!this.data.roles) {
      this.data.roles = JSON.parse(JSON.stringify(ROLES));
      this.save();
    }
    return this.data;
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
  reset() { localStorage.removeItem(this.KEY); this.data = null; this.load(); }
};

// ===================== 工具 =====================
const U = {
  uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); },
  esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; },
  dateStr(d) { const dt=d?new Date(d):new Date(); return dt.toISOString().slice(0,10); },
  fmtDate(d) { if(!d) return ''; const dt=new Date(d); return `${dt.getMonth()+1}月${dt.getDate()}日`; },
  fmtDateFull(d) { if(!d) return ''; const dt=new Date(d); const w=['日','一','二','三','四','五','六']; return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日 周${w[dt.getDay()]}`; },
  studentName(id) { const s=Store.data.students.find(x=>x.id===id); return s?s.name:id; },
  studentById(id) { return Store.data.students.find(x=>x.id===id); },
  today() { return new Date().toISOString().slice(0,10); },
  role(id) { return Store.data.roles[id||App.currentRole]; }
};

// ===================== 导出辅助 =====================
const STATUS_MAP = { present:'出勤', late:'迟到', leave:'请假', absent:'缺勤' };

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCSV(headers, rows) {
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  rows.forEach(r => lines.push(r.map(esc).join(',')));
  return '\uFEFF' + lines.join('\r\n');
}

function toast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),1500);
}

// ===================== 权限控制 =====================
const Perm = {
  current: 'headteacher',
  pages: {
    headteacher: ['dashboard','notice','student','attendance','homework','communicate','activity','finance','guide'],
    subjectteacher: ['dashboard','student','attendance','homework','guide'],
    parent: ['dashboard','notice','attendance','guide'],
    student: ['notice','homework','guide']
  },
  canEdit: {
    headteacher: ['notice','student','grades','rewards','mental','attendance','leave','homework','assignment','communication','visit','meeting','activity','finance','material'],
    subjectteacher: ['grades','assignment'],
    parent: ['leave'],
    student: ['submit']
  },
  hasPage(pageId) { return this.pages[this.current].includes(pageId); },
  hasPerm(perm) { return (this.canEdit[this.current]||[]).includes(perm); },
  childId() { return Store.data.roles.parent.childId; },
  studentId() { return Store.data.roles.student.studentId; }
};

// ===================== 表单字段定义 =====================
const SUBJECT_OPTIONS = [
  {v:'语文',l:'语文'},{v:'数学',l:'数学'},{v:'英语',l:'英语'},
  {v:'道法',l:'道法'},{v:'历史',l:'历史'},{v:'地理',l:'地理'},{v:'生物',l:'生物'}
];

const FORM_SCHEMAS = {
  student: {
    title: '学生档案',
    fields: [
      { key:'name', label:'姓名', type:'text', required:true },
      { key:'gender', label:'性别', type:'select', options:[{v:'男',l:'男'},{v:'女',l:'女'}] },
      { key:'birth', label:'出生日期', type:'date' },
      { key:'parent', label:'家长姓名', type:'text' },
      { key:'phone', label:'联系电话', type:'text' },
      { key:'address', label:'家庭住址', type:'text' },
      { key:'notes', label:'备注(职务)', type:'text' }
    ]
  },
  notice: {
    title: '通知公告',
    fields: [
      { key:'type', label:'通知类型', type:'select', options:[{v:'permanent',l:'永久公告'},{v:'temporary',l:'临时通知'},{v:'meeting',l:'家长会通知'}] },
      { key:'title', label:'标题', type:'text', required:true },
      { key:'content', label:'正文内容', type:'textarea' },
      { key:'date', label:'发布日期', type:'date' },
      { key:'author', label:'发布人', type:'text' }
    ]
  },
  exam: {
    title: '考试',
    fields: [
      { key:'name', label:'考试名称', type:'text', required:true },
      { key:'date', label:'考试日期', type:'date' },
      { key:'subjects', label:'考试科目(逗号分隔)', type:'tags' }
    ]
  },
  reward: {
    title: '奖惩记录',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'type', label:'类型', type:'select', options:[{v:'reward',l:'奖励'},{v:'punishment',l:'处分'}] },
      { key:'level', label:'级别', type:'select', options:[{v:'校级',l:'校级'},{v:'班级',l:'班级'},{v:'区级',l:'区级'}] },
      { key:'description', label:'事由', type:'text' },
      { key:'date', label:'日期', type:'date' }
    ]
  },
  mental: {
    title: '心理健康跟踪',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'date', label:'日期', type:'date' },
      { key:'mood', label:'心理状态', type:'select', options:[{v:'良好',l:'良好'},{v:'一般',l:'一般'},{v:'需关注',l:'需关注'}] },
      { key:'note', label:'记录说明', type:'textarea' },
      { key:'followUp', label:'跟进措施', type:'textarea' },
      { key:'teacher', label:'记录人', type:'text' }
    ]
  },
  leave: {
    title: '请假申请',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'type', label:'请假类型', type:'select', options:[{v:'病假',l:'病假'},{v:'事假',l:'事假'}] },
      { key:'startDate', label:'开始日期', type:'date' },
      { key:'endDate', label:'结束日期', type:'date' },
      { key:'reason', label:'请假事由', type:'textarea' },
      { key:'parent', label:'申请人(家长)', type:'text' },
      { key:'status', label:'审批状态', type:'select', options:[{v:'pending',l:'待审批'},{v:'approved',l:'已批准'},{v:'rejected',l:'已驳回'}] },
      { key:'approver', label:'审批人', type:'text' }
    ]
  },
  assignment: {
    title: '作业',
    fields: [
      { key:'subject', label:'学科', type:'select', options:SUBJECT_OPTIONS },
      { key:'title', label:'作业标题', type:'text', required:true },
      { key:'content', label:'作业内容', type:'textarea' },
      { key:'dueDate', label:'截止日期', type:'date' },
      { key:'published', label:'发布日期', type:'date' },
      { key:'author', label:'发布教师', type:'text' }
    ]
  },
  submission: {
    title: '作业提交/批改',
    fields: [
      { key:'assignmentId', label:'作业', type:'assignment-select' },
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'submittedDate', label:'提交日期', type:'date' },
      { key:'status', label:'批改状态', type:'select', options:[{v:'submitted',l:'待批改'},{v:'graded',l:'已批改'}] },
      { key:'score', label:'分数', type:'number' },
      { key:'feedback', label:'教师评语', type:'textarea' }
    ]
  },
  error: {
    title: '错题记录',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'subject', label:'学科', type:'select', options:SUBJECT_OPTIONS },
      { key:'question', label:'错题内容', type:'textarea' },
      { key:'analysis', label:'错因分析', type:'textarea' },
      { key:'date', label:'日期', type:'date' },
      { key:'teacher', label:'记录教师', type:'text' }
    ]
  },
  communication: {
    title: '家校沟通',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'date', label:'日期', type:'date' },
      { key:'type', label:'沟通方式', type:'select', options:[{v:'电话沟通',l:'电话沟通'},{v:'面谈',l:'面谈'},{v:'微信沟通',l:'微信沟通'}] },
      { key:'content', label:'沟通内容', type:'textarea' },
      { key:'result', label:'沟通结果', type:'textarea' },
      { key:'teacher', label:'教师', type:'text' }
    ]
  },
  visit: {
    title: '家访登记',
    fields: [
      { key:'studentId', label:'学生', type:'student-select' },
      { key:'date', label:'日期', type:'date' },
      { key:'purpose', label:'家访目的', type:'text' },
      { key:'summary', label:'家访总结', type:'textarea' },
      { key:'result', label:'结果', type:'select', options:[{v:'良好',l:'良好'},{v:'需持续关注',l:'需持续关注'},{v:'一般',l:'一般'}] },
      { key:'teacher', label:'教师', type:'text' }
    ]
  },
  meeting: {
    title: '家长会',
    fields: [
      { key:'title', label:'标题', type:'text', required:true },
      { key:'date', label:'日期', type:'date' },
      { key:'time', label:'时间', type:'text' },
      { key:'location', label:'地点', type:'text' },
      { key:'agenda', label:'议程', type:'textarea' }
    ]
  },
  activity: {
    title: '班级活动',
    fields: [
      { key:'type', label:'活动类型', type:'select', options:[{v:'班会',l:'班会'},{v:'文体活动',l:'文体活动'},{v:'研学活动',l:'研学活动'}] },
      { key:'title', label:'活动标题', type:'text', required:true },
      { key:'date', label:'日期', type:'date' },
      { key:'location', label:'地点', type:'text' },
      { key:'description', label:'活动描述', type:'textarea' },
      { key:'participants', label:'参与人数', type:'number' },
      { key:'status', label:'状态', type:'select', options:[{v:'未开始',l:'未开始'},{v:'进行中',l:'进行中'},{v:'已完成',l:'已完成'}] }
    ]
  },
  finance: {
    title: '班费记录',
    fields: [
      { key:'type', label:'类型', type:'select', options:[{v:'income',l:'收入'},{v:'expense',l:'支出'}] },
      { key:'amount', label:'金额', type:'number', required:true },
      { key:'category', label:'分类', type:'text' },
      { key:'description', label:'说明', type:'text' },
      { key:'date', label:'日期', type:'date' },
      { key:'recorder', label:'记录人', type:'text' }
    ]
  },
  material: {
    title: '物资领用',
    fields: [
      { key:'item', label:'物资名称', type:'text', required:true },
      { key:'borrower', label:'领用人', type:'text' },
      { key:'borrowDate', label:'领用日期', type:'date' },
      { key:'returnDate', label:'归还日期', type:'date' },
      { key:'status', label:'状态', type:'select', options:[{v:'在用',l:'在用'},{v:'已归还',l:'已归还'},{v:'常驻',l:'常驻'}] }
    ]
  }
};

// ===================== 数据映射 =====================
const DATA_MAP = {
  student:      { array:'students' },
  notice:       { array:'notices' },
  exam:         { array:'exams' },
  reward:       { array:'rewards' },
  mental:       { array:'mentalHealth' },
  leave:        { array:'leaveRequests' },
  assignment:   { array:'assignments' },
  submission:   { array:'submissions' },
  error:        { array:'errorCollection' },
  communication:{ array:'communications' },
  visit:        { array:'homeVisits' },
  meeting:      { array:'parentMeetings' },
  activity:     { array:'activities' },
  finance:      { array:'finances' },
  material:     { array:'materials' }
};

// 各类型保存后需要刷新的渲染函数
function rerender(type) {
  const map = {
    student: () => { App.renderStudentTable(); App.renderExamSelects(); },
    notice: () => App.renderNotices(),
    exam: () => { App.renderExamSelects(); App.renderGradesTable(); },
    reward: () => App.renderRewardsTable(),
    mental: () => App.renderMentalTable(),
    leave: () => App.renderLeaveList(),
    assignment: () => App.renderAssignmentList(),
    submission: () => App.renderSubmissionList(),
    error: () => App.renderErrorTable(),
    communication: () => App.renderCommTable(),
    visit: () => App.renderVisitTable(),
    meeting: () => App.renderMeetingList(),
    activity: () => App.renderActivities(),
    finance: () => { App.renderFinanceSummary(); App.renderFinanceTable(); },
    material: () => App.renderMaterialTable()
  };
  if (map[type]) map[type]();
  App.renderDashboard();
}

// ===================== 应用主控 =====================
const App = {
  currentRole: 'headteacher',
  currentPage: 'dashboard',
  editState: { type: null, id: null, isNew: false },

  init() {
    Store.load();
    this.renderTopBar();
    this.renderSidebar();
    this.renderBottomNav();
    this.bindRoleSwitcher();
    this.bindSidebar();
    this.bindModals();
    this.bindSubTabs();
    this.bindSettings();
    this.bindEditModal();
    this.bindGradeModal();
    this.bindLeaveModal();
    this.bindExport();
    this.updateMobileRoleBtn();
    this.renderAll();
  },

  // ---- 顶部栏 ----
  renderTopBar() {
    const ci = Store.data.classInfo;
    document.getElementById('topClassName').textContent = ci.className;
    document.getElementById('topClassSub').textContent = `${ci.schoolName} · ${ci.semester}`;
    document.title = `${ci.className} · 班级管理工作台`;
    const r = Store.data.roles[this.currentRole];
    document.getElementById('currentUser').innerHTML = `<span class="user-icon">${r.icon}</span><span class="user-name">${U.esc(r.user)}</span>`;
  },

  // ---- 导航 ----
  navItems() {
    return NAV_ITEMS.filter(item => Perm.hasPage(item.id));
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    NAV_ITEMS.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'nav-item' + (item.id === this.currentPage ? ' active' : '') + (!Perm.hasPage(item.id) ? ' disabled' : '');
      btn.innerHTML = `<span class="nav-icon">${item.icon}</span><span>${item.label}</span>`;
      if (Perm.hasPage(item.id)) {
        btn.addEventListener('click', () => this.goPage(item.id));
      }
      nav.appendChild(btn);
    });
  },

  renderBottomNav() {
    const nav = document.getElementById('bottomNav');
    const inner = document.createElement('div');
    inner.className = 'bottom-nav-inner';
    NAV_ITEMS.forEach(item => {
      if (!Perm.hasPage(item.id)) return;
      const btn = document.createElement('button');
      btn.className = 'bn-item' + (item.id === this.currentPage ? ' active' : '');
      btn.innerHTML = `<span class="bn-icon">${item.icon}</span><span>${item.label}</span>`;
      btn.addEventListener('click', () => this.goPage(item.id));
      inner.appendChild(btn);
    });
    nav.innerHTML = '';
    nav.appendChild(inner);
  },

  goPage(pageId) {
    if (!Perm.hasPage(pageId)) { toast('当前角色无权访问'); return; }
    this.currentPage = pageId;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-'+pageId)?.classList.add('active');
    this.renderSidebar();
    this.renderBottomNav();
    this.renderPage(pageId);
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    window.scrollTo(0,0);
  },

  // ---- 角色切换 ----
  bindRoleSwitcher() {
    // 桌面端 chip
    document.querySelectorAll('.role-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.switchRole(chip.dataset.role);
      });
    });
    // 手机端按钮 → 弹出选择面板
    document.getElementById('roleMobileBtn')?.addEventListener('click', () => {
      document.getElementById('roleSheetModal').classList.add('active');
      this.updateRoleSheetActive();
    });
    // 面板内选项
    document.querySelectorAll('.role-sheet-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchRole(item.dataset.role);
        document.getElementById('roleSheetModal').classList.remove('active');
      });
    });
  },

  updateRoleSheetActive() {
    document.querySelectorAll('.role-sheet-item').forEach(item => {
      item.classList.toggle('active', item.dataset.role === this.currentRole);
    });
  },

  updateMobileRoleBtn() {
    const r = Store.data.roles[this.currentRole];
    document.getElementById('rmIcon').textContent = r.icon;
    const roleLabels = { headteacher:'班主任', subjectteacher:'任课教师', parent:'家长', student:'学生' };
    document.getElementById('rmName').textContent = roleLabels[this.currentRole] || r.user;
  },

  switchRole(role) {
    this.currentRole = role;
    Perm.current = role;
    this.renderTopBar();
    this.updateMobileRoleBtn();
    const r = Store.data.roles[role];
    const permText = {
      headteacher: '班主任模式 · 全部权限',
      subjectteacher: `任课教师模式 · ${U.esc(r.subject||'')}学科`,
      parent: '家长模式 · 查看自家孩子',
      student: '学生模式 · 提交作业报名'
    };
    document.getElementById('roleIndicator').innerHTML = `<span class="role-indicator-dot" style="background:${r.color}"></span><span>${permText[role]}</span>`;
    document.querySelectorAll('[data-perm]').forEach(btn => {
      const perms = btn.dataset.perm.split(',');
      btn.classList.toggle('allowed', perms.includes(role));
    });
    const firstPage = Perm.pages[role][0];
    this.goPage(firstPage);
  },

  // ---- 侧边栏 ----
  bindSidebar() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('active');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('active');
    });
  },

  // ---- 弹窗 ----
  bindModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).classList.remove('active');
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
    document.getElementById('noticeDetailFooter')?.addEventListener('click', e => {
      if (e.target.dataset.close) document.getElementById('noticeDetailModal').classList.remove('active');
    });
  },

  // ---- 子标签 ----
  bindSubTabs() {
    document.querySelectorAll('.sub-tab-bar').forEach(bar => {
      bar.querySelectorAll('.sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          bar.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const parent = bar.parentElement;
          Object.entries(tab.dataset).forEach(([key,val]) => {
            parent.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            const possibleIds = [`stab-${val}`,`atstab-${val}`,`hwstab-${val}`,`cstab-${val}`,`fstab-${val}`];
            for (const id of possibleIds) {
              const el = document.getElementById(id);
              if (el) { el.classList.add('active'); break; }
            }
          });
        });
      });
    });
  },

  // ==================== 通用编辑系统 ====================
  canEditType(type) {
    if (this.currentRole === 'headteacher') return true;
    if (type === 'assignment' && Perm.hasPerm('assignment')) return true;
    if (type === 'leave' && Perm.hasPerm('leave')) return true;
    if (type === 'submission' && Perm.hasPerm('submit')) return true;
    return false;
  },

  openEditModal(type, id) {
    if (!this.canEditType(type)) { toast('当前角色无编辑权限'); return; }
    const schema = FORM_SCHEMAS[type];
    if (!schema) { toast('未知的表单类型'); return; }
    const dm = DATA_MAP[type];
    let record;
    if (id) {
      record = Store.data[dm.array].find(x => x.id === id);
      if (!record) { toast('记录不存在'); return; }
    } else {
      record = {};
      schema.fields.forEach(f => {
        if (f.type === 'select' && f.options.length > 0) record[f.key] = f.options[0].v;
        else if (f.type === 'tags') record[f.key] = [];
        else if (f.type === 'number') record[f.key] = 0;
        else record[f.key] = '';
      });
    }

    // 构建表单
    const body = document.getElementById('editModalBody');
    body.innerHTML = schema.fields.map(f => {
      const val = record[f.key];
      const escVal = typeof val === 'string' ? U.esc(val) : (val !== undefined && val !== null ? val : '');
      if (f.type === 'select') {
        return `<div class="form-row"><label>${f.label}</label><select class="form-input" data-field="${f.key}">${f.options.map(o => `<option value="${o.v}" ${val===o.v?'selected':''}>${o.l}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="form-row"><label>${f.label}</label><textarea class="form-input" data-field="${f.key}" rows="4" ${f.required?'required':''}>${escVal}</textarea></div>`;
      }
      if (f.type === 'student-select') {
        return `<div class="form-row"><label>${f.label}</label><select class="form-input" data-field="${f.key}">${Store.data.students.map(s => `<option value="${s.id}" ${val===s.id?'selected':''}>${U.esc(s.name)} (${s.id})</option>`).join('')}</select></div>`;
      }
      if (f.type === 'assignment-select') {
        return `<div class="form-row"><label>${f.label}</label><select class="form-input" data-field="${f.key}">${Store.data.assignments.map(a => `<option value="${a.id}" ${val===a.id?'selected':''}>${U.esc(a.subject)} · ${U.esc(a.title)}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'tags') {
        const tagVal = Array.isArray(val) ? val.join(', ') : (val || '');
        return `<div class="form-row"><label>${f.label}</label><input type="text" class="form-input" data-field="${f.key}" data-type="tags" value="${U.esc(tagVal)}" placeholder="用逗号分隔"></div>`;
      }
      if (f.type === 'date') {
        return `<div class="form-row"><label>${f.label}</label><input type="date" class="form-input" data-field="${f.key}" value="${escVal}"></div>`;
      }
      if (f.type === 'number') {
        return `<div class="form-row"><label>${f.label}</label><input type="number" class="form-input" data-field="${f.key}" value="${escVal}"></div>`;
      }
      return `<div class="form-row"><label>${f.label}</label><input type="text" class="form-input" data-field="${f.key}" value="${escVal}" ${f.required?'required':''}></div>`;
    }).join('');

    this.editState = { type, id, isNew: !id };
    document.getElementById('editModalTitle').textContent = (id ? '编辑' : '添加') + schema.title;
    document.getElementById('editModal').classList.add('active');
  },

  saveEditModal() {
    const { type, id, isNew } = this.editState;
    const schema = FORM_SCHEMAS[type];
    const dm = DATA_MAP[type];
    if (!schema) return;

    // 收集值
    const values = {};
    schema.fields.forEach(f => {
      const el = document.querySelector(`#editModalBody [data-field="${f.key}"]`);
      if (!el) return;
      if (f.type === 'number') values[f.key] = parseInt(el.value) || 0;
      else if (f.type === 'tags') values[f.key] = el.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      else values[f.key] = el.value.trim();
    });

    // 验证
    for (const f of schema.fields) {
      if (f.required && !values[f.key] && values[f.key] !== 0) {
        toast(`请填写${f.label}`);
        return;
      }
    }

    if (isNew) {
      const newRec = { id: U.uid(), ...values };
      Store.data[dm.array].push(newRec);
    } else {
      const rec = Store.data[dm.array].find(x => x.id === id);
      if (rec) Object.assign(rec, values);
    }

    Store.save();
    document.getElementById('editModal').classList.remove('active');
    rerender(type);
    toast(isNew ? '已添加' : '已保存');
  },

  deleteRecord(type, id) {
    if (!this.canEditType(type)) { toast('无权限'); return; }
    if (!confirm('确认删除此条记录？此操作不可撤销。')) return;
    const dm = DATA_MAP[type];
    const arr = Store.data[dm.array];
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) {
      arr.splice(idx, 1);
      Store.save();
      rerender(type);
      toast('已删除');
    }
  },

  bindEditModal() {
    document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEditModal());
    // 回车保存
    document.getElementById('editModalBody')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) this.saveEditModal();
    });
  },

  // ==================== 班级设置 ====================
  bindSettings() {
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
    document.getElementById('resetDataBtn')?.addEventListener('click', () => {
      if (confirm('确认重置全部数据？所有修改将丢失，恢复为初始示例数据。')) {
        Store.reset();
        this.renderTopBar();
        this.renderAll();
        this.goPage(this.currentPage);
        document.getElementById('settingsModal').classList.remove('active');
        toast('数据已重置');
      }
    });
  },

  openSettings() {
    const ci = Store.data.classInfo;
    const r = Store.data.roles;
    document.getElementById('setClassName').value = ci.className || '';
    document.getElementById('setSchoolName').value = ci.schoolName || '';
    document.getElementById('setGrade').value = ci.grade || '';
    document.getElementById('setClassCode').value = ci.classCode || '';
    document.getElementById('setHeadTeacher').value = ci.headTeacher || '';
    document.getElementById('setSemester').value = ci.semester || '';
    document.getElementById('setRoleHT').value = r.headteacher.user || '';
    document.getElementById('setRoleST').value = r.subjectteacher.user || '';
    document.getElementById('setRoleSTSubject').value = r.subjectteacher.subject || '';
    document.getElementById('setRoleParent').value = r.parent.user || '';
    document.getElementById('setRoleStudent').value = r.student.user || '';

    // 学生下拉
    const sel1 = document.getElementById('setRoleParentChild');
    const sel2 = document.getElementById('setRoleStudentId');
    const opts = Store.data.students.map(s => `<option value="${s.id}">${U.esc(s.name)} (${s.id})</option>`).join('');
    sel1.innerHTML = opts;
    sel2.innerHTML = opts;
    sel1.value = r.parent.childId || Store.data.students[0]?.id || '';
    sel2.value = r.student.studentId || Store.data.students[0]?.id || '';

    document.getElementById('settingsModal').classList.add('active');
  },

  saveSettings() {
    const ci = Store.data.classInfo;
    ci.className = document.getElementById('setClassName').value.trim() || ci.className;
    ci.schoolName = document.getElementById('setSchoolName').value.trim() || ci.schoolName;
    ci.grade = document.getElementById('setGrade').value.trim() || ci.grade;
    ci.classCode = document.getElementById('setClassCode').value.trim() || ci.classCode;
    ci.headTeacher = document.getElementById('setHeadTeacher').value.trim() || ci.headTeacher;
    ci.semester = document.getElementById('setSemester').value.trim() || ci.semester;
    ci.studentCount = Store.data.students.length;

    const r = Store.data.roles;
    r.headteacher.user = document.getElementById('setRoleHT').value.trim() || r.headteacher.user;
    r.subjectteacher.user = document.getElementById('setRoleST').value.trim() || r.subjectteacher.user;
    r.subjectteacher.subject = document.getElementById('setRoleSTSubject').value.trim() || r.subjectteacher.subject;
    r.parent.user = document.getElementById('setRoleParent').value.trim() || r.parent.user;
    r.parent.childId = document.getElementById('setRoleParentChild').value;
    r.student.user = document.getElementById('setRoleStudent').value.trim() || r.student.user;
    r.student.studentId = document.getElementById('setRoleStudentId').value;

    Store.save();
    this.renderTopBar();
    this.switchRole(this.currentRole);
    document.getElementById('settingsModal').classList.remove('active');
    toast('设置已保存');
  },

  // ==================== 数据导出 ====================
  bindExport() {
    document.getElementById('exportAllBtn')?.addEventListener('click', () => this.exportAll());
    document.getElementById('exportStudentsBtn')?.addEventListener('click', () => this.exportStudents());
    document.getElementById('exportGradesBtn')?.addEventListener('click', () => this.exportGrades());
    document.getElementById('exportAttendanceBtn')?.addEventListener('click', () => this.exportAttendance());
    document.getElementById('exportFinanceBtn')?.addEventListener('click', () => this.exportFinance());
    document.getElementById('exportRewardsBtn')?.addEventListener('click', () => this.exportRewards());
    document.getElementById('exportLeaveBtn')?.addEventListener('click', () => this.exportLeave());
  },

  exportAll() {
    downloadFile(`班级数据备份_${U.dateStr()}.json`, JSON.stringify(Store.data, null, 2), 'application/json');
    toast('已导出全部数据(JSON)');
  },

  exportStudents() {
    const headers = ['学号','姓名','性别','出生日期','家长姓名','联系电话','家庭住址','备注(职务)'];
    const rows = Store.data.students.map(s => [s.id, s.name, s.gender, s.birth, s.parent, s.phone, s.address, s.notes]);
    downloadFile(`学生档案_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出学生档案');
  },

  exportGrades() {
    const examName = {};
    Store.data.exams.forEach(e => examName[e.id] = e.name);
    const headers = ['考试','学科','学号','姓名','分数','日期'];
    const rows = Store.data.grades.map(g => [examName[g.examId]||g.examId, g.subject, g.studentId, U.studentName(g.studentId), g.score, g.date]);
    downloadFile(`成绩台账_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出成绩台账');
  },

  exportAttendance() {
    const headers = ['日期','学号','姓名','考勤状态'];
    const rows = Store.data.attendance.map(a => [a.date, a.studentId, U.studentName(a.studentId), STATUS_MAP[a.status]||a.status]);
    downloadFile(`考勤记录_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出考勤记录');
  },

  exportFinance() {
    const headers = ['日期','类型','分类','金额(元)','说明','记录人'];
    const rows = Store.data.finances.map(f => [f.date, f.type==='income'?'收入':'支出', f.category, f.amount, f.description, f.recorder]);
    downloadFile(`班费收支_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出班费收支');
  },

  exportRewards() {
    const headers = ['日期','学号','姓名','类型','级别','事由'];
    const rows = Store.data.rewards.map(r => [r.date, r.studentId, U.studentName(r.studentId), r.type==='reward'?'奖励':'处分', r.level, r.description]);
    downloadFile(`奖惩记录_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出奖惩记录');
  },

  exportLeave() {
    const headers = ['申请日期','学号','姓名','请假类型','开始日期','结束日期','事由','状态','审批人'];
    const rows = Store.data.leaveRequests.map(l => [l.applyDate, l.studentId, U.studentName(l.studentId), l.type, l.startDate, l.endDate, l.reason, l.status==='approved'?'已批准':'待审批', l.approver]);
    downloadFile(`请假记录_${U.dateStr()}.csv`, toCSV(headers, rows), 'text/csv');
    toast('已导出请假记录');
  },

  // ==================== 成绩录入弹窗 ====================
  bindGradeModal() {
    document.getElementById('gradeExam')?.addEventListener('change', () => this.fillGradeSubjects());
    document.getElementById('gradeSubject')?.addEventListener('change', () => this.fillGradeInputs());
    document.getElementById('saveGradesBtn')?.addEventListener('click', () => this.saveGrades());
  },

  fillGradeSubjects() {
    const examId = document.getElementById('gradeExam').value;
    const exam = Store.data.exams.find(e => e.id === examId);
    if (!exam) return;
    const sel = document.getElementById('gradeSubject');
    sel.innerHTML = (exam.subjects || []).map(s => `<option value="${s}">${s}</option>`).join('');
    this.fillGradeInputs();
  },

  fillGradeInputs() {
    const examId = document.getElementById('gradeExam')?.value;
    const subject = document.getElementById('gradeSubject')?.value;
    if (!examId || !subject) return;
    const grid = document.getElementById('gradeInputGrid');
    grid.innerHTML = Store.data.students.map(s => {
      const g = Store.data.grades.find(x => x.examId === examId && x.studentId === s.id && x.subject === subject);
      const score = g ? g.score : '';
      return `<div class="grade-input-row">
        <label>${U.esc(s.name)}</label>
        <input type="number" min="0" max="100" value="${score}" data-sid="${s.id}" placeholder="—">
      </div>`;
    }).join('');
  },

  openGradeModal() {
    if (!Perm.hasPerm('grades')) { toast('无权限'); return; }
    const examSel = document.getElementById('gradeExam');
    examSel.innerHTML = Store.data.exams.map(e => `<option value="${e.id}">${U.esc(e.name)} (${U.fmtDate(e.date)})</option>`).join('');
    if (Store.data.exams.length > 0) {
      examSel.value = Store.data.exams[Store.data.exams.length-1].id;
      this.fillGradeSubjects();
    }
    document.getElementById('gradeModal').classList.add('active');
  },

  saveGrades() {
    const examId = document.getElementById('gradeExam').value;
    const subject = document.getElementById('gradeSubject').value;
    const exam = Store.data.exams.find(e => e.id === examId);
    if (!exam || !subject) { toast('请选择考试和学科'); return; }
    const inputs = document.querySelectorAll('#gradeInputGrid input');
    inputs.forEach(inp => {
      const sid = inp.dataset.sid;
      const val = inp.value.trim();
      let g = Store.data.grades.find(x => x.examId === examId && x.studentId === sid && x.subject === subject);
      if (val === '') {
        // 空值：移除成绩
        if (g) {
          const idx = Store.data.grades.indexOf(g);
          Store.data.grades.splice(idx, 1);
        }
      } else {
        const score = Math.max(0, Math.min(100, parseInt(val) || 0));
        if (g) {
          g.score = score;
        } else {
          Store.data.grades.push({
            id: `${examId}-${sid}-${subject}`,
            examId, studentId: sid, subject, score, date: exam.date
          });
        }
      }
    });
    Store.save();
    document.getElementById('gradeModal').classList.remove('active');
    this.renderGradesTable();
    this.renderDashboard();
    toast('成绩已保存');
  },

  // ==================== 请假申请弹窗 ====================
  bindLeaveModal() {
    document.getElementById('saveLeaveBtn')?.addEventListener('click', () => this.saveLeaveForm());
  },

  openLeaveForm() {
    if (!Perm.hasPerm('leave') && this.currentRole !== 'headteacher') { toast('无权限'); return; }
    const sel = document.getElementById('leaveStudent');
    let students = Store.data.students;
    if (this.currentRole === 'parent') students = students.filter(s => s.id === Perm.childId());
    sel.innerHTML = students.map(s => `<option value="${s.id}">${U.esc(s.name)}</option>`).join('');
    if (this.currentRole === 'parent') {
      sel.value = Perm.childId();
      sel.disabled = true;
    } else {
      sel.disabled = false;
    }
    document.getElementById('leaveType').value = '病假';
    document.getElementById('leaveStart').value = U.today();
    document.getElementById('leaveEnd').value = U.today();
    document.getElementById('leaveReason').value = '';
    document.getElementById('leaveModal').classList.add('active');
  },

  saveLeaveForm() {
    const studentId = document.getElementById('leaveStudent').value;
    const type = document.getElementById('leaveType').value;
    const startDate = document.getElementById('leaveStart').value;
    const endDate = document.getElementById('leaveEnd').value;
    const reason = document.getElementById('leaveReason').value.trim();
    if (!studentId || !startDate || !endDate || !reason) { toast('请填写完整'); return; }
    const student = U.studentById(studentId);
    Store.data.leaveRequests.push({
      id: U.uid(), studentId, type, startDate, endDate, reason,
      status: 'pending', approver: '', applyDate: U.today(),
      parent: student ? student.parent : ''
    });
    Store.save();
    document.getElementById('leaveModal').classList.remove('active');
    this.renderLeaveList();
    this.renderDashboard();
    toast('请假申请已提交');
  },

  // ==================== 渲染入口 ====================
  renderAll() {
    this.renderDashboard();
  },

  renderPage(pageId) {
    switch(pageId) {
      case 'dashboard': this.renderDashboard(); break;
      case 'notice': this.renderNotices(); break;
      case 'student': this.renderStudentSection(); break;
      case 'attendance': this.renderAttendanceSection(); break;
      case 'homework': this.renderHomeworkSection(); break;
      case 'communicate': this.renderCommSection(); break;
      case 'activity': this.renderActivities(); break;
      case 'finance': this.renderFinanceSection(); break;
      case 'guide': this.renderGuide(); break;
    }
  },

  // ==================== 数据看板 ====================
  renderDashboard() {
    const d = Store.data;
    document.getElementById('dashboardDate').textContent = U.fmtDateFull(U.today());
    const todayAtt = d.attendance.filter(a => a.date === d.attendance[d.attendance.length-1]?.date);
    const presentToday = todayAtt.filter(a => a.status==='present').length;
    const absentToday = todayAtt.filter(a => a.status==='absent').length;
    const lateToday = todayAtt.filter(a => a.status==='late').length;
    const leaveToday = todayAtt.filter(a => a.status==='leave').length;
    const pendingLeaves = d.leaveRequests.filter(l => l.status==='pending').length;
    const pendingSubs = d.submissions.filter(s => s.status==='submitted').length;
    const totalIncome = d.finances.filter(f => f.type==='income').reduce((s,f)=>s+f.amount,0);
    const totalExpense = d.finances.filter(f => f.type==='expense').reduce((s,f)=>s+f.amount,0);

    const stats = [
      { icon:'👥', label:'班级人数', value:d.students.length+'人' },
      { icon:'✅', label:'今日出勤', value:presentToday+'人', trend:`迟到${lateToday} 请假${leaveToday} 缺勤${absentToday}`, trendColor:'#64748B' },
      { icon:'📋', label:'待审批请假', value:pendingLeaves+'条', color:pendingLeaves>0?'#DC2626':'#1E293B' },
      { icon:'📝', label:'待批改作业', value:pendingSubs+'份', color:pendingSubs>0?'#F59E0B':'#1E293B' },
      { icon:'💰', label:'班费结余', value:'¥'+(totalIncome-totalExpense), color:'#0D9488' },
      { icon:'🎪', label:'本月活动', value:d.activities.length+'项', color:'#7C3AED' }
    ];

    document.getElementById('dashboardStats').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-card-icon">${s.icon}</div>
        <div class="stat-card-label">${s.label}</div>
        <div class="stat-card-value" style="color:${s.color||'#1E293B'}">${s.value}</div>
        ${s.trend?`<div class="stat-card-trend" style="color:${s.trendColor||'#94A3B8'}">${s.trend}</div>`:''}
      </div>
    `).join('');

    this.renderAttendanceChart();
    this.renderGradeChart();
    this.renderLeaveChart();
    this.renderActivityChart();
  },

  renderAttendanceChart() {
    const d = Store.data;
    const dates = [...new Set(d.attendance.map(a=>a.date))].slice(-7);
    const el = document.getElementById('attendanceChart');
    if (!el) return;
    const stats = dates.map(date => {
      const recs = d.attendance.filter(a => a.date === date);
      return { date, present: recs.filter(r=>r.status==='present').length, absent: recs.filter(r=>r.status==='absent').length, late: recs.filter(r=>r.status==='late').length, leave: recs.filter(r=>r.status==='leave').length };
    });
    const maxVal = Math.max(...stats.map(s => s.present+s.absent+s.late+s.leave), 1);
    el.innerHTML = `
      <div class="chart-bars">
        ${stats.map(s => {
          const total = s.present+s.absent+s.late+s.leave;
          const h = total/maxVal*100;
          return `<div class="chart-bar-col">
            <div class="chart-bar-val">${s.present}</div>
            <div class="chart-bar" style="height:${h}%;background:linear-gradient(180deg,#16A34A,#15803D)"></div>
            <div class="chart-bar-label">${U.fmtDate(s.date)}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:var(--text-sub);margin-top:8px">
        <span>🟢出勤 ${stats.reduce((s,x)=>s+x.present,0)}</span>
        <span>🟡迟到 ${stats.reduce((s,x)=>s+x.late,0)}</span>
        <span>🔵请假 ${stats.reduce((s,x)=>s+x.leave,0)}</span>
        <span>🔴缺勤 ${stats.reduce((s,x)=>s+x.absent,0)}</span>
      </div>`;
  },

  renderGradeChart() {
    const d = Store.data;
    const el = document.getElementById('gradeChart');
    if (!el) return;
    const exam = d.exams[d.exams.length-1];
    if (!exam) { el.innerHTML = '<div style="color:var(--text-sub)">暂无考试数据</div>'; return; }
    const grades = d.grades.filter(g => g.examId === exam.id && g.subject === '数学');
    const ranges = [
      { label:'90-100', min:90, max:100, color:'#16A34A' },
      { label:'80-89', min:80, max:89, color:'#0D9488' },
      { label:'70-79', min:70, max:79, color:'#2563EB' },
      { label:'60-69', min:60, max:69, color:'#F59E0B' },
      { label:'<60', min:0, max:59, color:'#DC2626' }
    ];
    el.innerHTML = `
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">${U.esc(exam.name)} · 数学 (${grades.length}人)</div>
      ${ranges.map(r => {
        const count = grades.filter(g => g.score>=r.min && g.score<=r.max).length;
        const pct = grades.length>0 ? count/grades.length*100 : 0;
        return `<div class="dist-row"><div class="dist-label">${r.label}</div><div class="dist-track"><div class="dist-fill" style="width:${pct}%;background:${r.color}"></div></div><div class="dist-val">${count}</div></div>`;
      }).join('')}`;
  },

  renderLeaveChart() {
    const d = Store.data;
    const el = document.getElementById('leaveChart');
    if (!el) return;
    const approved = d.leaveRequests.filter(l=>l.status==='approved').length;
    const pending = d.leaveRequests.filter(l=>l.status==='pending').length;
    const sick = d.leaveRequests.filter(l=>l.type==='病假').length;
    const personal = d.leaveRequests.filter(l=>l.type==='事假').length;
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="text-align:center;padding:12px;background:var(--bg-soft);border-radius:8px"><div style="font-size:24px;font-weight:700;color:var(--success)">${approved}</div><div style="font-size:12px;color:var(--text-sub)">已批准</div></div>
        <div style="text-align:center;padding:12px;background:var(--bg-soft);border-radius:8px"><div style="font-size:24px;font-weight:700;color:var(--accent)">${pending}</div><div style="font-size:12px;color:var(--text-sub)">待审批</div></div>
        <div style="text-align:center;padding:12px;background:var(--bg-soft);border-radius:8px"><div style="font-size:24px;font-weight:700;color:var(--info)">${sick}</div><div style="font-size:12px;color:var(--text-sub)">病假</div></div>
        <div style="text-align:center;padding:12px;background:var(--bg-soft);border-radius:8px"><div style="font-size:24px;font-weight:700;color:var(--secondary)">${personal}</div><div style="font-size:12px;color:var(--text-sub)">事假</div></div>
      </div>`;
  },

  renderActivityChart() {
    const d = Store.data;
    const el = document.getElementById('activityChart');
    if (!el) return;
    const done = d.activities.filter(a=>a.status==='已完成').length;
    const ongoing = d.activities.filter(a=>a.status==='进行中').length;
    const planned = d.activities.filter(a=>a.status==='未开始').length;
    const total = d.activities.length;
    const types = ['班会','文体活动','研学活动'];
    el.innerHTML = `
      <div style="display:flex;justify-content:space-around;margin-bottom:16px">
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:var(--success)">${done}</div><div style="font-size:12px;color:var(--text-sub)">已完成</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:var(--accent)">${ongoing}</div><div style="font-size:12px;color:var(--text-sub)">进行中</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:var(--text-light)">${planned}</div><div style="font-size:12px;color:var(--text-sub)">未开始</div></div>
      </div>
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">活动类型分布</div>
      ${types.map(t => {
        const count = d.activities.filter(a=>a.type===t).length;
        const pct = total>0 ? count/total*100 : 0;
        return `<div class="dist-row"><div class="dist-label">${t}</div><div class="dist-track"><div class="dist-fill" style="width:${pct}%;background:var(--primary)"></div></div><div class="dist-val">${count}</div></div>`;
      }).join('')}`;
  },

  // ==================== 通知公告 ====================
  renderNotices(filter) {
    const d = Store.data;
    let notices = d.notices;
    const f = filter || document.querySelector('#noticeFilter .active')?.dataset.filter || 'all';
    if (f !== 'all') notices = notices.filter(n => n.type === f);
    notices = [...notices].reverse();
    const typeMap = { permanent:'永久公告', temporary:'临时通知', meeting:'家长会通知' };
    const typeTag = { permanent:'tag-blue', temporary:'tag-yellow', meeting:'tag-teal' };
    const canEdit = this.canEditType('notice');
    const el = document.getElementById('noticeList');
    el.innerHTML = notices.map(n => {
      const readCount = n.readBy.length;
      const isParent = this.currentRole === 'parent';
      const childId = Perm.childId();
      const hasRead = n.readBy.includes(childId);
      return `
        <div class="notice-card type-${n.type}" data-id="${n.id}">
          <div class="notice-card-header">
            <span class="notice-card-title">${U.esc(n.title)}</span>
            <span class="tag ${typeTag[n.type]}">${typeMap[n.type]}</span>
          </div>
          <div class="notice-card-preview">${U.esc(n.content).replace(/\n/g,'<br>')}</div>
          <div class="notice-card-meta">
            <span>📅 ${U.fmtDate(n.date)}</span>
            <span>✍️ ${U.esc(n.author)}</span>
            <span class="notice-read-status">已读 ${readCount}/${d.students.length}</span>
            ${isParent && n.type==='meeting' ? (hasRead?'<span class="tag tag-green">已确认</span>':'<span class="tag tag-red">待确认</span>') : ''}
            ${canEdit ? `<button class="btn-edit" onclick="event.stopPropagation();App.openEditModal('notice','${n.id}')">编辑</button><button class="btn-del" onclick="event.stopPropagation();App.deleteRecord('notice','${n.id}')">删除</button>` : ''}
          </div>
        </div>`;
    }).join('');
    el.querySelectorAll('.notice-card').forEach(card => {
      card.addEventListener('click', () => this.showNoticeDetail(card.dataset.id));
    });
    document.querySelectorAll('#noticeFilter .filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#noticeFilter .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderNotices(btn.dataset.filter);
      };
    });
    // 替换发布通知按钮
    const addBtn = document.getElementById('addNoticeBtn');
    if (addBtn) {
      addBtn.textContent = '+ 发布通知';
      addBtn.onclick = () => this.openEditModal('notice');
    }
  },

  showNoticeDetail(id) {
    const n = Store.data.notices.find(x => x.id === id);
    if (!n) return;
    const typeMap = { permanent:'永久公告', temporary:'临时通知', meeting:'家长会通知' };
    const d = Store.data;
    const unread = d.students.filter(s => !n.readBy.includes(s.id));
    document.getElementById('noticeDetailTitle').textContent = n.title;
    document.getElementById('noticeDetailBody').innerHTML = `
      <div style="margin-bottom:12px">
        <span class="tag tag-blue">${typeMap[n.type]}</span>
        <span style="font-size:12px;color:var(--text-sub);margin-left:8px">${U.fmtDateFull(n.date)} · ${U.esc(n.author)}</span>
      </div>
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;background:var(--bg-soft);padding:14px;border-radius:8px;margin-bottom:12px">${U.esc(n.content)}</div>
      <div style="font-size:13px;color:var(--text-sub)">家长已读回执：${n.readBy.length}/${d.students.length} 已读</div>
      ${unread.length > 0 ? `<div style="font-size:12px;color:var(--danger);margin-top:4px">未读：${unread.slice(0,5).map(s=>s.name).join('、')}${unread.length>5?'...':''}</div>` : '<div style="font-size:12px;color:var(--success);margin-top:4px">✓ 全部已读</div>'}`;
    const footer = document.getElementById('noticeDetailFooter');
    if (this.currentRole === 'parent') {
      const childId = Perm.childId();
      const hasRead = n.readBy.includes(childId);
      if (!hasRead) {
        footer.innerHTML = `<button class="btn-primary" id="confirmReceiptBtn">确认已读并回执</button>`;
        document.getElementById('confirmReceiptBtn').onclick = () => {
          n.readBy.push(childId);
          Store.save();
          this.renderNotices();
          toast('回执已确认');
          document.getElementById('noticeDetailModal').classList.remove('active');
        };
      } else {
        footer.innerHTML = `<button class="btn-secondary btn-block" data-close="noticeDetailModal">您已确认回执</button>`;
        this.bindModals();
      }
    } else {
      footer.innerHTML = `<button class="btn-secondary btn-block" data-close="noticeDetailModal">关闭</button>`;
      this.bindModals();
    }
    document.getElementById('noticeDetailModal').classList.add('active');
  },

  // ==================== 学情管理 ====================
  renderStudentSection() {
    this.renderStudentTable();
    this.renderExamSelects();
    this.renderGradesTable();
    this.renderRewardsTable();
    this.renderMentalTable();
  },

  renderStudentTable() {
    const d = Store.data;
    let students = d.students;
    if (this.currentRole === 'parent') students = students.filter(s => s.id === Perm.childId());
    const canEdit = this.canEditType('student');
    const el = document.getElementById('studentTableWrap');
    el.innerHTML = `
      ${canEdit ? `<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('student')">+ 添加学生</button></div>` : ''}
      <table class="data-table">
        <thead><tr>
          <th>学号</th><th>姓名</th><th>性别</th><th>出生日期</th><th>家长</th><th>联系电话</th><th>备注</th>
          ${canEdit?'<th>操作</th>':''}
        </tr></thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td class="col-id">${s.id}</td>
              <td class="col-name">${U.esc(s.name)}</td>
              <td>${s.gender}</td>
              <td>${s.birth}</td>
              <td>${U.esc(s.parent)}</td>
              <td>${U.esc(s.phone)}</td>
              <td>${U.esc(s.notes||'')}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('student','${s.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('student','${s.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderExamSelects() {
    const examSel = document.getElementById('examSelect');
    const subSel = document.getElementById('subjectSelect');
    if (!examSel) return;
    examSel.innerHTML = Store.data.exams.map(e => `<option value="${e.id}">${U.esc(e.name)} (${U.fmtDate(e.date)})</option>`).join('');
    const lastExam = Store.data.exams[Store.data.exams.length-1];
    if (lastExam) {
      subSel.innerHTML = lastExam.subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    examSel.onchange = () => { this.renderGradesTable(); };
    subSel.onchange = () => { this.renderGradesTable(); };
  },

  renderGradesTable() {
    const examId = document.getElementById('examSelect')?.value;
    const subject = document.getElementById('subjectSelect')?.value;
    if (!examId || !subject) return;
    const d = Store.data;
    let students = d.students;
    if (this.currentRole === 'parent') students = students.filter(s => s.id === Perm.childId());
    const canEdit = Perm.hasPerm('grades');
    const grades = d.grades.filter(g => g.examId === examId && g.subject === subject);
    const sorted = [...students.map(s => {
      const g = grades.find(x => x.studentId === s.id);
      return { ...s, score: g ? g.score : null, gradeId: g ? g.id : null };
    })].sort((a,b) => (b.score||0) - (a.score||0));
    const scores = sorted.filter(s => s.score !== null).map(s => s.score);
    const avg = scores.length > 0 ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const passCount = scores.filter(s => s >= 60).length;
    const passRate = scores.length > 0 ? (passCount/scores.length*100).toFixed(0) : 0;
    const el = document.getElementById('gradesTableWrap');
    el.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
        <div class="tag tag-blue">均分 ${avg}</div>
        <div class="tag tag-green">最高 ${max}</div>
        <div class="tag tag-red">最低 ${min}</div>
        <div class="tag tag-teal">及格率 ${passRate}%</div>
        ${canEdit?`<button class="btn-primary btn-sm" onclick="App.openGradeModal()">✏️ 成绩录入</button>`:''}
        ${canEdit?`<button class="btn-primary btn-sm" onclick="App.openEditModal('exam')">+ 添加考试</button>`:''}
      </div>
      <table class="data-table">
        <thead><tr><th>排名</th><th>学号</th><th>姓名</th><th>成绩</th><th>等级</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${sorted.map((s,i) => {
            const rank = i+1;
            const grade = s.score===null?'-':(s.score>=90?'A':s.score>=80?'B':s.score>=70?'C':s.score>=60?'D':'E');
            const gradeTag = {A:'tag-green',B:'tag-teal',C:'tag-blue',D:'tag-yellow',E:'tag-red'}[grade]||'tag-gray';
            return `<tr>
              <td>${rank<=3?'🏆':''}${rank}</td>
              <td class="col-id">${s.id}</td>
              <td class="col-name">${U.esc(s.name)}</td>
              <td style="font-weight:${rank<=3?'700':'400'};color:${s.score!==null&&s.score<60?'var(--danger)':'var(--text)'}">${s.score!==null?s.score:'未录'}</td>
              <td><span class="tag ${gradeTag}">${grade}</span></td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.editGradeInline('${examId}','${subject}','${s.id}')">改分</button></td>`:''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  editGradeInline(examId, subject, studentId) {
    const g = Store.data.grades.find(x => x.examId === examId && x.studentId === studentId && x.subject === subject);
    const current = g ? g.score : '';
    const input = prompt(`输入${U.studentName(studentId)}的${subject}成绩（0-100，留空删除）：`, current);
    if (input === null) return;
    const trimmed = input.trim();
    if (trimmed === '') {
      if (g) {
        const idx = Store.data.grades.indexOf(g);
        Store.data.grades.splice(idx, 1);
        Store.save();
        this.renderGradesTable();
        this.renderDashboard();
        toast('成绩已删除');
      }
    } else {
      const score = Math.max(0, Math.min(100, parseInt(trimmed) || 0));
      if (g) {
        g.score = score;
      } else {
        const exam = Store.data.exams.find(e => e.id === examId);
        Store.data.grades.push({ id:`${examId}-${studentId}-${subject}`, examId, studentId, subject, score, date: exam?exam.date:U.today() });
      }
      Store.save();
      this.renderGradesTable();
      this.renderDashboard();
      toast('成绩已更新');
    }
  },

  renderRewardsTable() {
    const d = Store.data;
    const canEdit = this.canEditType('reward') || Perm.hasPerm('rewards');
    const el = document.getElementById('rewardsTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('reward')">+ 添加奖惩</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>学生</th><th>类型</th><th>级别</th><th>事由</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.rewards.map(r => `
            <tr>
              <td>${U.fmtDate(r.date)}</td>
              <td class="col-name">${U.studentName(r.studentId)}</td>
              <td><span class="tag ${r.type==='reward'?'tag-green':'tag-red'}">${r.type==='reward'?'奖励':'处分'}</span></td>
              <td><span class="tag tag-blue">${U.esc(r.level)}</span></td>
              <td>${U.esc(r.description)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('reward','${r.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('reward','${r.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderMentalTable() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('mental');
    const moodTag = { '良好':'tag-green', '一般':'tag-yellow', '需关注':'tag-red' };
    const el = document.getElementById('mentalTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('mental')">+ 添加记录</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>学生</th><th>状态</th><th>记录</th><th>跟进措施</th><th>记录人</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.mentalHealth.map(m => `
            <tr>
              <td>${U.fmtDate(m.date)}</td>
              <td class="col-name">${U.studentName(m.studentId)}</td>
              <td><span class="tag ${moodTag[m.mood]||'tag-gray'}">${U.esc(m.mood)}</span></td>
              <td style="max-width:200px">${U.esc(m.note)}</td>
              <td style="max-width:200px;color:var(--text-sub)">${U.esc(m.followUp)}</td>
              <td>${U.esc(m.teacher)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('mental','${m.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('mental','${m.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  // ==================== 考勤请假 ====================
  renderAttendanceSection() {
    const dates = [...new Set(Store.data.attendance.map(a=>a.date))].reverse();
    const dateInput = document.getElementById('attendanceDate');
    dateInput.value = dates[0] || U.today();
    dateInput.onchange = () => this.renderAttendanceTable();
    this.renderAttendanceTable();
    this.renderLeaveList();
    this.renderMonthlyAttendance();
  },

  renderAttendanceTable() {
    const date = document.getElementById('attendanceDate').value;
    const d = Store.data;
    let records = d.attendance.filter(a => a.date === date);
    let students = d.students;
    if (this.currentRole === 'parent') students = students.filter(s => s.id === Perm.childId());
    const canEdit = Perm.hasPerm('attendance');
    const statusMap = { present:['出勤','tag-green'], absent:['缺勤','tag-red'], late:['迟到','tag-yellow'], leave:['请假','tag-blue'] };
    const el = document.getElementById('attendanceTableWrap');
    if (records.length === 0 && !canEdit) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-sub)">该日期暂无考勤记录</div>';
      return;
    }
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.addAttendanceDate()">+ 添加当日考勤</button><button class="btn-secondary btn-sm" onclick="App.fillAttendance('${date}')">一键全部出勤</button></div>`:''}
      ${records.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--text-sub)">该日期暂无考勤记录，可点击上方按钮添加</div>' : `
      <table class="data-table">
        <thead><tr><th>学号</th><th>姓名</th><th>考勤状态</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${students.map(s => {
            const rec = records.find(r => r.studentId === s.id);
            const status = rec ? rec.status : 'present';
            const [label, tag] = statusMap[status] || ['出勤','tag-green'];
            return `<tr>
              <td class="col-id">${s.id}</td>
              <td class="col-name">${U.esc(s.name)}</td>
              <td><span class="tag ${tag}">${label}</span></td>
              ${canEdit?`<td class="col-actions"><select class="select-input" style="padding:3px 6px;font-size:12px" onchange="App.setAttendance('${date}','${s.id}',this.value)">
                <option value="present" ${status==='present'?'selected':''}>出勤</option>
                <option value="late" ${status==='late'?'selected':''}>迟到</option>
                <option value="leave" ${status==='leave'?'selected':''}>请假</option>
                <option value="absent" ${status==='absent'?'selected':''}>缺勤</option>
              </select></td>`:''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}`;
  },

  setAttendance(date, studentId, status) {
    let rec = Store.data.attendance.find(a => a.date === date && a.studentId === studentId);
    if (rec) {
      rec.status = status;
    } else {
      Store.data.attendance.push({ date, studentId, status });
    }
    Store.save();
    this.renderDashboard();
    this.renderMonthlyAttendance();
    toast('考勤已更新');
  },

  fillAttendance(date) {
    Store.data.students.forEach(s => {
      let rec = Store.data.attendance.find(a => a.date === date && a.studentId === s.id);
      if (rec) {
        rec.status = 'present';
      } else {
        Store.data.attendance.push({ date, studentId: s.id, status: 'present' });
      }
    });
    Store.save();
    this.renderAttendanceTable();
    this.renderDashboard();
    this.renderMonthlyAttendance();
    toast('已设置全部出勤');
  },

  addAttendanceDate() {
    const date = prompt('输入考勤日期（YYYY-MM-DD）：', U.today());
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast('日期格式不正确'); return; }
    // 检查是否已存在
    const exists = Store.data.attendance.some(a => a.date === date);
    if (exists) { toast('该日期已有考勤记录'); return; }
    // 为所有学生添加出勤
    Store.data.students.forEach(s => {
      Store.data.attendance.push({ date, studentId: s.id, status: 'present' });
    });
    Store.save();
    document.getElementById('attendanceDate').value = date;
    this.renderAttendanceTable();
    this.renderDashboard();
    this.renderMonthlyAttendance();
    toast(`已添加 ${date} 考勤记录`);
  },

  renderLeaveList() {
    const d = Store.data;
    const el = document.getElementById('leaveListWrap');
    let leaves = d.leaveRequests;
    if (this.currentRole === 'parent') leaves = leaves.filter(l => l.studentId === Perm.childId());
    leaves = [...leaves].reverse();
    const canApply = this.currentRole === 'parent' || this.currentRole === 'headteacher';
    const statusTag = { approved:['已批准','tag-green'], pending:['待审批','tag-yellow'], rejected:['已驳回','tag-red'] };
    el.innerHTML = `
      ${canApply?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openLeaveForm()">+ 请假申请</button></div>`:''}
      ${leaves.map(l => {
        const [sLabel, sTag] = statusTag[l.status] || ['待审批','tag-yellow'];
        const canApprove = this.currentRole === 'headteacher' && l.status === 'pending';
        const canEdit = this.canEditType('leave');
        return `
          <div class="leave-card">
            <div class="leave-info">
              <div class="leave-student">${U.studentName(l.studentId)} <span class="tag ${l.type==='病假'?'tag-red':'tag-blue'}">${l.type}</span></div>
              <div class="leave-detail">${l.startDate} 至 ${l.endDate} · 申请人：${U.esc(l.parent)}</div>
              <div class="leave-detail">事由：${U.esc(l.reason)}</div>
            </div>
            <div class="leave-actions">
              <span class="tag ${sTag}">${sLabel}</span>
              ${canApprove ? `<button class="btn-success btn-xs" onclick="App.approveLeave('${l.id}',true)">批准</button><button class="btn-danger btn-xs" onclick="App.approveLeave('${l.id}',false)">驳回</button>` : ''}
              ${canEdit && !canApprove ? `<button class="btn-edit" onclick="App.openEditModal('leave','${l.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('leave','${l.id}')">删除</button>` : ''}
            </div>
          </div>`;
      }).join('')}`;
  },

  approveLeave(id, approve) {
    const l = Store.data.leaveRequests.find(x => x.id === id);
    if (l) {
      l.status = approve ? 'approved' : 'rejected';
      l.approver = Store.data.roles[this.currentRole].user;
      Store.save();
      this.renderLeaveList();
      this.renderDashboard();
      toast(approve ? '已批准请假' : '已驳回请假');
    }
  },

  renderMonthlyAttendance() {
    const d = Store.data;
    const el = document.getElementById('monthlyAttendanceWrap');
    const dates = [...new Set(d.attendance.map(a=>a.date))].reverse();
    const stats = dates.map(date => {
      const recs = d.attendance.filter(a => a.date === date);
      return { date, present: recs.filter(r=>r.status==='present').length, late: recs.filter(r=>r.status==='late').length, leave: recs.filter(r=>r.status==='leave').length, absent: recs.filter(r=>r.status==='absent').length };
    });
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>日期</th><th>出勤</th><th>迟到</th><th>请假</th><th>缺勤</th><th>出勤率</th></tr></thead>
        <tbody>
          ${stats.map(s => {
            const total = s.present+s.late+s.leave+s.absent;
            const rate = total > 0 ? (s.present/total*100).toFixed(0) : 0;
            return `<tr>
              <td>${U.fmtDateFull(s.date)}</td>
              <td><span class="tag tag-green">${s.present}</span></td>
              <td><span class="tag tag-yellow">${s.late}</span></td>
              <td><span class="tag tag-blue">${s.leave}</span></td>
              <td><span class="tag tag-red">${s.absent}</span></td>
              <td style="font-weight:600;color:${rate>=90?'var(--success)':rate>=80?'var(--accent)':'var(--danger)'}">${rate}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  // ==================== 作业教学 ====================
  renderHomeworkSection() {
    this.renderAssignmentList();
    this.renderSubmissionList();
    this.renderErrorTable();
  },

  renderAssignmentList() {
    const d = Store.data;
    const canEdit = this.canEditType('assignment');
    const el = document.getElementById('assignmentListWrap');
    el.innerHTML = d.assignments.map(a => `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <span class="tag tag-blue">${U.esc(a.subject)}</span>
            <span style="font-size:15px;font-weight:600;margin-left:8px">${U.esc(a.title)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:12px;color:var(--text-sub)">截止：${U.fmtDate(a.dueDate)}</span>
            ${canEdit?`<button class="btn-edit" onclick="App.openEditModal('assignment','${a.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('assignment','${a.id}')">删除</button>`:''}
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-sub);line-height:1.7;white-space:pre-wrap">${U.esc(a.content)}</div>
        <div style="font-size:12px;color:var(--text-light);margin-top:8px">发布：${U.fmtDate(a.published)} · ${U.esc(a.author)}</div>
      </div>`).join('');
    // 替换发布作业按钮
    const addBtn = document.getElementById('addAssignmentBtn');
    if (addBtn) {
      addBtn.textContent = '+ 发布作业';
      addBtn.onclick = () => this.openEditModal('assignment');
    }
  },

  renderSubmissionList() {
    const d = Store.data;
    const el = document.getElementById('submissionListWrap');
    let subs = d.submissions;
    if (this.currentRole === 'student') subs = subs.filter(s => s.studentId === Perm.studentId());
    subs = [...subs].reverse();
    const canEdit = this.currentRole === 'headteacher' || Perm.hasPerm('assignment');
    const statusTag = { graded:['已批改','tag-green'], submitted:['待批改','tag-yellow'] };
    el.innerHTML = `
      ${this.currentRole==='student'?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('submission')">+ 提交作业</button></div>`:''}
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('submission')">+ 添加提交记录</button></div>`:''}
      ${subs.map(s => {
        const a = d.assignments.find(x => x.id === s.assignmentId);
        const [sLabel, sTag] = statusTag[s.status] || ['待批改','tag-yellow'];
        return `
          <div class="card" style="padding:12px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-weight:600">${U.studentName(s.studentId)}</span>
                <span style="font-size:12px;color:var(--text-sub);margin-left:8px">${a?U.esc(a.subject):''} · ${a?U.esc(a.title):''}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                ${s.score!==null?`<span style="font-weight:700;color:${s.score>=80?'var(--success)':s.score>=60?'var(--accent)':'var(--danger)'}">${s.score}分</span>`:''}
                <span class="tag ${sTag}">${sLabel}</span>
                ${canEdit?`<button class="btn-edit" onclick="App.openEditModal('submission','${s.id}')">${s.status==='submitted'?'批改':'编辑'}</button><button class="btn-del" onclick="App.deleteRecord('submission','${s.id}')">删除</button>`:''}
              </div>
            </div>
            ${s.feedback ? `<div style="font-size:13px;color:var(--text-sub);margin-top:6px">📌 ${U.esc(s.feedback)}</div>` : ''}
          </div>`;
      }).join('')}`;
  },

  renderErrorTable() {
    const d = Store.data;
    const canEdit = this.currentRole === 'headteacher' || Perm.hasPerm('assignment');
    const el = document.getElementById('errorTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('error')">+ 添加错题</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>学生</th><th>学科</th><th>错题内容</th><th>错因分析</th><th>记录教师</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.errorCollection.map(e => `
            <tr>
              <td>${U.fmtDate(e.date)}</td>
              <td class="col-name">${U.studentName(e.studentId)}</td>
              <td><span class="tag tag-blue">${U.esc(e.subject)}</span></td>
              <td style="max-width:200px">${U.esc(e.question)}</td>
              <td style="max-width:250px;color:var(--text-sub)">${U.esc(e.analysis)}</td>
              <td>${U.esc(e.teacher)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('error','${e.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('error','${e.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  // ==================== 家校沟通 ====================
  renderCommSection() {
    this.renderCommTable();
    this.renderVisitTable();
    this.renderMeetingList();
  },

  renderCommTable() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('communication');
    const el = document.getElementById('commTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('communication')">+ 添加沟通记录</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>学生</th><th>沟通方式</th><th>沟通内容</th><th>结果</th><th>教师</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.communications.map(c => `
            <tr>
              <td>${U.fmtDate(c.date)}</td>
              <td class="col-name">${U.studentName(c.studentId)}</td>
              <td><span class="tag tag-teal">${U.esc(c.type)}</span></td>
              <td style="max-width:200px">${U.esc(c.content)}</td>
              <td style="max-width:200px;color:var(--text-sub)">${U.esc(c.result)}</td>
              <td>${U.esc(c.teacher)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('communication','${c.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('communication','${c.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderVisitTable() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('communication');
    const resultTag = { '良好':'tag-green', '需持续关注':'tag-yellow', '一般':'tag-blue' };
    const el = document.getElementById('visitTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('visit')">+ 添加家访记录</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>学生</th><th>家访目的</th><th>家访总结</th><th>结果</th><th>教师</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.homeVisits.map(h => `
            <tr>
              <td>${U.fmtDate(h.date)}</td>
              <td class="col-name">${U.studentName(h.studentId)}</td>
              <td>${U.esc(h.purpose)}</td>
              <td style="max-width:250px;color:var(--text-sub)">${U.esc(h.summary)}</td>
              <td><span class="tag ${resultTag[h.result]||'tag-gray'}">${U.esc(h.result)}</span></td>
              <td>${U.esc(h.teacher)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('visit','${h.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('visit','${h.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderMeetingList() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('meeting');
    const el = document.getElementById('meetingListWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('meeting')">+ 添加家长会</button></div>`:''}
      ${d.parentMeetings.map(m => {
        const signedIn = d.students.filter(s => m.signIns.includes(s.id));
        const notSignedIn = d.students.filter(s => !m.signIns.includes(s.id));
        return `
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <h3>📅 ${U.esc(m.title)}</h3>
              ${canEdit?`<div><button class="btn-edit" onclick="App.openEditModal('meeting','${m.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('meeting','${m.id}')">删除</button></div>`:''}
            </div>
            <div style="font-size:13px;color:var(--text-sub);line-height:1.8">
              <div>🕐 时间：${U.fmtDateFull(m.date)} ${U.esc(m.time||'')}</div>
              <div>📍 地点：${U.esc(m.location)}</div>
              <div style="white-space:pre-wrap;margin-top:8px">📋 议程：\n${U.esc(m.agenda)}</div>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
              <div style="font-size:13px;font-weight:600;margin-bottom:6px">签到情况：${signedIn.length}/${d.students.length}</div>
              <div style="font-size:12px;color:var(--success)">✓ 已签到：${signedIn.map(s=>s.name).join('、')}</div>
              ${notSignedIn.length > 0 ? `<div style="font-size:12px;color:var(--danger);margin-top:4px">✗ 未签到：${notSignedIn.slice(0,10).map(s=>s.name).join('、')}${notSignedIn.length>10?'...':''}</div>` : ''}
            </div>
          </div>`;
      }).join('')}`;
  },

  // ==================== 班级活动 ====================
  renderActivities() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('activity');
    const typeIcon = { '班会':'📋', '文体活动':'⚽', '研学活动':'🚌' };
    const statusTag = { '已完成':'tag-green', '进行中':'tag-yellow', '未开始':'tag-gray' };
    const el = document.getElementById('activityListWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('activity')">+ 添加活动</button></div>`:''}
      ${d.activities.map(a => `
        <div class="activity-card">
          <div class="activity-header">
            <span class="activity-icon">${typeIcon[a.type]||'🎪'}</span>
            <span class="activity-title">${U.esc(a.title)}</span>
            <span class="tag ${statusTag[a.status]||'tag-gray'}">${a.status}</span>
            ${canEdit?`<div><button class="btn-edit" onclick="App.openEditModal('activity','${a.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('activity','${a.id}')">删除</button></div>`:''}
          </div>
          <div class="activity-desc">${U.esc(a.description)}</div>
          <div class="activity-meta">
            <span>📅 ${U.fmtDateFull(a.date)}</span>
            <span>📍 ${U.esc(a.location)}</span>
            <span>👥 ${a.participants}人参与</span>
          </div>
        </div>`).join('')}`;
  },

  // ==================== 物资财务 ====================
  renderFinanceSection() {
    this.renderFinanceSummary();
    this.renderFinanceTable();
    this.renderMaterialTable();
  },

  renderFinanceSummary() {
    const d = Store.data;
    const income = d.finances.filter(f=>f.type==='income').reduce((s,f)=>s+f.amount,0);
    const expense = d.finances.filter(f=>f.type==='expense').reduce((s,f)=>s+f.amount,0);
    document.getElementById('financeSummary').innerHTML = `
      <div class="finance-stat"><div class="finance-stat-label">总收入</div><div class="finance-stat-value" style="color:var(--success)">¥${income}</div></div>
      <div class="finance-stat"><div class="finance-stat-label">总支出</div><div class="finance-stat-value" style="color:var(--danger)">¥${expense}</div></div>
      <div class="finance-stat"><div class="finance-stat-label">结余</div><div class="finance-stat-value" style="color:var(--secondary)">¥${income-expense}</div></div>`;
  },

  renderFinanceTable() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('finance');
    const el = document.getElementById('financeTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('finance')">+ 添加收支</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>日期</th><th>类型</th><th>金额</th><th>分类</th><th>说明</th><th>记录人</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.finances.map(f => `
            <tr>
              <td>${U.fmtDate(f.date)}</td>
              <td><span class="tag ${f.type==='income'?'tag-green':'tag-red'}">${f.type==='income'?'收入':'支出'}</span></td>
              <td style="font-weight:600;color:${f.type==='income'?'var(--success)':'var(--danger)'}">${f.type==='income'?'+':'-'}¥${f.amount}</td>
              <td>${U.esc(f.category)}</td>
              <td>${U.esc(f.description)}</td>
              <td>${U.esc(f.recorder)}</td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('finance','${f.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('finance','${f.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderMaterialTable() {
    const d = Store.data;
    const canEdit = Perm.hasPerm('material');
    const statusTag = { '在用':'tag-yellow', '已归还':'tag-green', '常驻':'tag-blue' };
    const el = document.getElementById('materialTableWrap');
    el.innerHTML = `
      ${canEdit?`<div class="action-bar"><button class="btn-primary btn-sm" onclick="App.openEditModal('material')">+ 添加物资</button></div>`:''}
      <table class="data-table">
        <thead><tr><th>物资</th><th>领用人</th><th>领用日期</th><th>归还日期</th><th>状态</th>${canEdit?'<th>操作</th>':''}</tr></thead>
        <tbody>
          ${d.materials.map(m => `
            <tr>
              <td>${U.esc(m.item)}</td>
              <td class="col-name">${U.esc(m.borrower)}</td>
              <td>${U.fmtDate(m.borrowDate)}</td>
              <td>${m.returnDate?U.fmtDate(m.returnDate):'—'}</td>
              <td><span class="tag ${statusTag[m.status]||'tag-gray'}">${m.status}</span></td>
              ${canEdit?`<td class="col-actions"><button class="btn-edit" onclick="App.openEditModal('material','${m.id}')">编辑</button><button class="btn-del" onclick="App.deleteRecord('material','${m.id}')">删除</button></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  // ==================== 使用说明 ====================
  renderGuide() {
    const el = document.getElementById('guideContent');
    el.innerHTML = `
      <div class="guide-section">
        <h2>一、工作台整体页面布局</h2>
        <p>本工作台采用<b>顶部栏 + 侧边导航 + 主内容区</b>三段式布局，电脑端侧边栏常驻左侧，手机端自动切换为底部导航栏+抽屉式菜单。</p>
        <h3>顶部栏</h3>
        <ul>
          <li>左侧：班级名称、学校、学期信息</li>
          <li>右侧：<b>⚙️设置按钮</b>（可修改班级名称、学校、学期、班主任姓名、各角色姓名等）、角色切换器、当前用户标识</li>
        </ul>
        <h3>导航区</h3>
        <ul>
          <li>9个功能入口：数据看板、通知公告、学情管理、考勤请假、作业教学、家校沟通、班级活动、物资财务、使用说明</li>
          <li>根据当前角色动态显示可访问入口</li>
        </ul>
      </div>

      <div class="guide-section">
        <h2>二、全部数据可编辑</h2>
        <p>工作台中所有数据均可编辑，包括：</p>
        <ul>
          <li><b>班级信息</b>：点击右上角 ⚙️ → 修改班级名称、学校、年级、编号、班主任姓名、学期</li>
          <li><b>角色设置</b>：在设置弹窗中修改班主任/任课教师/家长/学生的姓名和关联学生</li>
          <li><b>学生档案</b>：学情管理 → 学生档案 → 添加/编辑/删除学生（姓名、性别、出生日期、家长、电话、住址、备注）</li>
          <li><b>成绩</b>：学情管理 → 成绩台账 → 点击「成绩录入」批量编辑，或点击「改分」单独修改</li>
          <li><b>考试</b>：成绩台账页面可添加新考试（名称、日期、科目）</li>
          <li><b>奖惩记录</b>：添加/编辑/删除奖惩记录</li>
          <li><b>心理健康</b>：添加/编辑/删除心理健康跟踪记录</li>
          <li><b>考勤</b>：每日考勤页面可添加考勤日期、逐个下拉修改状态、一键全部出勤</li>
          <li><b>请假</b>：家长可提交请假申请，班主任可审批/编辑/删除</li>
          <li><b>通知公告</b>：发布/编辑/删除通知</li>
          <li><b>作业</b>：发布/编辑/删除作业</li>
          <li><b>作业提交</b>：添加/编辑/批改/删除提交记录（含分数和评语）</li>
          <li><b>错题台账</b>：添加/编辑/删除错题记录</li>
          <li><b>家校沟通</b>：添加/编辑/删除沟通记录</li>
          <li><b>家访登记</b>：添加/编辑/删除家访记录</li>
          <li><b>家长会</b>：添加/编辑/删除家长会</li>
          <li><b>班级活动</b>：添加/编辑/删除活动</li>
          <li><b>班费收支</b>：添加/编辑/删除收支记录</li>
          <li><b>物资领用</b>：添加/编辑/删除物资记录</li>
        </ul>
      </div>

      <div class="guide-section">
        <h2>三、角色权限详细设置方案</h2>
        <table class="guide-perm-table">
          <thead><tr><th>功能模块</th><th>班主任</th><th>任课教师</th><th>家长</th><th>学生</th></tr></thead>
          <tbody>
            <tr><td>数据看板</td><td class="check">查看</td><td class="check">查看</td><td class="check">查看</td><td class="cross">—</td></tr>
            <tr><td>通知公告</td><td class="check">增删改查</td><td class="cross">—</td><td class="check">查看+回执</td><td class="check">查看</td></tr>
            <tr><td>学生档案</td><td class="check">增删改查</td><td class="check">查看</td><td class="check">仅自家孩子</td><td class="cross">—</td></tr>
            <tr><td>成绩管理</td><td class="check">全部编辑</td><td class="check">本学科编辑</td><td class="check">仅自家孩子</td><td class="cross">—</td></tr>
            <tr><td>奖惩记录</td><td class="check">增删改查</td><td class="cross">—</td><td class="check">仅自家孩子</td><td class="cross">—</td></tr>
            <tr><td>心理健康</td><td class="check">增删改查</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>每日考勤</td><td class="check">登记/编辑</td><td class="check">查看</td><td class="check">仅自家孩子</td><td class="cross">—</td></tr>
            <tr><td>请假申请</td><td class="check">审批+编辑</td><td class="cross">—</td><td class="check">提交申请</td><td class="cross">—</td></tr>
            <tr><td>作业发布</td><td class="check">全部学科</td><td class="check">本学科</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>作业提交</td><td class="check">查看+批改</td><td class="check">本学科批改</td><td class="cross">—</td><td class="check">提交+查看</td></tr>
            <tr><td>错题台账</td><td class="check">增删改查</td><td class="check">查看</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>家校沟通</td><td class="check">增删改查</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>家访登记</td><td class="check">增删改查</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>家长会</td><td class="check">管理+签到</td><td class="cross">—</td><td class="check">查看</td><td class="cross">—</td></tr>
            <tr><td>班级活动</td><td class="check">增删改查</td><td class="cross">—</td><td class="cross">—</td><td class="check">报名</td></tr>
            <tr><td>物资财务</td><td class="check">增删改查</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
            <tr><td>⚙️ 班级设置</td><td class="check">全部设置</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
          </tbody>
        </table>
      </div>

      <div class="guide-section">
        <h2>四、快速上手使用说明</h2>
        <h3>第一步：修改班级信息</h3>
        <ol>
          <li>点击右上角 <b>⚙️</b> 按钮，打开班级设置</li>
          <li>修改班级名称、学校名称、学期、班主任姓名等</li>
          <li>在「角色设置」中修改各角色姓名和关联学生</li>
          <li>点击「保存设置」</li>
        </ol>
        <h3>第二步：管理学生档案</h3>
        <ol>
          <li>进入「学情管理」→「学生档案」</li>
          <li>点击「+ 添加学生」新增，或点击「编辑」修改已有学生</li>
          <li>可修改姓名、性别、出生日期、家长姓名、电话、住址、备注</li>
        </ol>
        <h3>第三步：录入成绩</h3>
        <ol>
          <li>进入「学情管理」→「成绩台账」</li>
          <li>选择考试和学科，点击「成绩录入」批量编辑</li>
          <li>或点击每行的「改分」单独修改某个学生成绩</li>
        </ol>
        <h3>第四步：日常考勤</h3>
        <ol>
          <li>进入「考勤请假」→「每日考勤」</li>
          <li>选择日期，用下拉框修改每个学生的考勤状态</li>
          <li>可点击「一键全部出勤」快速设置</li>
        </ol>
        <h3>数据说明</h3>
        <ul>
          <li>所有数据保存在浏览器本地，刷新不丢失</li>
          <li>在 ⚙️ 设置中可「重置全部数据」恢复初始示例</li>
          <li>切换角色后自动适配不同权限</li>
        </ul>
      </div>`;
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
