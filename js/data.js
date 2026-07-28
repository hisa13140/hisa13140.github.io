/**
 * 班级管理工作台 - 初始数据
 * 包含30名学生档案及各分区示例数据
 */

const CLASS_INFO = {
  className: "七年级3班",
  schoolName: "阳光中学",
  grade: "七年级",
  classCode: "7-3",
  headTeacher: "王明华",
  studentCount: 30,
  semester: "2025-2026学年第二学期"
};

// 30名学生档案
const STUDENTS = [
  { id: "S01", name: "陈思雨", gender: "女", birth: "2012-03-15", parent: "陈建国", phone: "138****6201", address: "阳光小区3栋201", notes: "语文课代表" },
  { id: "S02", name: "李子轩", gender: "男", birth: "2012-05-22", parent: "李伟", phone: "139****8832", address: "幸福路18号", notes: "数学课代表" },
  { id: "S03", name: "张语桐", gender: "女", birth: "2012-01-08", parent: "张志强", phone: "137****4567", address: "文化街56号", notes: "" },
  { id: "S04", name: "王浩然", gender: "男", birth: "2012-07-19", parent: "王海军", phone: "136****9821", address: "和平苑7栋302", notes: "体育委员" },
  { id: "S05", name: "刘梓涵", gender: "女", birth: "2012-04-03", parent: "刘敏", phone: "135****3344", address: "教育路29号", notes: "英语课代表" },
  { id: "S06", name: "赵宇航", gender: "男", birth: "2012-09-12", parent: "赵刚", phone: "138****7755", address: "科技园12栋", notes: "" },
  { id: "S07", name: "孙若曦", gender: "女", birth: "2012-02-25", parent: "孙丽华", phone: "139****1122", address: "花园小区5栋", notes: "文艺委员" },
  { id: "S08", name: "周子墨", gender: "男", birth: "2012-06-18", parent: "周强", phone: "137****6688", address: "书香苑2栋401", notes: "" },
  { id: "S09", name: "吴佳琪", gender: "女", birth: "2012-08-30", parent: "吴芳", phone: "136****5544", address: "文教路77号", notes: "" },
  { id: "S10", name: "郑明轩", gender: "男", birth: "2012-03-07", parent: "郑涛", phone: "135****2233", address: "康乐街15号", notes: "班长" },
  { id: "S11", name: "马欣怡", gender: "女", birth: "2012-05-14", parent: "马琳", phone: "138****9900", address: "阳光小区8栋", notes: "宣传委员" },
  { id: "S12", name: "黄子睿", gender: "男", birth: "2012-01-20", parent: "黄磊", phone: "139****4477", address: "幸福路33号", notes: "" },
  { id: "S13", name: "林诗韵", gender: "女", birth: "2012-07-25", parent: "林峰", phone: "137****8866", address: "文化街12号", notes: "" },
  { id: "S14", name: "郭嘉睿", gender: "男", birth: "2012-04-11", parent: "郭鹏", phone: "136****3322", address: "和平苑3栋", notes: "" },
  { id: "S15", name: "何雨萱", gender: "女", birth: "2012-09-03", parent: "何静", phone: "135****7711", address: "教育路45号", notes: "" },
  { id: "S16", name: "高俊熙", gender: "男", birth: "2012-02-28", parent: "高远", phone: "138****5599", address: "科技园6栋", notes: "" },
  { id: "S17", name: "罗梓萱", gender: "女", birth: "2012-06-15", parent: "罗丽", phone: "139****6677", address: "花园小区2栋", notes: "学习委员" },
  { id: "S18", name: "梁宇轩", gender: "男", birth: "2012-08-22", parent: "梁杰", phone: "137****4488", address: "书香苑5栋", notes: "" },
  { id: "S19", name: "宋雅琪", gender: "女", birth: "2012-03-30", parent: "宋明", phone: "136****2255", address: "文教路88号", notes: "" },
  { id: "S20", name: "谢子辰", gender: "男", birth: "2012-05-08", parent: "谢军", phone: "135****9933", address: "康乐街20号", notes: "劳动委员" },
  { id: "S21", name: "唐悦然", gender: "女", birth: "2012-01-17", parent: "唐伟", phone: "138****7788", address: "阳光小区1栋", notes: "" },
  { id: "S22", name: "许铭泽", gender: "男", birth: "2012-07-03", parent: "许波", phone: "139****1100", address: "幸福路50号", notes: "" },
  { id: "S23", name: "邓思琪", gender: "女", birth: "2012-04-25", parent: "邓超", phone: "137****6633", address: "文化街8号", notes: "" },
  { id: "S24", name: "冯俊豪", gender: "男", birth: "2012-09-09", parent: "冯雷", phone: "136****5511", address: "和平苑9栋", notes: "" },
  { id: "S25", name: "陈紫宁", gender: "女", birth: "2012-02-12", parent: "陈静", phone: "135****3377", address: "教育路66号", notes: "" },
  { id: "S26", name: "彭浩宇", gender: "男", birth: "2012-06-20", parent: "彭飞", phone: "138****9922", address: "科技园4栋", notes: "" },
  { id: "S27", name: "蒋梦瑶", gender: "女", birth: "2012-08-05", parent: "蒋华", phone: "139****4466", address: "花园小区6栋", notes: "生活委员" },
  { id: "S28", name: "韩俊杰", gender: "男", birth: "2012-03-23", parent: "韩冰", phone: "137****8822", address: "书香苑1栋", notes: "" },
  { id: "S29", name: "沈沐瑶", gender: "女", birth: "2012-05-27", parent: "沈月", phone: "136****7744", address: "文教路35号", notes: "" },
  { id: "S30", name: "杨子骞", gender: "男", birth: "2012-01-14", parent: "杨帆", phone: "135****2299", address: "康乐街8号", notes: "副班长" }
];

