/*
 Navicat Premium Dump SQL

 Source Server         : localhost_3306_1
 Source Server Type    : MySQL
 Source Server Version : 90200 (9.2.0)
 Source Host           : localhost:3306
 Source Schema         : springboot_learn

 Target Server Type    : MySQL
 Target Server Version : 90200 (9.2.0)
 File Encoding         : 65001

 Date: 22/05/2025 02:31:22
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for course_materials
-- ----------------------------
DROP TABLE IF EXISTS `course_materials`;
CREATE TABLE `course_materials` (
  `course_id` bigint NOT NULL,
  `material` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  KEY `FKjobqk7m872wjsw0y29tle6wek` (`course_id`),
  CONSTRAINT `FKjobqk7m872wjsw0y29tle6wek` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of course_materials
-- ----------------------------
BEGIN;
INSERT INTO `course_materials` (`course_id`, `material`) VALUES (2, '高考英语真题汇编');
INSERT INTO `course_materials` (`course_id`, `material`) VALUES (3, '指定词汇手册');
INSERT INTO `course_materials` (`course_id`, `material`) VALUES (1, '高中数学必修一教材');
INSERT INTO `course_materials` (`course_id`, `material`) VALUES (1, '配套练习册');
COMMIT;

-- ----------------------------
-- Table structure for course_prerequisites
-- ----------------------------
DROP TABLE IF EXISTS `course_prerequisites`;
CREATE TABLE `course_prerequisites` (
  `course_id` bigint NOT NULL,
  `prerequisite` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  KEY `FKhh4f1avebuvlv54m3j3l3pp36` (`course_id`),
  CONSTRAINT `FKhh4f1avebuvlv54m3j3l3pp36` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of course_prerequisites
-- ----------------------------
BEGIN;
INSERT INTO `course_prerequisites` (`course_id`, `prerequisite`) VALUES (2, '完成高二英语课程');
INSERT INTO `course_prerequisites` (`course_id`, `prerequisite`) VALUES (3, '对物理实验有兴趣');
COMMIT;

-- ----------------------------
-- Table structure for course_recommended_teachers
-- ----------------------------
DROP TABLE IF EXISTS `course_recommended_teachers`;
CREATE TABLE `course_recommended_teachers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `course_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_course_teacher` (`course_id`,`teacher_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `course_recommended_teachers_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `course_recommended_teachers_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of course_recommended_teachers
-- ----------------------------
BEGIN;
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (17, 1, 3, '2025-05-21 22:58:55');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (22, 1, 5, '2025-05-22 00:49:25');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (23, 2, 5, '2025-05-22 00:49:25');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (24, 3, 5, '2025-05-22 00:49:25');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (25, 5, 5, '2025-05-22 00:49:25');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (26, 1, 1, '2025-05-22 00:59:31');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (27, 3, 1, '2025-05-22 00:59:31');
INSERT INTO `course_recommended_teachers` (`id`, `course_id`, `teacher_id`, `created_at`) VALUES (28, 5, 1, '2025-05-22 00:59:31');
COMMIT;

-- ----------------------------
-- Table structure for courses
-- ----------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `difficulty` int DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `level` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK5o6x4fpafbywj4v2g0owhh11r` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of courses
-- ----------------------------
BEGIN;
INSERT INTO `courses` (`id`, `category`, `description`, `difficulty`, `duration`, `level`, `name`, `price`, `status`) VALUES (1, '数学', '针对高一数学教材进行同步辅导和拔高', 4, 90, '高一', '高中数学同步辅导', 250.00, 'active');
INSERT INTO `courses` (`id`, `category`, `description`, `difficulty`, `duration`, `level`, `name`, `price`, `status`) VALUES (2, '英语', '针对高考英语的阅读、写作、听力进行强化训练', 4, 120, '高三', '高考英语冲刺', 300.00, 'active');
INSERT INTO `courses` (`id`, `category`, `description`, `difficulty`, `duration`, `level`, `name`, `price`, `status`) VALUES (3, '物理', '通过实验深入理解初中物理概念', 2, 60, '初中', '初中物理实验班', 150.00, 'active');
INSERT INTO `courses` (`id`, `category`, `description`, `difficulty`, `duration`, `level`, `name`, `price`, `status`) VALUES (5, '数学', '1', 3, 15, '小学', '122', 1.00, 'active');
COMMIT;

-- ----------------------------
-- Table structure for enrollments
-- ----------------------------
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enrollment_date` datetime(6) NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `student_id` bigint NOT NULL,
  `teacher_course_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf7cj3dv76hfdom8344jk4h4tq` (`student_id`,`teacher_course_id`),
  KEY `FKrewf20tucbt5d4jdlfsb9nswb` (`teacher_course_id`),
  CONSTRAINT `FK8kf1u1857xgo56xbfmnif2c51` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `FKrewf20tucbt5d4jdlfsb9nswb` FOREIGN KEY (`teacher_course_id`) REFERENCES `teacher_courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of enrollments
-- ----------------------------
BEGIN;
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (1, '2025-05-06 19:57:31.000000', 200.00, 1, 1);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (2, '2025-05-06 19:57:31.000000', 180.00, 2, 2);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (3, '2025-05-06 19:57:31.000000', 220.00, 3, 3);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (4, '2025-05-06 19:57:31.000000', 200.00, 1, 4);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (7, '2025-05-20 00:06:14.867097', 12.00, 17, 1);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (10, '2025-05-22 00:56:42.489249', 220.00, 3, 5);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (11, '2025-05-22 00:57:45.066806', 200.00, 17, 4);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (12, '2025-05-22 01:07:08.506134', 220.00, 17, 3);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (13, '2025-05-22 01:13:23.998828', 12.00, 17, 8);
INSERT INTO `enrollments` (`id`, `enrollment_date`, `hourly_rate`, `student_id`, `teacher_course_id`) VALUES (14, '2025-05-22 01:43:59.546843', 12.00, 1, 9);
COMMIT;

-- ----------------------------
-- Table structure for feedbacks
-- ----------------------------
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) DEFAULT NULL,
  `rating` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `lesson_id` bigint DEFAULT NULL,
  `student_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK36km57clggd0aosobkdk0o67a` (`lesson_id`),
  KEY `FK4ocysx6ldsioryb4bx1etqw32` (`student_id`),
  CONSTRAINT `FK36km57clggd0aosobkdk0o67a` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`),
  CONSTRAINT `FK4ocysx6ldsioryb4bx1etqw32` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of feedbacks
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for flyway_schema_history
-- ----------------------------
DROP TABLE IF EXISTS `flyway_schema_history`;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `script` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of flyway_schema_history
-- ----------------------------
BEGIN;
INSERT INTO `flyway_schema_history` (`installed_rank`, `version`, `description`, `type`, `script`, `checksum`, `installed_by`, `installed_on`, `execution_time`, `success`) VALUES (1, '1', '<< Flyway Baseline >>', 'BASELINE', '<< Flyway Baseline >>', NULL, 'root', '2025-05-21 22:20:23', 0, 1);
INSERT INTO `flyway_schema_history` (`installed_rank`, `version`, `description`, `type`, `script`, `checksum`, `installed_by`, `installed_on`, `execution_time`, `success`) VALUES (2, '1.5', 'Create course recommended teachers table', 'SQL', 'V1_5__Create_course_recommended_teachers_table.sql', 1271789677, 'root', '2025-05-21 22:20:23', 21, 1);
COMMIT;

-- ----------------------------
-- Table structure for lessons
-- ----------------------------
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `end_date_time` datetime(6) NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `start_date_time` datetime(6) NOT NULL,
  `status` enum('CANCELLED_BY_STUDENT','CANCELLED_BY_TEACHER','COMPLETED','IN_PROGRESS','NO_SHOW','PENDING_PAYMENT','SCHEDULED') COLLATE utf8mb4_general_ci NOT NULL,
  `enrollment_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKloob046c1v1kvvs5nmg0roua9` (`enrollment_id`),
  CONSTRAINT `FKloob046c1v1kvvs5nmg0roua9` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of lessons
-- ----------------------------
BEGIN;
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (25, '2024-05-13 20:30:00.000000', '线上会议室A', '讲解了函数基础，张三掌握良好，但对定义域的理解需加强。下次课复习并讲解值域。', '2024-05-13 19:00:00.000000', 'COMPLETED', 1);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (26, '2024-05-20 20:30:00.000000', '线上会议室A', '复习了函数定义域和值域，完成练习题，张三进步明显，能独立解决大部分问题。建议课后多做综合题。', '2024-05-20 19:00:00.000000', 'COMPLETED', 1);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (27, '2024-05-27 20:30:00.000000', '线上会议室A', '计划讲解指数函数和对数函数。', '2024-05-27 19:00:00.000000', 'SCHEDULED', 1);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (28, '2024-05-14 21:00:00.000000', '自习室 B', '阅读理解专项训练，讲解了长难句分析技巧，李四参与度高，但做题速度有待提高。布置了限时阅读练习。', '2024-05-14 19:00:00.000000', 'COMPLETED', 2);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (29, '2024-05-21 21:00:00.000000', '自习室 B', '学生临时有事取消', '2024-05-21 19:00:00.000000', 'CANCELLED_BY_STUDENT', 2);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (30, '2024-05-28 21:00:00.000000', '自习室 B', NULL, '2024-05-28 19:00:00.000000', 'SCHEDULED', 2);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (31, '2024-05-17 20:00:00.000000', '物理实验室', '完成了浮力实验，王五动手能力强，但对阿基米德原理的公式理解不够深刻。下次课讲解相关计算题。', '2024-05-17 19:00:00.000000', 'COMPLETED', 3);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (46, '2025-05-26 09:30:00.000000', '教室B', '123', '2025-05-26 08:00:00.000000', 'COMPLETED', 13);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (47, '2025-05-29 15:30:00.000000', '教室B', '', '2025-05-29 14:00:00.000000', 'SCHEDULED', 11);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (48, '2025-05-27 20:30:00.000000', '线上', '', '2025-05-27 19:00:00.000000', 'SCHEDULED', 7);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (49, '2025-05-26 15:30:00.000000', '教室B', '', '2025-05-26 14:00:00.000000', 'SCHEDULED', 11);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (50, '2025-05-27 10:30:00.000000', '教室A', '', '2025-05-27 09:00:00.000000', 'SCHEDULED', 11);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (51, '2025-05-27 15:30:00.000000', '教室B', '', '2025-05-27 14:00:00.000000', 'SCHEDULED', 13);
INSERT INTO `lessons` (`id`, `end_date_time`, `location`, `notes`, `start_date_time`, `status`, `enrollment_id`) VALUES (52, '2025-05-30 20:30:00.000000', '线上', '', '2025-05-30 19:00:00.000000', 'SCHEDULED', 13);
COMMIT;

-- ----------------------------
-- Table structure for student_availabilities
-- ----------------------------
DROP TABLE IF EXISTS `student_availabilities`;
CREATE TABLE `student_availabilities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `day_of_week` enum('FRIDAY','MONDAY','SATURDAY','SUNDAY','THURSDAY','TUESDAY','WEDNESDAY') COLLATE utf8mb4_general_ci NOT NULL,
  `end_time` time(6) NOT NULL,
  `is_available` bit(1) NOT NULL,
  `start_time` time(6) NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKf36n6orgj7c4ej059abnhtmyc` (`student_id`),
  CONSTRAINT `FKf36n6orgj7c4ej059abnhtmyc` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of student_availabilities
-- ----------------------------
BEGIN;
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (95, 'MONDAY', '19:00:00.000000', b'1', '09:00:00.000000', 3);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (135, 'MONDAY', '11:00:00.000000', b'1', '09:00:00.000000', 2);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (136, 'TUESDAY', '12:30:00.000000', b'1', '11:30:00.000000', 2);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (137, 'WEDNESDAY', '09:30:00.000000', b'1', '09:00:00.000000', 2);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (138, 'WEDNESDAY', '13:00:00.000000', b'1', '10:00:00.000000', 2);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (139, 'THURSDAY', '13:00:00.000000', b'1', '10:00:00.000000', 2);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (140, 'MONDAY', '15:30:00.000000', b'1', '14:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (141, 'SATURDAY', '12:00:00.000000', b'1', '09:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (142, 'SUNDAY', '12:00:00.000000', b'1', '09:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (143, 'THURSDAY', '15:30:00.000000', b'1', '14:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (144, 'TUESDAY', '10:30:00.000000', b'1', '09:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (145, 'TUESDAY', '15:30:00.000000', b'1', '14:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (146, 'TUESDAY', '20:30:00.000000', b'1', '19:00:00.000000', 17);
INSERT INTO `student_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `student_id`) VALUES (147, 'FRIDAY', '20:30:00.000000', b'1', '19:00:00.000000', 17);
COMMIT;

-- ----------------------------
-- Table structure for students
-- ----------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age` int DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `grade` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `parent` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parent_phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of students
-- ----------------------------
BEGIN;
INSERT INTO `students` (`id`, `age`, `enrollment_date`, `gender`, `grade`, `name`, `parent`, `parent_phone`, `phone`, `status`) VALUES (1, 16, '2025-05-06', '男', '高一', '张三', '张大明', '13700137001', '13800138001', 'active');
INSERT INTO `students` (`id`, `age`, `enrollment_date`, `gender`, `grade`, `name`, `parent`, `parent_phone`, `phone`, `status`) VALUES (2, 17, '2025-05-06', '女', '高二', '李四', '李建国', '13700137002', '13800138002', 'active');
INSERT INTO `students` (`id`, `age`, `enrollment_date`, `gender`, `grade`, `name`, `parent`, `parent_phone`, `phone`, `status`) VALUES (3, 15, '2025-05-06', '男', '初三', '王五', '王强', '13700137003', '13800138003', 'active');
INSERT INTO `students` (`id`, `age`, `enrollment_date`, `gender`, `grade`, `name`, `parent`, `parent_phone`, `phone`, `status`) VALUES (17, NULL, '2025-05-19', NULL, 'primary_1', '测试学生', '测试家长', '13900139000', '13800138000', 'active');
COMMIT;

-- ----------------------------
-- Table structure for teacher_availabilities
-- ----------------------------
DROP TABLE IF EXISTS `teacher_availabilities`;
CREATE TABLE `teacher_availabilities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `day_of_week` enum('FRIDAY','MONDAY','SATURDAY','SUNDAY','THURSDAY','TUESDAY','WEDNESDAY') COLLATE utf8mb4_general_ci NOT NULL,
  `end_time` time(6) NOT NULL,
  `is_available` bit(1) NOT NULL,
  `start_time` time(6) NOT NULL,
  `teacher_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfnfhxrcukt6estvsb5mi0lchw` (`teacher_id`),
  CONSTRAINT `FKfnfhxrcukt6estvsb5mi0lchw` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of teacher_availabilities
-- ----------------------------
BEGIN;
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (4, 'TUESDAY', '21:00:00.000000', b'1', '18:00:00.000000', 2);
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (5, 'THURSDAY', '21:00:00.000000', b'1', '18:00:00.000000', 2);
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (42, 'TUESDAY', '11:00:00.000000', b'1', '09:00:00.000000', 1);
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (46, 'MONDAY', '10:00:00.000000', b'1', '09:00:00.000000', 3);
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (49, 'SATURDAY', '11:30:00.000000', b'1', '09:00:00.000000', 5);
INSERT INTO `teacher_availabilities` (`id`, `day_of_week`, `end_time`, `is_available`, `start_time`, `teacher_id`) VALUES (50, 'SUNDAY', '11:30:00.000000', b'1', '09:00:00.000000', 5);
COMMIT;

-- ----------------------------
-- Table structure for teacher_courses
-- ----------------------------
DROP TABLE IF EXISTS `teacher_courses`;
CREATE TABLE `teacher_courses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `course_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKmgcshj4tjaptvvkjugmi80ybd` (`teacher_id`,`course_id`),
  KEY `FK998yb1badftsiklfh13bcw3ol` (`course_id`),
  CONSTRAINT `FK998yb1badftsiklfh13bcw3ol` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `FKg5rpjxn8vjt9v81ura5taiulf` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of teacher_courses
-- ----------------------------
BEGIN;
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (1, 1, 1);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (10, 2, 1);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (4, 3, 1);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (11, 5, 1);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (12, 1, 2);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (2, 2, 2);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (13, 3, 2);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (14, 5, 2);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (5, 1, 3);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (3, 3, 3);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (9, 1, 5);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (6, 2, 5);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (7, 3, 5);
INSERT INTO `teacher_courses` (`id`, `course_id`, `teacher_id`) VALUES (8, 5, 5);
COMMIT;

-- ----------------------------
-- Table structure for teachers
-- ----------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age` int DEFAULT NULL,
  `availability_mode` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `education` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subject` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4l9jjfvsct1dd5aufnurxcvbs` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of teachers
-- ----------------------------
BEGIN;
INSERT INTO `teachers` (`id`, `age`, `availability_mode`, `education`, `email`, `experience`, `gender`, `hourly_rate`, `name`, `phone`, `status`, `subject`) VALUES (1, 35, NULL, '硕士', 'zhao@example.com', 10, '男', 200.00, '赵老师', '13900139001', 'active', '数学');
INSERT INTO `teachers` (`id`, `age`, `availability_mode`, `education`, `email`, `experience`, `gender`, `hourly_rate`, `name`, `phone`, `status`, `subject`) VALUES (2, 28, NULL, '本科', 'qian@example.com', 5, '女', 180.00, '钱老师', '13900139002', 'active', '英语');
INSERT INTO `teachers` (`id`, `age`, `availability_mode`, `education`, `email`, `experience`, `gender`, `hourly_rate`, `name`, `phone`, `status`, `subject`) VALUES (3, 40, NULL, '博士', 'sun@example.com', 15, '男', 220.00, '孙老师', '13900139003', 'active', '物理');
INSERT INTO `teachers` (`id`, `age`, `availability_mode`, `education`, `email`, `experience`, `gender`, `hourly_rate`, `name`, `phone`, `status`, `subject`) VALUES (5, 18, NULL, '本科', '1@1.com', 1, '男', 12.00, 'ZHENGYI LI', '13111111111', 'active', '数学');
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('ADMIN','STUDENT','TEACHER') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `enrollment_date` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `grade` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parent_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parent_phone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `student_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`id`, `created_at`, `email`, `enabled`, `last_login_at`, `name`, `password`, `phone`, `role`, `username`, `address`, `enrollment_date`, `grade`, `notes`, `parent_name`, `parent_phone`, `student_id`) VALUES (25, '2025-05-19 23:38:34.567766', 'teststudent@example.com', b'1', '2025-05-22 01:41:21.151635', '测试学生', '$2a$10$hs5UaGA9NLSooeL8Gy1xE.rhxMSU3NZXJyXjZIvxRH62prOjvQPiq', '13800138000', 'STUDENT', 'teststudent', '测试地址', NULL, 'primary_1', '测试备注', '测试家长', '13900139000', 17);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
