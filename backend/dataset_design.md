
## 1 总体实体-关系示意（中文）

```
[Students] 1 ──< N [Student Availabilities]

[Teachers] 1 ──< N [Teacher Availabilities]

[Teachers] 1 ──< N [Teacher Courses] N >── 1 [Courses]

[Students] 1 ──< N [Enrollments] N >── 1 [Teacher Courses]

[Enrollments] 1 ──< N [Lessons] 1 >──?── 1 [Payments]
```

*箭头方向：`A 1 ──< N B` 表示 A 拥有多个 B；`──?──` 代表可为 NULL（可选）。*

---

## 2 各表职能与字段要点

| 表名                          | 角色定位             | 核心字段                                                    | 主要关系                                                                              |
| --------------------------- | ---------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **students**                | 学员主档             | `id`, `full_name`, `availability_mode`                  | ① 对应多条 **student\_availabilities**<br>② 对应多条 **enrollments**                      |
| **student\_availabilities** | 学员周期可用时间段        | `day_of_week`, `start_time`, `end_time`, `is_available` | 多条归属一名 **student**                                                                |
| **teachers**                | 教师主档             | `id`, `full_name`, `hourly_rate`, `availability_mode`   | ① 对应多条 **teacher\_availabilities**<br>② 经 **teacher\_courses** 间接关联多门 **courses** |
| **teacher\_availabilities** | 教师周期可用时间段        | 同上                                                      | 多条归属一名 **teacher**                                                                |
| **courses**                 | 课程定义（科目/级别）      | `id`, `name`, `description`                             | 经 **teacher\_courses** 与多名 **teachers** 关联                                        |
| **teacher\_courses**        | **教师⇄课程** 多对多桥表  | `teacher_id`, `course_id` (唯一)                          | ① 一名教师可教授多门课<br>② 一门课可由多名教师开班<br>③ 与 **enrollments** 形成“一门课在某教师名下的报班”             |
| **enrollments**             | **学生⇄教师课程** 选课记录 | `student_id`, `teacher_course_id`, `hourly_rate`        | ① 一名学生对同一 `teacher_course` 只能有一条选课<br>② 一条 **enrollment** 下可排多节 **lessons**       |
| **lessons**                 | 具体排课/上课记录        | `start_dt`, `end_dt`, `status`                          | ① 归属于一条 **enrollment**<br>② 通过表达式索引可快速检查学生/教师时段冲突                                 |
| **payments** *(可选)*         | 课时收费             | `lesson_id`, `amount`, `method`, `paid_at`              | 1 对 1 关联单节 **lesson**（可为空）                                                        |

---

## 3 核心业务关系说明

1. **可用时间**

   * 学生与教师各自维护一张 *availability* 子表。
   * 以 `day_of_week + start_time/end_time` 原子化存储，便于 SQL 级别做“交集”查询，实现智能排课。

2. **师生选课流程**

   1. **课程** 先由学校教务或管理员创建。
   2. **教师** 通过 **teacher\_courses** 声明自己能教哪些课程。
   3. **学生** 选定某教师-课程组合，生成一条 **enrollment**，并记录课时费 `hourly_rate`。
   4. 后续所有排课 (**lessons**) 均基于该 enrollment 创建，可追溯到具体教师与课程。

3. **排课与冲突检测**

   * 每当创建/调整 **lesson** 时：

     * 用 `start_dt / end_dt` 与 **student\_availabilities**、**teacher\_availabilities** 做“是否在可用时间”校验；
     * 用 **lessons** 对应的表达式索引，快速检测同一教师或学生在相同时间是否已有课。
   * `status` 字段允许标记 `COMPLETED / CANCELLED`，为统计报表或补课留口。

4. **支付**

   * 若系统需要收费管理，可为已完成的 **lesson** 生成一条 **payment**；
   * 也可扩展为计费周期汇总表（如 `invoices`），当前设计保留最小 1-1 结构。

---

### 设计亮点小结

* **多对多桥表** + **唯一约束**，保证师生选课关系清晰、无重复。
* **时间段拆分** 与 **索引约束**，让冲突检测落在数据库层，减少代码复杂度。
* **枚举状态**＋**CHECK**，在表层防止非法数据进入。

按此结构即可直接在 MySQL 8 上落库，并为后续智能排课、报表统计、扩展 RRULE 或单次请假留出充分空间。