// 通知公告
const NOTICES = [
  { id: "N01", type: "permanent", title: "七年级3班班规及日常行为规范", content: "1. 按时到校，不迟到不早退\n2. 校服穿戴整齐，佩戴红领巾\n3. 课堂纪律：不交头接耳，积极举手发言\n4. 作业按时完成，书写工整\n5. 尊敬师长，团结同学\n6. 保持教室卫生，值日生认真履职", date: "2026-02-15", author: "王明华", readBy: ["S01","S02","S03","S05","S07","S10","S11","S13","S17","S19","S21","S23","S25","S27","S29"] },
  { id: "N02", type: "temporary", title: "本周五下午班会课调整通知", content: "因学校统一安排，本周五（7月25日）下午第三节课班会课调整至第二节课进行，请同学们提前准备班会主题材料——《我的暑假计划》。", date: "2026-07-21", author: "王明华", readBy: ["S01","S02","S05","S10","S17"] },
  { id: "N03", type: "meeting", title: "期末家长会通知", content: "尊敬的各位家长：\n定于2026年7月30日（周三）下午14:30在学校报告厅召开期末家长会，主要内容为期末成绩分析、暑期学习安排及安全教育。\n请各位家长准时参加，收到本通知请在系统中确认回执。", date: "2026-07-22", author: "王明华", readBy: ["S01","S03","S05","S07","S10","S11","S13","S15","S17","S19","S21","S23","S25","S27","S29"] }
];

// 历次成绩
const EXAMS = [
  { id: "E01", name: "期中考试", date: "2026-04-20", subjects: ["语文","数学","英语","道法","历史","地理","生物"] },
  { id: "E02", name: "月考二", date: "2026-05-25", subjects: ["语文","数学","英语","道法","历史","地理","生物"] },
  { id: "E03", name: "期末模拟", date: "2026-07-10", subjects: ["语文","数学","英语","道法","历史","地理","生物"] }
];

// 生成成绩数据
function genGrades() {
  const grades = [];
  EXAMS.forEach(exam => {
    STUDENTS.forEach(s => {
      const subjects = exam.subjects;
      subjects.forEach(sub => {
        // 基于学生ID生成稳定分数
        const base = 60 + (parseInt(s.id.slice(1)) * 37 + sub.charCodeAt(0)) % 40;
        const score = Math.min(100, base + Math.floor(Math.random() * 5));
        grades.push({ id: `${exam.id}-${s.id}-${sub}`, examId: exam.id, studentId: s.id, subject: sub, score: score, date: exam.date });
      });
    });
  });
  return grades;
}

// 奖惩记录
const REWARDS = [
  { id: "R01", studentId: "S10", type: "reward", level: "校级", description: "校级优秀学生干部", date: "2026-05-01" },
  { id: "R02", studentId: "S01", type: "reward", level: "班级", description: "月度学习之星", date: "2026-05-28" },
  { id: "R03", studentId: "S17", type: "reward", level: "班级", description: "月度学习之星", date: "2026-05-28" },
  { id: "R04", studentId: "S04", type: "reward", level: "校级", description: "校运会800米第一名", date: "2026-04-15" },
  { id: "R05", studentId: "S12", type: "punishment", level: "班级", description: "课堂纪律提醒（第三次）", date: "2026-06-10" },
  { id: "R06", studentId: "S22", type: "punishment", level: "班级", description: "未完成作业（第二次）", date: "2026-06-18" }
];

// 心理健康跟踪
const MENTAL_HEALTH = [
  { id: "M01", studentId: "S12", date: "2026-06-05", mood: "一般", note: "近期作业完成度下降，课堂注意力不集中", followUp: "已与家长沟通，建议关注孩子作息", teacher: "王明华" },
  { id: "M02", studentId: "S22", date: "2026-06-15", mood: "需关注", note: "连续两周未交作业，情绪低落", followUp: "安排心理委员关注，预约校心理老师", teacher: "王明华" },
  { id: "M03", studentId: "S06", date: "2026-07-01", mood: "良好", note: "期中后成绩进步明显，自信心增强", followUp: "继续鼓励，保持", teacher: "王明华" }
];

// 考勤数据（近5个上学日）
function genAttendance() {
  const records = [];
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 10 && dates.length < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }
  dates.reverse();
  dates.forEach(date => {
    STUDENTS.forEach(s => {
      // 90%出勤, 5%请假, 3%迟到, 2%缺勤
      const r = (parseInt(s.id.slice(1)) + date.charCodeAt(8)) % 100;
      let status = "present";
      if (r >= 90 && r < 95) status = "leave";
      else if (r >= 95 && r < 98) status = "late";
      else if (r >= 98) status = "absent";
      records.push({ date, studentId: s.id, status });
    });
  });
  return records;
}

// 请假记录
const LEAVE_REQUESTS = [
  { id: "L01", studentId: "S03", startDate: "2026-07-22", endDate: "2026-07-22", type: "病假", reason: "感冒发烧38.5度，需就医休息", status: "approved", approver: "王明华", applyDate: "2026-07-22", parent: "张志强" },
  { id: "L02", studentId: "S15", startDate: "2026-07-23", endDate: "2026-07-24", type: "事假", reason: "家中老人住院，需陪护", status: "approved", approver: "王明华", applyDate: "2026-07-22", parent: "何静" },
  { id: "L03", studentId: "S08", startDate: "2026-07-25", endDate: "2026-07-25", type: "病假", reason: "肠胃不适，需休息一天", status: "pending", approver: "", applyDate: "2026-07-24", parent: "周强" }
];

// 作业
const ASSIGNMENTS = [
  { id: "A01", subject: "语文", title: "第七单元课后练习+作文《我的暑假计划》", content: "1. 完成课后练习三、四、五大题\n2. 作文600字以上，注意段落结构\n3. 预习第八单元课文", dueDate: "2026-07-28", published: "2026-07-25", author: "王明华" },
  { id: "A02", subject: "数学", title: "第七章复习题+拓展练习", content: "课本P156-158全部习题\n练习册第七章综合训练\n选做：挑战题1-3", dueDate: "2026-07-27", published: "2026-07-25", author: "李老师" },
  { id: "A03", subject: "英语", title: "Unit 8 词汇+阅读理解", content: "1. 抄写并背诵Unit 8新词\n2. 完成阅读理解Passage A、B\n3. 录制课文朗读音频", dueDate: "2026-07-28", published: "2026-07-25", author: "刘老师" },
  { id: "A04", subject: "道法", title: "期末复习提纲第三部分", content: "完成复习提纲P12-15\n整理第三单元思维导图", dueDate: "2026-07-29", published: "2026-07-25", author: "张老师" }
];

// 作业提交记录
function genSubmissions() {
  const subs = [];
  ASSIGNMENTS.forEach(a => {
    STUDENTS.forEach(s => {
      const r = (parseInt(s.id.slice(1)) + a.id.charCodeAt(2)) % 10;
      if (r < 8) {
        const score = 70 + (parseInt(s.id.slice(1)) * 13 + a.id.charCodeAt(2)) % 30;
        subs.push({
          id: `${a.id}-${s.id}`,
          assignmentId: a.id,
          studentId: s.id,
          submittedDate: a.dueDate,
          status: r < 7 ? "graded" : "submitted",
          score: r < 7 ? score : null,
          feedback: r < 7 ? (score >= 85 ? "完成优秀，思路清晰" : score >= 70 ? "基本完成，注意细节" : "需加强基础练习") : ""
        });
      }
    });
  });
  return subs;
}

// 错题收集
const ERROR_COLLECTION = [
  { id: "EC01", studentId: "S12", subject: "数学", question: "一元一次方程应用题：行程问题", analysis: "对路程=速度×时间公式理解不透彻，列方程时方向判断错误", date: "2026-07-20", teacher: "李老师" },
  { id: "EC02", studentId: "S22", subject: "英语", question: "现在完成时与一般过去时辨析", analysis: "混淆两种时态的使用场景，需强化语境练习", date: "2026-07-18", teacher: "刘老师" },
  { id: "EC03", studentId: "S08", subject: "数学", question: "几何证明题：三角形全等判定", analysis: "证明步骤不规范，缺少必要条件说明", date: "2026-07-19", teacher: "李老师" }
];

// 家校沟通
const COMMUNICATIONS = [
  { id: "C01", studentId: "S12", date: "2026-06-10", type: "电话沟通", content: "与家长沟通课堂纪律问题，家长表示会加强督促", result: "家长配合度较高，持续观察", teacher: "王明华" },
  { id: "C02", studentId: "S22", date: "2026-06-18", type: "面谈", content: "家长到校面谈，了解孩子近期情绪问题及家庭情况", result: "已预约校心理老师，家长同意配合", teacher: "王明华" },
  { id: "C03", studentId: "S06", date: "2026-07-01", type: "微信沟通", content: "向家长反馈期中后成绩进步，家长表示欣慰", result: "继续家校配合鼓励", teacher: "王明华" }
];

// 家访登记
const HOME_VISITS = [
  { id: "H01", studentId: "S12", date: "2026-06-12", purpose: "了解家庭环境及学生心理状况", summary: "家庭氛围正常，父母工作较忙，孩子课余缺乏督促。建议家长每日关注作业完成情况。", teacher: "王明华", result: "良好" },
  { id: "H02", studentId: "S22", date: "2026-06-20", purpose: "跟进学生情绪问题", summary: "发现家庭近期有变故，学生情绪受影响。已与家长深入沟通，建议寻求心理辅导。", teacher: "王明华", result: "需持续关注" }
];

// 家长会
const PARENT_MEETINGS = [
  { id: "PM01", title: "期末家长会", date: "2026-07-30", time: "14:30", location: "学校报告厅", agenda: "1. 期末成绩分析\n2. 暑期学习安排\n3. 安全教育\n4. 个别交流", signIns: ["S01","S03","S05","S07","S10","S11","S13","S15","S17","S19","S21","S23","S25","S27","S29"] }
];

// 班级活动
const ACTIVITIES = [
  { id: "AC01", type: "班会", title: "主题班会：《我的暑假计划》", date: "2026-07-25", location: "本班教室", description: "每位同学分享暑假学习计划和生活安排，评选最佳计划", participants: 30, status: "进行中" },
  { id: "AC02", type: "文体活动", title: "班级篮球友谊赛", date: "2026-07-18", location: "学校篮球场", description: "男生5v5篮球赛，女生啦啦队加油", participants: 28, status: "已完成" },
  { id: "AC03", type: "研学活动", title: "市科技馆研学之旅", date: "2026-07-15", location: "市科技馆", description: "参观科技馆各展区，完成研学任务单，撰写研学心得", participants: 30, status: "已完成" }
];

// 班费收支
const FINANCES = [
  { id: "F01", type: "income", amount: 1500, category: "班费收缴", description: "本学期班费收缴（30人×50元）", date: "2026-02-20", recorder: "王明华" },
  { id: "F02", type: "expense", amount: 280, category: "学习用品", description: "购买班级打印纸、粉笔、马克笔等", date: "2026-03-05", recorder: "王明华" },
  { id: "F03", type: "expense", amount: 350, category: "活动经费", description: "篮球友谊赛奖品及饮用水", date: "2026-07-18", recorder: "王明华" },
  { id: "F04", type: "expense", amount: 500, category: "研学活动", description: "科技馆研学交通费及午餐", date: "2026-07-15", recorder: "王明华" },
  { id: "F05", type: "expense", amount: 120, category: "卫生用品", description: "购买班级清洁工具及消毒用品", date: "2026-04-10", recorder: "王明华" }
];

// 物资领用
const MATERIALS = [
  { id: "MT01", item: "粉笔（白）×5盒", borrower: "S20 谢子辰", borrowDate: "2026-07-22", returnDate: "", status: "在用" },
  { id: "MT02", item: "马克笔×12支", borrower: "S11 马欣怡", borrowDate: "2026-07-20", returnDate: "", status: "在用" },
  { id: "MT03", item: "扫把×2把", borrower: "S20 谢子辰", borrowDate: "2026-07-01", returnDate: "2026-07-15", status: "已归还" },
  { id: "MT04", item: "班级药箱", borrower: "S27 蒋梦瑶", borrowDate: "2026-02-25", returnDate: "", status: "常驻" }
];

// 当前用户角色
const ROLES = {
  headteacher: { id: "headteacher", name: "班主任", user: "王明华", icon: "👨‍🏫", color: "#2563EB" },
  subjectteacher: { id: "subjectteacher", name: "任课教师", user: "李老师", icon: "👩‍🏫", color: "#0D9488", subject: "数学" },
  parent: { id: "parent", name: "家长", user: "陈建国", icon: "👨", color: "#7C3AED", childId: "S01" },
  student: { id: "student", name: "学生", user: "陈思雨", icon: "🧑‍🎓", color: "#EA580C", studentId: "S01" }
};

// 导航菜单
const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "数据看板" },
  { id: "notice", icon: "📢", label: "通知公告" },
  { id: "student", icon: "🎓", label: "学情管理" },
  { id: "attendance", icon: "✅", label: "考勤请假" },
  { id: "homework", icon: "📚", label: "作业教学" },
  { id: "communicate", icon: "💬", label: "家校沟通" },
  { id: "activity", icon: "🎪", label: "班级活动" },
  { id: "finance", icon: "💰", label: "物资财务" },
  { id: "guide", icon: "📖", label: "使用说明" }
];

// 初始数据包
const INITIAL_DATA = {
  classInfo: CLASS_INFO,
  students: STUDENTS,
  notices: NOTICES,
  exams: EXAMS,
  grades: genGrades(),
  rewards: REWARDS,
  mentalHealth: MENTAL_HEALTH,
  attendance: genAttendance(),
  leaveRequests: LEAVE_REQUESTS,
  assignments: ASSIGNMENTS,
  submissions: genSubmissions(),
  errorCollection: ERROR_COLLECTION,
  communications: COMMUNICATIONS,
  homeVisits: HOME_VISITS,
  parentMeetings: PARENT_MEETINGS,
  activities: ACTIVITIES,
  finances: FINANCES,
  materials: MATERIALS,
  roles: JSON.parse(JSON.stringify(ROLES))
};
